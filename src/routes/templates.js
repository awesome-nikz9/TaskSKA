'use strict';
const express = require('express');
const db = require('../db');
const A = require('../auth');
const S = require('../store');
const { err } = require('../util');
const tasks = require('./tasks');
const router = express.Router();
router.use(A.requireLogin);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM templates WHERE owner_id=? ORDER BY name').all(req.user.id);
  res.json(rows.map(S.templateDto));
});
router.post('/', A.blockAuditorWrites, (req, res, next) => {
  const b = req.body || {};
  if (!String(b.name || '').trim() || !String(b.title || '').trim()) return next(err(400, 'bad_request', 'Name and title are required.'));
  const info = db.prepare(`INSERT INTO templates (owner_id,name,title,description,estimated_hours,deadline_offset_days,default_assignee_id)
    VALUES (?,?,?,?,?,?,?)`).run(req.user.id, String(b.name).trim(), String(b.title).trim(), b.description || null,
    Number(b.estimatedHours) > 0 ? Number(b.estimatedHours) : 4, parseInt(b.deadlineOffsetDays, 10) || 7,
    b.defaultAssigneeId ? Number(b.defaultAssigneeId) : null);
  res.json(S.templateDto(db.prepare('SELECT * FROM templates WHERE id=?').get(info.lastInsertRowid)));
});
router.put('/:id', A.blockAuditorWrites, (req, res, next) => {
  const t = db.prepare('SELECT * FROM templates WHERE id=?').get(Number(req.params.id));
  if (!t || t.owner_id !== req.user.id) return next(err(404, 'not_found', 'Template not found.'));
  const b = req.body || {};
  db.prepare(`UPDATE templates SET name=?,title=?,description=?,estimated_hours=?,deadline_offset_days=?,default_assignee_id=? WHERE id=?`)
    .run(String(b.name || t.name).trim(), String(b.title || t.title).trim(), b.description ?? t.description,
      Number(b.estimatedHours) > 0 ? Number(b.estimatedHours) : t.estimated_hours,
      parseInt(b.deadlineOffsetDays, 10) || t.deadline_offset_days,
      b.defaultAssigneeId ? Number(b.defaultAssigneeId) : t.default_assignee_id, t.id);
  res.json(S.templateDto(db.prepare('SELECT * FROM templates WHERE id=?').get(t.id)));
});
router.delete('/:id', A.blockAuditorWrites, (req, res, next) => {
  const t = db.prepare('SELECT * FROM templates WHERE id=?').get(Number(req.params.id));
  if (!t || t.owner_id !== req.user.id) return next(err(404, 'not_found', 'Template not found.'));
  db.prepare('DELETE FROM templates WHERE id=?').run(t.id);
  res.json({ ok: true });
});
// POST /templates/:id/instantiate -> create a task from the template
router.post('/:id/instantiate', A.blockAuditorWrites, (req, res, next) => {
  const t = db.prepare('SELECT * FROM templates WHERE id=?').get(Number(req.params.id));
  if (!t || t.owner_id !== req.user.id) return next(err(404, 'not_found', 'Template not found.'));
  const deadline = new Date(Date.now() + t.deadline_offset_days * 86400000).toISOString().slice(0, 10);
  try {
    const row = tasks.createTask(req.user, {
      title: t.title, description: t.description, estimatedHours: t.estimated_hours,
      deadline, assigneeId: t.default_assignee_id || null,
    });
    res.json(S.taskDto(row, req.user));
  } catch (e) { next(e); }
});
module.exports = router;
