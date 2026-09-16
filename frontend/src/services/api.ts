// api.ts — the only boundary between UI components and a future backend.
import { categories as staticCategories, businessMatchesCategory } from "@/data/categories";
import { serviceCatalog } from "@/data/services";
import { sampleBusinesses } from "@/data/sampleBusinesses";
import { heroImages } from "@/data/heroImages";
import { integration, isBackendConfigured } from "@/config/integration";
import { distanceKm } from "@/lib/distance";
import { slugify } from "@/lib/slugify";
import { Business, Category, CreateBookingInput, CreateListingInput, CreateReviewInput, ListingSearchParams, Review, ServiceCategory } from "@/types";

export { isBackendConfigured };
export class ApiError extends Error { constructor(message: string, public readonly status?: number) { super(message); this.name = "ApiError"; } }
function apiUrl(path: string) { if (!integration.apiBaseUrl) throw new ApiError("The backend URL has not been configured."); return `${integration.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`; }
function requestHeaders() {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (integration.apiKey) headers[integration.apiAuthScheme ? "Authorization" : integration.apiKeyHeader] = integration.apiAuthScheme ? `${integration.apiAuthScheme} ${integration.apiKey}` : integration.apiKey;
  return headers;
}
async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) { let message = `Request failed with status ${res.status}.`; try { const body = (await res.json()) as { message?: string; error?: string; detail?: string }; message = body.message ?? body.error ?? body.detail ?? message; } catch { /* retain status message */ } throw new ApiError(message, res.status); }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
export async function apiGet<T>(path: string): Promise<T> { return parseResponse<T>(await fetch(apiUrl(path), { credentials: "include", headers: requestHeaders(), cache: "no-store" })); }
export async function apiPost<T>(path: string, body: unknown): Promise<T> { return parseResponse<T>(await fetch(apiUrl(path), { method: "POST", credentials: "include", headers: { ...requestHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(body) })); }
export async function apiUpload(file: File): Promise<string> {
  const body = new FormData();
  body.set("file", file);
  const result = itemPayload(await parseResponse<unknown>(await fetch(apiUrl(integration.endpoints.uploads), {
    method: "POST", credentials: "include", headers: requestHeaders(), body,
  })));
  const url = text(object(result).url, object(result).imageUrl, object(result).image_url);
  if (!url) throw new ApiError("The upload endpoint did not return a public image URL.");
  return url;
}

type ApiRecord = Record<string, unknown>;
function object(value: unknown): ApiRecord { return value && typeof value === "object" && !Array.isArray(value) ? value as ApiRecord : {}; }
function text(...values: unknown[]) { return values.find((value) => typeof value === "string" || typeof value === "number")?.toString() ?? ""; }
function number(...values: unknown[]) { const value = Number(values.find((item) => item !== undefined && item !== null && item !== "")); return Number.isFinite(value) ? value : 0; }
function optionalNumber(...values: unknown[]) { const raw = values.find((item) => item !== undefined && item !== null && item !== ""); const value = Number(raw); return raw !== undefined && Number.isFinite(value) ? value : undefined; }
function arrayPayload(value: unknown): unknown[] { if (Array.isArray(value)) return value; const body = object(value); for (const key of ["data", "results", "items", "businesses", "categories"]) if (Array.isArray(body[key])) return body[key] as unknown[]; return []; }
function itemPayload(value: unknown): unknown { const body = object(value); return body.data ?? body.result ?? body.business ?? value; }
function strings(value: unknown): string[] { return Array.isArray(value) ? value.map((item) => typeof item === "string" ? item : text(object(item).url, object(item).image, object(item).name, object(item).label)).filter(Boolean) : []; }

// Accepts common response envelopes and camelCase or snake_case field names.
// If a backend differs more substantially, add its mapper here—not in a component.
function toBusiness(value: unknown): Business {
  const source = object(value); const contact = object(source.contact); const category = object(source.category); const location = object(source.location); const coordinates = object(source.coordinates);
  const rawServices = source.services ?? source.serviceCategories; const rawAmenities = source.amenities;
  return {
    id: text(source.id, source._id, source.businessId, source.business_id),
    // Real backend doesn't have a slug field/lookup yet (flagged in
    // getBusinessBySlug below) — fall back to deriving one from the name
    // so routing still works, same as the sample data does.
    slug: text(source.slug) || slugify(text(source.name, source.title, source.businessName, source.business_name)),
    name: text(source.name, source.title, source.businessName, source.business_name),
    image: text(source.image, source.imageUrl, source.image_url, source.coverImage, source.cover_image, source.logo) || heroImages[0],
    category: text(source.categoryName, category.label, category.name, category.title, source.category) || "Uncategorized", location: text(source.locationName, source.address, location.address, location.name, source.city, source.area) || "Location not provided",
    description: text(source.description, source.about), rating: number(source.rating, source.averageRating, source.average_rating), reviewCount: number(source.reviewCount, source.review_count, source.totalReviews),
    phone: text(source.phone, contact.phone), whatsapp: text(source.whatsapp, contact.whatsapp), email: text(source.email, contact.email), hours: text(source.hours, source.openingHours, source.opening_hours), gallery: strings(source.gallery ?? source.images),
    services: Array.isArray(rawServices) ? rawServices.map((entry) => ({ label: typeof entry === "string" ? entry : text(object(entry).label, object(entry).name, object(entry).title) })).filter((entry) => entry.label) : undefined,
    amenities: Array.isArray(rawAmenities) ? rawAmenities.map((entry) => ({ label: typeof entry === "string" ? entry : text(object(entry).label, object(entry).name), icon: typeof entry === "string" ? "Check" : text(object(entry).icon) || "Check" })).filter((entry) => entry.label) : undefined,
    latitude: optionalNumber(source.latitude, source.lat, location.latitude, coordinates.lat), longitude: optionalNumber(source.longitude, source.lng, location.longitude, coordinates.lng),
  };
}
function toCategory(value: unknown): Category { const item = object(value); return { id: text(item.id, item._id, item.slug, item.name), label: text(item.label, item.name, item.title) }; }
function toServiceCategory(value: unknown): ServiceCategory { const item = object(value); return { label: text(item.label, item.name, item.title), items: strings(item.items ?? item.services) }; }
function toReview(value: unknown): Review { const item = object(value); return { id: text(item.id, item._id), businessId: text(item.businessId, item.business_id), rating: number(item.rating), title: text(item.title, item.subject), message: text(item.message, item.comment, item.body), authorName: text(item.authorName, item.author_name, item.userName, item.name), createdAt: text(item.createdAt, item.created_at) || new Date().toISOString() }; }
function toQuery(params: ListingSearchParams) { const query = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); }); const output = query.toString(); return output ? `?${output}` : ""; }
function businessPath(id?: string) { return `${integration.endpoints.businesses}${id ? `/${encodeURIComponent(id)}` : ""}`; }

