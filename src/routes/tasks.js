const express = require('express');
const router = express.Router();
const { wrap, ApiException } = require('../lib/errors');
const { requireAuth } = require('../middleware/auth');
const { User, Task, Subtask } = require('../models');
const { toTaskDto } = require('../lib/dto');
const workload = require('../services/workload');
const connections = require('../services/connections');
const notifications = require('../services/notifications');

// ---- helpers ----

function parseDeadline(raw) {
  if (raw == null || String(raw).trim() === '') return null;
  const s = String(raw);
  if (s.length <= 10) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) throw ApiException.badRequest('Invalid deadline format. Use yyyy-MM-dd or yyyy-MM-ddTHH:mm.');
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 17, 0, 0, 0);
    if (isNaN(d.getTime())) throw ApiException.badRequest('Invalid deadline format. Use yyyy-MM-dd or yyyy-MM-ddTHH:mm.');
    return d;
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) throw ApiException.badRequest('Invalid deadline format. Use yyyy-MM-dd or yyyy-MM-ddTHH:mm.');
  return d;
}

function deadlineToDateString(deadline) {
  const d = new Date(deadline);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return y + '-' + mo + '-' + da;
}

async function assignablePool(me) {
  const pool = [me];
  pool.push(...await connections.acceptedConnections(me));
  return pool;
}

async function pickLowestWorkload(pool) {
  if (!pool.length) throw ApiException.badRequest('No candidates available for auto-assignment.');
  let best = null;
  let bestPct = Infinity;
  for (const u of pool) {
    const pct = await workload.percentFor(u);
    if (pct < bestPct) { bestPct = pct; best = u; }
  }
  return best;
}

async function getByCode(code) {
  const t = await Task.findOne({
    where: { taskCode: code },
    include: [{ model: Subtask, as: 'subtasks' }],
  });
  if (!t) throw ApiException.notFound('Task ' + code + ' not found.');
  return t;
}

function ensureEditor(me, t) {
  if (me.role === 'AUDITOR') throw ApiException.forbidden('Auditors have read-only access.');
  const ok = me.role === 'ADMIN'
    || (t.creatorId != null && t.creatorId === me.id)
    || (t.assigneeId != null && t.assigneeId === me.id);
  if (!ok) throw ApiException.forbidden('Only the task creator or assignee can modify this task.');
}

async function ensureVisible(me, t) {
  if (me.role === 'ADMIN' || me.role === 'AUDITOR') return;
  if (t.creatorId === me.id || t.assigneeId === me.id) return;
  const assignee = t.assigneeId ? await User.findByPk(t.assigneeId) : null;
  const creator = t.creatorId ? await User.findByPk(t.creatorId) : null;
  if (assignee && await connections.isConnected(me, assignee)) return;
  if (creator && await connections.isConnected(me, creator)) return;
  throw ApiException.forbidden('You do not have access to this task.');
}

async function recomputeProgress(t, subtasks) {
  if (!subtasks || subtasks.length === 0) return;
  const done = subtasks.filter((s) => s.done).length;
  const pct = Math.round((done * 100.0) / subtasks.length);
  t.progress = pct;
  if (pct === 100) t.status = 'COMPLETED';
  else if (pct > 0 && t.status === 'NOT_STARTED') t.status = 'IN_PROGRESS';
}

function deadlineCompare(a, b) {
  const da = a.deadline, db = b.deadline;
  if (da == null && db == null) return 0;
  if (da == null) return 1;
  if (db == null) return -1;
  return new Date(da).getTime() - new Date(db).getTime();
}

async function visibleTasks(me) {
  const accepted = await connections.acceptedConnections(me);
  const connectionIds = new Set(accepted.map((u) => u.id));
  const all = await Task.findAll({ include: [{ model: Subtask, as: 'subtasks' }] });
  const out = [];
  for (const t of all) {
    const mine = (t.creatorId != null && t.creatorId === me.id)
      || (t.assigneeId != null && t.assigneeId === me.id);
    const connected = (t.assigneeId != null && connectionIds.has(t.assigneeId))
      || (t.creatorId != null && connectionIds.has(t.creatorId));
    if (mine || connected || me.role === 'ADMIN' || me.role === 'AUDITOR') {
      out.push(t);
    }
  }
  return out;
}

async function activateDependents(completed) {
  const all = await Task.findAll();
  for (const other of all) {
    const otherDeps = await other.getDependencies();
    if (otherDeps.some((d) => d.id === completed.id)) {
      const allDone = otherDeps.every((d) => d.status === 'COMPLETED');
      if (allDone && other.assigneeId != null) {
        const assignee = await User.findByPk(other.assigneeId);
        await notifications.notify(assignee, 'DEPENDENCY_ACTIVE',
          '"' + other.title + '" is now unblocked - all prerequisites are complete.',
          other.taskCode);
      }
    }
  }
}

