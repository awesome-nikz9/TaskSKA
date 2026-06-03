'use strict';
// Small shared helpers.
const j = (v, d = []) => { try { const x = JSON.parse(v); return x == null ? d : x; } catch { return d; } };
const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const taskCode = (id) => 'TSK-' + String(id).padStart(6, '0');

function cleanSkills(v) {
  if (v == null) return [];
  const list = Array.isArray(v) ? v : String(v).split(',');
  const out = [];
  for (let s of list) { s = String(s).trim(); if (s && !out.includes(s)) out.push(s); }
  return out.slice(0, 25);
}
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'OVERDUE'];
const cleanPriority = (v) => PRIORITIES.includes(String(v || '').toUpperCase()) ? String(v).toUpperCase() : 'MEDIUM';

// Parse yyyy-MM-dd or ISO -> 'YYYY-MM-DD HH:MM:SS' (UTC) or null; false = invalid.
function parseDeadline(raw) {
  if (raw == null || String(raw).trim() === '') return null;
  const s = String(raw).trim();
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) d = new Date(s + 'T17:00:00Z');
  else d = new Date(s);
  if (isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}
const toISO = (mysql) => mysql ? mysql.replace(' ', 'T') + 'Z' : null;

class ApiError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
const err = (status, code, message) => new ApiError(status, code, message);

module.exports = { j, now, taskCode, cleanSkills, cleanPriority, parseDeadline, toISO, PRIORITIES, STATUSES, ApiError, err };
