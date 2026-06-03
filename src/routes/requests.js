'use strict';
const express = require('express');
const db = require('../db');
const A = require('../auth');
const S = require('../store');
const { err, now } = require('../util');
const router = express.Router();
router.use(A.requireLogin);

// POST /tasks/:code/request  (mounted under /tasks via index) - here standalone /requests endpoints + open requests
// GET /requests -> { mine: [...requests I made], incoming: [...requests on tasks I created] }
router.get('/', (req, res) => {
  const me = req.user.id;
  const mine = db.prepare('SELECT * FROM requests WHERE tasker_id=? ORDER BY created_at DESC').all(me).map(S.requestDto);
  const incoming = db.prepare(`SELECT r.* FROM requests r JOIN tasks t ON t.id=r.task_id
     WHERE t.creator_id=? AND r.status='PENDING' ORDER BY r.created_at DESC`).all(me).map(S.requestDto);
  res.json({ mine, incoming });
});

// POST /requests/:id/approve  { note }  -> assign task to tasker
router.post('/:id/approve', A.blockAuditorWrites, (req, res, next) => {
  const me = req.user;
  const r = db.prepare('SELECT * FROM requests WHERE id=?').get(Number(req.params.id));
  if (!r) return next(err(404, 'not_found', 'Request not found.'));
  const t = S.getTask(r.task_id);
  if (!t || (me.role !== 'ADMIN' && t.creator_id !== me.id)) return next(err(403, 'forbidden', 'Only the task owner can decide.'));
  if (r.status !== 'PENDING') return next(err(400, 'bad_request', 'Already decided.'));
  db.prepare('UPDATE requests SET status=?, decided_by=?, decision_note=?, decided_at=? WHERE id=?')
    .run('APPROVED', me.id, String((req.body || {}).note || '') || null, now(), r.id);
  db.prepare('UPDATE tasks SET assignee_id=?, is_open=0, updated_at=? WHERE id=?').run(r.tasker_id, now(), t.id);
  // decline other pending requests on this task
  db.prepare(`UPDATE requests SET status='DECLINED', decided_by=?, decided_at=? WHERE task_id=? AND status='PENDING'`).run(me.id, now(), t.id);
  S.notify(r.tasker_id, 'REQUEST_APPROVED', `Your request for "${t.title}" was approved - it's now assigned to you.`, t.task_code);
  res.json({ ok: true });
});

// POST /requests/:id/decline { note }
router.post('/:id/decline', A.blockAuditorWrites, (req, res, next) => {
  const me = req.user;
  const r = db.prepare('SELECT * FROM requests WHERE id=?').get(Number(req.params.id));
  if (!r) return next(err(404, 'not_found', 'Request not found.'));
  const t = S.getTask(r.task_id);
  if (!t || (me.role !== 'ADMIN' && t.creator_id !== me.id)) return next(err(403, 'forbidden', 'Only the task owner can decide.'));
  if (r.status !== 'PENDING') return next(err(400, 'bad_request', 'Already decided.'));
  db.prepare('UPDATE requests SET status=?, decided_by=?, decision_note=?, decided_at=? WHERE id=?')
    .run('DECLINED', me.id, String((req.body || {}).note || '') || null, now(), r.id);
  S.notify(r.tasker_id, 'REQUEST_DECLINED', `Your request for "${t.title}" was declined.`, t.task_code);
  res.json({ ok: true });
});

module.exports = router;

// Separate handler for creating a request on an open task (mounted on /tasks/:code/request).
module.exports.create = (req, res, next) => {
  const me = req.user;
  const t = S.getTaskByCode(req.params.code);
  if (!t) return next(err(404, 'not_found', 'Task not found.'));
  if (!t.is_open || t.assignee_id != null) return next(err(400, 'bad_request', 'This task is not open for requests.'));
  if (t.creator_id === me.id) return next(err(400, 'bad_request', "You can't request your own task."));
  const dup = db.prepare(`SELECT 1 FROM requests WHERE task_id=? AND tasker_id=? AND status='PENDING'`).get(t.id, me.id);
  if (dup) return next(err(409, 'conflict', 'You already have a pending request for this task.'));
  db.prepare('INSERT INTO requests (task_id,tasker_id,comment) VALUES (?,?,?)').run(t.id, me.id, String((req.body || {}).comment || '') || null);
  S.notify(t.creator_id, 'TASK_REQUESTED', `${me.full_name} requested "${t.title}".`, t.task_code);
  res.json({ ok: true, message: 'Request sent.' });
};
