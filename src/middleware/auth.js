const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { ApiException } = require('../lib/errors');

function sign(user) {
  return jwt.sign(
    { sub: user.email, role: user.role, uid: user.id },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresSeconds }
  );
}

// Parses a Bearer token if present and loads the user onto req.user (no error if absent).
async function parseToken(req, _res, next) {
  const h = req.headers.authorization;
  if (h && h.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(h.substring(7), config.jwt.secret);
      const user = await User.findOne({ where: { email: payload.sub } });
      if (user && user.enabled) req.user = user;
    } catch (_) { /* invalid token -> anonymous */ }
  }
  next();
}

// Requires an authenticated user.
function requireAuth(req, _res, next) {
  if (!req.user) return next(ApiException.unauthorized('Not authenticated'));
  next();
}

// Requires ADMIN role.
function requireAdmin(req, _res, next) {
  if (!req.user) return next(ApiException.unauthorized('Not authenticated'));
  if (req.user.role !== 'ADMIN') return next(ApiException.forbidden('Administrator access required.'));
  next();
}

module.exports = { sign, parseToken, requireAuth, requireAdmin };
