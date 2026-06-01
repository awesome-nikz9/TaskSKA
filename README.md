# TaskSKA — Task Management System (Node.js)

Production-ready task management platform with an urgency-weighted workload
estimator, MFA-secured auth, role-based access (Taskmaster / Tasker / Auditor /
Admin), connections, notifications, templates and an admin portal.

Backend: **Node.js + Express + Sequelize**. Frontend: vanilla-JS SPA (`public/`)
served by the same server. Database: **SQLite in-memory** for dev, **MySQL** for
production.

## Quick start (dev)

```bash
npm install
npm run dev        # TASKSKA_PROFILE=dev, in-memory SQLite, demo data seeded
# open http://localhost:8080  (admin portal at /admin)
```

Demo accounts (dev only): `maya@taskska.app`, `leo@taskska.app`,
`aria@taskska.app`, `sam@taskska.app` — all password `Demo@12345`.
Admin: `admin@taskska.app` / `Admin@12345`.

MFA codes and email-verification tokens are printed to the server console when
`MAIL_CONSOLE_FALLBACK=true` (no SMTP needed for testing). They are also returned
as `devCode` in the API response in that mode.

## Production

1. Copy `.env.example` to `.env` and set real values (`TASKSKA_PROFILE=prod`,
   a strong `TASKSKA_JWT_SECRET`, the MySQL `DB_*` vars, your `ADMIN_*`, SMTP
   `MAIL_*`, and `SEED_DEMO=false`).
2. `npm install --omit=dev`
3. `node server.js`  (or use PM2 / systemd / Docker — see below).

Tables are created automatically on first boot (`sequelize.sync`) and the admin
account is seeded idempotently.

### Docker
```bash
docker compose up -d        # starts MySQL + app on :8080
```

### PM2
```bash
pm2 start ecosystem.config.js
```

### systemd + nginx
See `deploy/taskska.service` and `deploy/nginx.conf`, and `HOSTINGER.md` for a
step-by-step VPS / shared-hosting walkthrough.

## Configuration (env vars)

| Var | Default | Notes |
|-----|---------|-------|
| `TASKSKA_PROFILE` | `prod` | `dev` = in-memory SQLite + demo seed; `prod` = MySQL |
| `PORT` | `8080` | HTTP port |
| `TASKSKA_JWT_SECRET` | (change me) | 32+ char random string |
| `TASKSKA_JWT_EXPIRES` | `86400` | token lifetime, seconds |
| `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` | localhost/3306/taskska/taskska/changeme | MySQL connection |
| `ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME` | admin@taskska.app / Admin@12345 / Platform Administrator | seeded admin |
| `SEED_DEMO` | `true` | seed demo users/tasks (set `false` in prod) |
| `OTP_EXPIRY_MINUTES` | `10` | MFA code lifetime |
| `MAIL_CONSOLE_FALLBACK` | `true` | print codes to console instead of SMTP |
| `MAIL_HOST/MAIL_PORT/MAIL_USERNAME/MAIL_PASSWORD/MAIL_FROM` | — | SMTP settings |

## API

All endpoints under `/api`. Auth is `Authorization: Bearer <jwt>` obtained from
the login → verify-otp flow.

- `POST /api/auth/{register,verify-email,login,verify-otp,admin-login,forgot-password,reset-password}`
- `GET/POST /api/tasks`, `GET /api/tasks/created`, `GET /api/tasks/search`,
  `GET/PUT/DELETE /api/tasks/:code`, `POST /api/tasks/:code/{status,progress}`,
  `POST /api/tasks/:code/subtasks/:id/toggle`
- `GET/POST /api/connections`, `POST /api/connections/:id/{accept,decline}`
- `GET /api/workload/me`, `GET /api/workload/team`
- `GET /api/notifications`, `GET /api/notifications/unread-count`,
  `POST /api/notifications/:id/read`, `POST /api/notifications/read-all`
- `GET/POST /api/templates`, `POST /api/templates/:id/instantiate`, `DELETE /api/templates/:id`
- `GET /api/profile/me`, `PUT /api/profile`, `PUT /api/profile/notifications`
- `GET /api/admin/stats`, `GET /api/admin/users`,
  `POST /api/admin/users/:id/{enable,disable,role}`, `DELETE /api/admin/users/:id`

## Workload estimator

For each active (non-completed) assigned task: `remaining = estimatedHours ×
(1 − progress/100)`, weighted by urgency (1.6 overdue, 1.4 < 48h, 1.2 < 168h,
×1.1 if blocked). Sum ÷ weekly capacity → percent (capped 100). ≤50 LOW,
≤80 MEDIUM, else HIGH.
