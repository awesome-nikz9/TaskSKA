'use strict';
const express = require('express');
const db = require('../db');
const A = require('../auth');
const S = require('../store');
const router = express.Router();
router.use(A.requireLogin);

// GET /workload/me
router.get('/me', (req, res) => res.json(S.workloadDto(req.user.id)));

// GET /workload/team?scope=all&level=
router.get('/team', (req, res) => {
  const me = req.user;
  const out = []; const seen = new Set();
  const add = (id) => { if (!id || seen.has(id)) return; const u = S.getUser(id); if (!u) return; seen.add(id); out.push(S.workloadDto(u)); };
  add(me.id);
  const scope = String(req.query.scope || '').toLowerCase();
  const canAll = scope === 'all' && (me.role === 'TASKMASTER' || me.role === 'ADMIN');
  if (canAll) db.prepare(`SELECT id FROM users WHERE role IN ('TASKMASTER','TASKER') AND enabled=1`).all().forEach(u => add(u.id));
  else S.acceptedConnectionIds(me.id).forEach(add);
  out.sort((a, b) => b.percent - a.percent);
  let level = String(req.query.level || '').toUpperCase();
  const filtered = level ? out.filter(w => w.level === level) : out;
  res.json(filtered);
});

module.exports = router;
