'use strict';
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'taskska.db');
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'TASKMASTER',   -- TASKMASTER | TASKER | AUDITOR | ADMIN
  skills        TEXT NOT NULL DEFAULT '[]',            -- JSON array
  availability  TEXT,                                  -- Full-time | Part-time | ...
  capacity_hours INTEGER NOT NULL DEFAULT 40,
  job_title     TEXT,
  mfa_enabled   INTEGER NOT NULL DEFAULT 0,
  enabled       INTEGER NOT NULL DEFAULT 1,
  notify_assignment INTEGER NOT NULL DEFAULT 1,
  notify_status     INTEGER NOT NULL DEFAULT 1,
  notify_deadline   INTEGER NOT NULL DEFAULT 1,
  notify_connection INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS connections (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'PENDING',       -- PENDING | ACCEPTED | DECLINED
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  responded_at  TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  task_code     TEXT UNIQUE,
  title         TEXT NOT NULL,
  description   TEXT,
  requirements  TEXT,
  required_skills TEXT NOT NULL DEFAULT '[]',          -- JSON array
  is_open       INTEGER NOT NULL DEFAULT 0,
  priority      TEXT NOT NULL DEFAULT 'MEDIUM',        -- LOW | MEDIUM | HIGH | URGENT
  status        TEXT NOT NULL DEFAULT 'NOT_STARTED',   -- NOT_STARTED | IN_PROGRESS | BLOCKED | COMPLETED | OVERDUE
  progress      INTEGER NOT NULL DEFAULT 0,
  estimated_hours REAL NOT NULL DEFAULT 4,
  deadline      TEXT,
  due_soon_notified INTEGER NOT NULL DEFAULT 0,
  creator_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignee_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status_updated_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT
);

CREATE TABLE IF NOT EXISTS subtasks (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id  INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title    TEXT NOT NULL,
  done     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task_deps (
  task_id       INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_id)
);

CREATE TABLE IF NOT EXISTS requests (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tasker_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment    TEXT,
  status     TEXT NOT NULL DEFAULT 'PENDING',          -- PENDING | APPROVED | DECLINED
  decided_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  decision_note TEXT,
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  message     TEXT NOT NULL,
  related_task_code TEXT,
  read_flag   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS templates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  estimated_hours REAL NOT NULL DEFAULT 4,
  deadline_offset_days INTEGER NOT NULL DEFAULT 7,
  default_assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_creator  ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_conn_users ON connections(requester_id, addressee_id);
`);

module.exports = db;
