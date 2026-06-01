const express = require('express');
const router = express.Router();
const { wrap } = require('../lib/errors');
const { requireAuth } = require('../middleware/auth');
const { toUserDto } = require('../lib/dto');

// GET /api/profile/me — current user DTO
router.get('/me', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  res.json(await toUserDto(me));
}));

// PUT /api/profile — update profile fields
router.put('/', requireAuth, wrap(async (req, res) => {
  const u = req.user;
  const req_ = req.body || {};
  if (req_.fullName != null && String(req_.fullName).trim() !== '') u.fullName = String(req_.fullName).trim();
  if (req_.skills != null) u.skills = Array.from(new Set(req_.skills));
  if (req_.availability != null) u.availability = req_.availability;
  if (req_.weeklyCapacityHours != null && req_.weeklyCapacityHours > 0) u.weeklyCapacityHours = req_.weeklyCapacityHours;
  if (req_.jobTitle != null) u.jobTitle = req_.jobTitle;
  await u.save();
  res.json(await toUserDto(u));
}));

// PUT /api/profile/notifications — update notification preferences
router.put('/notifications', requireAuth, wrap(async (req, res) => {
  const u = req.user;
  const req_ = req.body || {};
  u.notifyAssignment = req_.notifyAssignment;
  u.notifyStatus = req_.notifyStatus;
  u.notifyConnection = req_.notifyConnection;
  u.notifyEmail = req_.notifyEmail;
  await u.save();
  res.json(await toUserDto(u));
}));

module.exports = router;
