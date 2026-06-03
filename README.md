# TaskSKA — Intelligent Task Management (Node.js)

A production-ready task management platform with an **urgency-weighted workload engine**, role-based
access (Taskmaster / Tasker / Auditor / Admin), peer connections, an open-task pool with assignment
requests, notifications, templates, and an admin portal. Rebuilt on **Node.js + Express + SQLite**.

Implements all six modules from the Team T3 capstone (5 sprints):
Authentication & Security · Task Management · Collaboration · Notifications · Workload Engine · Automation.

## Quick start (local)

```bash
npm install
npm start
# open http://localhost:4000
```

On first run with an empty database, demo data is seeded automatically.
To (re)seed manually: `npm run seed`. To run the test suite: `npm test`.

## Demo accounts (password unless noted: `Sample@123`)

| Role        | Email                  | Notes                                  |
|-------------|------------------------|----------------------------------------|
| Admin       | admin@taskska.app      | password `Admin@123` — full admin portal |
| Taskmaster  | maya@taskska.app       | owns the demo tasks, connected to the team — **best demo view** |
| Tasker      | leo@taskska.app        | assigned tasks, can request open tasks |
| Tasker      | aria@taskska.app       | part-time, design skills               |
| Tasker      | noah@taskska.app       | QA                                     |
| Auditor     | sam@taskska.app        | read-only oversight                    |

## Features

- **Auth & security:** register/login, bcrypt password hashing, JWT in an httpOnly cookie,
  rate-limited auth, optional MFA (demo code `123456`), password reset, four roles.
- **Tasks:** create/edit/delete, priorities, deadlines, estimated hours, subtasks (auto-progress),
  dependencies (blocks until prerequisites complete), status workflow, Kanban board with drag-and-drop.
- **Collaboration:** connections by email (accept/decline), task search, open-task pool, assignment
  requests with skill-match scoring.
- **Workload engine:** urgency-weighted estimator (imminent/overdue tasks weighted up), calibrated by
  each user's historical actual-vs-estimate ratio; auto-assignment to the lowest-loaded teammate.
- **Notifications:** assignment, status, deadline-soon and overdue (hourly sweep), in-app bell.
- **Templates:** reusable task blueprints, one-click instantiate.
- **Admin portal:** stats, team workload, user management (roles/enable/delete), all tasks, requests,
  one-click "Load demo data".

## Configuration (`.env`, see `.env.example`)

| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | 4000 | HTTP port |
| `JWT_SECRET` | (dev value) | **set a long random string in production** |
| `DB_FILE` | ./data/taskska.db | SQLite database path |
| `SEED_ON_EMPTY` | 1 | seed demo data when the DB is empty |
| `CORS_ORIGIN` | (blank) | comma-separated origins if the frontend is hosted separately |

## Deploy

**Note:** This is a Node.js server, so it needs a Node host (a VPS, or a platform like Render/Railway/Fly).
Standard Hostinger *shared* hosting runs PHP only — use a Hostinger **VPS** plan, or one of the options below.

- **Render (free):** push this repo, then New → Blueprint (uses `render.yaml`). Persistent disk keeps the SQLite file.
- **Railway / Fly.io:** Node app, start command `node server.js`, mount a volume at `/app/data`.
- **Docker / VPS:**
  ```bash
  docker build -t taskska .
  docker run -p 4000:4000 -e JWT_SECRET=$(openssl rand -hex 32) -v $PWD/data:/app/data taskska
  ```
- **Bare VPS:** `npm install --omit=dev && JWT_SECRET=... node server.js` behind nginx + pm2.

For higher scale, swap SQLite for Postgres by replacing `src/db.js` (schema is standard SQL).

## Project layout

```
server.js            Express app, route wiring, auto-seed, overdue sweep
src/db.js            SQLite schema
src/auth.js          bcrypt + JWT + role middleware
src/workload.js      urgency-weighted workload engine
src/store.js         shared queries + DTO mappers
src/seed.js          demo data
src/routes/*.js      auth, tasks, connections, requests, workload, notifications, templates, profile, admin
public/              SPA (index.html, app.js, styles.css)
test/api.test.js     integration tests (node --test)
```
