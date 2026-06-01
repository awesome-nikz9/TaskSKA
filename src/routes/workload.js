const express = require('express');
const router = express.Router();
const { wrap } = require('../lib/errors');
const { requireAuth } = require('../middleware/auth');
const { toWorkloadDto } = require('../lib/dto');
const connectionsService = require('../services/connections');

// GET /api/workload/me — self workload
router.get('/me', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  res.json(await toWorkloadDto(me));
}));

// GET /api/workload/team — self + connected team members, sorted high->low.
// Optional ?level=LOW|MEDIUM|HIGH filter.
router.get('/team', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const out = [];
  out.push(await toWorkloadDto(me));
  const connected = await connectionsService.acceptedConnections(me);
  for (const u of connected) out.push(await toWorkloadDto(u));
  out.sort((a, b) => b.percent - a.percent);
  const level = req.query.level;
  let result = out;
  if (level != null && String(level).trim() !== '') {
    const lv = String(level).toUpperCase();
    result = out.filter((w) => w.level.toUpperCase() === lv);
  }
  res.json(result);
}));

module.exports = router;
