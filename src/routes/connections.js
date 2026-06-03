'use strict';
const express = require('express');
const db = require('../db');
const A = require('../auth');
const S = require('../store');
const { err } = require('../util');
const router = express.Router();
router.use(A.requireLogin);

function connDto(c, meId) {
  const otherId = c.requester_id === meId ? c.addressee_id : c.requester_id;
  const other = S.getUser(otherId);
  let direction = 'CURRENT';
  if (c.status === 'PENDING') direction = c.requester_id === meId ? 'OUTGOING' : 'INCOMING';
  return { id: c.id, status: c.status, direction, otherUserId: otherId,
    name: other ? other.full_name : 'Unknown', email: other ? other.email : null,
    jobTitle: other ? other.job_title : null, workloadPercent: other ? S.userDto(other).workloadPercent : null,
    skills: other ? S.userDto(other).skills : [] };
}

// GET /connections -> all (accepted + pending in/out)
router.get('/', (req, res) => {
  const me = req.user.id;
  const rows = db.prepare('SELECT * FROM connections WHERE requester_id=? OR addressee_id=?').all(me, me);
  res.json(rows.map(c => connDto(c, me)));
});

// POST /connections  { email }
router.post('/', A.blockAuditorWrites, (req, res, next) => {
  const me = req.user;
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  const other = S.getUserByEmail(email);
  if (!other) return next(err(404, 'not_found', 'No user with that email.'));
  if (other.id === me.id) return next(err(400, 'bad_request', "You can't connect with yourself."));
  const existing = db.prepare(`SELECT * FROM connections WHERE
    (requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)`).get(me.id, other.id, other.id, me.id);
  if (existing) return next(err(409, 'conflict', 'A connection already exists with this user.'));
  const info = db.prepare('INSERT INTO connections (requester_id,addressee_id,status) VALUES (?,?,?)').run(me.id, other.id, 'PENDING');
  S.notify(other.id, 'CONNECTION_REQUEST', `${me.full_name} sent you a connection request.`, null);
  res.json(connDto(db.prepare('SELECT * FROM connections WHERE id=?').get(info.lastInsertRowid), me.id));
});

// POST /connections/:id/respond  { accept: true|false }
router.post('/:id/respond', A.blockAuditorWrites, (req, res, next) => {
  const me = req.user;
  const c = db.prepare('SELECT * FROM connections WHERE id=?').get(Number(req.params.id));
  if (!c || c.addressee_id !== me.id) return next(err(404, 'not_found', 'Request not found.'));
  if (c.status !== 'PENDING') return next(err(400, 'bad_request', 'Already responded.'));
  const accept = !!(req.body || {}).accept;
  db.prepare('UPDATE connections SET status=?, responded_at=datetime(\'now\') WHERE id=?').run(accept ? 'ACCEPTED' : 'DECLINED', c.id);
  if (accept) S.notify(c.requester_id, 'CONNECTION_ACCEPTED', `${me.full_name} accepted your connection request.`, null);
  res.json({ ok: true, status: accept ? 'ACCEPTED' : 'DECLINED' });
});

// DELETE /connections/:id
router.delete('/:id', A.blockAuditorWrites, (req, res, next) => {
  const me = req.user;
  const c = db.prepare('SELECT * FROM connections WHERE id=?').get(Number(req.params.id));
  if (!c || (c.requester_id !== me.id && c.addressee_id !== me.id)) return next(err(404, 'not_found', 'Connection not found.'));
  db.prepare('DELETE FROM connections WHERE id=?').run(c.id);
  res.json({ ok: true });
});

module.exports = router;