async function createTask(me, body) {
  if (me.role === 'AUDITOR') {
    throw ApiException.forbidden('Auditors have read-only access and cannot create tasks.');
  }
  body = body || {};
  if (body.title == null || String(body.title).trim() === '') {
    throw ApiException.badRequest('title: must not be blank');
  }

  let assignee;
  if (body.autoAssign === true) {
    assignee = await pickLowestWorkload(await assignablePool(me));
  } else if (body.assigneeId == null) {
    assignee = me;
  } else {
    assignee = await User.findByPk(body.assigneeId);
    if (!assignee) throw ApiException.notFound('Assignee not found.');
    if (assignee.id !== me.id && !(await connections.isConnected(me, assignee))) {
      throw ApiException.forbidden('You can only assign tasks to yourself or a connected user.');
    }
  }

  const estimatedHours = (body.estimatedHours != null && body.estimatedHours > 0) ? body.estimatedHours : 4;

  const t = await Task.create({
    title: String(body.title).trim(),
    description: body.description,
    deadline: parseDeadline(body.deadline),
    estimatedHours,
    creatorId: me.id,
    assigneeId: assignee.id,
    status: 'NOT_STARTED',
  });
  t.taskCode = 'TSK-' + String(t.id).padStart(6, '0');

  // subtasks
  const createdSubtasks = [];
  if (Array.isArray(body.subtasks)) {
    for (const s of body.subtasks) {
      if (s == null || String(s).trim() === '') continue;
      const st = await Subtask.create({ title: String(s).trim(), taskId: t.id });
      createdSubtasks.push(st);
    }
  }

  // dependencies (by taskCode)
  if (Array.isArray(body.dependencyCodes)) {
    const deps = [];
    for (const code of body.dependencyCodes) {
      const dep = await Task.findOne({ where: { taskCode: code } });
      if (dep && dep.id !== t.id) deps.push(dep);
    }
    if (deps.length) await t.addDependencies(deps);
  }

  await recomputeProgress(t, createdSubtasks);
  await t.save();
  t.subtasks = createdSubtasks;

  if (assignee.id !== me.id) {
    let msg = me.fullName + ' assigned you "' + t.title + '"';
    if (t.deadline != null) msg += ' (due ' + deadlineToDateString(t.deadline) + ')';
    msg += '.';
    await notifications.notify(assignee, 'TASK_ASSIGNED', msg, t.taskCode);
  }
  return t;
}

// ---- routes ----

// GET / -> my tasks (assigned to me), sorted by deadline nulls-last
router.get('/', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const rows = await Task.findAll({
    where: { assigneeId: me.id },
    include: [{ model: Subtask, as: 'subtasks' }],
  });
  rows.sort(deadlineCompare);
  const dtos = await Promise.all(rows.map((t) => toTaskDto(t, me)));
  res.json(dtos);
}));

// GET /created -> tasks I created
router.get('/created', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const rows = await Task.findAll({
    where: { creatorId: me.id },
    include: [{ model: Subtask, as: 'subtasks' }],
  });
  rows.sort(deadlineCompare);
  const dtos = await Promise.all(rows.map((t) => toTaskDto(t, me)));
  res.json(dtos);
}));

// GET /search?q=&status=
router.get('/search', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const q = req.query.q;
  const statusRaw = req.query.status;
  const needle = q == null ? '' : String(q).trim().toLowerCase();
  let st = null;
  if (statusRaw != null && String(statusRaw).trim() !== '' && String(statusRaw).toUpperCase() !== 'ALL') {
    const candidate = String(statusRaw).toUpperCase();
    if (['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'OVERDUE'].includes(candidate)) {
      st = candidate;
    }
  }
  const visible = await visibleTasks(me);
  const filtered = visible.filter((t) => {
    if (needle !== '') {
      const matches = (t.taskCode && t.taskCode.toLowerCase().includes(needle))
        || (t.title && t.title.toLowerCase().includes(needle))
        || (t.description != null && t.description.toLowerCase().includes(needle));
      if (!matches) return false;
    }
    if (st != null && t.status !== st) return false;
    return true;
  });
  filtered.sort(deadlineCompare);
  const dtos = await Promise.all(filtered.map((t) => toTaskDto(t, me)));
  res.json(dtos);
}));

