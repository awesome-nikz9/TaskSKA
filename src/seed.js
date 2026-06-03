'use strict';
const db = require('./db');
const A = require('./auth');
const S = require('./store');
const { now, taskCode } = require('./util');

function ensureUser(email, fullName, role, meta) {
  const ex = S.getUserByEmail(email);
  if (ex) return ex.id;
  const info = db.prepare(`INSERT INTO users (full_name,email,password_hash,role,skills,availability,capacity_hours,job_title)
    VALUES (?,?,?,?,?,?,?,?)`).run(fullName, email, A.hash(meta.password || 'Sample@123'), role,
    JSON.stringify(meta.skills || []), meta.availability || 'Full-time', meta.capacity || 40, meta.jobTitle || null);
  return info.lastInsertRowid;
}
function connect(a, b, status = 'ACCEPTED') {
  if (!a || !b) return;
  const ex = db.prepare(`SELECT 1 FROM connections WHERE (requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)`).get(a, b, b, a);
  if (ex) return;
  db.prepare('INSERT INTO connections (requester_id,addressee_id,status,responded_at) VALUES (?,?,?,?)')
    .run(a, b, status, status === 'ACCEPTED' ? now() : null);
}

// Seeds demo content. force:true reseeds tasks even if some exist (idempotent on users).
function seed(opts = {}) {
  const D = 86400000, T = Date.now(), nowS = now();
  const admin = ensureUser('admin@taskska.app', 'Admin', 'ADMIN', { skills: ['Administration'], jobTitle: 'System Admin', password: 'Admin@123' });
  const maya = ensureUser('maya@taskska.app', 'Maya Okoro', 'TASKMASTER', { skills: ['Planning', 'Coordination', 'QA'], jobTitle: 'Delivery Lead' });
  const leo = ensureUser('leo@taskska.app', 'Leo Martins', 'TASKER', { skills: ['Node.js', 'APIs', 'SQL'], jobTitle: 'Backend Engineer' });
  const aria = ensureUser('aria@taskska.app', 'Aria Chen', 'TASKER', { skills: ['React', 'UI', 'UX', 'Research'], availability: 'Part-time', capacity: 30, jobTitle: 'Frontend Designer' });
  const noah = ensureUser('noah@taskska.app', 'Noah Kim', 'TASKER', { skills: ['QA', 'Automation', 'Cypress'], jobTitle: 'QA Engineer' });
  const sam = ensureUser('sam@taskska.app', 'Sam Reyes', 'AUDITOR', { skills: ['Audit', 'Reporting'], jobTitle: 'Compliance Auditor' });

  connect(maya, leo); connect(maya, aria); connect(maya, noah); connect(leo, aria); connect(aria, noah, 'PENDING');
  // connect admin to all so the admin's /app views are populated too
  [maya, leo, aria, noah].forEach(u => connect(admin, u));

  const have = db.prepare('SELECT COUNT(*) c FROM tasks WHERE creator_id=?').get(maya).c;
  if (have === 0 || opts.force) {
    if (opts.force && have > 0) { /* keep existing; only add if none for maya */ }
    if (have === 0) {
      const specs = [
        ['Design onboarding flow', 'Wireframe self-registration and verification screens.', 'IN_PROGRESS', 45, 12, T + 3 * D, aria, 'HIGH', 0, ['React', 'UX'], 'Mobile-first, accessible (WCAG AA).'],
        ['Build auth API', 'Register, verify, login and reset endpoints.', 'IN_PROGRESS', 60, 20, T + 5 * D, leo, 'HIGH', 0, ['Node.js', 'SQL'], 'Cookie sessions; rate-limited.'],
        ['Set up database schema', 'Core tables, indexes and seed data.', 'COMPLETED', 100, 8, T - 4 * D, leo, 'MEDIUM', 0, ['SQL'], ''],
        ['Workload estimator research', 'Validate the urgency-weighted model.', 'BLOCKED', 20, 10, T + 2 * D, aria, 'MEDIUM', 0, ['Research'], 'Compare against historical actuals.'],
        ['Compliance review', 'Review access controls and audit logging.', 'NOT_STARTED', 0, 6, T + 9 * D, maya, 'LOW', 0, ['Audit'], ''],
        ['Fix overdue notifications', 'Hourly sweep mislabels due-soon items.', 'OVERDUE', 30, 5, T - 2 * D, leo, 'URGENT', 0, ['Node.js'], 'Add a unit test for the boundary.'],
        ['QA regression pass', 'Full regression before the release.', 'NOT_STARTED', 0, 14, T + 6 * D, noah, 'HIGH', 0, ['QA', 'Automation'], 'Cover auth + tasks + workload.'],
        ['Prepare investor deck', '10-slide narrative + metrics appendix.', 'IN_PROGRESS', 25, 9, T + 7 * D, maya, 'MEDIUM', 0, ['Planning'], ''],
        ['Write API tests', 'Cover the auth and tasks endpoints.', 'NOT_STARTED', 0, 10, T + 4 * D, null, 'HIGH', 1, ['Node.js', 'SQL'], 'Open for any tasker to claim.'],
        ['Design marketing site', 'Landing, pricing and FAQ sections.', 'NOT_STARTED', 0, 16, T + 11 * D, null, 'MEDIUM', 1, ['React', 'UI'], 'Open pool - pick it up if you have capacity.'],
      ];
      const codes = {};
      for (const s of specs) {
        const deadline = s[5] ? new Date(s[5]).toISOString().slice(0, 19).replace('T', ' ') : null;
        const info = db.prepare(`INSERT INTO tasks (title,description,requirements,required_skills,is_open,priority,status,progress,estimated_hours,deadline,creator_id,assignee_id,status_updated_at,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(s[0], s[1], s[10] || null, JSON.stringify(s[9]), s[8], s[7], s[2], s[3], s[4], deadline, maya, s[6],
          nowS, new Date(T - 10 * D).toISOString().slice(0, 19).replace('T', ' '), nowS);
        const id = info.lastInsertRowid;
        db.prepare('UPDATE tasks SET task_code=? WHERE id=?').run(taskCode(id), id);
        codes[s[0]] = { id, code: taskCode(id) };
        db.prepare('INSERT INTO subtasks (task_id,title,done) VALUES (?,?,?)').run(id, 'Kick-off', s[3] > 0 ? 1 : 0);
        db.prepare('INSERT INTO subtasks (task_id,title,done) VALUES (?,?,?)').run(id, 'Implementation', s[3] >= 100 ? 1 : 0);
        db.prepare('INSERT INTO subtasks (task_id,title,done) VALUES (?,?,?)').run(id, 'Wrap-up', s[3] >= 100 ? 1 : 0);
      }
      if (codes['Build auth API'] && codes['Set up database schema'])
        db.prepare('INSERT OR IGNORE INTO task_deps (task_id,depends_on_id) VALUES (?,?)').run(codes['Build auth API'].id, codes['Set up database schema'].id);
      if (codes['Write API tests']) db.prepare('INSERT INTO requests (task_id,tasker_id,comment) VALUES (?,?,?)').run(codes['Write API tests'].id, leo, 'I built the auth API so I know these endpoints well - I have capacity this week.');
      if (codes['Design marketing site']) db.prepare('INSERT INTO requests (task_id,tasker_id,comment) VALUES (?,?,?)').run(codes['Design marketing site'].id, aria, 'Design is my wheelhouse - happy to take the landing page.');
      if (codes['Fix overdue notifications']) S.notify(maya, 'DEADLINE_OVERDUE', `Task ${codes['Fix overdue notifications'].code} "Fix overdue notifications" is overdue.`, codes['Fix overdue notifications'].code);
      if (codes['Write API tests']) S.notify(maya, 'TASK_REQUESTED', 'Leo Martins requested "Write API tests".', codes['Write API tests'].code);
      if (codes['Set up database schema']) S.notify(maya, 'STATUS_UPDATE', '"Set up database schema" is now COMPLETED (updated by Leo Martins).', codes['Set up database schema'].code);
      db.prepare('INSERT INTO templates (owner_id,name,title,description,estimated_hours,deadline_offset_days,default_assignee_id) VALUES (?,?,?,?,?,?,?)').run(maya, 'Bug fix', 'Fix: <component>', 'Reproduce, fix, add a regression test, verify.', 4, 3, leo);
      db.prepare('INSERT INTO templates (owner_id,name,title,description,estimated_hours,deadline_offset_days,default_assignee_id) VALUES (?,?,?,?,?,?,?)').run(maya, 'Design review', 'Design review: <feature>', 'Heuristic + accessibility review with written notes.', 3, 5, aria);
    }
  }
  const users = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const tasksN = db.prepare('SELECT COUNT(*) c FROM tasks').get().c;
  return { users, tasks: tasksN };
}

if (require.main === module) { const r = seed({ force: false }); console.log('Seed complete:', r); }
module.exports = { seed };
