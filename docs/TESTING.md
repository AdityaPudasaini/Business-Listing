# Testing the whole system

A complete test pass, in the order that finds problems fastest. Allow about 90 minutes. Tick
each box; write what you saw next to anything that does not match.

Everything here runs on your own computer against your local database, except Part 8.

## Part 0. Get ready

1. **Commit or stash your work**, then copy the files from the latest zip over your repository.
2. **Start the database** (your Docker container): `docker ps` should list `pg-dev` as running.
3. **Apply the database changes** (adds the audit log, lockout, session and email-verification columns):
   ```powershell
   cd backend
   npm install
   npx prisma migrate dev --name add_email_verification
   ```
   Commit the new folder it creates under `backend/prisma/migrations`.
4. **Check `backend/.env`** has `JWT_SECRET` (any long random text is fine locally).
5. **Back up your data first**, since this changes the database:
   `.\ops\backup\backup-dev.ps1` (creates a `backups` folder).
6. **Start both apps** in two terminals: `npm run start:dev` in `backend`, `npm run dev` in `frontend`.

## Part 1. Automated checks (about 5 minutes)

Run these and paste any error to get it fixed. All should finish without errors.

```powershell
cd backend
npm run build                    # compiles the API (catches type errors)

cd ../frontend
npm run lint
npm test                         # unit tests, including analytics and audit labels
npm run build                    # production build of the website
```

- [ ] backend build passes
- [ ] frontend lint passes
- [ ] frontend tests pass
- [ ] frontend build passes

## Part 2. API smoke test (about 2 minutes)

With the backend running:

```powershell
cd backend
npm run smoke-test
```

It creates throw-away accounts and checks: the API is up and sends safe headers, public data loads,
weak passwords are refused, sign-up and sign-in, that unknown and wrong-password logins look
identical, the session cookie flags, "log out everywhere" killing old sessions, account deletion,
and that normal users cannot read the audit log.

Add the audit log and lockout checks:

```powershell
$env:ADMIN_EMAIL="your-admin@example.com"; $env:ADMIN_PASSWORD="your-admin-password"
npm run smoke-test -- --lockout
```

(`--lockout` waits about a minute; the API limits logins to 5 per minute, and the script paces
itself around that.) Use an admin account made for testing and close the terminal afterwards so
the password is not left in your shell history.

Add `--uploads` to also check image uploads: anonymous visitors are refused, a text file renamed
`.png` is refused, and a real image is stored as WebP and served back. It leaves one tiny file in
`backend/uploads`, which is harmless.

Expected: `ALL CHECKS PASSED`. Any `FAIL` line says what was wrong. Then remove the test accounts:

```powershell
docker exec pg-dev psql -U postgres -d mydb -c 'DELETE FROM \"User\" WHERE email LIKE ''smoke-%@example.test'';'
```

Run it a second time with email confirmation switched on (Part 4) to cover that path as well.

- [ ] smoke test passes (verification off)
- [ ] smoke test passes (verification on)

## Part 3. The public website

Open http://localhost:3000 in a normal window (so you see what visitors see).

| Check | Expected |
| --- | --- |
| Homepage loads | Hero images show (your uploaded ones if any, otherwise the defaults), category filter, "Your Nearest Auto Service" cards with photos |
| Search by address, and "Locate me" | Results update; the browser asks for location permission |
| Open a listing | Gallery, services, hours, map, reviews and products load |
| Map | The map and marker display (needs your Google Maps key) |
| About, Contact, Privacy, Terms pages | Open; the Privacy page mentions analytics |
| Contact form | Submitting shows a success message |
| Cookie notice | Appears once; choosing Accept or Decline hides it and it does not return after a refresh |
| Phone width (DevTools, device toolbar) | Navbar collapses, cards stack, nothing scrolls sideways |
| Stop the backend, reload | The site shows a clear "not connected" style message, not a blank page |

## Part 4. Sign-up, email confirmation and login

Do this section twice if you can: once with confirmation **off** (the local default) and once
**on**. To turn it on, add `REQUIRE_EMAIL_VERIFICATION=true` to `backend/.env` and restart the
backend. With no email server configured, the backend **prints each email in its own terminal**,
so you can copy the confirmation link from there.

**Password rules**

