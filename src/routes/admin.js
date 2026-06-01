const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { wrap, ApiException } = require('../lib/errors');
const { requireAdmin } = require('../middleware/auth');
const { User, Task, Connection } = require('../models');
const { toUserDto, toWorkloadDto } = require('../lib/dto');

const TASK_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'OVERDUE'];

// GET /api/admin/stats — aggregate dashboard stats
router.get('/stats', requireAdmin, wrap(async (req, res) => {
  const tasksByStatus = {};
  for (const s of TASK_STATUSES) {
    tasksByStatus[s] = await Task.count({ where: { status: s } });
  }

  const team = [];
  for (const role of ['TASKMASTER', 'TASKER']) {
    const roleUsers = await User.findAll({ where: { role } });
    for (const u of roleUsers) team.push(await toWorkloadDto(u));
  }
  team.sort((a, b) => b.percent - a.percent);

  const totalUsers = await User.count();
  const taskmasters = await User.count({ where: { role: 'TASKMASTER' } });
  const taskers = await User.count({ where: { role: 'TASKER' } });
  const auditors = await User.count({ where: { role: 'AUDITOR' } });
  const pendingUsers = await User.count({ where: { enabled: false } });
  const totalTasks = await Task.count();
  const overdueTasks = await Task.count({ where: { status: 'OVERDUE' } });
  const openConnections = await Connection.count({ where: { status: 'PENDING' } });

  res.json({
    totalUsers,
    taskmasters,
    taskers,
    auditors,
    pendingUsers,
    totalTasks,
    tasksByStatus,
    overdueTasks,
    openConnections,
    teamWorkload: team,
  });
}));

// GET /api/admin/users — all users with task counts, sorted by name
router.get('/users', requireAdmin, wrap(async (req, res) => {
  const allUsers = await User.findAll();
  const out = [];
  for (const u of allUsers) {
    const active = await Task.count({ where: { assigneeId: u.id } });
    const created = await Task.count({ where: { creatorId: u.id } });
    out.push({ user: await toUserDto(u), activeTasks: active, createdTasks: created });
  }
  out.sort((a, b) => (a.user.fullName || '').toLowerCase().localeCompare((b.user.fullName || '').toLowerCase()));
  res.json(out);
}));

async function setEnabled(userId, enabled) {
  const u = await User.findByPk(userId);
  if (!u) throw ApiException.notFound('User not found');
  if (u.role === 'ADMIN') throw ApiException.badRequest('Cannot modify the admin account');
  u.enabled = enabled;
  await u.save();
  return toUserDto(u);
}

// POST /api/admin/users/:id/enable
router.post('/users/:id/enable', requireAdmin, wrap(async (req, res) => {
  res.json(await setEnabled(req.params.id, true));
}));

// POST /api/admin/users/:id/disable
router.post('/users/:id/disable', requireAdmin, wrap(async (req, res) => {
  res.json(await setEnabled(req.params.id, false));
}));

// POST /api/admin/users/:id/role { role }
router.post('/users/:id/role', requireAdmin, wrap(async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) throw ApiException.notFound('User not found');
  if (u.role === 'ADMIN') throw ApiException.badRequest('Cannot change the admin account role');
  const raw = (req.body || {}).role;
  const valid = ['TASKMASTER', 'TASKER', 'AUDITOR', 'ADMIN'];
  let role;
  if (raw != null && valid.includes(String(raw).toUpperCase())) role = String(raw).toUpperCase();
  else throw ApiException.badRequest('Invalid role');
  if (role === 'ADMIN') throw ApiException.badRequest('Cannot promote to ADMIN');
  u.role = role;
  await u.save();
  res.json(await toUserDto(u));
}));

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, wrap(async (req, res) => {
  const userId = req.params.id;
  const u = await User.findByPk(userId);
  if (!u) throw ApiException.notFound('User not found');
  if (u.role === 'ADMIN') throw ApiException.badRequest('Cannot delete the admin account');

  // unassign tasks assigned to user
  const assigned = await Task.findAll({ where: { assigneeId: u.id } });
  for (const t of assigned) { t.assigneeId = null; await t.save(); }
  // delete tasks created by user
  await Task.destroy({ where: { creatorId: u.id } });
  // delete connections involving user
  await Connection.destroy({ where: { [Op.or]: [{ requesterId: u.id }, { addresseeId: u.id }] } });
  await u.destroy();

  res.json({ message: 'User deleted' });
}));

module.exports = router;
