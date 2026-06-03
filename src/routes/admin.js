'use strict';
const express = require('express');
const db = require('../db');
const A = require('../auth');
const S = require('../store');
const { err, now } = require('../util');
const { workload } = require('../workload');
const tasks = require('./tasks');
const router = express.Router();
router.use(A.requireLogin, A.requireAdmin);

// GET /admin/stats
router.get('/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const totalTasks = db.prepare('SELECT COUNT(*) c FROM tasks').get().c;
  const overdueTasks = db.prepare(`SELECT COUNT(*) c FROM tasks WHERE status='OVERDUE'`).get().c;
  const completed = db.prepare(`SELECT COUNT(*) c FROM tasks WHERE status='COMPLETED'`).get().c;
  const openConnections = db.prepare(`SELECT COUNT(*) c FROM connections WHERE status='PENDING'`).get().c;
  const byStatus = {};
  db.prepare('SELECT status, COUNT(*) c FROM tasks GROUP BY status').all().forEach(r => byStatus[r.status] = r.c);
  const role = (r) => db.prepare('SELECT COUNT(*) c FROM users WHERE role=?').get(r).c;
  const team = db.prepare(`SELECT id FROM users WHERE role IN ('TASKMASTER','TASKER') AND enabled=1`).all()
    .map(u => S.workloadDto(u.id)).sort((a, b) => b.percent - a.percent);
  const perAssignee = db.prepare(`SELECT id, full_name FROM users WHERE role IN ('TASKMASTER','TASKER')`).all().map(u => {
    const active = db.prepare(`SELECT COUNT(*) c FROM tasks WHERE assignee_id=? AND status NOT IN ('COMPLETED')`).get(u.id).c;
    const done = db.prepare(`SELECT COUNT(*) c FROM tasks WHERE assignee_id=? AND status='COMPLETED'`).get(u.id).c;
    const overdue = db.prepare(`SELECT COUNT(*) c FROM tasks WHERE assignee_id=? AND status='OVERDUE'`).get(u.id).c;
    return { id: u.id, name: u.full_name, active, completed: done, overdue, total: active + done, workloadPercent: workload(u.id).percent };
  });
  res.json({
    totalUsers, totalTasks, overdueTasks, completionRate: totalTasks ? Math.round((completed / totalTasks) * 100) : 0,
    pendingUsers: 0, openConnections, tasksByStatus: byStatus,
    taskmasters: role('TASKMASTER'), taskers: role('TASKER'), auditors: role('AUDITOR'), admins: role('ADMIN'),
    teamWorkload: team, perAssignee,
  });
});

// GET /admin/users
router.get('/users', (req, res) => {
  res.json(db.prepare('SELECT id FROM users ORDER BY full_name').all().map(u => S.userDto(u.id)));
});
router.post('/users/:id/enable', (req, res) => { db.prepare('UPDATE users SET enabled=1 WHERE id=?').run(Number(req.params.id)); res.json({ ok: true }); });
router.post('/users/:id/disable', (req, res, next) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return next(err(400, 'bad_request', "You can't disable your own account."));
  db.prepare('UPDATE users SET enabled=0 WHERE id=?').run(id); res.json({ ok: true });
});
router.post('/users/:id/role', (req, res, next) => {
  const role = String((req.body || {}).role || '').toUpperCase();
  if (!['TASKMASTER', 'TASKER', 'AUDITOR', 'ADMIN'].includes(role)) return next(err(400, 'bad_request', 'Invalid role.'));
  db.prepare('UPDATE users SET role=? WHERE id=?').run(role, Number(req.params.id)); res.json({ ok: true });
});
router.delete('/users/:id', (req, res, next) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return next(err(400, 'bad_request', "You can't delete your own account."));
  db.prepare('DELETE FROM users WHERE id=?').run(id); res.json({ ok: true });
});

// GET /admin/tasks (all)
router.get('/tasks', (req, res) => res.json(db.prepare('SELECT id FROM tasks ORDER BY created_at DESC').all().map(t => S.taskDto(t.id, req.user))));
router.post('/tasks', (req, res, next) => { try { res.json(S.taskDto(tasks.createTask(req.user, req.body || {}, { bypassConnection: true }), req.user)); } catch (e) { next(e); } });
router.post('/tasks/:code/assign', (req, res, next) => {
  const t = S.getTaskByCode(req.params.code);
  if (!t) return next(err(404, 'not_found', 'Task not found.'));
  const u = S.getUser(Number((req.body || {}).assigneeId));
  if (!u) return next(err(404, 'not_found', 'Assignee not found.'));
  db.prepare('UPDATE tasks SET assignee_id=?, is_open=0, updated_at=? WHERE id=?').run(u.id, now(), t.id);
  S.notify(u.id, 'TASK_ASSIGNED', `An admin assigned you "${t.title}".`, t.task_code);
  res.json(S.taskDto(S.getTask(t.id), req.user));
});
router.delete('/tasks/:code', (req, res, next) => {
  const t = S.getTaskByCode(req.params.code);
  if (!t) return next(err(404, 'not_found', 'Task not found.'));
  db.prepare('DELETE FROM tasks WHERE id=?').run(t.id); res.json({ ok: true });
});
router.get('/assignees', (req, res) => {
  res.json(db.prepare(`SELECT id, full_name, role FROM users WHERE role IN ('TASKMASTER','TASKER') AND enabled=1 ORDER BY full_name`)
    .all().map(u => ({ id: u.id, name: u.full_name, role: u.role, workloadPercent: workload(u.id).percent })));
});
router.get('/requests', (req, res) => res.json(db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all().map(S.requestDto)));

// POST /admin/seed-demo  (force-load demo data)
router.post('/seed-demo', (req, res) => {
  const { seed } = require('../seed');
  const r = seed({ force: true });
  res.json({ message: `Demo data ready: ${r.tasks} tasks, ${r.users} users.`, ...r });
});

module.exports = router;
