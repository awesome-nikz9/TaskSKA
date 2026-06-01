// Dynamic urgency-weighted workload estimator (the NOVEL feature).
// Workload % = committed remaining effort / weekly capacity, weighted up for
// imminent or overdue deadlines so urgent work counts for more.
const { Task } = require('../models');

async function compute(user) {
  const assigned = await Task.findAll({ where: { assigneeId: user.id } });
  let committed = 0, active = 0;
  const now = Date.now();
  for (const t of assigned) {
    if (t.status === 'COMPLETED') continue;
    active++;
    const remaining = t.estimatedHours * (1.0 - t.progress / 100.0);
    let urgency = 1.0;
    if (t.deadline) {
      const hoursToDeadline = Math.floor((new Date(t.deadline).getTime() - now) / 3600000);
      if (hoursToDeadline < 0) urgency = 1.6;          // overdue
      else if (hoursToDeadline < 48) urgency = 1.4;    // within 2 days
      else if (hoursToDeadline < 168) urgency = 1.2;   // within a week
    }
    if (t.status === 'BLOCKED') urgency *= 1.1;
    committed += remaining * urgency;
  }
  const capacity = Math.max(1, user.weeklyCapacityHours);
  let percent = Math.round((committed / capacity) * 100.0);
  if (percent > 100) percent = 100;
  return { percent, level: level(percent), activeTasks: active, committedHours: Math.round(committed * 10) / 10.0, capacityHours: capacity };
}

function level(percent) {
  if (percent <= 50) return 'LOW';
  if (percent <= 80) return 'MEDIUM';
  return 'HIGH';
}

async function percentFor(user) { return (await compute(user)).percent; }

module.exports = { compute, percentFor, level };
