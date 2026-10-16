# Security overview

What the application does to protect accounts and data, and what still depends on how it is run.

## Built in

| Area | Control |
| --- | --- |
| Passwords | bcrypt with a random salt (cost 12). 8 to 72 characters, with an uppercase letter and a number. The rules are the same on the website and in the API. |
| Login | Rate limited per IP; an account locks for 15 minutes after 5 wrong passwords; response time does not reveal which emails exist. |
| Sessions | httpOnly, SameSite cookie (Secure in production). 7 days for owners; admins get a session cookie and an 8-hour token. Password reset and "Sign out everywhere" end every existing session. |
| Email | New accounts confirm their email before logging in (when `REQUIRE_EMAIL_VERIFICATION` is on). Links are single-use, stored only as hashes, and expire. Signing in with Google or Facebook on an unconfirmed account replaces any password set by someone else first. |
| Audit log | Sign-ins, failures, lockouts, password resets, role and ban changes, listing approvals, content changes and announcements are recorded (who, what, when, IP). Admins can read it at Admin, Audit log. Entries cannot be edited from the app. |
| Headers | API: a locked-down Content-Security-Policy. Website: CSP (report-only by default, see `docs/DEPLOYMENT.md`), HSTS, frame blocking, referrer and permissions policies. |
| Uploads | Size limit, and the file type is checked from the file's contents. |
| Analytics | Off unless configured, and starts only after the visitor accepts cookies and has not enabled Do Not Track. Never runs on admin pages or pages with secret tokens in the address. |
| Secrets | The API refuses to start without `JWT_SECRET` (32+ characters in production). `.env` files are ignored by Git. Runtime secrets live only in the server's `.env`; GitHub holds just the deploy key and public build values. |
| Delivery pipeline | Every change goes through CI (lint, tests, builds, database migration check) before it can be deployed. Deployment is over SSH to a pinned server identity, can require a named person's approval, backs up first, checks health afterwards and rolls back automatically. Dependabot proposes dependency and base-image updates; CodeQL scans the code where available. See `docs/CICD.md`. |

## Depends on how you run it

- Keep the server patched, and the database port closed to the internet.
- Back up and **test restores** (`ops/backup`). Encrypt copies that leave the server.
- Turn on two-factor authentication on the hosting, domain, email and GitHub accounts.
- Review the audit log after any suspicious report.
- Run `npm run prune-audit-log` periodically so the log does not grow forever.

## Known limits (good next steps)

- Two-factor login for admin accounts is not built.
- The account lockout can be used to lock someone out on purpose for 15 minutes.
- `script-src` allows inline scripts, because Next.js needs them for page hydration. A nonce-based policy would remove that, at the cost of dynamic rendering for every page.
- Password-breach checking (rejecting passwords seen in leaks) is not built.
- Existing accounts with older, weaker passwords can still log in until they next change them.

## Reporting a problem

Email the site owner with what you found and how to reproduce it. Please do not share it publicly first.
