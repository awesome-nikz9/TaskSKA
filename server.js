'use strict';
require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const A = require('./src/auth');
const { ApiError } = require('./src/util');
const { sweepOverdue } = require('./src/sweep');
const requestsRoute = require('./src/routes/requests');

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
if (process.env.CORS_ORIGIN) app.use(cors({ origin: process.env.CORS_ORIGIN.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// API
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/tasks', require('./src/routes/tasks'));
app.post('/api/tasks/:code/request', A.requireLogin, A.blockAuditorWrites, requestsRoute.create);
app.use('/api/requests', requestsRoute);
app.use('/api/connections', require('./src/routes/connections'));
app.use('/api/workload', require('./src/routes/workload'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/templates', require('./src/routes/templates'));
app.use('/api/profile', require('./src/routes/profile'));
app.use('/api/admin', require('./src/routes/admin'));
app.get('/api/health', (req, res) => res.json({ ok: true, version: require('./package.json').version }));

// Static SPA
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((e, req, res, next) => {
  if (e instanceof ApiError) return res.status(e.status).json({ code: e.code, message: e.message });
  console.error(e);
  res.status(500).json({ code: 'server_error', message: e.message || 'Server error.' });
});

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  // Auto-seed when empty.
  try {
    const db = require('./src/db');
    const empty = db.prepare('SELECT COUNT(*) c FROM users').get().c === 0;
    if (empty && process.env.SEED_ON_EMPTY !== '0') { require('./src/seed').seed({ force: false }); console.log('Seeded demo data (empty DB).'); }
  } catch (e) { console.error('Seed check failed:', e.message); }
  sweepOverdue();
  setInterval(sweepOverdue, 60 * 60 * 1000);
  app.listen(PORT, () => console.log(`TaskSKA running on http://localhost:${PORT}`));
}
module.exports = app;
