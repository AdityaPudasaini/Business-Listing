// integration.ts — the one place to connect the Business-Listing API.
// Only NEXT_PUBLIC_* values are available in the browser. Never put a private
// server secret here; route those calls through a Next.js server route instead.

export type ApiPlatform = "auto" | "restaurant";

function withoutTrailingSlash(value?: string) {
  return value?.trim().replace(/\/$/, "");
}

function positiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const integration = {
  apiBaseUrl: withoutTrailingSlash(process.env.NEXT_PUBLIC_API_URL),
  apiKey: process.env.NEXT_PUBLIC_API_KEY?.trim(),
  apiKeyHeader: process.env.NEXT_PUBLIC_API_KEY_HEADER?.trim() || "X-API-Key",
  apiAuthScheme: process.env.NEXT_PUBLIC_API_AUTH_SCHEME?.trim(),
  platform: (process.env.NEXT_PUBLIC_VERTICAL === "restaurant"
    ? "restaurant"
    : "auto") as ApiPlatform,

  // GET /businesses only runs its distance query when lat, lng AND radiusKm
  // are all present, so the UI has to supply a radius even though no screen
  // asks the user for one.
  nearbyRadiusKm: positiveNumber(process.env.NEXT_PUBLIC_NEARBY_RADIUS_KM, 25),

  endpoints: {
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    googleAuth: "/auth/google",
    facebookAuth: "/auth/facebook",
    categories: process.env.NEXT_PUBLIC_API_CATEGORIES_PATH || "/categories",
    businesses: process.env.NEXT_PUBLIC_API_BUSINESSES_PATH || "/businesses",
    serviceCategories:
      process.env.NEXT_PUBLIC_API_SERVICE_CATEGORIES_PATH ||
      "/service-categories",
    bookings: process.env.NEXT_PUBLIC_API_BOOKINGS_PATH || "/bookings",
    uploads: process.env.NEXT_PUBLIC_API_UPLOADS_PATH || "/uploads",
    myListings: process.env.NEXT_PUBLIC_API_MY_LISTINGS_PATH || "/businesses/mine",
    myAccount: process.env.NEXT_PUBLIC_API_MY_ACCOUNT_PATH || "/me/account",
    users: process.env.NEXT_PUBLIC_API_USERS_PATH || "/users",
    chats: process.env.NEXT_PUBLIC_API_CHATS_PATH || "/chats",

    // Auth — these three exist on the Nest side today.
    login: process.env.NEXT_PUBLIC_API_LOGIN_PATH || "/auth/login",
    register: process.env.NEXT_PUBLIC_API_REGISTER_PATH || "/auth/register",
    me: process.env.NEXT_PUBLIC_API_ME_PATH || "/auth/me",
    contact: process.env.NEXT_PUBLIC_API_CONTACT_PATH || "/contact",
    heroImages: process.env.NEXT_PUBLIC_API_HERO_IMAGES_PATH || "/hero-images",

  },
};

export const isBackendConfigured = Boolean(integration.apiBaseUrl);

// Which routes actually exist on the Nest side today.
//
// The NEXT_PUBLIC_API_*_PATH values above are all populated in .env.local, so
// "has a path" is NOT the same as "has a route" — /categories is configured but
// unimplemented, and calling it would 404 on every page load. Flip a flag the
// day its route ships; nothing else in the app needs to change.
export const backendSupports = {
  listings: true, // GET /businesses, GET /businesses/slug/:slug
  auth: true, // POST /auth/login, /auth/register, GET /auth/me
  reviews: true, // GET + POST /businesses/:id/reviews
  bookings: true, // POST /bookings and GET /bookings (own history) both wired
  categories: true, // no route; `category` is a plain string column
  serviceCatalog: false, // no route and no model
  uploads: true, // no route, no multer, no storage
  myListings: true, // GET /businesses/mine requires the current user's JWT
  myAccount: true, // GET/PATCH /me/account
  users: true, // GET /users, PATCH /users/:id/role (both admin-only)
  passwordReset: true, // POST /auth/forgot-password, POST /auth/reset-password
  socialLogin: true, // GET /auth/google, /auth/facebook (+ /callback). Needs provider keys on the API.
  contact: true, // POST /contact
  heroImages: true, // GET (public), POST/DELETE (admin) /hero-images
  announcements: true, // POST/GET /businesses/:id/announcements
  customers: true, // GET /businesses/:id/customers, GET /businesses/mine/customers
  chats: true,
};