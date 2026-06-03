'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { err } = require('./util');

const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const COOKIE = 'tk_token';

const hash = (pw) => bcrypt.hashSync(String(pw), 10);
const verify = (pw, h) => { try { return bcrypt.compareSync(String(pw), h); } catch { return false; } };
const sign = (user) => jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });

function setAuthCookie(res, user) {
  res.cookie(COOKIE, sign(user), {
    httpOnly: true, sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 3600 * 1000,
  });
}
const clearAuthCookie = (res) => res.clearCookie(COOKIE);

function currentUser(req) {
  let token = req.cookies && req.cookies[COOKIE];
  const h = req.headers.authorization;
  if (!token && h && h.startsWith('Bearer ')) token = h.slice(7);
  if (!token) return null;
  try {
    const p = jwt.verify(token, SECRET);
    const u = db.prepare('SELECT * FROM users WHERE id = ?').get(p.id);
    if (!u || !u.enabled) return null;
    return u;
  } catch { return null; }
}

// Middleware: attaches req.user or 401.
function requireLogin(req, res, next) {
  const u = currentUser(req);
  if (!u) return next(err(401, 'unauthorized', 'You must be signed in.'));
  req.user = u;
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') return next(err(403, 'forbidden', 'Administrator access required.'));
  next();
}
function blockAuditorWrites(req, res, next) {
  if (req.user && req.user.role === 'AUDITOR') return next(err(403, 'forbidden', 'Auditors have read-only access.'));
  next();
}

module.exports = { hash, verify, sign, setAuthCookie, clearAuthCookie, currentUser, requireLogin, requireAdmin, blockAuditorWrites, COOKIE };
