const config = require('../config');
let transporter = null;
function getTransporter() {
  if (transporter || !config.mail.host) return transporter;
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: config.mail.host, port: config.mail.port,
    secure: false, auth: config.mail.username ? { user: config.mail.username, pass: config.mail.password } : undefined,
  });
  return transporter;
}
async function send(to, subject, body) {
  const smtpConfigured = !!config.mail.host;
  if (!smtpConfigured || config.mail.consoleFallback) {
    console.log(`\n========= TaskSKA EMAIL (console fallback) =========\nTo: ${to}\nSubject: ${subject}\n${body}\n====================================================`);
    if (!smtpConfigured) return;
  }
  try { await getTransporter().sendMail({ from: config.mail.from, to, subject, text: body }); }
  catch (e) { console.warn(`Email send failed (${e.message}), used console log.`); }
}
module.exports = { send };
