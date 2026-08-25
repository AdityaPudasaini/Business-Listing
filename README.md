# Backend Developer #5 — Universal Business Listing Theme API

This is your ready-to-run NestJS starter. The Auth module (register, login,
forgot/reset password, JWT) is already fully built and working.

## 1. Setup (do this first)

```bash
npm install
cp .env.example .env
# edit .env with your real DATABASE_URL and JWT_SECRET
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

API runs on http://localhost:3000. Test it works by sending a POST request to
`/auth/register` with a JSON body of `{ "name": "...", "email": "...", "password": "..." }`.

## 2. Read the guideline

Open **Backend-Dev5-Guideline.docx** in this folder before writing any code.
It explains how the Auth module works and gives a full working example for each
of your 3 required modules.

## 3. Project Goal

A theme that works for Auto, Property, Hotel, Jobs, Restaurant, Business, or Services listings — one product, many verticals.

## 4. Your 3 Required Modules

Stub folders already exist under `src/modules/` and are already registered in
`app.module.ts`, so the app runs immediately even before you implement them.
Fill in the real Prisma queries using the full example in the guideline docx.

- **Listings** — Manage business listings: register, list, filter, update.
- **Reviews** — Manage customer reviews on a listing.
- **Bookings / Enquiries** — Manage bookings/enquiries submitted to a business.

## 5. Where Things Live

- `src/modules/auth/` — already built, do not need to touch
- `src/modules/<your-module>/` — your 3 stub modules, each has a placeholder route that works out of the box
- `prisma/schema.prisma` — add your 3 models here (see the guideline docx for exact fields)
- `src/prisma/prisma.service.ts` — inject this into any service that needs the database

## 6. Timeline

40 working days, 8 hours/day. Full week-by-week breakdown is in the guideline docx, Part D.

## 7. If You Get Stuck

Report the problem like this (also in the guideline docx):

```
Problem: <what's not working>
What I tried: <steps you took>
Error: <exact error message>
Screenshot: attached
```

This is a beginner-friendly starter — every core file has a one-line comment at the top
explaining its job. Read that comment before editing any file.
