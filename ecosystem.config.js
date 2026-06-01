// PM2 process file — `pm2 start ecosystem.config.js`
module.exports = {
  apps: [{
    name: 'taskska',
    script: 'server.js',
    instances: 1,
    env: { NODE_ENV: 'production', TASKSKA_PROFILE: 'prod', PORT: 8080 },
  }],
};
