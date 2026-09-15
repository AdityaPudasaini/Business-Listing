// integration.ts — the one place to connect a future AutoHub or BhojanHub API.
// Only NEXT_PUBLIC_* values are available in the browser. Never put a private
// server secret here; route those calls through a Next.js server route instead.

export type ApiPlatform = "auto" | "restaurant";

function withoutTrailingSlash(value?: string) {
  return value?.trim().replace(/\/$/, "");
}

export const integration = {
  apiBaseUrl: withoutTrailingSlash(process.env.NEXT_PUBLIC_API_URL),
  apiKey: process.env.NEXT_PUBLIC_API_KEY?.trim(),
  apiKeyHeader: process.env.NEXT_PUBLIC_API_KEY_HEADER?.trim() || "X-API-Key",
  apiAuthScheme: process.env.NEXT_PUBLIC_API_AUTH_SCHEME?.trim(),
  platform: (process.env.NEXT_PUBLIC_VERTICAL === "restaurant" ? "restaurant" : "auto") as ApiPlatform,
  endpoints: {
    categories: process.env.NEXT_PUBLIC_API_CATEGORIES_PATH || "/categories",
    businesses: process.env.NEXT_PUBLIC_API_BUSINESSES_PATH || "/businesses",
    serviceCategories: process.env.NEXT_PUBLIC_API_SERVICE_CATEGORIES_PATH || "/service-categories",
    bookings: process.env.NEXT_PUBLIC_API_BOOKINGS_PATH || "/bookings",
    uploads: process.env.NEXT_PUBLIC_API_UPLOADS_PATH || "/uploads",
  },
};

export const isBackendConfigured = Boolean(integration.apiBaseUrl);
