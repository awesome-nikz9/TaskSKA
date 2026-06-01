// Overdue flagger — mirrors Java OverdueScheduler. Runs every 5 minutes.
const cron = require('node-cron');
const { Op } = require('sequelize');
const { Task, User } = require('./models');
const notifications = require('./services/notifications');

async function flagOverdue() {
  const now = new Date();
  const due = await Task.findAll({
    where: { status: { [Op.notIn]: ['COMPLETED', 'OVERDUE'] }, deadline: { [Op.lt]: now } },
  });
  for (const t of due) {
    t.status = 'OVERDUE';
    t.statusUpdatedAt = now;
    await t.save();
    const msg = `Task ${t.taskCode} "${t.title}" is overdue.`;
    const assignee = t.assigneeId ? await User.findByPk(t.assigneeId) : null;
    if (assignee) await notifications.notify(assignee, 'DEADLINE_OVERDUE', msg, t.taskCode);
    if (t.creatorId && t.creatorId !== t.assigneeId) {
      const creator = await User.findByPk(t.creatorId);
      if (creator) await notifications.notify(creator, 'DEADLINE_OVERDUE', msg, t.taskCode);
    }
  }
  return due.length;
}

function start() {
  cron.schedule('*/5 * * * *', () => { flagOverdue().catch((e) => console.error('[scheduler]', e.message)); });
}

module.exports = { start, flagOverdue };
