// Idempotent data seeding — mirrors Java DataInitializer.
const bcrypt = require('bcryptjs');
const config = require('./config');
const { User, Task, Subtask, Connection } = require('./models');

async function ensureUser(attrs) {
  let u = await User.findOne({ where: { email: attrs.email } });
  if (u) return u;
  return User.create(attrs);
}

function hash(pw) { return bcrypt.hashSync(pw, 10); }

async function assignCode(task) {
  task.taskCode = 'TSK-' + String(task.id).padStart(6, '0');
  await task.save();
}

async function ensureConnection(a, b) {
  const existing = await Connection.findOne({
    where: { requesterId: a.id, addresseeId: b.id },
  });
  if (existing) return;
  await Connection.create({ requesterId: a.id, addresseeId: b.id, status: 'ACCEPTED', respondedAt: new Date() });
}

async function run() {
  // Admin — always present.
  await ensureUser({
    fullName: config.admin.name,
    email: config.admin.email,
    passwordHash: hash(config.admin.password),
    role: 'ADMIN',
    enabled: true,
    mfaEnabled: true,
    weeklyCapacityHours: 40,
    skills: [],
  });

  if (!config.seedDemo) return;
  const anyTm = await User.findOne({ where: { role: 'TASKMASTER' } });
  if (anyTm) return; // demo already seeded

  const maya = await ensureUser({ fullName: 'Maya Okoro', email: 'maya@taskska.app', passwordHash: hash('Demo@12345'), role: 'TASKMASTER', enabled: true, mfaEnabled: true, weeklyCapacityHours: 40, jobTitle: 'Delivery Lead', availability: 'Full-time', skills: ['Planning', 'Coordination', 'QA'] });
  const leo = await ensureUser({ fullName: 'Leo Martins', email: 'leo@taskska.app', passwordHash: hash('Demo@12345'), role: 'TASKER', enabled: true, mfaEnabled: true, weeklyCapacityHours: 40, jobTitle: 'Engineer', availability: 'Full-time', skills: ['Backend', 'APIs', 'Databases'] });
  const aria = await ensureUser({ fullName: 'Aria Chen', email: 'aria@taskska.app', passwordHash: hash('Demo@12345'), role: 'TASKER', enabled: true, mfaEnabled: true, weeklyCapacityHours: 30, jobTitle: 'Designer', availability: 'Part-time', skills: ['UX', 'UI', 'Research'] });
  await ensureUser({ fullName: 'Sam Reyes', email: 'sam@taskska.app', passwordHash: hash('Demo@12345'), role: 'AUDITOR', enabled: true, mfaEnabled: true, weeklyCapacityHours: 40, jobTitle: 'Compliance', availability: 'Full-time', skills: ['Audit', 'Reporting'] });

  await ensureConnection(maya, leo);
  await ensureConnection(maya, aria);
  await ensureConnection(leo, aria);

  const day = 86400000;
  const now = Date.now();
  const specs = [
    { title: 'Design onboarding flow', description: 'Wireframe the self-registration and verification screens.', status: 'IN_PROGRESS', progress: 40, estimatedHours: 12, deadline: new Date(now + 3 * day), creator: maya, assignee: aria },
    { title: 'Build auth API', description: 'Implement register, verify, login and OTP endpoints.', status: 'IN_PROGRESS', progress: 60, estimatedHours: 20, deadline: new Date(now + 5 * day), creator: maya, assignee: leo },
    { title: 'Set up database schema', description: 'Create core tables and seed reference data.', status: 'COMPLETED', progress: 100, estimatedHours: 8, deadline: new Date(now - 2 * day), creator: maya, assignee: leo },
    { title: 'Workload estimator research', description: 'Validate the urgency-weighted model against sample data.', status: 'BLOCKED', progress: 20, estimatedHours: 10, deadline: new Date(now + 1 * day), creator: maya, assignee: aria },
    { title: 'Compliance review', description: 'Review access controls and audit logging.', status: 'NOT_STARTED', progress: 0, estimatedHours: 6, deadline: new Date(now + 7 * day), creator: maya, assignee: maya },
  ];

  for (const s of specs) {
    const t = await Task.create({
      title: s.title, description: s.description, status: s.status, progress: s.progress,
      estimatedHours: s.estimatedHours, deadline: s.deadline, statusUpdatedAt: new Date(),
      creatorId: s.creator.id, assigneeId: s.assignee.id,
    });
    await assignCode(t);
    await Subtask.create({ taskId: t.id, title: 'Kick-off', done: s.progress > 0 });
    await Subtask.create({ taskId: t.id, title: 'Wrap-up', done: s.progress === 100 });
  }
}

module.exports = { run };