// GET /:code
router.get('/:code', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const t = await getByCode(req.params.code);
  await ensureVisible(me, t);
  res.json(await toTaskDto(t, me));
}));

// POST / -> create
router.post('/', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const t = await createTask(me, req.body);
  res.json(await toTaskDto(t, me));
}));

// PUT /:code -> update
router.put('/:code', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const body = req.body || {};
  const t = await getByCode(req.params.code);
  ensureEditor(me, t);

  if (body.title != null && String(body.title).trim() !== '') t.title = String(body.title).trim();
  t.description = body.description;
  if (body.deadline != null) t.deadline = parseDeadline(body.deadline);
  if (body.estimatedHours != null && body.estimatedHours > 0) t.estimatedHours = body.estimatedHours;
  if (body.assigneeId != null) {
    const assignee = await User.findByPk(body.assigneeId);
    if (!assignee) throw ApiException.notFound('Assignee not found.');
    if (assignee.id !== me.id && !(await connections.isConnected(me, assignee))) {
      throw ApiException.forbidden('You can only assign tasks to yourself or a connected user.');
    }
    const changed = t.assigneeId == null || t.assigneeId !== assignee.id;
    t.assigneeId = assignee.id;
    if (changed && assignee.id !== me.id) {
      await notifications.notify(assignee, 'TASK_ASSIGNED',
        me.fullName + ' assigned you "' + t.title + '".', t.taskCode);
    }
  }
  t.updatedAt = new Date();
  await t.save();
  res.json(await toTaskDto(t, me));
}));

// POST /:code/status
router.post('/:code/status', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const body = req.body || {};
  if (body.status == null || String(body.status).trim() === '') {
    throw ApiException.badRequest('status: must not be blank');
  }
  const t = await getByCode(req.params.code);
  ensureEditor(me, t);

  const statusRaw = String(body.status).toUpperCase();
  if (!['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'OVERDUE'].includes(statusRaw)) {
    throw ApiException.badRequest('Invalid status.');
  }
  const status = statusRaw;

  const deps = await t.getDependencies();
  if (status === 'IN_PROGRESS' && deps.some((d) => d.status !== 'COMPLETED')) {
    throw ApiException.badRequest('This task is blocked by an incomplete dependency and cannot start yet.');
  }

  t.status = status;
  t.statusUpdatedAt = new Date();
  t.updatedAt = new Date();
  if (status === 'COMPLETED') {
    t.progress = 100;
    const subs = await Subtask.findAll({ where: { taskId: t.id } });
    for (const s of subs) { s.done = true; await s.save(); }
  }
  await t.save();

  if (t.creatorId != null && t.creatorId !== me.id) {
    const creator = await User.findByPk(t.creatorId);
    await notifications.notify(creator, 'STATUS_UPDATE',
      '"' + t.title + '" is now ' + status.replace(/_/g, ' ')
      + ' (updated by ' + me.fullName + ').', t.taskCode);
  }

  if (status === 'COMPLETED') await activateDependents(t);
  res.json(await toTaskDto(t, me));
}));

// POST /:code/progress
router.post('/:code/progress', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const body = req.body || {};
  const progress = body.progress;
  const t = await getByCode(req.params.code);
  ensureEditor(me, t);

  t.progress = Math.max(0, Math.min(100, progress));
  if (t.progress === 100) t.status = 'COMPLETED';
  else if (t.status === 'NOT_STARTED' && t.progress > 0) t.status = 'IN_PROGRESS';
  t.updatedAt = new Date();
  await t.save();
  res.json(await toTaskDto(t, me));
}));

// POST /:code/subtasks/:subtaskId/toggle
router.post('/:code/subtasks/:subtaskId/toggle', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const t = await getByCode(req.params.code);
  ensureEditor(me, t);

  const subId = Number(req.params.subtaskId);
  const subs = await Subtask.findAll({ where: { taskId: t.id } });
  const st = subs.find((s) => s.id === subId);
  if (!st) throw ApiException.notFound('Subtask not found.');
  st.done = !st.done;
  await st.save();

  await recomputeProgress(t, subs);
  await t.save();
  t.subtasks = subs;
  res.json(await toTaskDto(t, me));
}));

// DELETE /:code
router.delete('/:code', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const t = await getByCode(req.params.code);
  if (me.role !== 'ADMIN' && (t.creatorId == null || t.creatorId !== me.id)) {
    throw ApiException.forbidden('Only the task creator or an admin can delete this task.');
  }
  await t.destroy();
  res.status(200).end();
}));

module.exports = router;
module.exports.createTask = createTask;
