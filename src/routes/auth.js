'use strict';
const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const A = require('../auth');
const S = require('../store');
const { err, cleanSkills } = require('../util');

const router = express.Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });

const ROLES = ['TASKMASTER', 'TASKER', 'AUDITOR'];

// POST /auth/register
router.post('/register', loginLimiter, (req, res, next) => {
  const b = req.body || {};
  const fullName = String(b.fullName || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  let role = String(b.role || 'TASKMASTER').toUpperCase();
  if (!ROLES.includes(role)) role = 'TASKMASTER';
  if (!fullName) return next(err(400, 'bad_request', 'Full name is required.'));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return next(err(400, 'bad_request', 'A valid email is required.'));
  if (password.length < 8 || password.length > 150) return next(err(400, 'bad_request', 'Password must be 8-150 characters.'));
  if (S.getUserByEmail(email)) return next(err(409, 'email_taken', 'An account with that email already exists.'));

  const info = db.prepare(`INSERT INTO users (full_name,email,password_hash,role,skills,availability,capacity_hours,job_title)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    fullName, email, A.hash(password), role,
    JSON.stringify(cleanSkills(b.skills)),
    b.availability ? String(b.availability) : null,
    Number(b.weeklyCapacityHours) > 0 ? Number(b.weeklyCapacityHours) : 40,
    b.jobTitle ? String(b.jobTitle) : null);
  const user = S.getUser(info.lastInsertRowid);
  A.setAuthCookie(res, user);
  res.json({ message: 'Account created.', user: S.userDto(user), autoLogin: true });
});

// POST /auth/login
router.post('/login', loginLimiter, (req, res, next) => {
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  const password = String((req.body || {}).password || '');
  const u = S.getUserByEmail(email);
  if (!u || !A.verify(password, u.password_hash)) return next(err(401, 'unauthorized', 'Invalid email or password.'));
  if (!u.enabled) return next(err(403, 'forbidden', 'This account has been disabled. Contact an administrator.'));
  if (u.mfa_enabled) {
    // Demo MFA: a fixed code is returned so the flow is presentable without email infra.
    return res.json({ mfaRequired: true, email: u.email, devCode: '123456',
      message: 'Enter the 6-digit code (demo code: 123456).' });
  }
  A.setAuthCookie(res, u);
  res.json({ message: 'Signed in.', user: S.userDto(u) });
});

// POST /auth/verify-otp  (demo: code 123456)
router.post('/verify-otp', loginLimiter, (req, res, next) => {
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  const code = String((req.body || {}).code || '');
  const u = S.getUserByEmail(email);
  if (!u) return next(err(401, 'unauthorized', 'Invalid request.'));
  if (code !== '123456') return next(err(401, 'unauthorized', 'Incorrect code.'));
  A.setAuthCookie(res, u);
  res.json({ message: 'Signed in.', user: S.userDto(u) });
});

// POST /auth/forgot-password (stub) + POST /auth/reset-password
router.post('/forgot-password', (req, res) => res.json({ message: 'If that email exists, a reset link has been sent.' }));
router.post('/reset-password', (req, res, next) => {
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  const password = String((req.body || {}).password || '');
  const u = S.getUserByEmail(email);
  if (!u) return next(err(404, 'not_found', 'No such account.'));
  if (password.length < 8) return next(err(400, 'bad_request', 'Password must be at least 8 characters.'));
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(A.hash(password), u.id);
  res.json({ message: 'Password updated. You can now sign in.' });
});

// GET /auth/me
router.get('/me', (req, res, next) => {
  const u = A.currentUser(req);
  if (!u) return next(err(401, 'unauthorized', 'Not signed in.'));
  res.json(S.userDto(u));
});

// POST /auth/logout
router.post('/logout', (req, res) => { A.clearAuthCookie(res); res.json({ message: 'Signed out.' }); });

// POST /auth/mfa (toggle, requires login)
router.post('/mfa', A.requireLogin, (req, res) => {
  const enabled = !!(req.body || {}).enabled ? 1 : 0;
  db.prepare('UPDATE users SET mfa_enabled = ? WHERE id = ?').run(enabled, req.user.id);
  res.json({ mfaEnabled: !!enabled, message: enabled ? 'MFA enabled.' : 'MFA disabled.' });
});

module.exports = router;
