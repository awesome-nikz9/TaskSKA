const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { wrap, ApiException } = require('../lib/errors');
const { User } = require('../models');
const { toUserDto } = require('../lib/dto');
const { sign } = require('../middleware/auth');
const otp = require('../services/otp');
const email = require('../services/email');

// Helper: case-insensitive email lookup (Java uses findByEmailIgnoreCase).
function findByEmail(rawEmail) {
  const e = (rawEmail || '').trim().toLowerCase();
  return User.findOne({ where: { email: e } });
}

const VALID_REGISTER_ROLES = ['TASKMASTER', 'TASKER', 'AUDITOR', 'ADMIN'];

// POST /register
router.post('/register', wrap(async (req, res) => {
  const { fullName, email: rawEmail, password, role, skills, availability,
    weeklyCapacityHours, jobTitle } = req.body || {};

  if (!fullName || !String(fullName).trim()) throw ApiException.badRequest('fullName is required.');
  if (!rawEmail || !String(rawEmail).trim()) throw ApiException.badRequest('email is required.');
  if (!password || !String(password).trim()) throw ApiException.badRequest('password is required.');
  if (!role || !String(role).trim()) throw ApiException.badRequest('role is required.');

  const normalizedEmail = String(rawEmail).trim().toLowerCase();
  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    throw ApiException.conflict('An account with that email already exists.');
  }

  const roleUpper = String(role).toUpperCase();
  if (!VALID_REGISTER_ROLES.includes(roleUpper)) {
    throw ApiException.badRequest('Role must be TASKMASTER or TASKER.');
  }
  if (roleUpper === 'ADMIN') {
    throw ApiException.forbidden('Admin accounts cannot be self-registered.');
  }

  const token = uuidv4();
  const u = await User.create({
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(password, 10),
    role: roleUpper,
    skills: Array.isArray(skills) ? Array.from(new Set(skills)) : [],
    availability: availability != null ? availability : null,
    jobTitle: jobTitle != null ? jobTitle : null,
    weeklyCapacityHours: (weeklyCapacityHours != null && weeklyCapacityHours > 0)
      ? weeklyCapacityHours : undefined,
    enabled: false,
    emailVerificationToken: token,
  });

  await email.send(u.email, 'Verify your TaskSKA account',
    'Welcome to TaskSKA, ' + u.fullName + '!\n\n' +
    'Your email verification code is: ' + token + '\n\n' +
    'Enter it on the verification screen to activate your account.');

  const dev = otp.isConsoleFallback() ? token : null;
  res.json({
    message: 'Account created. Check your email for the verification code to activate your account.',
    devCode: dev,
  });
}));

// POST /verify-email
router.post('/verify-email', wrap(async (req, res) => {
  const { token } = req.body || {};
  if (!token || !String(token).trim()) throw ApiException.badRequest('token is required.');

  const u = await User.findOne({ where: { emailVerificationToken: token } });
  if (!u) throw ApiException.badRequest('Invalid or expired verification code.');

  u.enabled = true;
  u.emailVerificationToken = null;
  await u.save();
  res.json(await toUserDto(u));
}));

// Shared login step 1 logic (Java AuthService.login).
async function doLogin(rawEmail, password) {
  const u = await findByEmail(rawEmail);
  if (!u) throw ApiException.unauthorized('Invalid email or password.');
  if (!bcrypt.compareSync(password || '', u.passwordHash)) {
    throw ApiException.unauthorized('Invalid email or password.');
  }
  if (!u.enabled) {
    throw ApiException.forbidden('Account not activated. Please verify your email first.');
  }
  if (!u.mfaEnabled) {
    return { message: 'MFA_DISABLED', devCode: null };
  }
  const code = otp.generate(u);
  await u.save();
  await email.send(u.email, 'Your TaskSKA verification code',
    'Your one-time login code is: ' + code + '\nIt expires in 10 minutes.');
  const dev = otp.isConsoleFallback() ? code : null;
  return { message: 'A verification code was sent to your email.', devCode: dev };
}

// POST /login
router.post('/login', wrap(async (req, res) => {
  const { email: rawEmail, password } = req.body || {};
  if (!rawEmail || !String(rawEmail).trim()) throw ApiException.badRequest('email is required.');
  if (!password || !String(password).trim()) throw ApiException.badRequest('password is required.');
  res.json(await doLogin(rawEmail, password));
}));

// POST /verify-otp
router.post('/verify-otp', wrap(async (req, res) => {
  const { email: rawEmail, code } = req.body || {};
  if (!rawEmail || !String(rawEmail).trim()) throw ApiException.badRequest('email is required.');
  if (!code || !String(code).trim()) throw ApiException.badRequest('code is required.');

  const u = await findByEmail(rawEmail);
  if (!u) throw ApiException.unauthorized('Invalid email or password.');
  if (!otp.verify(u, code)) {
    throw ApiException.unauthorized('Incorrect or expired verification code.');
  }
  await u.save();
  const token = sign(u);
  res.json({ token, user: await toUserDto(u) });
}));

// POST /admin-login
router.post('/admin-login', wrap(async (req, res) => {
  const { email: rawEmail, password } = req.body || {};
  if (!rawEmail || !String(rawEmail).trim()) throw ApiException.badRequest('email is required.');
  if (!password || !String(password).trim()) throw ApiException.badRequest('password is required.');

  const u = await findByEmail(rawEmail);
  if (!u) throw ApiException.unauthorized('Invalid administrator credentials.');
  if (u.role !== 'ADMIN') {
    throw ApiException.forbidden('This account is not an administrator.');
  }
  res.json(await doLogin(rawEmail, password));
}));

// POST /forgot-password
router.post('/forgot-password', wrap(async (req, res) => {
  const { email: rawEmail } = req.body || {};
  if (!rawEmail || !String(rawEmail).trim()) throw ApiException.badRequest('email is required.');

  const u = await findByEmail(rawEmail);
  if (u) {
    const token = uuidv4();
    u.resetToken = token;
    u.resetExpiry = new Date(Date.now() + 60 * 60000); // 1 hour
    await u.save();
    await email.send(u.email, 'Reset your TaskSKA password',
      'Use this code to reset your password (valid for 1 hour): ' + token);
  }

  // Do not reveal whether the email exists.
  let dev = null;
  if (otp.isConsoleFallback() && u) {
    dev = u.resetToken;
  }
  res.json({
    message: 'If that email is registered, a reset code has been sent.',
    devCode: dev,
  });
}));

// POST /reset-password
router.post('/reset-password', wrap(async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !String(token).trim()) throw ApiException.badRequest('token is required.');
  if (!newPassword || !String(newPassword).trim()) throw ApiException.badRequest('newPassword is required.');

  const u = await User.findOne({ where: { resetToken: token } });
  if (!u) throw ApiException.badRequest('Invalid or expired reset code.');
  if (!u.resetExpiry || new Date(u.resetExpiry).getTime() < Date.now()) {
    throw ApiException.badRequest('Reset code has expired.');
  }
  u.passwordHash = bcrypt.hashSync(newPassword, 10);
  u.resetToken = null;
  u.resetExpiry = null;
  await u.save();
  res.json({ message: 'Password updated. You can now log in with your new password.' });
}));

module.exports = router;
