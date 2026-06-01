const { Sequelize } = require('sequelize');
const config = require('./index');

let sequelize;
if (config.isDev) {
  // In-memory SQLite — the dev/test equivalent of the Java H2 profile.
  sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
} else {
  sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: false,
    define: { charset: 'utf8mb4' },
    pool: { max: 10, min: 0, idle: 10000 },
  });
}
module.exports = sequelize;
