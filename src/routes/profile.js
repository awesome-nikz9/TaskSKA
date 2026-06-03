'use strict';
const express = require('express');
const db = require('../db');
const A = require('../auth');
const S = require('../store');
const { cleanSkills } = require('../util');
const router = express.Router();
router.use(A.requireLogin);

router.get('/', (req, res) => res.json(S.userDto(req.user.id)));
router.put('/', (req, res) => {
  const b = req.body || {}, id = req.user.id;
  const f = {};
  if (b.fullName != null && String(b.fullName).trim()) f.full_name = String(b.fullName).trim();
  if ('skills' in b) f.skills = JSON.stringify(cleanSkills(b.skills));
  if ('availability' in b) f.availability = b.availability || null;
  if (b.weeklyCapacityHours != null && Number(b.weeklyCapacityHours) > 0) f.capacity_hours = Number(b.weeklyCapacityHours);
  if ('jobTitle' in b) f.job_title = b.jobTitle || null;
  const keys = Object.keys(f);
  if (keys.length) db.prepare(`UPDATE users SET ${keys.map(k => `${k}=?`).join(',')} WHERE id=?`).run(...keys.map(k => f[k]), id);
  res.json(S.userDto(id));
});
router.put('/notifications', (req, res) => {
  const b = req.body || {}, id = req.user.id;
  const map = { notifyAssignment: 'notify_assignment', notifyStatus: 'notify_status', notifyDeadline: 'notify_deadline', notifyConnection: 'notify_connection' };
  const f = {};
  for (const k in map) if (k in b) f[map[k]] = b[k] ? 1 : 0;
  const keys = Object.keys(f);
  if (keys.length) db.prepare(`UPDATE users SET ${keys.map(k => `${k}=?`).join(',')} WHERE id=?`).run(...keys.map(k => f[k]), id);
  res.json(S.userDto(id));
});
router.post('/password', (req, res, next) => {
  const b = req.body || {};
  if (!A.verify(String(b.current || ''), req.user.password_hash)) return next(require('../util').err(400, 'bad_request', 'Current password is incorrect.'));
  if (String(b.next || '').length < 8) return next(require('../util').err(400, 'bad_request', 'New password must be at least 8 characters.'));
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(A.hash(b.next), req.user.id);
  res.json({ message: 'Password changed.' });
});
module.exports = router;
