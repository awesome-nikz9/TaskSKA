'use strict';
const express = require('express');
const db = require('../db');
const A = require('../auth');
const S = require('../store');
const { err } = require('../util');
const router = express.Router();
router.use(A.requireLogin);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE recipient_id=? ORDER BY created_at DESC, id DESC LIMIT 100').all(req.user.id);
  res.json(rows.map(S.notificationDto));
});
router.get('/unread-count', (req, res) => {
  const c = db.prepare('SELECT COUNT(*) c FROM notifications WHERE recipient_id=? AND read_flag=0').get(req.user.id).c;
  res.json({ count: c });
});
router.post('/:id/read', (req, res, next) => {
  const n = db.prepare('SELECT * FROM notifications WHERE id=?').get(Number(req.params.id));
  if (!n || n.recipient_id !== req.user.id) return next(err(404, 'not_found', 'Notification not found.'));
  db.prepare('UPDATE notifications SET read_flag=1 WHERE id=?').run(n.id);
  res.json({ ok: true });
});
router.post('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET read_flag=1 WHERE recipient_id=?').run(req.user.id);
  res.json({ ok: true });
});
module.exports = router;
