# AutoHub Nepal: Backend API

REST API for AutoHub Nepal, built with NestJS, Prisma and PostgreSQL.

## Setup

Requirements: Node.js 20+ and a PostgreSQL database.

```bash
npm install
```

Copy `.env.example` to `.env` and fill it in (see [Environment variables](#environment-variables)),
then:

```bash
npx prisma generate
npx prisma migrate dev     # creates the tables
npx prisma db seed         # adds the default categories and a few test reviews
npm run start:dev
```

The API runs on http://localhost:3001 (set `PORT` in `.env`; the frontend uses 3000).
Check it with `GET /health`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Start with auto-reload (development) |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled app |
| `npm run start:prod:migrate` | Apply migrations, then run the compiled app |
| `npm run migrate:deploy` | Apply existing migrations (production) |
| `npm run prisma:migrate` | Create/apply a migration (development) |
| `npm run prisma:studio` | Open Prisma Studio to browse the database |
| `npm run make-admin -- <email>` | Promote a registered user to admin |
| `npm run prune-audit-log -- --days=365 --confirm` | Delete audit log rows older than 365 days (omit `--confirm` for a dry run) |

## Environment variables

Create `backend/.env`. Variables marked **required** must be set.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | **yes** | PostgreSQL connection string |
| `JWT_SECRET` | **yes** | Long random string used to sign login tokens. The API will not start without it, and in production it must be 32+ characters |
| `FRONTEND_URL` | **yes** in production | Exact frontend origin, no trailing slash (for example `http://localhost:3000`). Used for CORS and email links |
| `PORT` | no | API port (use `3001` locally) |
| `BACKEND_URL` | no | Public URL of this API (used for social login callbacks) |
| `NODE_ENV` | no | `production` in production |
| `TRUST_PROXY` | no | Number of reverse-proxy hops in front of the API (default `1` in production, `0` locally) |
| `UPLOAD_DIR` | no | Where uploaded images are stored (served at `/files/<name>`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | for email | Mail server used for password reset, announcements and contact emails |
| `MAIL_FROM` | for email | "From" address on outgoing email |
| `CONTACT_INBOX_EMAIL` | for email | Inbox that receives contact-form messages |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | for Google login | Google OAuth credentials |
| `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | for Facebook login | Facebook OAuth credentials |
| `AI_PROVIDER` | no | `none` (default), `openai`, `anthropic` or `groq`. Enables AI fallback replies in listing chat |
| `AI_MODEL` | no | Model name for the chosen provider |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY` | no | API key for the chosen `AI_PROVIDER` |

| `REQUIRE_EMAIL_VERIFICATION` | no | `true` makes new accounts confirm their email before they can log in. Default: on in production, off locally. Needs working SMTP |

Email features (password reset, email confirmation, owner announcements) do not work until the
SMTP variables are set.

## Project structure

```
backend/
├── prisma/
│   ├── schema.prisma          Database models
│   ├── migrations/            Migration history
│   ├── seed.ts                Default categories and test data
│   ├── import-wordpress*.ts   One-off WordPress import scripts
│   └── data/                  Import data (gitignored, contains personal data)
├── scripts/                   Admin and cleanup helper scripts
└── src/
    ├── main.ts                App entry point (CORS, security headers, static files)
    ├── app.module.ts
    ├── common/                Shared guards, decorators, filters and utils
    ├── prisma/                PrismaService
    └── modules/
        ├── auth/              Register, login, logout, password reset, Google/Facebook login
        ├── users/             User accounts and roles
        ├── audit/             Audit log: records security events, admin-only GET /audit-logs
        ├── listings/          Business listings (create, search, update, approval)
        ├── categories/        Listing categories
        ├── reviews/           Reviews and ratings
        ├── bookings-enquiries/ Bookings and enquiries
        ├── customers/         Owner view of customers, bookings and reviews
        ├── announcements/     Email announcements from owners to customers
        ├── broadcasts/        Admin broadcasts
        ├── chats/             Visitor chat sessions and optional AI replies
        ├── products/          Listing products
        ├── contact/           Contact form
        ├── hero-images/       Homepage hero images (admin managed)
        ├── popup-ad/          Homepage entry popup ad (admin managed)
        ├── uploads/           Image uploads
        ├── mail/              Email sending
        └── health/            Health check
```

## Authentication and roles

- Login sets an httpOnly cookie containing a JWT.
- Roles are `user` and `admin`. Business owners are regular users who own listings.
- User tokens last 7 days. Admin tokens last 8 hours, and admin sessions end when the
  browser closes.
- Passwords: 8 to 72 characters with an uppercase letter and a number, hashed with bcrypt (cost 12).
- Five wrong passwords lock an account for 15 minutes. Rate limiting is applied through
  `@nestjs/throttler`.
- Email confirmation: when `REQUIRE_EMAIL_VERIFICATION` is on, `POST /auth/register` emails a
  link and login is refused (403, code `EMAIL_NOT_VERIFIED`) until it is used.
  `POST /auth/verify-email` and `POST /auth/resend-verification` handle the link.
- Sessions can be revoked: a password reset or `POST /auth/logout-all` invalidates every token
  issued before it.
- Security events and admin actions are written to the audit log (`AuditLog` table). Mark a
  route with `@Audit('some.action')` to record it. Admins read it at `GET /audit-logs`.

## Helper scripts

Run from the `backend` folder. These read `DATABASE_URL` from `.env`.

```bash
# Promote or demote a user
node scripts/make-admin.js you@example.com
node scripts/make-admin.js you@example.com --role=user

# Delete accounts (dry run by default; add --confirm to actually delete)
node scripts/delete-users.js a@example.com b@example.com
node scripts/delete-users.js a@example.com --confirm
node scripts/delete-test-users.js --confirm
```

Deleting a user also deletes their reviews, bookings and chat sessions.

## WordPress import (one-off)

Used once to move the old AutoHub WordPress data into this database. The data files
live in `prisma/data/` and are gitignored because they contain personal data. Always
run with `--dry-run` first.

```bash
npx ts-node prisma/import-wordpress.ts --owner=you@example.com --dry-run
npx ts-node prisma/import-wordpress-users.ts --dry-run
npx ts-node prisma/import-wordpress-reviews.ts --dry-run
```

See the comment at the top of each script for all flags.

## Deployment notes

The repository root has a `docker-compose.yml` that runs the database, API, website and an
HTTPS reverse proxy together. See [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) for the full
walkthrough and [../ops/backup](../ops/backup) for backups.

Without Docker:

- Set `NODE_ENV=production`, `FRONTEND_URL` and a strong `JWT_SECRET` (32+ characters).
- Run `npm run build`, then `npm run start:prod:migrate`.
- Uploaded images are stored on disk (`UPLOAD_DIR`), so use persistent storage.

## If you get stuck

Report the problem like this:

```
Problem: <what's not working>
What I tried: <steps you took>
Error: <exact error message>
Screenshot: attached
```
