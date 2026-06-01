# Deploying TaskSKA (Node.js) on Hostinger

Two supported paths: a **VPS plan** (recommended, full control) or a
**Node.js-capable shared/Cloud hosting** plan via hPanel.

## A. Hostinger VPS (Ubuntu)

1. **Create the VPS** in hPanel → VPS, pick an Ubuntu 22.04 template, and SSH in:
   `ssh root@YOUR_VPS_IP`.

2. **Install Node.js 20 + MySQL:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs mysql-server
   systemctl enable --now mysql
   ```

3. **Create the database:**
   ```bash
   mysql -e "CREATE DATABASE taskska CHARACTER SET utf8mb4;"
   mysql -e "CREATE USER 'taskska'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';"
   mysql -e "GRANT ALL ON taskska.* TO 'taskska'@'localhost'; FLUSH PRIVILEGES;"
   ```

4. **Upload the app** to `/var/www/taskska` (scp, git, or SFTP), then:
   ```bash
   cd /var/www/taskska
   cp .env.example .env      # then edit .env (see below)
   npm install --omit=dev
   ```

5. **Edit `.env`** — set at minimum:
   ```
   TASKSKA_PROFILE=prod
   PORT=8080
   TASKSKA_JWT_SECRET=<64 random chars>
   DB_HOST=localhost
   DB_NAME=taskska
   DB_USER=taskska
   DB_PASSWORD=STRONG_PASSWORD
   ADMIN_EMAIL=you@yourdomain.com
   ADMIN_PASSWORD=<your admin password>
   SEED_DEMO=false
   MAIL_CONSOLE_FALLBACK=false
   MAIL_HOST=smtp.hostinger.com
   MAIL_PORT=587
   MAIL_USERNAME=you@yourdomain.com
   MAIL_PASSWORD=<mailbox password>
   MAIL_FROM=you@yourdomain.com
   ```

6. **Run as a service** (auto-restart, starts on boot):
   ```bash
   cp deploy/taskska.service /etc/systemd/system/taskska.service
   systemctl daemon-reload
   systemctl enable --now taskska
   systemctl status taskska     # confirm it's running
   ```
   (Or use PM2: `npm i -g pm2 && pm2 start ecosystem.config.js && pm2 startup && pm2 save`.)

7. **Put nginx in front** (TLS + port 80/443 → 8080):
   ```bash
   apt-get install -y nginx certbot python3-certbot-nginx
   cp deploy/nginx.conf /etc/nginx/sites-available/taskska
   ln -s /etc/nginx/sites-available/taskska /etc/nginx/sites-enabled/
   # edit server_name to your domain, then:
   nginx -t && systemctl reload nginx
   certbot --nginx -d taskska.yourdomain.com   # free HTTPS
   ```

8. **Point your domain** at the VPS IP (hPanel → Domains → DNS, A record → VPS IP).
   Visit `https://taskska.yourdomain.com` — the SPA loads; admin portal at `/admin`.

### Docker alternative on the VPS
If Docker is installed: `cp .env.example .env` (edit it), then
`docker compose up -d`. This brings up MySQL + the app together. Front it with
nginx as in step 7 (proxy to `127.0.0.1:8080`).

## B. Hostinger shared / Cloud hosting (Node.js app via hPanel)

1. hPanel → **Websites → Node.js** (or "Setup Node.js App"). Create an app:
   set the **application root** to your uploaded folder, **startup file** to
   `server.js`, and Node version to 18+.
2. Upload the project files (File Manager or SFTP) into that folder, excluding
   `node_modules`.
3. In the Node.js app panel, click **Run NPM Install**.
4. Add the environment variables from step 5 above in the panel's
   **Environment variables** section. Create a MySQL database in hPanel →
   **Databases → MySQL**, and use those credentials for `DB_*`.
5. Set `TASKSKA_PROFILE=prod`, `SEED_DEMO=false`, and start the app. hPanel maps
   it to your domain automatically.

## First login

Log in at `/admin` with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you configured.
With `MAIL_CONSOLE_FALLBACK=false` and SMTP set, MFA codes are emailed; with it
`true`, codes print to the server log (`journalctl -u taskska -f`).

## Notes
- The schema is created automatically on first boot — no manual migration step.
- The admin account is re-seeded idempotently every boot, so it can't be locked out.
- Keep `SEED_DEMO=false` in production to avoid demo users/tasks.
