'use strict';
const db = require('./db');

// Average actual/estimated ratio across a user's COMPLETED tasks (1.0 if <2 points).
function historicalFactor(uid) {
  const rows = db.prepare(
    `SELECT estimated_hours, created_at, status_updated_at FROM tasks
     WHERE assignee_id = ? AND status = 'COMPLETED' AND status_updated_at IS NOT NULL`).all(uid);
  const ratios = [];
  for (const h of rows) {
    const est = Number(h.estimated_hours);
    if (est <= 0 || !h.created_at) continue;
    let elapsed = (Date.parse(h.status_updated_at + 'Z') - Date.parse(h.created_at + 'Z')) / 3600000;
    if (elapsed <= 0) continue;
    elapsed = Math.min(elapsed, est * 5);
    ratios.push(elapsed / est);
  }
  if (ratios.length < 2) return 1.0;
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  return Math.max(0.7, Math.min(1.5, avg));
}

// Urgency-weighted estimator -> { percent, level, activeTasks, committedHours, capacityHours, historicalFactor }
function workload(uid) {
  const u = db.prepare('SELECT capacity_hours FROM users WHERE id = ?').get(uid);
  const cap = Math.max(1, (u && u.capacity_hours) || 40);
  const rows = db.prepare('SELECT status, progress, estimated_hours, deadline FROM tasks WHERE assignee_id = ?').all(uid);
  const nowTs = Date.now();
  let committed = 0, active = 0;
  for (const t of rows) {
    if (t.status === 'COMPLETED') continue;
    active++;
    let remaining = Number(t.estimated_hours) * (1 - Number(t.progress) / 100);
    let urgency = 1.0;
    if (t.deadline) {
      const hrs = Math.floor((Date.parse(t.deadline + 'Z') - nowTs) / 3600000);
      if (hrs < 0) urgency = 1.6; else if (hrs < 48) urgency = 1.4; else if (hrs < 168) urgency = 1.2;
    }
    if (t.status === 'BLOCKED') urgency *= 1.1;
    committed += remaining * urgency;
  }
  const factor = historicalFactor(uid);
  committed *= factor;
  let percent = Math.round((committed / cap) * 100);
  if (percent > 100) percent = 100;
  const level = percent <= 50 ? 'LOW' : percent <= 80 ? 'MEDIUM' : 'HIGH';
  return {
    percent, level, activeTasks: active,
    committedHours: Math.round(committed * 10) / 10,
    capacityHours: cap, historicalFactor: Math.round(factor * 100) / 100,
  };
}
const workloadPercent = (uid) => workload(uid).percent;

module.exports = { workload, workloadPercent, historicalFactor };
