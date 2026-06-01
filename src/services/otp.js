const config = require('../config');
// Mutates the user instance (caller persists with user.save()), mirroring the Java flow.
function generate(user) {
  const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  user.otpCode = code;
  user.otpExpiry = new Date(Date.now() + config.otp.expiryMinutes * 60000);
  return code;
}
function verify(user, code) {
  if (!user.otpCode || !user.otpExpiry) return false;
  const ok = user.otpCode === code && new Date(user.otpExpiry).getTime() > Date.now();
  if (ok) { user.otpCode = null; user.otpExpiry = null; }
  return ok;
}
function isConsoleFallback() { return config.mail.consoleFallback; }
module.exports = { generate, verify, isConsoleFallback };
