# AutoHub Nepal: Frontend

The website for AutoHub Nepal, built with Next.js, React, TypeScript and Tailwind CSS.
It includes the public site, the business owner dashboard and the admin panel.

## Setup

Requirements: Node.js 20+ and the backend API running (see
[../backend/README.md](../backend/README.md)).

```bash
npm install
```

Create a `.env.local` file in this folder:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_VERTICAL=auto
```

Then start the dev server:

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the code in `src/` |
| `npm test` | Run the tests once (Vitest) |
| `npm run test:watch` | Run the tests in watch mode |

## Environment variables

Put these in `.env.local`. Anything starting with `NEXT_PUBLIC_` is visible to every
visitor's browser, so never put private keys in one.

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend origin, no trailing slash (for example `http://localhost:3001`). Required |
| `NEXT_PUBLIC_VERTICAL` | `auto` (default, AutoHub) or `restaurant` (Bhojan Hub) |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site (used for SEO and sitemap) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps key for maps and location search |
| `GOOGLE_MAPS_SERVER_API_KEY` | Optional server-only key, never sent to the browser |
| `NEXT_PUBLIC_IMAGE_HOSTS` | Extra allowed image hosts, comma separated |
| `NEXT_PUBLIC_NEARBY_RADIUS_KM` | Radius used for "Nearby" listings |
| `NEXT_PUBLIC_COUNTRY_NAME`, `NEXT_PUBLIC_COUNTRY_CODE` | Country used for location search |
| `NEXT_PUBLIC_SOCIAL_FACEBOOK`, `_INSTAGRAM`, `_TWITTER` | Footer social links |
| `NEXT_PUBLIC_DEMO_MODE` | Set to `true` to use bundled sample data with no backend (local demos only) |
| `NEXT_IMAGE_ALLOW_LOCAL_IP` | Set to `true` if images are served from a local IP in development |

The `NEXT_PUBLIC_API_*_PATH` variables can override individual backend route names.
You normally do not need them.

If `NEXT_PUBLIC_API_URL` is missing and demo mode is not on, the site shows a
"server is not connected" error instead of fake data.

## Project structure

```
frontend/
├── public/                    Logos and static images
├── Sitemap and Wireframes/    Original sitemap and wireframe links
└── src/
    ├── app/                   Pages (Next.js App Router)
    │   ├── page.tsx           Homepage
    │   ├── listings/          Listing search and detail pages
    │   ├── register/          Business registration
    │   ├── dashboard/         Owner dashboard
    │   ├── admin/             Admin panel (listings, review queue, users,
    │   │                      categories, chats, settings)
    │   ├── login, signup, forgot-password, reset-password
    │   └── about, contact, privacy, terms
    ├── components/
    │   ├── ui/                Generic pieces (Button, Card, EmptyState, ...)
    │   ├── layout/            Navbar, Footer
    │   ├── sections/          Homepage and dashboard sections (Hero, Customers, ...)
    │   ├── project/           Listing card, search/filter bar, rating stars
    │   └── admin/             Admin panel components
    ├── config/                Theme, branding and backend connection settings
    ├── features/verticals/    Per-vertical settings (auto, restaurant)
    ├── services/api.ts        All backend calls go through this file
    ├── hooks/, lib/, types/   Shared hooks, helpers and TypeScript types
    ├── data/                  Category data and demo data
    └── test/                  Test setup
```

## How it works

- **One API boundary:** every backend request goes through `src/services/api.ts`.
  Components never call `fetch` directly.
- **Branding in one place:** brand name, colors and feature flags live in
  `src/config/theme.ts`.
- **Two verticals:** `NEXT_PUBLIC_VERTICAL=auto` shows AutoHub. `restaurant` switches
  the booking form to table reservations for Bhojan Hub. Restart the dev server after
  changing it.
- **Homepage hero images and popup ad** are managed by admins under
  **Admin → Settings**. The homepage loads them from the backend, so uploads show
  after a refresh.

## Roles

- **Visitor:** browse listings, chat, book, contact.
- **Owner:** register businesses, manage listings, see customers, send messages and
  email announcements from the dashboard.
- **Admin:** approve listings, manage users and categories, manage chats and homepage
  settings. Admin logins use `/admin/login`.

## Image hosts

Remote images must come from an allowed host. Your backend host and Unsplash are
allowed by default. Add others with `NEXT_PUBLIC_IMAGE_HOSTS` in `.env.local`.

## If you get stuck

Report the problem like this:

```
Problem: <what's not working>
What I tried: <steps you took>
Error: <exact error message>
Screenshot: attached
```
