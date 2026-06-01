// TaskSKA — Node.js (Express + Sequelize) backend bootstrap.
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./src/config');
const { sequelize } = require('./src/models');
const { parseToken } = require('./src/middleware/auth');
const errorHandler = require('./src/middleware/error');
const seed = require('./src/seed');
const scheduler = require('./src/scheduler');

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));
app.use(parseToken); // attaches req.user when a valid Bearer token is present

// API routers
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/tasks', require('./src/routes/tasks'));
app.use('/api/templates', require('./src/routes/templates'));
app.use('/api/connections', require('./src/routes/connections'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/workload', require('./src/routes/workload'));
app.use('/api/profile', require('./src/routes/profile'));
app.use('/api/admin', require('./src/routes/admin'));

app.get('/api/health', (_req, res) => res.json({ status: 'UP' }));

// Static frontend (SPA + admin portal)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('/admin', (_req, res) => res.sendFile(path.join(publicDir, 'admin.html')));
app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

app.use(errorHandler);

async function start() {
  await sequelize.sync();
  await seed.run();
  scheduler.start();
  app.listen(config.port, () => {
    console.log(`TaskSKA [${config.profile}] listening on :${config.port}`);
  });
}

if (require.main === module) {
  start().catch((e) => { console.error('Fatal startup error:', e); process.exit(1); });
}

module.exports = { app, start };
