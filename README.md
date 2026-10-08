# AutoHub Nepal

A business listing platform for auto services in Nepal. Visitors can find garages and
auto businesses near them, read reviews, book services and chat with owners. Owners
manage their listings, customers and announcements. Admins review listings and manage
the site.

The codebase is built so the same app can serve other verticals (for example
restaurants, as "Bhojan Hub") by changing one environment variable.

## Tech stack

| Part | Stack |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Zustand, React Hook Form, Zod |
| Backend | NestJS, TypeScript, Prisma, PostgreSQL, JWT (httpOnly cookie), Nodemailer |

## Repository structure

```
.
├── frontend/   Next.js web app (public site, owner dashboard, admin panel)
├── backend/    NestJS REST API and Prisma database schema
└── docs/       Project documentation (database ERD)
```

## Main features

- Search and filter listings by category, location and rating
- Listing detail pages with gallery, services, hours, map and reviews
- Business registration wizard with image uploads
- Bookings and enquiries
- Reviews and ratings
- Owner dashboard: listings, customers, personal messages and email announcements
- Visitor chat on each listing (keyword replies, optional AI replies, owner takeover)
- Admin panel: listing review queue, users, categories, chats, homepage hero images and popup ad
- Email/password login, Google and Facebook login, password reset by email

## Getting started

You need Node.js 20+ and a PostgreSQL database. Start the backend first, then the
frontend.

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

Register an account through the website, then promote it:

```bash
cd backend
npm run make-admin -- you@example.com
```

## What is not in Git

Secrets and private data are ignored on purpose: `.env` files, uploaded images
(`backend/uploads`) and the WordPress import data in `backend/prisma/data`. Never
commit these.
