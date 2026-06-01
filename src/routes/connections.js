const express = require('express');
const router = express.Router();
const { wrap } = require('../lib/errors');
const { requireAuth } = require('../middleware/auth');
const connectionsService = require('../services/connections');

// GET /api/connections — list incoming/outgoing/current connections
router.get('/', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  res.json(await connectionsService.list(me));
}));

// POST /api/connections — request a connection by email
router.post('/', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  res.json(await connectionsService.request(me, req.body.email));
}));

// POST /api/connections/:id/accept
router.post('/:id/accept', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  res.json(await connectionsService.respond(me, req.params.id, true));
}));

// POST /api/connections/:id/decline
router.post('/:id/decline', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  res.json(await connectionsService.respond(me, req.params.id, false));
}));

module.exports = router;
