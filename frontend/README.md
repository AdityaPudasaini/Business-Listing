# Frontend Developer #5 — Universal Business Listing Theme

This is your ready-to-run Next.js starter. It already contains the shared project
architecture used by all 6 theme products, plus a working homepage.

## 1. Setup (do this first)

```bash
npm install
npm run dev
```

Open http://localhost:3000 — if you see a homepage with a header and footer, setup worked.

## 2. Read the guideline

Open **Frontend-Dev5-Guideline.docx** in this folder before writing any code.
It explains TypeScript basics, the folder structure, and gives a full working example
for each of your 3 required components.

## 3. Project Goal

A theme that works for Auto, Property, Hotel, Jobs, Restaurant, Business, or Services listings — one product, many verticals.

## 4. Homepage Section Order

Search → Location → Categories → Featured Listings → Popular Listings → Nearby → Popular Services → How It Works → Register Your Business → Footer

## 5. Inner Pages To Build

- Listing (search + filter)
- Detail Page
- Owner Dashboard
- Register Business

## 6. Your 3 Required Components

Stub files already exist in `src/components/project/` with the props typed out for you.
Fill in the JSX using the full example in the guideline docx.

- **ListingCard** — A reusable listing card — the same component works for a car dealership, hotel, or property listing.
- **SearchFilterBar** — A search + filter bar (category, location, rating, price, open-now).
- **RatingStars** — A star-rating component used both for display and for collecting a review rating.

## 7. Where Things Live

- `src/config/theme.ts` — brand name, colors, feature flags (the ONLY place client branding should live)
- `src/components/ui/` — generic reusable pieces (Button, Card, EmptyState, LoadingSpinner)
- `src/components/layout/` — Navbar, Footer
- `src/components/sections/` — homepage sections (Hero is already built as an example)
- `src/components/project/` — your 3 project-specific components (stubs waiting for you)
- `src/data/` — mock data to build against before the backend is ready
- `src/services/api.ts` — where all backend calls should go through

## 8. Timeline

40 working days, 8 hours/day. Full week-by-week breakdown is in the guideline docx, Part E.

## 9. Backend connection

## One frontend, switchable data

This is one shared frontend. To preview restaurant data instead of auto data,
set `NEXT_PUBLIC_VERTICAL=restaurant` in `.env.local`, then restart the dev
server. Set it back to `auto` to restore the AutoHub demo data. The same cards,
filters, map, detail flow, and booking component stay in place.

The site runs against the demo data by default. When the AutoHub or Bhojan Hub
backend is ready, copy `.env.example` to `.env.local` and add its origin:

```bash
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_VERTICAL=auto
```

If the backend expects a browser-safe API key, add `NEXT_PUBLIC_API_KEY`. It
uses `X-API-Key` by default; change `NEXT_PUBLIC_API_KEY_HEADER` or set
`NEXT_PUBLIC_API_AUTH_SCHEME=Bearer` when required. Do **not** put a private
admin/server key in a `NEXT_PUBLIC_` variable: anything with that prefix is
visible to every browser visitor. A private API must be called through a
server-side Next.js route instead.

The API layer tolerates common response wrappers (`data`, `results`, `items`)
and camelCase or snake_case listing fields. If a backend has different route
names, set the endpoint path variables in `.env.example`; components never
need to be edited.

`src/services/api.ts` is the single API boundary. It falls back to the current
demo data when no API URL is set, then automatically switches to these expected
endpoints when a URL is present:

- `GET /categories`
- `GET /businesses?query=&category=&latitude=&longitude=&sort=`
- `GET /businesses/:id`
- `GET /service-categories`
- `POST /bookings`
- `POST /businesses/:id/reviews`
- `POST /uploads` (multipart form data with a `file` field, returning `{ url }`)

The backend team should keep the common listing fields consistent (`id`, `name`,
`image`, `category`, `location`, `rating`, contact details, hours, gallery,
services, amenities and coordinates). Vertical-only data should be nested under
an extra field, for example vehicle information for Auto or table/menu data for
Restaurant. This keeps the shared listing pages reusable.

The registration wizard uploads selected images to `/uploads` first, then sends
the returned URLs with the listing payload. The exact request/response shapes
are in `API_CONTRACT.md`.

For a Bhojan Hub deployment, set `NEXT_PUBLIC_VERTICAL=restaurant`. The booking
form will then use table-reservation fields and restaurant time windows while
the shared listing, map, ratings and contact UI stay the same. The vertical
feature modules live in `src/features/verticals/`.

## 10. If You Get Stuck

Report the problem like this (also in the guideline docx):

```
Problem: <what's not working>
What I tried: <steps you took>
Error: <exact error message>
Screenshot: attached
```

This is a beginner-friendly starter — every core file has a one-line comment at the top
explaining its job. Read that comment before editing any file.
