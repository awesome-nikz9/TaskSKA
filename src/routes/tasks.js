'use strict';
const express = require('express');
const db = require('../db');
const A = require('../auth');
const S = require('../store');
const { err, now, taskCode, cleanSkills, cleanPriority, parseDeadline, toISO, STATUSES } = require('../util');
const { workloadPercent } = require('../workload');

const router = express.Router();
router.use(A.requireLogin);

function assignablePool(me) {
  return [me.id, ...S.acceptedConnectionIds(me.id)].filter((v, i, a) => a.indexOf(v) === i);
}
function pickLowestWorkload(pool) {
  let best = null, bestPct = Infinity;
  for (const uid of pool) { const p = workloadPercent(uid); if (p < bestPct) { bestPct = p; best = uid; } }
  return best;
}
function deadlineCmp(a, b) {
  if (!a.deadline && !b.deadline) return 0;
  if (!a.deadline) return 1; if (!b.deadline) return -1;
  return Date.parse(a.deadline + 'Z') - Date.parse(b.deadline + 'Z');
}
function ensureEditor(me, t) {
  if (me.role === 'AUDITOR') return err(403, 'forbidden', 'Auditors have read-only access.');
  const ok = me.role === 'ADMIN' || t.creator_id === me.id || (t.assignee_id && t.assignee_id === me.id);
  return ok ? true : err(403, 'forbidden', 'Only the task creator or assignee can modify this task.');
}
function ensureVisible(me, t) {
  if (me.role === 'ADMIN' || me.role === 'AUDITOR') return true;
  if (t.creator_id === me.id || t.assignee_id === me.id) return true;
  if (t.assignee_id && S.isConnected(me.id, t.assignee_id)) return true;
  if (t.creator_id && S.isConnected(me.id, t.creator_id)) return true;
  return err(403, 'forbidden', 'You do not have access to this task.');
}
function visibleTasks(me) {
  const rows = db.prepare('SELECT * FROM tasks').all();
  if (me.role === 'ADMIN' || me.role === 'AUDITOR') return rows;
  const conn = new Set(S.acceptedConnectionIds(me.id));
  return rows.filter(t =>
    t.creator_id === me.id || t.assignee_id === me.id ||
    (t.assignee_id && conn.has(t.assignee_id)) || (t.creator_id && conn.has(t.creator_id)));
}

