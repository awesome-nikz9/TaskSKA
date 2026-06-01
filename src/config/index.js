require('dotenv').config();
const profile = process.env.TASKSKA_PROFILE || 'prod';
module.exports = {
  profile,
  isDev: profile === 'dev',
  port: parseInt(process.env.PORT || '8080', 10),
  jwt: {
    secret: process.env.TASKSKA_JWT_SECRET || 'CHANGE_ME_super_secret_key_at_least_32_chars_long_0123456789',
    expiresSeconds: parseInt(process.env.TASKSKA_JWT_EXPIRES || '86400', 10),
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'taskska',
    user: process.env.DB_USER || 'taskska',
    password: process.env.DB_PASSWORD || 'changeme',
  },
  admin: {
    email: (process.env.ADMIN_EMAIL || 'admin@taskska.app').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    name: process.env.ADMIN_NAME || 'Platform Administrator',
  },
  seedDemo: (process.env.SEED_DEMO || 'true') === 'true',
  otp: { expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10) },
  mail: {
    consoleFallback: (process.env.MAIL_CONSOLE_FALLBACK || 'true') === 'true',
    host: process.env.MAIL_HOST || '',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    username: process.env.MAIL_USERNAME || '',
    password: process.env.MAIL_PASSWORD || '',
    from: process.env.MAIL_FROM || 'no-reply@taskska.app',
  },
};