| Try | Expected |
| --- | --- |
| Sign up with `abc123` | Refused with a clear message (needs 8+ characters, an uppercase letter and a number) |
| Sign up with `Garage2026x` | Accepted |
| Sign up again with the same email | Refused: already registered |

**Confirmation off**

- [ ] After signing up you are signed in straight away

**Confirmation on**

- [ ] After signing up you see **Check your email**, and you are not signed in
- [ ] The backend terminal shows the email with a link ending in `/verify-email?token=...`
- [ ] Logging in before confirming shows **Confirm your email first** with a resend button
- [ ] "Send the email again" works, then shows a 30-second countdown
- [ ] Opening the link shows **Email confirmed**; the token disappears from the address bar
- [ ] Opening the same link a second time shows **Link not valid** (it is single-use)
- [ ] You can now log in
- [ ] A made-up link (`/verify-email?token=abc`) shows **Link not valid**

**Login and lockout**

- [ ] Wrong password shows "Invalid email or password"
- [ ] An unknown email shows exactly the same message
- [ ] After 5 wrong passwords the next attempt (even with the right password) says too many
      failed attempts. The same attempt within the same minute may instead show the general
      rate-limit message; both are correct.
- [ ] After the lock expires (15 minutes), or if you clear it with
      `UPDATE "User" SET "lockedUntil"=NULL,"failedLogins"=0 WHERE email='...';`, login works again

**Forgot and reset password**

- [ ] "Forgot password" prints a reset email (terminal) with a link
- [ ] The reset form rejects a weak new password and accepts a strong one
- [ ] Any other browser that was logged in is signed out after the reset
- [ ] An account that never confirmed its email can now log in after resetting

**Social login (needs real Google and Facebook credentials)**

- [ ] Sign in with Google creates or links the account
- [ ] Sign in with Facebook creates or links the account
- [ ] Signing up with email, **not confirming**, then using Google with the same address works,
      and the old password no longer works

## Part 5. Owner features

Sign in as a normal user.

| Check | Expected |
| --- | --- |
| Register a business (all wizard steps, with photos) | Saved; appears as **pending** |
| Upload a large photo (2 to 4 MB) in the wizard | Accepted. The new file in `backend/uploads` is a `.webp` of a few hundred KB, upright, and the backend terminal logs `Saved upload ...: 3200 KB -> 180 KB` |
| Dashboard | Your listings show; edit a listing and save |
| Products | Add, edit and delete a product |
| Account card | Name and phone edit and save |
| **Sign out everywhere** | Log in on two browsers, click it in one: both are signed out and the next action asks you to log in |
| Book, review and chat as a visitor on someone else's listing | Booking and review save; chat answers |
| Customers page | The booking, review and chat messages show up |
| **Email announcement** | The button is enabled with one business; sending prints the email (terminal) or delivers it |
| Message thread | A personal message to a customer is saved |

## Part 6. Admin panel

Sign in at `/admin/login` with an admin account (promote yours with
`npm run make-admin -- you@example.com` in `backend`).

| Check | Expected |
| --- | --- |
| Admin login | Works; closing the whole browser and reopening asks you to sign in again |
| Review queue | Approve one pending listing and reject another; both leave the queue |
| Users | Change a role; ban and unban a user (a banned user cannot log in) |
| Categories | Create, rename, delete |
| Chats | The conversations list loads |
| **Settings, hero images** | Upload an image, then reload the homepage: it appears. Delete it: it disappears |
| **Settings, popup ad** | Upload an image, set a link, check the popup on the homepage, then remove it |
| **Audit log** | See below |

**The audit log page** (`/admin/audit-log`)

- [ ] Shows the actions you just did (sign-ins, the approval, the role change, the hero upload, ...)
- [ ] Each row has the right plain-language label and colour
- [ ] "Details" expands to show the IP address, browser and extra info (for example the new role)
- [ ] The filter menu narrows the list (try *Sign-ins and passwords* and *Listings*)
- [ ] Failed sign-ins on an unknown email show "Unknown account, Tried name@..."
- [ ] Next and Previous work once there are more than 25 entries
- [ ] A normal (non-admin) user visiting the page is not shown the data

## Part 7. Privacy, analytics and security headers

**Analytics** (only if you set `NEXT_PUBLIC_ANALYTICS_PROVIDER` and the ID; otherwise confirm
nothing loads)

- [ ] Before clicking the cookie notice: DevTools, Network shows **no** request to
      `googletagmanager.com` or `plausible.io`