// Shared create used by routes + templates + admin.
function createTask(me, args, opts = {}) {
  if (me.role === 'AUDITOR') throw err(403, 'forbidden', 'Auditors cannot create tasks.');
  const title = String(args.title || '').trim();
  if (!title) throw err(400, 'bad_request', 'title: must not be blank');

  const isOpen = !!args.isOpen;
  let assigneeId;
  if (isOpen) assigneeId = null;
  else if (args.autoAssign === true) {
    assigneeId = pickLowestWorkload(assignablePool(me));
    if (assigneeId == null) throw err(400, 'bad_request', 'No candidates available for auto-assignment.');
  } else if (args.assigneeId == null || args.assigneeId === '') assigneeId = me.id;
  else {
    const u = S.getUser(Number(args.assigneeId));
    if (!u) throw err(404, 'not_found', 'Assignee not found.');
    if (!opts.bypassConnection && u.id !== me.id && !S.isConnected(me.id, u.id))
      throw err(403, 'forbidden', 'You can only assign tasks to yourself or a connected user.');
    assigneeId = u.id;
  }
  const deadline = parseDeadline(args.deadline);
  if (deadline === false) throw err(400, 'bad_request', 'Invalid deadline. Use yyyy-MM-dd.');
  const est = Number(args.estimatedHours) > 0 ? Number(args.estimatedHours) : 4;
  const ts = now();

  const info = db.prepare(`INSERT INTO tasks
    (title,description,requirements,required_skills,is_open,priority,status,progress,estimated_hours,deadline,creator_id,assignee_id,status_updated_at,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    title.slice(0, 150), args.description || null,
    args.requirements ? String(args.requirements).slice(0, 2000) : null,
    JSON.stringify(cleanSkills(args.requiredSkills)),
    isOpen ? 1 : 0, cleanPriority(args.priority), 'NOT_STARTED', 0, est, deadline,
    me.id, assigneeId, ts, ts, ts);
  const id = info.lastInsertRowid;
  db.prepare('UPDATE tasks SET task_code = ? WHERE id = ?').run(taskCode(id), id);

  if (Array.isArray(args.subtasks))
    for (const s of args.subtasks) { const t = String(s || '').trim(); if (t) db.prepare('INSERT INTO subtasks (task_id,title) VALUES (?,?)').run(id, t.slice(0, 200)); }
  if (Array.isArray(args.dependencyCodes))
    for (const dc of args.dependencyCodes) { const dep = S.getTaskByCode(String(dc).trim()); if (dep && dep.id !== id) db.prepare('INSERT OR IGNORE INTO task_deps (task_id,depends_on_id) VALUES (?,?)').run(id, dep.id); }
  S.recomputeProgress(id);

  const row = S.getTask(id);
  if (assigneeId && assigneeId !== me.id) {
    let msg = `${me.full_name} assigned you "${row.title}"`;
    if (row.deadline) msg += ` (due ${row.deadline.slice(0, 10)})`;
    S.notify(assigneeId, 'TASK_ASSIGNED', msg + '.', row.task_code);
  }
  return row;
}

// GET /tasks  (mine = assigned to me)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks WHERE assignee_id = ?').all(req.user.id).sort(deadlineCmp);
  res.json(rows.map(t => S.taskDto(t, req.user)));
});
// GET /tasks/created
router.get('/created', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks WHERE creator_id = ?').all(req.user.id).sort(deadlineCmp);
  res.json(rows.map(t => S.taskDto(t, req.user)));
});
// GET /tasks/open  (unassigned pool, visible to all members)
router.get('/open', (req, res) => {
  const rows = db.prepare(`SELECT * FROM tasks WHERE is_open=1 AND assignee_id IS NULL AND status!='COMPLETED'`).all().sort(deadlineCmp);
  res.json(rows.map(t => S.taskDto(t, req.user)));
});
// GET /tasks/search?q=&status=&deadline=
router.get('/search', (req, res) => {
  const me = req.user;
  const needle = String(req.query.q || '').trim().toLowerCase();
  let st = String(req.query.status || '').toUpperCase();
  if (!STATUSES.includes(st)) st = null;
  let dueTs = null;
  const due = String(req.query.deadline || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(due)) dueTs = Date.parse(due.slice(0, 10) + 'T23:59:59Z');
  let rows = visibleTasks(me).filter(t => {
    if (needle) {
      const m = (t.task_code && t.task_code.toLowerCase().includes(needle)) ||
        (t.title && t.title.toLowerCase().includes(needle)) ||
        (t.description && t.description.toLowerCase().includes(needle));
      if (!m) return false;
    }
    if (st && t.status !== st) return false;
    if (dueTs != null) { if (!t.deadline) return false; if (Date.parse(t.deadline + 'Z') > dueTs) return false; }
    return true;
  }).sort(deadlineCmp);
  res.json(rows.map(t => S.taskDto(t, me)));
});

// POST /tasks
router.post('/', A.blockAuditorWrites, (req, res, next) => {
  try { res.json(S.taskDto(createTask(req.user, req.body || {}), req.user)); }
  catch (e) { next(e); }
});

// GET /tasks/:code
router.get('/:code', (req, res, next) => {
  const t = S.getTaskByCode(req.params.code);
  if (!t) return next(err(404, 'not_found', `Task ${req.params.code} not found.`));
  const v = ensureVisible(req.user, t); if (v !== true) return next(v);
  res.json(S.taskDto(t, req.user));
});

// PUT /tasks/:code
router.put('/:code', A.blockAuditorWrites, (req, res, next) => {
  const me = req.user, b = req.body || {};
  const t = S.getTaskByCode(req.params.code);
  if (!t) return next(err(404, 'not_found', `Task ${req.params.code} not found.`));
  const ed = ensureEditor(me, t); if (ed !== true) return next(ed);
  const f = {};
  if (b.title != null && String(b.title).trim()) f.title = String(b.title).trim().slice(0, 150);
  if ('description' in b) f.description = b.description;
  if ('requirements' in b) f.requirements = b.requirements != null ? String(b.requirements).slice(0, 2000) : null;
  if ('requiredSkills' in b) f.required_skills = JSON.stringify(cleanSkills(b.requiredSkills));
  if ('priority' in b) f.priority = cleanPriority(b.priority);
  if ('isOpen' in b) f.is_open = b.isOpen ? 1 : 0;
  if ('deadline' in b) { const d = parseDeadline(b.deadline); if (d === false) return next(err(400, 'bad_request', 'Invalid deadline.')); f.deadline = d; f.due_soon_notified = 0; }
  if (b.estimatedHours != null && Number(b.estimatedHours) > 0) f.estimated_hours = Number(b.estimatedHours);

  let notifyAssignee = null;
  if (b.assigneeId != null && b.assigneeId !== '') {
    const u = S.getUser(Number(b.assigneeId));
    if (!u) return next(err(404, 'not_found', 'Assignee not found.'));
    if (me.role !== 'ADMIN' && u.id !== me.id && !S.isConnected(me.id, u.id)) return next(err(403, 'forbidden', 'You can only assign to yourself or a connected user.'));
    if (t.assignee_id !== u.id && u.id !== me.id) notifyAssignee = u.id;
    f.assignee_id = u.id; f.is_open = 0;
  }
  f.updated_at = now();
  const keys = Object.keys(f);
  db.prepare(`UPDATE tasks SET ${keys.map(k => `${k}=?`).join(',')} WHERE id=?`).run(...keys.map(k => f[k]), t.id);
  if (notifyAssignee) S.notify(notifyAssignee, 'TASK_ASSIGNED', `${me.full_name} assigned you "${f.title || t.title}".`, t.task_code);
  res.json(S.taskDto(S.getTask(t.id), me));
});

// DELETE /tasks/:code
router.delete('/:code', A.blockAuditorWrites, (req, res, next) => {
  const me = req.user, t = S.getTaskByCode(req.params.code);
  if (!t) return next(err(404, 'not_found', `Task ${req.params.code} not found.`));
  if (me.role !== 'ADMIN' && t.creator_id !== me.id) return next(err(403, 'forbidden', 'Only the creator or an admin can delete this task.'));
  db.prepare('DELETE FROM tasks WHERE id = ?').run(t.id);
  res.json({ ok: true });
});

// POST /tasks/:code/status
router.post('/:code/status', A.blockAuditorWrites, (req, res, next) => {
  const me = req.user, t = S.getTaskByCode(req.params.code);
  if (!t) return next(err(404, 'not_found', `Task ${req.params.code} not found.`));
  const ed = ensureEditor(me, t); if (ed !== true) return next(ed);
  const status = String((req.body || {}).status || '').toUpperCase();
  if (!STATUSES.includes(status)) return next(err(400, 'bad_request', 'Invalid status.'));
  if (status === 'IN_PROGRESS') {
    const deps = db.prepare(`SELECT t.status FROM task_deps d JOIN tasks t ON t.id=d.depends_on_id WHERE d.task_id=?`).all(t.id);
    if (deps.some(d => d.status !== 'COMPLETED')) return next(err(400, 'bad_request', 'Blocked by an incomplete dependency.'));
  }
  const ts = now();
  const f = { status, status_updated_at: ts, updated_at: ts };
  if (status === 'COMPLETED') f.progress = 100;
  const keys = Object.keys(f);
  db.prepare(`UPDATE tasks SET ${keys.map(k => `${k}=?`).join(',')} WHERE id=?`).run(...keys.map(k => f[k]), t.id);
  if (status === 'COMPLETED') db.prepare('UPDATE subtasks SET done=1 WHERE task_id=?').run(t.id);
  if (t.creator_id && t.creator_id !== me.id)
    S.notify(t.creator_id, 'STATUS_UPDATE', `"${t.title}" is now ${status.replace(/_/g, ' ')} (updated by ${me.full_name}).`, t.task_code);
  if (status === 'COMPLETED') {
    const dependents = db.prepare(`SELECT t.* FROM task_deps d JOIN tasks t ON t.id=d.task_id WHERE d.depends_on_id=?`).all(t.id);
    for (const o of dependents) {
      const deps = db.prepare(`SELECT t.status FROM task_deps d JOIN tasks t ON t.id=d.depends_on_id WHERE d.task_id=?`).all(o.id);
      if (deps.every(d => d.status === 'COMPLETED') && o.assignee_id)
        S.notify(o.assignee_id, 'DEPENDENCY_ACTIVE', `"${o.title}" is now unblocked - all prerequisites are complete.`, o.task_code);
    }
  }
  res.json(S.taskDto(S.getTask(t.id), me));
});

// POST /tasks/:code/progress
router.post('/:code/progress', A.blockAuditorWrites, (req, res, next) => {
  const me = req.user, t = S.getTaskByCode(req.params.code);
  if (!t) return next(err(404, 'not_found', `Task ${req.params.code} not found.`));
  const ed = ensureEditor(me, t); if (ed !== true) return next(ed);
  let p = parseInt((req.body || {}).progress, 10) || 0; p = Math.max(0, Math.min(100, p));
  const f = { progress: p, updated_at: now() };
  if (p === 100) f.status = 'COMPLETED'; else if (t.status === 'NOT_STARTED' && p > 0) f.status = 'IN_PROGRESS';
  const keys = Object.keys(f);
  db.prepare(`UPDATE tasks SET ${keys.map(k => `${k}=?`).join(',')} WHERE id=?`).run(...keys.map(k => f[k]), t.id);
  res.json(S.taskDto(S.getTask(t.id), me));
});

// POST /tasks/:code/subtasks/:sid/toggle
router.post('/:code/subtasks/:sid/toggle', A.blockAuditorWrites, (req, res, next) => {
  const me = req.user, t = S.getTaskByCode(req.params.code);
  if (!t) return next(err(404, 'not_found', `Task ${req.params.code} not found.`));
  const ed = ensureEditor(me, t); if (ed !== true) return next(ed);
  const st = db.prepare('SELECT * FROM subtasks WHERE id=? AND task_id=?').get(Number(req.params.sid), t.id);
  if (!st) return next(err(404, 'not_found', 'Subtask not found.'));
  db.prepare('UPDATE subtasks SET done=? WHERE id=?').run(st.done ? 0 : 1, st.id);
  S.recomputeProgress(t.id);
  res.json(S.taskDto(S.getTask(t.id), me));
});

module.exports = router;
module.exports.createTask = createTask;
module.exports.visibleTasks = visibleTasks;
