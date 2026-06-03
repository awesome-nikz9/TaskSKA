'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Use an isolated temp DB and silence seeding noise.
const TMP = path.join(__dirname, 'tmp-test.db');
process.env.DB_FILE = TMP;
process.env.JWT_SECRET = 'test-secret';
process.env.SEED_ON_EMPTY = '0';
for (const f of [TMP, TMP + '-wal', TMP + '-shm']) try { fs.unlinkSync(f); } catch {}

const app = require('../server');
const { seed } = require('../src/seed');
seed({ force: false });

let server, base;
test.before(async () => {
  await new Promise(r => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; r(); }); });
});
test.after(() => server && server.close());

let cookie = '';
async function call(method, p, body, jar) {
  const headers = { 'Content-Type': 'application/json' };
  if (jar) headers.Cookie = jar;
  const res = await fetch(base + '/api' + p, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const setC = res.headers.get('set-cookie');
  const data = await res.json().catch(() => null);
  return { status: res.status, data, cookie: setC };
}

test('health', async () => {
  const r = await call('GET', '/health');
  assert.equal(r.status, 200); assert.equal(r.data.ok, true);
});

test('login as Maya (taskmaster)', async () => {
  const r = await call('POST', '/auth/login', { email: 'maya@taskska.app', password: 'Sample@123' });
  assert.equal(r.status, 200);
  assert.equal(r.data.user.role, 'TASKMASTER');
  cookie = r.cookie.split(';')[0];
});

test('reject bad password', async () => {
  const r = await call('POST', '/auth/login', { email: 'maya@taskska.app', password: 'wrong' });
  assert.equal(r.status, 401);
});

test('create a task and read it back', async () => {
  const r = await call('POST', '/tasks', { title: 'Test task', priority: 'HIGH', estimatedHours: 6, deadline: '2026-08-01', subtasks: ['x', 'y'] }, cookie);
  assert.equal(r.status, 200);
  assert.match(r.data.taskCode, /^TSK-\d{6}$/);
  assert.equal(r.data.status, 'NOT_STARTED');
  assert.equal(r.data.priority, 'HIGH');
  assert.equal(r.data.subtasks.length, 2);
  const g = await call('GET', '/tasks/' + r.data.taskCode, null, cookie);
  assert.equal(g.status, 200); assert.equal(g.data.title, 'Test task');
});

test('status transition to COMPLETED sets progress 100', async () => {
  const c = await call('POST', '/tasks', { title: 'Finish me', estimatedHours: 2 }, cookie);
  const code = c.data.taskCode;
  const s = await call('POST', '/tasks/' + code + '/status', { status: 'COMPLETED' }, cookie);
  assert.equal(s.status, 200); assert.equal(s.data.status, 'COMPLETED'); assert.equal(s.data.progress, 100);
});

test('workload team returns people with percentages', async () => {
  const r = await call('GET', '/workload/team?scope=all', null, cookie);
  assert.equal(r.status, 200);
  assert.ok(r.data.length >= 1);
  assert.ok(typeof r.data[0].percent === 'number');
});

test('open pool + request flow', async () => {
  const open = await call('GET', '/tasks/open', null, cookie);
  assert.equal(open.status, 200);
  assert.ok(open.data.length >= 1);
});

test('auditor cannot create tasks', async () => {
  const login = await call('POST', '/auth/login', { email: 'sam@taskska.app', password: 'Sample@123' });
  const jar = login.cookie.split(';')[0];
  const r = await call('POST', '/tasks', { title: 'nope' }, jar);
  assert.equal(r.status, 403);
});

test('admin stats require admin', async () => {
  const r = await call('GET', '/admin/stats', null, cookie); // maya is not admin
  assert.equal(r.status, 403);
  const login = await call('POST', '/auth/login', { email: 'admin@taskska.app', password: 'Admin@123' });
  const jar = login.cookie.split(';')[0];
  const ok = await call('GET', '/admin/stats', null, jar);
  assert.equal(ok.status, 200); assert.ok(ok.data.totalUsers >= 6);
});

test('unauthenticated request is rejected', async () => {
  const r = await call('GET', '/tasks');
  assert.equal(r.status, 401);
});
