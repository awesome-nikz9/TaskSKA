const { Op } = require('sequelize');
const { Connection, User } = require('../models');
const { ApiException } = require('../lib/errors');
const notifications = require('./notifications');
const workload = require('./workload');

async function findBetween(a, b) {
  return Connection.findOne({ where: { [Op.or]: [
    { requesterId: a.id, addresseeId: b.id },
    { requesterId: b.id, addresseeId: a.id },
  ] } });
}

async function request(me, emailAddr) {
  const target = await User.findOne({ where: { email: (emailAddr || '').toLowerCase() } });
  if (!target) throw ApiException.notFound('No TaskSKA user found with that email.');
  if (target.id === me.id) throw ApiException.badRequest('You cannot connect with yourself.');
  const existing = await findBetween(me, target);
  if (existing) {
    if (existing.status === 'ACCEPTED') throw ApiException.conflict('You are already connected with this user.');
    if (existing.status === 'PENDING') throw ApiException.conflict('A connection request is already pending.');
  }
  const c = existing || Connection.build();
  c.requesterId = me.id; c.addresseeId = target.id;
  c.status = 'PENDING'; c.createdAt = new Date(); c.respondedAt = null;
  await c.save();
  await notifications.notify(target, 'CONNECTION_REQUEST',
    `${me.fullName} (${me.email}) sent you a connection request.`, null);
  return { message: `Connection request sent to ${target.fullName}.` };
}

async function respond(me, connectionId, accept) {
  const c = await Connection.findByPk(connectionId);
  if (!c) throw ApiException.notFound('Connection request not found.');
  if (c.addresseeId !== me.id) throw ApiException.forbidden('You can only respond to requests addressed to you.');
  if (c.status !== 'PENDING') throw ApiException.badRequest('This request has already been handled.');
  c.status = accept ? 'ACCEPTED' : 'DECLINED';
  c.respondedAt = new Date();
  await c.save();
  if (accept) {
    const requester = await User.findByPk(c.requesterId);
    await notifications.notify(requester, 'CONNECTION_ACCEPTED', `${me.fullName} accepted your connection request.`, null);
  }
  return { message: accept ? 'Connection accepted.' : 'Connection declined.' };
}

async function acceptedConnections(me) {
  const rows = await Connection.findAll({ where: { status: 'ACCEPTED', [Op.or]: [{ requesterId: me.id }, { addresseeId: me.id }] } });
  const otherIds = rows.map(c => c.requesterId === me.id ? c.addresseeId : c.requesterId);
  if (!otherIds.length) return [];
  return User.findAll({ where: { id: otherIds } });
}

async function isConnected(a, b) {
  const c = await findBetween(a, b);
  return !!c && c.status === 'ACCEPTED';
}

async function list(me) {
  const out = [];
  const incoming = await Connection.findAll({ where: { addresseeId: me.id, status: 'PENDING' } });
  for (const c of incoming) {
    const o = await User.findByPk(c.requesterId);
    out.push(dto(c.id, o, 'INCOMING', c.status, null, c.createdAt));
  }
  const outgoing = await Connection.findAll({ where: { requesterId: me.id, status: 'PENDING' } });
  for (const c of outgoing) {
    const o = await User.findByPk(c.addresseeId);
    out.push(dto(c.id, o, 'OUTGOING', c.status, null, c.createdAt));
  }
  const accepted = await Connection.findAll({ where: { status: 'ACCEPTED', [Op.or]: [{ requesterId: me.id }, { addresseeId: me.id }] } });
  for (const c of accepted) {
    const o = await User.findByPk(c.requesterId === me.id ? c.addresseeId : c.requesterId);
    out.push(dto(c.id, o, 'CURRENT', c.status, await workload.percentFor(o), c.createdAt));
  }
  return out;
}

function dto(id, o, direction, status, wl, at) {
  return { id, otherUserId: o.id, name: o.fullName, email: o.email, role: o.role, direction, status, workloadPercent: wl, createdAt: at };
}

module.exports = { findBetween, request, respond, acceptedConnections, isConnected, list };
