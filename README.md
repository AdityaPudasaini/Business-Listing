# AutoHub Nepal

A business listing platform for auto services in Nepal. Visitors can find garages and
auto businesses near them, read reviews, book services and chat with owners. Owners
manage their listings, customers and announcements. Admins review listings and manage
the site.

The codebase is built so the same app can serve other verticals (for example
restaurants, as "Bhojan Hub") by changing one environment variable.

Version: see [VERSION](VERSION).

## Two ways to use this repository

- **Install it on a server** (Docker, one command): see [Install on a server](#install-on-a-server).
- **Develop it on your computer** (Node.js and PostgreSQL): see [Development setup](#development-setup).

## Tech stack

| Part | Stack |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Zustand, React Hook Form, Zod |
| Backend | NestJS, TypeScript, Prisma, PostgreSQL, JWT (httpOnly cookie), Nodemailer |
| Deployment | Docker Compose, Caddy (automatic HTTPS), GitHub Actions |

## Install on a server

You need a VPS with root access (Ubuntu 22.04 / 24.04 or Debian 12, 2 GB RAM or more)
and two DNS A records pointing at it: `app.yoursite.com` (the website) and
`api.yoursite.com` (the API). Both names must share one parent domain.

```bash
# on the server, inside the unzipped folder
sudo bash install.sh yoursite.com you@email.com
```

The installer checks the server, installs Docker if needed, creates `.env` with fresh
random secrets, builds and starts the site, schedules a daily backup, and prints a one-time setup code. Open
`https://app.yoursite.com/install`, enter the code and create the admin account. The
page locks itself afterwards.

| Task | Command |
| --- | --- |
| Set up email (password reset, confirmation) | `sudo bash setup-smtp.sh` |
| Forgot the admin password, or add another admin | `sudo bash create-admin.sh` |
| Check that the site is healthy (containers, disk, backups, settings) | `sudo bash status.sh` |
| Install a new version (full replace, keeps your data and `.env`) | `sudo bash update.sh` |
| Back up now (a daily backup at 02:00 is scheduled by the installer) | `sudo bash ops/backup/backup.sh` |
| Check that a backup restores | `sudo bash ops/backup/restore.sh verify <file>` |

The full guide is in [documentation/index.html](documentation/index.html): open it in a
browser. It covers requirements, the web installer, email, updating, backup and restore,
the admin panel, security and troubleshooting.

## Repository structure

```
.
├── install.sh           One-command server installer
├── update.sh            Installs a newer version (keeps .env, backups and data)
├── setup-smtp.sh        Guided email setup
├── create-admin.sh      Create an admin account or reset its password
├── status.sh            Check that the site is healthy (read-only)
├── VERSION              Version of this release
├── .env.example         Every server setting, explained
├── docker-compose.yml   Production stack: database, API, website, HTTPS
├── frontend/            Next.js web app (public site, owner dashboard, admin panel)
├── backend/             NestJS REST API and Prisma database schema
├── ops/backup/          Backup and restore scripts
├── deploy/              Caddy (HTTPS reverse proxy) configuration
├── documentation/       Customer guide (index.html)
├── docs/                Developer notes: deployment, CI/CD, security, testing
└── .github/workflows/   CI, security scan, deploy, roll-back
```

## Main features

- Search and filter listings by category, location and rating
- Listing detail pages with gallery, services, hours, map and reviews
- Business registration wizard with image uploads and an admin approval step
- Bookings (guests can book without an account) and enquiries
- Reviews and ratings
- Owner dashboard: listings, customers, personal messages and email announcements
- Visitor chat on each listing (keyword replies, optional AI replies, owner takeover)
- Admin panel: listing review queue, users, categories, chats, homepage hero images and popup ad
- Email/password login with email confirmation, Google and Facebook login, password reset by email
- Security: account lockout, strong password rules, "sign out everywhere", and an admin audit log
- Optional privacy-respecting analytics (Google Analytics 4 or Plausible), only after cookie consent
- One-command installer, browser-based first-run setup, guided email setup, updater,
  backup and restore

## Development setup

You need Node.js 22 (the version the Docker images and CI use) and a PostgreSQL
database. Start the backend first, then the frontend.

1. **Backend:** follow [backend/README.md](backend/README.md)
2. **Frontend:** follow [frontend/README.md](frontend/README.md)

Quick version:

```bash
# Terminal 1: API on http://localhost:3001
cd backend
npm install
# create .env (see backend/README.md), then:
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Terminal 2: website on http://localhost:3000
cd frontend
npm install
# create .env.local (see frontend/README.md), then:
npm run dev
```

## Creating the first admin

- **On a server:** use the web installer at `/install` (see above). If the password is lost later, run `sudo bash create-admin.sh`.
- **On your computer (development):** register an account through the website, then
  promote it:

```bash
cd backend
npm run make-admin -- you@example.com
```

## Deploying and backups

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): put the site on a server with Docker and automatic HTTPS
- [docs/CICD.md](docs/CICD.md): the automatic pipeline: every merge to `main` is checked, built, deployed, and can be rolled back
- [ops/backup](ops/backup): daily backups and tested restores
- [docs/SECURITY.md](docs/SECURITY.md): what is protected, and what depends on how it is run
- [docs/TESTING.md](docs/TESTING.md): how the tests are run

## Building the customer package

The package for customers is built from a clean export of the repository.
`.gitattributes` leaves out files that must not ship (`.github/`, the daily tracker
spreadsheets, internal design notes).

```bash
git archive --format=zip --prefix=autohub/ -o ../AutoHub.zip HEAD
```

Keep `VERSION` and the changelog in `documentation/index.html` up to date before you build.

## What is not in Git

Secrets and private data are ignored on purpose: `.env` files, uploaded images
(`backend/uploads`) and the WordPress import data in `backend/prisma/data`. Never
commit these.
