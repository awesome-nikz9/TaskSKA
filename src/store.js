'use strict';
// Shared DB queries + DTO mappers (camelCase API contract).
const db = require('./db');
const { j, toISO, taskCode, now } = require('./util');
const { workload, workloadPercent } = require('./workload');

const getUser = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);
const getUserByEmail = (email) => db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(email);
const getTask = (id) => db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
const getTaskByCode = (code) => db.prepare('SELECT * FROM tasks WHERE task_code = ?').get(code);

function acceptedConnectionIds(uid) {
  const rows = db.prepare(
    `SELECT requester_id, addressee_id FROM connections
     WHERE status='ACCEPTED' AND (requester_id=? OR addressee_id=?)`).all(uid, uid);
  return rows.map(r => r.requester_id === uid ? r.addressee_id : r.requester_id);
}
function isConnected(a, b) {
  if (a === b) return true;
  return !!db.prepare(
    `SELECT 1 FROM connections WHERE status='ACCEPTED' AND
     ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?))`).get(a, b, b, a);
}

function recomputeProgress(taskId) {
  const subs = db.prepare('SELECT done FROM subtasks WHERE task_id = ?').all(taskId);
  if (!subs.length) return;
  const done = subs.filter(s => s.done).length;
  const pct = Math.round((done * 100) / subs.length);
  db.prepare('UPDATE tasks SET progress = ?, updated_at = ? WHERE id = ?').run(pct, now(), taskId);
}

function notify(recipientId, type, message, taskCodeStr) {
  if (!recipientId) return;
  db.prepare('INSERT INTO notifications (recipient_id, type, message, related_task_code) VALUES (?,?,?,?)')
    .run(recipientId, type, message, taskCodeStr || null);
}

function userDto(u) {
  if (typeof u === 'number') u = getUser(u);
  if (!u) return null;
  return {
    id: u.id, fullName: u.full_name, email: u.email, role: u.role,
    skills: j(u.skills), availability: u.availability, weeklyCapacityHours: u.capacity_hours,
    jobTitle: u.job_title, mfaEnabled: !!u.mfa_enabled, enabled: !!u.enabled,
    workloadPercent: workloadPercent(u.id),
    notifyAssignment: !!u.notify_assignment, notifyStatus: !!u.notify_status,
    notifyDeadline: !!u.notify_deadline, notifyConnection: !!u.notify_connection,
    createdAt: toISO(u.created_at),
  };
}

function taskDto(t, viewer) {
  if (typeof t === 'number') t = getTask(t);
  if (!t) return null;
  const creator = t.creator_id ? getUser(t.creator_id) : null;
  const assignee = t.assignee_id ? getUser(t.assignee_id) : null;
  const subs = db.prepare('SELECT id, title, done FROM subtasks WHERE task_id = ? ORDER BY id').all(t.id)
    .map(s => ({ id: s.id, title: s.title, done: !!s.done }));
  const deps = db.prepare(
    `SELECT t.task_code, t.status FROM task_deps d JOIN tasks t ON t.id=d.depends_on_id WHERE d.task_id=?`).all(t.id);
  let blocked = false; const dependencyCodes = [];
  for (const d of deps) { dependencyCodes.push(d.task_code); if (d.status !== 'COMPLETED') blocked = true; }
  dependencyCodes.sort();
  const openReq = db.prepare(`SELECT COUNT(*) c FROM requests WHERE task_id=? AND status='PENDING'`).get(t.id).c;
  let viewerRequested = false, canEdit = false;
  if (viewer) {
    viewerRequested = !!db.prepare(`SELECT 1 FROM requests WHERE task_id=? AND tasker_id=? AND status='PENDING'`).get(t.id, viewer.id);
    canEdit = viewer.role === 'ADMIN' || t.creator_id === viewer.id || t.assignee_id === viewer.id;
  }
  return {
    id: t.id, taskCode: t.task_code, title: t.title, description: t.description,
    requirements: t.requirements, requiredSkills: j(t.required_skills),
    priority: t.priority, isOpen: !!t.is_open, status: t.status, progress: t.progress,
    estimatedHours: t.estimated_hours, deadline: toISO(t.deadline),
    creatorId: t.creator_id, creatorName: creator ? creator.full_name : null,
    assigneeId: t.assignee_id, assigneeName: assignee ? assignee.full_name : null,
    subtasks: subs, dependencyCodes, blockedByDependency: blocked,
    openRequestCount: openReq, viewerRequested, canEdit,
    createdAt: toISO(t.created_at), statusUpdatedAt: toISO(t.status_updated_at),
  };
}

function workloadDto(u) {
  if (typeof u === 'number') u = getUser(u);
  const w = workload(u.id);
  return { userId: u.id, name: u.full_name, email: u.email, jobTitle: u.job_title,
    skills: j(u.skills), availability: u.availability,
    percent: w.percent, level: w.level, activeTasks: w.activeTasks,
    committedHours: w.committedHours, capacityHours: w.capacityHours };
}

function notificationDto(n) {
  return { id: n.id, type: n.type, message: n.message, relatedTaskCode: n.related_task_code,
    read: !!n.read_flag, createdAt: toISO(n.created_at) };
}
function templateDto(t) {
  const a = t.default_assignee_id ? getUser(t.default_assignee_id) : null;
  return { id: t.id, name: t.name, title: t.title, description: t.description,
    estimatedHours: t.estimated_hours, deadlineOffsetDays: t.deadline_offset_days,
    defaultAssigneeId: t.default_assignee_id, defaultAssigneeName: a ? a.full_name : null };
}
function requestDto(r) {
  const tasker = r.tasker_id ? getUser(r.tasker_id) : null;
  const task = getTask(r.task_id);
  const reqSkills = task ? j(task.required_skills) : [];
  const tskills = tasker ? j(tasker.skills) : [];
  let match = null;
  if (reqSkills.length) {
    const have = tskills.map(s => s.toLowerCase());
    const hit = reqSkills.filter(s => have.includes(s.toLowerCase())).length;
    match = Math.round((hit / reqSkills.length) * 100);
  }
  return { id: r.id, status: r.status, comment: r.comment, decisionNote: r.decision_note,
    createdAt: toISO(r.created_at), decidedAt: toISO(r.decided_at),
    taskerId: tasker ? tasker.id : null, taskerName: tasker ? tasker.full_name : 'Unknown',
    taskerSkills: tskills, taskerJobTitle: tasker ? tasker.job_title : null,
    taskerWorkloadPercent: tasker ? workloadPercent(tasker.id) : null, skillMatchPercent: match,
    taskId: task ? task.id : null, taskCode: task ? task.task_code : null, taskTitle: task ? task.title : null,
    taskRequiredSkills: reqSkills, taskDeadline: task ? toISO(task.deadline) : null,
    taskPriority: task ? task.priority : 'MEDIUM',
    taskStillOpen: task ? (!!task.is_open && task.assignee_id == null) : false };
}

module.exports = {
  getUser, getUserByEmail, getTask, getTaskByCode, acceptedConnectionIds, isConnected,
  recomputeProgress, notify, userDto, taskDto, workloadDto, notificationDto, templateDto, requestDto,
};