- [ ] After **Accept**: the request appears, and a visit shows in Google Analytics, Realtime
- [ ] After **Decline** (clear site data first): no request at all
- [ ] On `/admin` and `/verify-email` pages: no analytics request, even after Accept
- [ ] With the browser's Do Not Track on: no request even after Accept

**Content-Security-Policy** (production build only: `npm run build` then `npm start`, since it is
off in development)

- [ ] DevTools, Console shows no lines starting with "Content-Security-Policy" while you browse the
      homepage, a listing with a map, sign-up and login, and the admin pages. Any that appear name
      something the policy would block; tell me and I will adjust it before enforcing.
- [ ] DevTools, Network, click a page request, Headers: you see
      `Content-Security-Policy-Report-Only`, `X-Frame-Options`, `Referrer-Policy`

**Lighthouse** (DevTools, Lighthouse, run on the homepage and a listing, mobile and desktop)

- [ ] Note the scores: Performance ___, Accessibility ___, Best practices ___, SEO ___

## Part 8. Backups, restore, containers and the pipeline

**Backup and restore of your data**

- [ ] `.\ops\backup\backup-dev.ps1` creates a `.dmp` and an uploads `.zip` in `backups`
- [ ] Restore it into a throw-away database and compare counts (from `DATABASE_RESTORE.md`):
      ```powershell
      docker cp backups\autohub-YYYYMMDD-HHMMSS.dmp pg-dev:/tmp/check.dmp
      docker exec pg-dev createdb -U postgres checkdb
      docker exec pg-dev pg_restore -U postgres -d checkdb --no-owner /tmp/check.dmp
      docker exec pg-dev psql -U postgres -d checkdb -c 'SELECT (SELECT count(*) FROM \"User\") AS users, (SELECT count(*) FROM \"Business\") AS businesses;'
      docker exec pg-dev dropdb -U postgres checkdb
      ```
      The counts match your live database.

**Containers** (needs Docker Desktop running)

- [ ] `docker build ./backend -t autohub-backend-test` finishes
- [ ] `docker build ./frontend -t autohub-frontend-test --build-arg NEXT_PUBLIC_API_URL=https://api.example.com` finishes
- [ ] With a filled-in root `.env`, `docker compose config` prints the stack with no "required" errors

**Pipeline**

- [ ] Push a branch and open a pull request: the **CI** checks run and go green
      (`backend`, `frontend`, `docker`)
- [ ] If the `backend` check fails at *schema.prisma matches the migrations*, create the missing
      migration (`npx prisma migrate dev --name describe_the_change`) and commit it
- [ ] Full deployment on a test server: follow `docs/CICD.md`, then run
      [the before-you-announce checklist](DEPLOYMENT.md)

## Part 9. Things that broke before. Check them again

- [ ] Admin hero image changes appear on the homepage (the old caching bug)
- [ ] The Customers page "Email announcement" button is enabled
- [ ] Uploaded listing and hero images display (the `uploads` folder is in `backend`)
- [ ] After a backend restart, you stay signed in (cookies are valid, tokens still match)
- [ ] `npm run optimize-uploads -- --convert` (preview) lists the big old photos, the saving, and the
      database rows it would update; after `--convert --confirm` the listing, hero and product photos
      still display, in the database `SELECT image FROM \"Product\" LIMIT 3;` now ends in `.webp`, and the
      frontend terminal no longer shows `upstream image response timed out`

## If something fails

Write down the test, what you expected, and what happened, then copy the exact error text
(browser console, the backend terminal, or the smoke test output). That is enough to find the cause.

| What happened | Likely reason |
| --- | --- |
| Everyone is signed out after the update | Normal once: restart brought the new session checks. Log in again. |
| API will not start: "JWT_SECRET is not set" | Add `JWT_SECRET=...` to `backend/.env`. |
| API errors on every request after updating | The migration was not applied: run `npx prisma migrate dev`. |
| `npm run smoke-test` says it cannot reach the API | The backend is not running, or `API_URL` is wrong. |
| Smoke test reports "rate limited" | Another login attempt used the 5-per-minute allowance; the script waits and retries by itself. |
| Maps do not show | Missing or wrongly restricted `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (allow `http://localhost:3000/*`). |

## Test record

| Date | Tester | Parts completed | Problems found | Fixed? |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
