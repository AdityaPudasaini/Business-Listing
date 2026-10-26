# Deploying AutoHub Nepal

This guide puts the whole site on one Linux server with Docker. HTTPS certificates are
obtained and renewed automatically.

```
 visitors ──► Caddy (ports 80/443, HTTPS)
               ├─ app.example.com ──► frontend (Next.js)
               └─ api.example.com ──► backend (NestJS) ──► PostgreSQL
                                          └─ uploaded images (a Docker volume)
```

The site and the API use two names under **one parent domain**. This matters: the login
cookie is `SameSite=Lax`, which only works when both are on the same site (we saw it fail
when they were on two unrelated addresses).

> **Automatic deployments:** this guide builds the images on the server by hand. To have every
> merge to `main` tested, built and deployed automatically (with rollback), set up the pipeline in
> [CICD.md](CICD.md) after the one-time server preparation below.

## What you need

- A Linux server (a small VPS is enough) with Docker and the Docker Compose plugin
- A domain, with two DNS records (A, and AAAA for IPv6) pointing at the server:
  `app.example.com` and `api.example.com`
- Ports 80 and 443 open in the server's firewall
- An SMTP account for email (password reset, email confirmation, announcements)
- Optional: Google and Facebook login credentials, a Google Maps key, an analytics ID

## 1. First-time setup

```bash
git clone <your-repository-url> /opt/autohub
cd /opt/autohub
cp .env.example .env
nano .env
```

Fill in `.env`. Generate the two secrets with `openssl rand -hex 32`. Use letters and digits
only for `POSTGRES_PASSWORD`, because it is placed inside a connection URL.

Then build and start everything:

```bash
docker compose up -d --build
docker compose ps          # all four services should be "running" (db and backend "healthy")
docker compose logs -f backend
```

The backend applies database migrations by itself each time it starts. Open
`https://app.example.com`. The first time it can take a minute while the certificates are
issued.

## 2. Create the first admin

Register an account on the site and confirm its email, then:

```bash
docker compose exec backend npm run make-admin -- you@example.com
```

## 3. Email

Set the `SMTP_*` and `MAIL_FROM` values in `.env`. Check the backend log for
`SMTP ready` after starting. If it says the connection failed, no email will be sent.

`REQUIRE_EMAIL_VERIFICATION=true` makes new accounts confirm their email before they can log
in. Do not switch it on until SMTP works, or nobody will be able to sign up.

## 4. Google and Facebook login

Register these exact redirect addresses with each provider:

- Google: `https://api.example.com/auth/google/callback`
- Facebook: `https://api.example.com/auth/facebook/callback`

## 5. Content-Security-Policy rollout

The site starts in `CSP_MODE=report-only`: nothing is blocked, and the browser only logs what
a policy would have blocked.

1. Browse the live site with the developer console open (F12): the homepage, a listing (with
   its map), sign-up and log-in, a booking, the chat, and the admin pages.
2. Look for messages starting with "Content-Security-Policy". Each one names something the
   policy would block.
3. If everything you use is clean, set `CSP_MODE=enforce` in `.env` and rebuild:
   `docker compose up -d --build frontend`. (The policy is fixed when the site is built, so
   a rebuild is needed.)
4. If something legitimate is reported (a new map or font provider, say), add its address to
   `buildCsp()` in `frontend/next.config.js` first.

## 6. Backups

Install a daily backup (run as the user that owns `/opt/autohub`):

```bash
crontab -e
# add:
0 2 * * * cd /opt/autohub && ./ops/backup/backup.sh >> backups/backup.log 2>&1
```

For off-site copies, set `GPG_RECIPIENT` (encrypts every file) and `RCLONE_REMOTE` (for example
a Cloudflare R2 or S3 bucket) in the cron line. A backup that lives only on the server it
protects is not enough.

**Test a restore** now and then:

```bash
./ops/backup/restore.sh verify backups/autohub-YYYYMMDD-HHMMSS.dmp
```

To really restore, see the header of `ops/backup/restore.sh`.

## 7. Routine maintenance

| When | What |
| --- | --- |
| Each release | `git pull && docker compose up -d --build` |
| Monthly | `docker compose exec backend npm run prune-audit-log -- --days=365 --confirm` |
| Monthly | Run a backup `verify`; check disk space with `df -h` |
| Once, after loading old data | Shrink the existing photos. Run `./ops/backup/backup.sh` first, then `docker compose exec backend node scripts/optimize-uploads.js --convert` to preview and `--convert --confirm` to apply (add `--no-backup`, the backup above already has the originals). About a day later: `--remove-originals --confirm` |
| Regularly | `sudo apt update && sudo apt upgrade` on the server; rebuild images to pick up base-image fixes |
| After a staff change | Rotate `JWT_SECRET` (everyone is logged out) and the SMTP/API keys they knew |

Useful commands:

```bash
docker compose logs -f backend      # live backend log
docker compose restart backend
docker compose exec db psql -U autohub -d autohub
```

## 8. Before you announce it

- [ ] `https://app.example.com` and `https://api.example.com/health` both load over HTTPS
- [ ] Sign-up sends a confirmation email and the link works
- [ ] Password reset email arrives
- [ ] An image upload works and shows on the site
- [ ] Google and Facebook login work (if enabled)
- [ ] `CSP_MODE` is `enforce` and the console is clean
- [ ] The first backup ran, and `restore.sh verify` passes
- [ ] The admin account has a strong, unique password
- [ ] Port 5432 is NOT reachable from the internet (it isn't published in `docker-compose.yml`)
- [ ] Analytics (if used) only starts after "Accept" on the cookie notice