export async function getCategories(): Promise<Category[]> { return isBackendConfigured ? arrayPayload(await apiGet<unknown>(integration.endpoints.categories)).map(toCategory).filter((item) => item.id && item.label) : staticCategories; }
export async function getNearbyListings(params: { location?: string; category?: string; lat?: number; lng?: number }): Promise<Business[]> {
  if (isBackendConfigured) return arrayPayload(await apiGet<unknown>(`${businessPath()}${toQuery({ query: params.location, category: params.category, latitude: params.lat, longitude: params.lng, sort: params.lat !== undefined && params.lng !== undefined ? "distance" : undefined })}`)).map(toBusiness);
  let results = sampleBusinesses;
  if (params.category) results = results.filter((business) => businessMatchesCategory(business.category, params.category!));
  if (params.lat !== undefined && params.lng !== undefined) return results.filter((business) => business.latitude !== undefined && business.longitude !== undefined).map((business) => ({ ...business, distanceKm: distanceKm({ lat: params.lat!, lng: params.lng! }, { lat: business.latitude!, lng: business.longitude! }) })).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  return params.location ? results.filter((business) => business.location.toLowerCase().includes(params.location!.toLowerCase())) : results;
}
// Detail pages resolve by slug (/listings/ring-road-auto-garage), not by
// raw id. The slug is derived client-side for now (see lib/slugify.ts).
//
// !! DECISION NEEDED WHEN THE REAL BACKEND IS WIRED UP !!
// This assumes businessPath(slug) works against the real API too, which is
// unverified: confirm the backend either has a unique `slug` column + a
// slug-based lookup route, or agree on a different contract, before relying
// on this in production.
export async function getBusinessBySlug(slug: string): Promise<Business | undefined> { if (isBackendConfigured) return toBusiness(itemPayload(await apiGet<unknown>(businessPath(slug)))); const business = sampleBusinesses.find((item) => item.slug === slug); return business ? { ...business, hours: business.hours ?? "9:00 AM - 7:00 PM, Daily", email: business.email ?? "info@example.com", gallery: business.gallery ?? [business.image, ...heroImages].slice(0, 4) } : undefined; }
export async function getServiceCatalog(): Promise<ServiceCategory[]> { return isBackendConfigured ? arrayPayload(await apiGet<unknown>(integration.endpoints.serviceCategories)).map(toServiceCategory).filter((item) => item.label) : serviceCatalog; }
export async function createBooking(input: CreateBookingInput) { return apiPost<{ id: string }>(integration.endpoints.bookings, input); }
export async function createListing(input: CreateListingInput) { return apiPost<{ id: string }>(businessPath(), input); }
export async function createReview(businessId: string, input: CreateReviewInput): Promise<Review> { return toReview(itemPayload(await apiPost<unknown>(`${businessPath(businessId)}/reviews`, input))); }