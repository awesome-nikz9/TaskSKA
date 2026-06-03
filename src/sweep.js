'use strict';
const db = require('./db');
const S = require('./store');
const { now } = require('./util');

// Flip past-deadline tasks to OVERDUE; warn once when due within 24h.
function sweepOverdue() {
  const ts = now();
  const overdue = db.prepare(`SELECT * FROM tasks WHERE status NOT IN ('COMPLETED','OVERDUE') AND deadline IS NOT NULL AND deadline < ?`).all(ts);
  for (const t of overdue) {
    db.prepare('UPDATE tasks SET status=?, status_updated_at=? WHERE id=?').run('OVERDUE', ts, t.id);
    const msg = `Task ${t.task_code} "${t.title}" is overdue.`;
    if (t.assignee_id) S.notify(t.assignee_id, 'DEADLINE_OVERDUE', msg, t.task_code);
    if (t.creator_id && t.creator_id !== t.assignee_id) S.notify(t.creator_id, 'DEADLINE_OVERDUE', msg, t.task_code);
  }
  const soon = new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
  const dueSoon = db.prepare(`SELECT * FROM tasks WHERE status NOT IN ('COMPLETED','OVERDUE') AND deadline IS NOT NULL AND deadline >= ? AND deadline <= ? AND due_soon_notified=0`).all(ts, soon);
  for (const t of dueSoon) {
    const hrs = Math.max(0, Math.floor((Date.parse(t.deadline + 'Z') - Date.now()) / 3600000));
    const msg = `Task ${t.task_code} "${t.title}" is due in about ${hrs} hour${hrs === 1 ? '' : 's'}.`;
    if (t.assignee_id) S.notify(t.assignee_id, 'DEADLINE_SOON', msg, t.task_code);
    db.prepare('UPDATE tasks SET due_soon_notified=1 WHERE id=?').run(t.id);
  }
  return { overdue: overdue.length, dueSoon: dueSoon.length };
}
module.exports = { sweepOverdue };
