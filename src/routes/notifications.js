const express = require('express');
const router = express.Router();
const { wrap } = require('../lib/errors');
const { requireAuth } = require('../middleware/auth');
const notificationsService = require('../services/notifications');
const { toNotificationDto } = require('../lib/dto');

// GET /api/notifications — all notifications (newest first)
router.get('/', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const rows = await notificationsService.list(me);
  res.json(rows.map(toNotificationDto));
}));

// GET /api/notifications/unread-count — { count }
router.get('/unread-count', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const count = await notificationsService.unreadCount(me);
  res.json({ count });
}));

// POST /api/notifications/:id/read — mark one read (void / 200)
router.post('/:id/read', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  await notificationsService.markRead(me, req.params.id);
  res.status(200).end();
}));

// POST /api/notifications/read-all — mark all read (void / 200)
router.post('/read-all', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  await notificationsService.markAllRead(me);
  res.status(200).end();
}));

module.exports = router;
