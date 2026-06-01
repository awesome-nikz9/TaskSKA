const { Op } = require('sequelize');
const { Notification } = require('../models');
const email = require('./email');

function prefAllows(u, type) {
  switch (type) {
    case 'TASK_ASSIGNED': return u.notifyAssignment;
    case 'STATUS_UPDATE':
    case 'DEADLINE_OVERDUE':
    case 'DEPENDENCY_ACTIVE': return u.notifyStatus;
    case 'CONNECTION_REQUEST':
    case 'CONNECTION_ACCEPTED': return u.notifyConnection;
    default: return true;
  }
}

// recipient is a User instance.
async function notify(recipient, type, message, relatedTaskCode = null) {
  if (!recipient) return;
  if (!prefAllows(recipient, type)) return;
  await Notification.create({ recipientId: recipient.id, type, message, relatedTaskCode });
  if (recipient.notifyEmail) {
    await email.send(recipient.email, 'TaskSKA: ' + type.replace(/_/g, ' '), message);
  }
}

async function list(recipient) {
  return Notification.findAll({ where: { recipientId: recipient.id }, order: [['createdAt', 'DESC']] });
}
async function unreadCount(recipient) {
  return Notification.count({ where: { recipientId: recipient.id, readFlag: false } });
}
async function markRead(recipient, id) {
  const n = await Notification.findByPk(id);
  if (n && n.recipientId === recipient.id) { n.readFlag = true; await n.save(); }
}
async function markAllRead(recipient) {
  await Notification.update({ readFlag: true }, { where: { recipientId: recipient.id, readFlag: false } });
}
module.exports = { notify, list, unreadCount, markRead, markAllRead };
