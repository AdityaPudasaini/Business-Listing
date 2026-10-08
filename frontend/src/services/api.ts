import {
  categories as staticCategories,
  businessMatchesCategory,
} from "@/data/categories";
import { serviceCatalog } from "@/data/services";
import { sampleBusinesses } from "@/data/sampleBusinesses";
import { heroImages } from "@/data/heroImages";
import { publicImageUrl } from "@/lib/imageUrl";
import {
  backendSupports,
  integration,
  isBackendConfigured,
  isDemoMode,
  assertDemoMode,
} from "@/config/integration";
import { distanceKm } from "@/lib/distance";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";
import { slugify } from "@/lib/slugify";
import { resolveCategoryIcon } from "@/lib/categoryIcons";
import {
  AdminCategory,
  Business,
  BusinessProduct,
  BusinessProductInput,
  Category,
  ChatMessage,
  ChatSession,
  CreateBookingInput,
  CreateCategoryInput,
  CreateListingInput,
  CreateReviewInput,
  DayHours,
  HeroImage,
  PopupAd,
  ListingSearchParams,
  MyBooking,
  OwnerAccount,
  OwnerListing,
  Review,
  ServiceCategory,
  SubCategory,
  UpdateCategoryInput,
} from "@/types";
import { myListings as demoMyListings } from "@/data/myListings";
import { myAccount as demoMyAccount } from "@/data/myAccount";
import { demoBusinessCustomers } from "@/data/businessCustomers";
import type { BusinessCustomer, OwnerMessageEntry } from "@/types";
export { isBackendConfigured, isDemoMode, assertDemoMode };

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

function apiUrl(path: string) {
  if (!integration.apiBaseUrl) {
    throw new ApiError("The backend URL has not been configured.");
  }
  return `${integration.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function requestHeaders() {
  const headers: Record<string, string> = { Accept: "application/json" };

  // No more Authorization: Bearer — the browser sends the httpOnly session
  // cookie automatically on every request that has `credentials: "include"`.
  return headers;
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}.`;
    try {
      const body = (await res.json()) as {
        message?: string | string[];
        error?: string;
        detail?: string;
      };
      // Nest's ValidationPipe returns `message` as an array of field errors.
      const raw = Array.isArray(body.message)
        ? body.message.join(" ")
        : body.message;
      message = raw ?? body.error ?? body.detail ?? message;
    } catch {
      // retain status message
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// `credentials: "include"` on every call below tells the browser to send and
// accept the httpOnly session cookie. This requires the Nest app to answer
// with a specific origin (not "*") and `credentials: true` in enableCors —
// see backend's main.ts / social-auth changes for that half of this migration.

async function apiGet<T>(path: string): Promise<T> {
  return parseResponse<T>(
    await fetch(apiUrl(path), {
      headers: requestHeaders(),
      cache: "no-store",
      credentials: "include",
    })
  );
}

// How long (seconds) the Next.js server keeps a public API response before
// refetching it in the background (ISR). Short enough that edits and new
// listings show up within minutes, long enough that crawlers and visitors
// stop hitting the backend on every page view.
const PUBLIC_REVALIDATE_SECONDS = 300;

// For PUBLIC data only (listings, reviews, categories, hero images). Never use
// it for anything that depends on the logged-in user: on the server there is
// no session cookie, and a cached response would be shared between visitors.
//
// - On the server: cached for `revalidate` seconds via the Next.js data cache.
// - In the browser: the `next` option is ignored, so keep `no-store` and always
//   get fresh data (e.g. a review that was just posted).
export async function apiGetPublic<T>(
  path: string,
  revalidate: number = PUBLIC_REVALIDATE_SECONDS
): Promise<T> {
  const onServer = typeof window === "undefined";
  return parseResponse<T>(
    await fetch(apiUrl(path), {
      headers: requestHeaders(),
      credentials: "include",
      ...(onServer ? { next: { revalidate } } : { cache: "no-store" as const }),
    })
  );
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return parseResponse<T>(
    await fetch(apiUrl(path), {
      method: "POST",
      headers: { ...requestHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    })
  );
}

async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return parseResponse<T>(
    await fetch(apiUrl(path), {
      method: "PATCH",
      headers: { ...requestHeaders(), "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
    })
  );
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return parseResponse<T>(
    await fetch(apiUrl(path), {
      method: "PUT",
      credentials: "include",
      headers: { ...requestHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

async function apiDelete<T>(path: string): Promise<T> {
  return parseResponse<T>(
    await fetch(apiUrl(path), {
      method: "DELETE",
      headers: requestHeaders(),
      credentials: "include",
    })
  );
}

export async function apiUpload(file: File): Promise<string> {
  const body = new FormData();
  body.set("file", file);

  const result = itemPayload(
    await parseResponse<unknown>(
      await fetch(apiUrl(integration.endpoints.uploads), {
        method: "POST",
        headers: requestHeaders(),
        body,
        credentials: "include",
      })
    )
  );

  const url = text(
    object(result).url,
    object(result).imageUrl,
    object(result).image_url
  );
  if (!url) {
    throw new ApiError("The upload endpoint did not return a public image URL.");
  }
  return url;
}

type ApiRecord = Record<string, unknown>;

function object(value: unknown): ApiRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ApiRecord)
    : {};
}

function text(...values: unknown[]) {
  return (
    values
      .find((value) => typeof value === "string" || typeof value === "number")
      ?.toString() ?? ""
  );
}

function number(...values: unknown[]) {
  const value = Number(
    values.find((item) => item !== undefined && item !== null && item !== "")
  );
  return Number.isFinite(value) ? value : 0;
}

function optionalNumber(...values: unknown[]) {
  const raw = values.find(
    (item) => item !== undefined && item !== null && item !== ""
  );
  const value = Number(raw);
  return raw !== undefined && Number.isFinite(value) ? value : undefined;
}

// First value that parses as a real date, as an ISO string; undefined if none.
// (WordPress `*_gmt` fields have no timezone suffix but are UTC, hence the Z.)
function isoDate(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value !== "string" || !value) continue;
    const normalised = /^\d{4}-\d{2}-\d{2}T[\d:.]+$/.test(value)
      ? `${value}Z`
      : value;
    const time = Date.parse(normalised);
    if (Number.isFinite(time)) return new Date(time).toISOString();
  }
  return undefined;
}

function arrayPayload(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const body = object(value);
  for (const key of ["data", "results", "items", "businesses", "categories"]) {
    if (Array.isArray(body[key])) return body[key] as unknown[];
  }
  return [];
}

function itemPayload(value: unknown): unknown {
  const body = object(value);
  return body.data ?? body.result ?? body.business ?? value;
}

// --- WordPress REST shape helpers ---------------------------------------
// A `wp-json` response (e.g. a WordPress-backed restaurant directory) nests
// text under `{ rendered: "..." }` and only carries the featured image /
// taxonomy names when the request used `?_embed`. None of this overlaps with
// the Nest field names above, so these are additive, not replacements.

// Strips tags for use as plain-text description/fallback content. Deliberately
// simple — good enough for a card blurb, not a sanitizer for arbitrary HTML.
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function wpRendered(value: unknown): string {
  return text(object(value).rendered);
}

// `_embedded["wp:featuredmedia"][0].source_url` is only present when the
// listing request added `?_embed`. Falls through cleanly if absent.
function wpFeaturedImage(source: ApiRecord): string {
  const embedded = object(source._embedded);
  const media = embedded["wp:featuredmedia"];
  const first = Array.isArray(media) ? object(media[0]) : {};
  return text(first.source_url);
}

// `_embedded["wp:term"]` is an array of arrays (one per taxonomy attached to
// the post). Flattens them and returns the first term's name, since the UI
// only has room for one category per card today.
function wpTermName(source: ApiRecord): string {
  const embedded = object(source._embedded);
  const termGroups = embedded["wp:term"];
  if (!Array.isArray(termGroups)) return "";
  for (const group of termGroups) {
    if (Array.isArray(group) && group.length) {
      const name = text(object(group[0]).name);
      if (name) return name;
    }
  }
  return "";
}

// FRAGILE, INTENTIONALLY: some WordPress content types put structured facts
// (address, cuisine) as plain "Label: value" text inside the post body rather
// than as real fields. This regex-extracts a line by its label so the UI
// isn't blank in the meantime. It breaks the moment a post is written without
// that exact label, and it disappears the day the field is exposed properly
// (e.g. via ACF's "Show in REST API") — remove this once that happens.
function wpLabeledLineFromContent(html: string, label: string): string {
  const plain = stripHtml(html);
  const match = plain.match(
    new RegExp(`${label}:\\s*(.+?)(?=\\s+[A-Z][a-zA-Z]*:|$)`, "i")
  );
  return match ? match[1].trim() : "";
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .map((item) =>
          typeof item === "string"
            ? item
            : text(
                object(item).url,
                object(item).image,
                object(item).name,
                object(item).label
              )
        )
        .filter(Boolean)
    : [];
}

const DAY_ORDER = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

// Prisma stores `hours` as Json, shaped by CreateBusinessDto as
// { monday: { open: "09:00", close: "18:00" }, sunday: null }. The UI wants
// DayHours[]. A plain string from a future backend still passes through.
function toHoursByDay(value: unknown): DayHours[] | undefined {
  if (Array.isArray(value)) {
    const rows = value
      .map((entry) => ({
        day: text(object(entry).day),
        hours: text(object(entry).hours),
      }))
      .filter((row) => row.day);
    return rows.length ? rows : undefined;
  }

  const source = object(value);
  const keys = Object.keys(source);
  if (!keys.length) return undefined;

  const ordered = [...keys].sort((a, b) => {
    const left = DAY_ORDER.indexOf(a.toLowerCase());
    const right = DAY_ORDER.indexOf(b.toLowerCase());
    return (left === -1 ? 99 : left) - (right === -1 ? 99 : right);
  });

  return ordered.map((key) => {
    const slot = source[key];
    if (!slot) return { day: titleCase(key), hours: "Closed" };

    const open = text(object(slot).open);
    const close = text(object(slot).close);
    return {
      day: titleCase(key),
      hours: open && close ? `${open} – ${close}` : text(slot) || "Closed",
    };
  });
}

function summariseHours(rows?: DayHours[]) {
  if (!rows?.length) return "";
  const open = rows.filter((row) => row.hours !== "Closed");
  if (!open.length) return "Closed";

  const uniform = open.every((row) => row.hours === open[0].hours);
  return uniform && open.length === rows.length
    ? `${open[0].hours}, Daily`
    : "Hours vary by day";
}

// regroupServices — the backend stores Business.services as a flat string
// array (e.g. ["Brake Service", "Oil Change"]), since ServicesStep.tsx only
// saves which items were checked, not which category they came from. This
// looks each one up against serviceCatalog (the same catalog the wizard's
// checklist is built from) to reconstruct the grouped display shape.
function regroupServices(flatServices: string[]): ServiceCategory[] {
  const grouped = new Map<string, string[]>();
  const uncategorized: string[] = [];

  for (const item of flatServices) {
    const group = serviceCatalog.find((g) => g.items?.includes(item));
    if (group) {
      grouped.set(group.label, [...(grouped.get(group.label) ?? []), item]);
    } else {
      uncategorized.push(item);
    }
  }

  const result: ServiceCategory[] = Array.from(grouped, ([label, items]) => ({
    label,
    items,
  }));

  if (uncategorized.length) {
    result.push({ label: "Other Services", items: uncategorized });
  }

  return result;
}

function toBusiness(value: unknown): Business {
  const source = object(value);
  const contact = object(source.contact);
  const category = object(source.category);
  const location = object(source.location);
  const coordinates = object(source.coordinates);
  const counts = object(source._count);
  const rawServices = source.services ?? source.serviceCategories;
  const rawAmenities = source.amenities;

  const hoursByDay = toHoursByDay(source.hours ?? source.openingHours);
  const paymentMethods = strings(
    source.paymentMethods ?? source.payment_methods
  );

  return {
    id: text(source.id, source._id, source.businessId, source.business_id),
    slug:
      text(source.slug) ||
      slugify(
        text(source.name, source.title, source.businessName, source.business_name)
      ),
    name: text(
      source.name,
      source.title,
      source.businessName,
      source.business_name,
      wpRendered(source.title)
    ),
    image:
      publicImageUrl(
        text(
          source.image,
          source.imageUrl,
          source.image_url,
          source.coverImage,
          source.cover_image,
          source.logo,
          wpFeaturedImage(source)
        )
      ) || heroImages[0],
    bannerImage:
      publicImageUrl(text(source.coverImage, source.cover_image)) || undefined,
    category:
      text(
        source.categoryName,
        category.label,
        category.name,
        category.title,
        source.category,
        wpTermName(source)
      ) || "Uncategorized",
    location:
      text(
        source.location,
        source.locationName,
        source.address,
        location.address,
        location.name,
        source.city,
        source.area,
        // Last resort: scraped from the post body. See wpLabeledLineFromContent.
        wpLabeledLineFromContent(wpRendered(source.content), "Address")
      ) || "Location not provided",
    description:
      text(source.description, source.about) ||
      stripHtml(wpRendered(source.content)),
    rating: optionalNumber(
      source.rating,
      source.averageRating,
      source.average_rating
    ),
    // findAll/findOne include `_count.reviews`; the raw nearby query aliases it
    // as `reviewCount`. Without the `_count` fallback every card reads "0".
    reviewCount: number(
      source.reviewCount,
      source.review_count,
      source.totalReviews,
      counts.reviews
    ),
    phone: text(source.phone, contact.phone),
    whatsapp: text(source.whatsapp, contact.whatsapp),
    email: text(source.email, contact.email),
    website: text(source.website) || undefined,
    facebook: text(source.facebook) || undefined,
    instagram: text(source.instagram) || undefined,
    tiktok: text(source.tiktok) || undefined,
    linkedin: text(source.linkedin) || undefined,
    hours:
      text(
        typeof source.hours === "string" ? source.hours : undefined,
        source.openingHours,
        source.opening_hours
      ) || summariseHours(hoursByDay),
    hoursByDay,
    gallery: strings(source.gallery ?? source.images).map((g) =>
      publicImageUrl(g)
    ),
    paymentMethods: paymentMethods.length ? paymentMethods : undefined,
    isPartner: Boolean(source.isPartner ?? source.is_partner),
    services: Array.isArray(rawServices)
      ? rawServices.every((entry) => typeof entry === "string")
        ? regroupServices(rawServices as string[])
        : rawServices
            .map((entry) => ({
              label:
                typeof entry === "string"
                  ? entry
                  : text(
                      object(entry).label,
                      object(entry).name,
                      object(entry).title
                    ),
            }))
            .filter((entry) => entry.label)
      : undefined,
    amenities: Array.isArray(rawAmenities)
      ? rawAmenities
          .map((entry) => ({
            label:
              typeof entry === "string"
                ? entry
                : text(object(entry).label, object(entry).name),
            icon:
              typeof entry === "string"
                ? "Check"
                : text(object(entry).icon) || "Check",
          }))
          .filter((entry) => entry.label)
      : undefined,
    latitude: optionalNumber(
      source.latitude,
      source.lat,
      location.latitude,
      coordinates.lat
    ),
    longitude: optionalNumber(
      source.longitude,
      source.lng,
      location.longitude,
      coordinates.lng
    ),
    // Supplied by the nearby raw query only.
    distanceKm: optionalNumber(source.distanceKm, source.distance_km),
    createdAt: isoDate(source.createdAt, source.created_at, source.date_gmt),
    // WordPress REST calls it `modified_gmt`; our Nest API calls it updatedAt.
    updatedAt: isoDate(
      source.updatedAt,
      source.updated_at,
      source.modified_gmt,
      source.createdAt,
      source.created_at
    ),
  };
}

function toReview(value: unknown): Review {
  const item = object(value);
  return {
    id: text(item.id, item._id),
    businessId: text(item.businessId, item.business_id),
    userId: text(item.userId, item.user_id) || undefined,
    rating: number(item.rating),
    title: text(item.title, item.subject),
    message: text(item.message, item.comment, item.body),
    authorName: text(item.authorName, item.author_name, item.userName, item.name),
    createdAt: text(item.createdAt, item.created_at) || new Date().toISOString(),
  };
}

function toOwnerListing(value: unknown): OwnerListing {
  const item = object(value);
  const status = text(item.status);
  return {
    id: text(item.id),
    slug: text(item.slug),
    name: text(item.name),
    category: text(item.category),
    location: text(item.location),
    services: strings(item.services),
    phone: text(item.phone),
    description: text(item.description),
    whatsapp: text(item.whatsapp),
    email: text(item.email),
    website: text(item.website),
    facebook: text(item.facebook),
    instagram: text(item.instagram),
    tiktok: text(item.tiktok),
    linkedin: text(item.linkedin),
    latitude: optionalNumber(item.latitude),
    longitude: optionalNumber(item.longitude),
    openingHours: toHoursByDay(item.hours),
    amenities: strings(item.amenities),
    paymentMethods: strings(item.paymentMethods),
    parkingAvailable:
    typeof item.parkingAvailable === "boolean" ? item.parkingAvailable : null,
    image: publicImageUrl(text(item.image)) || undefined,
    coverImage: publicImageUrl(text(item.coverImage)) || undefined,
    gallery: strings(item.gallery).map((g) => publicImageUrl(g)),
    submittedAt: text(item.createdAt) || new Date().toISOString(),
    status:
      status === "approved" || status === "rejected" ? status : "pending",
  };
}

function toQuery(params: ListingSearchParams) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const output = query.toString();
  return output ? `?${output}` : "";
}

function businessPath(id?: string) {
  return `${integration.endpoints.businesses}${id ? `/${encodeURIComponent(id)}` : ""}`;
}

// GET /businesses/:id and GET /businesses/slug/:slug are different handlers.
// Hitting the first one with a slug returns 404 every time.
function businessBySlugPath(slug: string) {
  return `${integration.endpoints.businesses}/slug/${encodeURIComponent(slug)}`;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SessionUser {
  userId: string;
  role: string;
}

export interface AdminListing {
  id: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  isPartner: boolean;
}

// GET /auth/me returns whatever JwtStrategy.validate() produced — today that is
// only { userId, role }, not a profile. Roles live here and nowhere else in the
// login response, so the admin UI has to ask for them.
export async function getSession(): Promise<SessionUser | null> {
  if (!isBackendConfigured || !backendSupports.auth) {
    return null;
  }

  try {
    const payload = object(await apiGet<unknown>(integration.endpoints.me));
    const userId = text(payload.userId, payload.sub, payload.id);
    return userId ? { userId, role: text(payload.role) || "user" } : null;
  } catch {
    // No cookie, or an expired one — either way, no session.
    return null;
  }
}

export async function login(
  email: string,
  password: string
): Promise<AuthUser> {
  const payload = object(
    await apiPost<unknown>(integration.endpoints.login, { email, password })
  );

  // No token to read anymore — the response's Set-Cookie header is what
  // establishes the session; apiPost's credentials: "include" lets the
  // browser store it.
  const user = object(payload.user);
  const session = await getSession();

  return {
    id: text(user.id, session?.userId),
    name: text(user.name),
    email: text(user.email) || email,
    role: session?.role ?? "user",
  };
}

// POST /auth/register returns the new user but NO token, so a signup flow has
// to call login() straight after to get a session.
export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ id: string; name: string; email: string }> {
  const payload = object(
    await apiPost<unknown>(integration.endpoints.register, input)
  );
  return {
    id: text(payload.id),
    name: text(payload.name),
    email: text(payload.email),
  };
}

export async function logout(): Promise<void> {
  try {
    await apiPost("/auth/logout", {});
  } catch {
    // Best-effort — even if this call fails (e.g. already logged out,
    // network hiccup), the caller should still treat the user as signed out.
  }
}

/* ------------------------------------------------------------------ */
/* Listings — reads                                                    */
/* ------------------------------------------------------------------ */

export async function getCategories(): Promise<Category[]> {
  // `category` is a plain string column with no FK, so this can stay on
  // static data indefinitely for verticals that never need admin-managed
  // categories — but once /categories exists (see backend/src/modules/
  // categories), flipping backendSupports.categories to true switches every
  // reader (this function, CategoryFilter, the registration form) over with
  // no further changes.
  if (!isBackendConfigured || !backendSupports.categories) {
    return staticCategories;
  }
  const rows = arrayPayload(
    await apiGetPublic<unknown>(integration.endpoints.categories)
  ).map(toAdminCategory);
  return nestCategories(rows);
}

// The backend returns a flat, ordered list (see CategoriesService.findAll).
// This is the one place that turns it into the nested Category/SubCategory
// shape every component actually consumes.
function nestCategories(rows: AdminCategory[]): Category[] {
  const sorted = [...rows].sort((a, b) => a.order - b.order);
  const topLevel = sorted.filter((row) => !row.parentId);

  return topLevel
    .map((row) => ({
      id: row.id,
      label: row.label,
      subCategories: sorted
        .filter((child) => child.parentId === row.id)
        .map(
          (child): SubCategory => ({
            id: child.id,
            label: child.label,
            icon: resolveCategoryIcon(child.icon),
          })
        ),
    }))
    .filter((item) => item.id && item.label);
}

/* ------------------------------------------------------------------ */
/* Categories — admin management                                       */
/* ------------------------------------------------------------------ */

function toAdminCategory(value: unknown): AdminCategory {
  const item = object(value);
  return {
    id: text(item.id, item._id, item.slug),
    label: text(item.label, item.name, item.title),
    icon: item.icon ? text(item.icon) : undefined,
    order: number(item.order),
    parentId: item.parentId ? text(item.parentId) : null,
  };
}

// Flat list, admin-only reads nothing different from the public GET — the
// distinction is that the admin screen wants the raw flat rows (to edit
// individual ones) rather than the nested Category/SubCategory shape.
export async function getAdminCategories(): Promise<AdminCategory[]> {
  return arrayPayload(
    await apiGet<unknown>(integration.endpoints.categories)
  )
    .map(toAdminCategory)
    .sort((a, b) => a.order - b.order);
}

// POST/PATCH/DELETE below are admin-only, enforced server-side.
export async function createCategory(
  input: CreateCategoryInput
): Promise<AdminCategory> {
  return toAdminCategory(
    itemPayload(
      await apiPost<unknown>(integration.endpoints.categories, {
        label: input.label,
        icon: input.icon,
        order: input.order,
        parentId: input.parentId,
      })
    )
  );
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<AdminCategory> {
  return toAdminCategory(
    itemPayload(
      await apiPatch<unknown>(
        `${integration.endpoints.categories}/${encodeURIComponent(id)}`,
        input
      )
    )
  );
}

export async function deleteCategory(id: string) {
  return apiDelete<unknown>(
    `${integration.endpoints.categories}/${encodeURIComponent(id)}`
  );
}

// The backend compares `category` with an exact string match, so a parent id
// ("auto") returns nothing when listings are filed under its children
// ("auto-garage"). Send leaf ids only; parents get narrowed client-side.
function isLeafCategory(id: string) {
  const parent = staticCategories.find((item) => item.id === id);
  return !parent || !parent.subCategories?.length;
}

interface NearbyParams {
  location?: string;
  category?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

// Cache keyed by address string, kept for the life of the page/session so the
// same address (repeat listings, re-renders, re-searches) isn't geocoded twice.
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

// Last resort for a listing that has an address but no coordinates of its own
// (e.g. a WordPress source that never exposed lat/lng).
//
// Google refuses referrer-restricted keys on the REST Geocoding endpoint
// ("API keys with referer restrictions cannot be used with this API"), so the
// browser-visible NEXT_PUBLIC_GOOGLE_MAPS_API_KEY can't be used for it once it
// is locked down. Two paths instead:
//  - Browser: the Maps JavaScript API Geocoder, which honours the referrer
//    restriction on the public key.
//  - Server (SSR): the REST endpoint, but only if a separate server-side key is
//    set (GOOGLE_MAPS_SERVER_API_KEY — IP-restricted, never sent to the
//    browser). Without it we skip, and the browser geocodes the listing later.
type LatLng = { lat: number; lng: number };

// For both helpers: an object or null is a real answer (null = "no such
// address") and is cached; undefined means "couldn't ask / transient failure",
// which is not cached so a later attempt can succeed.
async function geocodeInBrowser(
  address: string
): Promise<LatLng | null | undefined> {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return undefined;

  try {
    await loadGoogleMaps();
    const geocoder = new window.google!.maps.Geocoder();
    const { results } = await geocoder.geocode({ address });
    const location = results?.[0]?.geometry?.location;
    return location ? { lat: location.lat(), lng: location.lng() } : null;
  } catch (error) {
    // ZERO_RESULTS is a genuine answer; anything else (bad key, quota, network)
    // is not worth caching.
    return (error as { code?: string })?.code === "ZERO_RESULTS"
      ? null
      : undefined;
  }
}

async function geocodeOnServer(
  address: string
): Promise<LatLng | null | undefined> {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!key) return undefined;

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${key}`
    );
    const data = await res.json();
    if (data?.status !== "OK" && data?.status !== "ZERO_RESULTS") {
      return undefined; // REQUEST_DENIED, OVER_QUERY_LIMIT, ...
    }
    const location = data?.results?.[0]?.geometry?.location;
    return location &&
      Number.isFinite(location.lat) &&
      Number.isFinite(location.lng)
      ? { lat: location.lat, lng: location.lng }
      : null;
  } catch {
    return undefined;
  }
}

async function geocodeAddress(address: string): Promise<LatLng | null> {
  if (!address) return null;
  if (geocodeCache.has(address)) return geocodeCache.get(address)!;

  const result =
    typeof window === "undefined"
      ? await geocodeOnServer(address)
      : await geocodeInBrowser(address);
  if (result === undefined) return null;

  geocodeCache.set(address, result);
  return result;
}

export async function getNearbyListings(
  params: NearbyParams
): Promise<Business[]> {
  if (!isBackendConfigured || !backendSupports.listings) {
    assertDemoMode();
    return getDemoNearbyListings(params);
  }

  const query = new URLSearchParams();
  if (params.category && isLeafCategory(params.category)) {
    query.set("category", params.category);
  }

  const hasPoint = params.lat !== undefined && params.lng !== undefined;
  if (hasPoint) {
    // findAll() only takes the distance branch when all three are present.
    query.set("lat", String(params.lat));
    query.set("lng", String(params.lng));
    query.set(
      "radiusKm",
      String(params.radiusKm ?? integration.nearbyRadiusKm)
    );
  }

  const search = query.toString();
  const payload = await apiGetPublic<unknown>(
    `${integration.endpoints.businesses}${search ? `?${search}` : ""}`
  );

  let results = arrayPayload(payload)
    .map(toBusiness)
    .filter((business) => business.id && business.name);

  // Parent categories, and a belt-and-braces check on the leaf ones.
  if (params.category) {
    results = results.filter((business) =>
      businessMatchesCategory(business.category, params.category!)
    );
  }

  // `location` is free text typed into the Hero search box, but the backend
  // does `location: { equals }` — an exact match that almost never hits. Filter
  // it here instead, and only when we have no coordinates to sort by.
  if (params.location && !hasPoint) {
    const needle = params.location.toLowerCase();
    results = results.filter((business) =>
      business.location.toLowerCase().includes(needle)
    );
  }

  if (hasPoint) {
    // Anything still missing coordinates after toBusiness() (no lat/lng field
    // on the source, no rescue from geocoding on a prior pass) but with an
    // address string gets one geocoding attempt here — see geocodeAddress.
    // Businesses genuinely without any location text are left alone.
    results = await Promise.all(
      results.map(async (business) => {
        if (
          business.latitude !== undefined &&
          business.longitude !== undefined
        ) {
          return business;
        }
        if (!business.location || business.location === "Location not provided") {
          return business;
        }
        const geocoded = await geocodeAddress(business.location);
        return geocoded
          ? { ...business, latitude: geocoded.lat, longitude: geocoded.lng }
          : business;
      })
    );

    results = results
      .map((business) =>
        business.distanceKm !== undefined ||
        business.latitude === undefined ||
        business.longitude === undefined
          ? business
          : {
              ...business,
              distanceKm: distanceKm(
                { lat: params.lat!, lng: params.lng! },
                { lat: business.latitude, lng: business.longitude }
              ),
            }
      )
      // Unknown distance sorts to the end, not the top — previously `?? 0`
      // made an unlocated listing rank as if it were right next to the user.
      .sort(
        (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
      );
  }

  return results;
}

async function getDemoNearbyListings(params: NearbyParams): Promise<Business[]> {
  let results = sampleBusinesses;

  if (params.category) {
    results = results.filter((b) =>
      businessMatchesCategory(b.category, params.category!)
    );
  }

  if (params.lat !== undefined && params.lng !== undefined) {
    results = results
      .filter((b) => b.latitude !== undefined && b.longitude !== undefined)
      .map((b) => ({
        ...b,
        distanceKm: distanceKm(
          { lat: params.lat!, lng: params.lng! },
          { lat: b.latitude!, lng: b.longitude! }
        ),
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  } else if (params.location) {
    results = results.filter((b) =>
      b.location.toLowerCase().includes(params.location!.toLowerCase())
    );
  }

  return results;
}

// How many reviews the listing page fetches on the server so they are in the
// initial HTML (and therefore visible to Google). The browser loads the rest.
const SERVER_REVIEW_COUNT = 5;

export async function getBusinessBySlug(
  slug: string
): Promise<Business | undefined> {
  if (isBackendConfigured && backendSupports.listings) {
    try {
      const business = toBusiness(
        itemPayload(await apiGetPublic<unknown>(businessBySlugPath(slug)))
      );
      // Reviews are optional extras: if this call fails the page still
      // renders, just without them in the server HTML.
      const reviews = await getReviews(business.id, SERVER_REVIEW_COUNT).catch(
        () => []
      );
      return reviews.length ? { ...business, reviews } : business;
    } catch (error) {
      // findBySlug throws NotFoundException both for a missing listing and for
      // one that is not approved yet. Returning undefined lets the page call
      // notFound() instead of crashing with an unhandled error.
      if (error instanceof ApiError && error.status === 404) return undefined;
      throw error;
    }
  }

  assertDemoMode();
  const business = sampleBusinesses.find((item) => item.slug === slug);
  return business
    ? {
        ...business,
        hours: business.hours ?? "9:00 AM - 7:00 PM, Daily",
        email: business.email ?? "info@example.com",
        gallery: business.gallery ?? [business.image, ...heroImages].slice(0, 4),
      }
    : undefined;
}

export async function getReviews(
  businessId: string,
  limit?: number
): Promise<Review[]> {
  if (!isBackendConfigured || !backendSupports.reviews) return [];

  const query = limit ? `?limit=${limit}` : "";
  return arrayPayload(
    await apiGetPublic<unknown>(`${businessPath(businessId)}/reviews${query}`)
  ).map(toReview);
}
export async function deleteReview(reviewId: string): Promise<void> {
  await apiDelete<void>(`/reviews/${encodeURIComponent(reviewId)}`);
}

function toBusinessProduct(value: unknown, businessId: string): BusinessProduct {
  const item = object(value);
  return {
    id: text(item.id),
    businessId: text(item.businessId) || businessId,
    name: text(item.name),
    description: text(item.description) || undefined,
    price: optionalNumber(item.price),
    image: publicImageUrl(text(item.image)) || undefined,
    category: text(item.category) || undefined,
    isAvailable: item.isAvailable !== false,
  };
}

// GET /businesses/:businessId/products — public, no auth needed.
export async function getBusinessProducts(
  businessId: string
): Promise<BusinessProduct[]> {
  if (!isBackendConfigured) return [];

  return arrayPayload(
    await apiGetPublic<unknown>(`${businessPath(businessId)}/products`)
  ).map((item) => toBusinessProduct(item, businessId));
}

// POST/PATCH/DELETE below all require the caller to own the business —
// enforced server-side in products.service.ts.
export async function createBusinessProduct(
  businessId: string,
  input: BusinessProductInput
): Promise<BusinessProduct> {
  return toBusinessProduct(
    itemPayload(
      await apiPost<unknown>(`${businessPath(businessId)}/products`, input)
    ),
    businessId
  );
}

export async function updateBusinessProduct(
  businessId: string,
  id: string,
  input: BusinessProductInput
): Promise<BusinessProduct> {
  return toBusinessProduct(
    itemPayload(
      await apiPatch<unknown>(
        `${businessPath(businessId)}/products/${encodeURIComponent(id)}`,
        input
      )
    ),
    businessId
  );
}

export async function deleteBusinessProduct(businessId: string, id: string) {
  return apiDelete<unknown>(
    `${businessPath(businessId)}/products/${encodeURIComponent(id)}`
  );
}

/* ------------------------------------------------------------------ */
/* Customers                                                          */
/* ------------------------------------------------------------------ */

function toBusinessCustomer(value: unknown): BusinessCustomer {
  const item = object(value);
  const review = object(item.review);
  return {
    id: text(item.id),
    name: text(item.name),
    email: item.email ? text(item.email) : undefined,
    phone: item.phone ? text(item.phone) : undefined,
    businessId: text(item.businessId),
    businessName: text(item.businessName),
    bookings: arrayPayload(item.bookings).map((b) => {
      const booking = object(b);
      return {
        id: text(booking.id),
        date: text(booking.date),
        time: text(booking.time),
        service: booking.service ? text(booking.service) : undefined,
        status: text(booking.status) || "pending",
      };
    }),
    review: item.review
      ? {
          id: text(review.id),
          rating: number(review.rating),
          title: review.title ? text(review.title) : undefined,
          message: text(review.message),
          createdAt: text(review.createdAt),
        }
      : undefined,
    messages: arrayPayload(item.messages).map(toOwnerMessage),
  };
}

// GET /businesses/:id/customers (one business) or GET /businesses/mine/customers
// (every business the current owner has). Owner (of the business) or admin.
export async function getBusinessCustomers(
  businessId?: string
): Promise<BusinessCustomer[]> {
  if (!isBackendConfigured || !backendSupports.customers) {
    assertDemoMode();
    return businessId
      ? demoBusinessCustomers.filter((c) => c.businessId === businessId)
      : demoBusinessCustomers;
  }
  const path = businessId
    ? `${businessPath(businessId)}/customers`
    : `${integration.endpoints.businesses}/mine/customers`;
  return arrayPayload(await apiGet<unknown>(path)).map(toBusinessCustomer);
}

function toOwnerMessage(value: unknown): OwnerMessageEntry {
  const item = object(value);
  return {
    id: text(item.id),
    sender: item.sender === "customer" ? "customer" : "owner",
    content: text(item.content),
    createdAt: text(item.createdAt),
    read: item.read !== false,
  };
}

// POST /businesses/:id/customers/:customerId/messages — personal message to one
// customer. The backend emails it (reply-to = the business) and saves it.
// `emailSent` is false when it was saved but the email could not be delivered.
export async function sendCustomerMessage(
  businessId: string,
  customerId: string,
  content: string
): Promise<{ message: OwnerMessageEntry; emailSent: boolean }> {
  // Customer ids from getBusinessCustomers are "<businessId>:<userId>".
  const userId = customerId.split(":").pop() ?? customerId;

  if (!isBackendConfigured || !backendSupports.customers) {
    assertDemoMode();
    return {
      message: {
        id: `msg-local-${Date.now()}`,
        sender: "owner",
        content,
        createdAt: new Date().toISOString(),
        read: true,
      },
      emailSent: true,
    };
  }

  const result = object(
    await apiPost<unknown>(
      `${businessPath(businessId)}/customers/${encodeURIComponent(userId)}/messages`,
      { content }
    )
  );
  return {
    message: toOwnerMessage(result),
    emailSent: result.emailSent !== false,
  };
}

/* ------------------------------------------------------------------ */
/* Announcements                                                      */
/* ------------------------------------------------------------------ */

export interface SendAnnouncementResult {
  sent: number;
  failed: number;
  total: number;
  failedEmails: string[];
}

// POST /businesses/:id/announcements — bulk email to this business's
// customers. Owner (of this business) or admin.
export async function sendAnnouncement(
  businessId: string,
  input: { subject: string; message: string; customerIds?: string[] }
): Promise<SendAnnouncementResult> {
  const result = object(
    await apiPost<unknown>(`${businessPath(businessId)}/announcements`, input)
  );
  return {
    sent: number(result.sent),
    failed: number(result.failed),
    total: number(result.total),
    failedEmails: arrayPayload(result.failedEmails).map((v) => text(v)),
  };
}

/* ------------------------------------------------------------------ */
/* Broadcasts (admin -> every user)                                   */
/* ------------------------------------------------------------------ */

export interface SendBroadcastResult {
  sent: number;
  failed: number;
  total: number;
  failedEmails: string[];
}

// POST /admin/broadcasts — site-wide email to every user. Admin-only.
export async function sendBroadcast(input: {
  subject: string;
  message: string;
}): Promise<SendBroadcastResult> {
  const result = object(await apiPost<unknown>("admin/broadcasts", input));
  return {
    sent: number(result.sent),
    failed: number(result.failed),
    total: number(result.total),
    failedEmails: arrayPayload(result.failedEmails).map((v) => text(v)),
  };
}

/* ------------------------------------------------------------------ */
/* Chats (chat widget)                                                 */
/* ------------------------------------------------------------------ */

function toChatMessage(value: unknown): ChatMessage {
  const item = object(value);
  return {
    id: text(item.id),
    from:
      item.from === "user" ||
      item.from === "owner" ||
      item.from === "admin"
        ? item.from
        : "bot",
    text: text(item.text),
    createdAt: text(item.createdAt),
  };
}

function toChatSession(value: unknown): ChatSession {
  const item = object(value);
  const business = object(item.business);
  const userValue = item.user ? object(item.user) : null;
  return {
    id: text(item.id),
    visitorName:
      typeof item.visitorName === "string" ? item.visitorName : undefined,
    takenOver: item.takenOver === true,
    endedAt: typeof item.endedAt === "string" ? item.endedAt : null,
    createdAt: text(item.createdAt),
    updatedAt: text(item.updatedAt),
    business: {
      id: text(business.id),
      name: text(business.name),
      slug: text(business.slug),
    },
    user: userValue
      ? { id: text(userValue.id), name: text(userValue.name), email: text(userValue.email) }
      : null,
    messages: Array.isArray(item.messages) ? item.messages.map(toChatMessage) : [],
  };
}

// POST /chats — start a new chat session on a listing. Guest or logged-in.
//
// Deliberately does NOT go through the generic itemPayload() unwrapper.
// itemPayload() falls back to `body.business` for endpoints that wrap their
// response as `{ business: {...} }` — but a ChatSession response also has
// its own nested `business` field (the listing it belongs to), which used to
// trick itemPayload into returning that nested business object instead of
// the session. The session's real id got replaced by the business's id,
// so every follow-up sendChatMessage() call was silently hitting a
// nonexistent session (404, swallowed by the widget's catch block) and
// nothing past the initial greeting ever got persisted.
export async function startChat(
  businessId: string,
  visitorName?: string
): Promise<ChatSession & { greeting: string }> {
  const result = (await apiPost<unknown>(integration.endpoints.chats, {
    businessId,
    visitorName,
  })) as Record<string, unknown>;
  return { ...toChatSession(result), greeting: text(result.greeting) };
}

// POST /chats/:id/messages — visitor sends a message. `reply` is the bot's
// answer, or null when a human has taken over the chat (the bot stays quiet
// and the owner/admin answers from the dashboard instead).
export async function sendChatMessage(
  sessionId: string,
  message: string
): Promise<{ takenOver: boolean; reply: ChatMessage | null }> {
  const result = object(
    await apiPost<unknown>(
      `${integration.endpoints.chats}/${encodeURIComponent(sessionId)}/messages`,
      { text: message }
    )
  );
  return {
    takenOver: result.takenOver === true,
    reply: result.reply ? toChatMessage(result.reply) : null,
  };
}

// POST /chats/general — site-wide AI assistant, used when no listing is open.
// Stateless on the server (nothing is saved). `reply` is null when AI is
// switched off or the provider failed, so the caller should fall back to its
// local canned answer.
export async function sendGeneralChatMessage(
  message: string,
  history: { from: string; text: string }[] = [],
  latitude?: number,
  longitude?: number
): Promise<string | null> {
  const result = object(
    await apiPost<unknown>(`${integration.endpoints.chats}/general`, {
      message,
      history,
      latitude,
      longitude,
    })
  );
  return typeof result.reply === "string" && result.reply.trim()
    ? result.reply
    : null;
}

// POST /chats/:id/end — the visitor ends their chat from the widget.
export async function endChat(sessionId: string): Promise<void> {
  await apiPost<unknown>(
    `${integration.endpoints.chats}/${encodeURIComponent(sessionId)}/end`,
    {}
  );
}

// POST /chats/:id/close — the listing's owner, or an admin, ends a chat.
// Returns the closing message added to the thread (null if already ended).
export async function closeChat(sessionId: string): Promise<ChatMessage | null> {
  const result = object(
    await apiPost<unknown>(
      `${integration.endpoints.chats}/${encodeURIComponent(sessionId)}/close`,
      {}
    )
  );
  return result.message ? toChatMessage(result.message) : null;
}

// GET /chats/:id/messages — visitor-side polling for owner/admin replies.
export async function getChatMessages(
  sessionId: string
): Promise<{ takenOver: boolean; ended: boolean; messages: ChatMessage[] }> {
  const result = object(
    await apiGet<unknown>(
      `${integration.endpoints.chats}/${encodeURIComponent(sessionId)}/messages`
    )
  );
  return {
    takenOver: result.takenOver === true,
    ended: typeof result.endedAt === "string",
    messages: Array.isArray(result.messages)
      ? result.messages.map(toChatMessage)
      : [],
  };
}

// POST /chats/:id/reply — the listing's owner, or an admin, replies to a
// visitor. The backend decides the sender label ("owner" / "admin").
export async function replyToChat(
  sessionId: string,
  message: string
): Promise<ChatMessage> {
  return toChatMessage(
    await apiPost<unknown>(
      `${integration.endpoints.chats}/${encodeURIComponent(sessionId)}/reply`,
      { text: message }
    )
  );
}

// GET /chats/admin/all — every chat on every listing (admin only).
export async function getAdminChats(): Promise<ChatSession[]> {
  if (!isBackendConfigured || !backendSupports.chats) return [];
  try {
    return arrayPayload(
      await apiGet<unknown>(`${integration.endpoints.chats}/admin/all`)
    ).map(toChatSession);
  } catch {
    // Not logged in / not authorized — same empty result as before.
    return [];
  }
}

// GET /chats/received — every chat session across the listings this user owns.
export async function getReceivedChats(): Promise<ChatSession[]> {
  if (!isBackendConfigured || !backendSupports.chats) return [];
  try {
    return arrayPayload(
      await apiGet<unknown>(`${integration.endpoints.chats}/received`)
    ).map(toChatSession);
  } catch {
    return [];
  }
}

function toMyBooking(value: unknown): MyBooking {
  const item = object(value);
  const business = object(item.business);
  const status = text(item.status).toLowerCase();
  return {
    id: text(item.id),
    date: text(item.date),
    time: text(item.time),
    service: text(item.service) || undefined,
    details:
      item.details && typeof item.details === "object"
        ? (item.details as Record<string, string | number | boolean>)
        : undefined,
    contactName: text(item.contactName) || undefined,
    contactPhone: text(item.contactPhone) || undefined,
    contactEmail: text(item.contactEmail) || undefined,
    status: status || "pending",
    business: {
      id: text(business.id),
      name: text(business.name),
      slug: text(business.slug),
    },
  };
}

// GET /bookings/received — bookings other people made on businesses this
// user owns. Same row shape as GET /bookings.
export async function getReceivedBookings(): Promise<MyBooking[]> {
  if (!isBackendConfigured || !backendSupports.bookings) return [];
  try {
    return arrayPayload(
      await apiGet<unknown>(`${integration.endpoints.bookings}/received`)
    ).map(toMyBooking);
  } catch {
    return [];
  }
}

// PATCH /bookings/:id/status — owner confirms or declines a request.
export async function updateBookingStatus(
  id: string,
  status: "confirmed" | "declined"
): Promise<MyBooking> {
  return toMyBooking(
    itemPayload(
      await apiPatch<unknown>(
        `${integration.endpoints.bookings}/${encodeURIComponent(id)}/status`,
        { status }
      )
    )
  );
}

function toHeroImage(value: unknown): HeroImage {
  const item = object(value);
  return {
    id: text(item.id),
    url: publicImageUrl(text(item.url)),
    order: typeof item.order === "number" ? item.order : 0,
  };
}

// GET /hero-images — public, no auth needed. Falls back to an empty array on
// any failure so the homepage's own static fallback list takes over instead
// of a broken hero section.
export async function getHeroImages(): Promise<HeroImage[]> {
  if (!isBackendConfigured || !backendSupports.heroImages) return [];
  try {
    return arrayPayload(
      await apiGetPublic<unknown>(integration.endpoints.heroImages)
    ).map(toHeroImage);
  } catch {
    return [];
  }
}
export async function getAdminHeroImages(): Promise<HeroImage[]> {
  return arrayPayload(
    await apiGet<unknown>(integration.endpoints.heroImages)
  ).map(toHeroImage);
}

// POST/DELETE below are admin-only, enforced server-side.
export async function addHeroImage(url: string): Promise<HeroImage> {
  return toHeroImage(
    itemPayload(
      await apiPost<unknown>(integration.endpoints.heroImages, { url })
    )
  );
}

export async function deleteHeroImage(id: string) {
  return apiDelete<unknown>(
    `${integration.endpoints.heroImages}/${encodeURIComponent(id)}`
  );
}

/* ------------------------------------------------------------------ */
/* Entry popup ad                                                      */
/* ------------------------------------------------------------------ */

function toPopupAd(value: unknown): PopupAd | null {
  const item = object(value);
  const image = publicImageUrl(text(item.image));
  if (!image) return null;
  return {
    id: text(item.id),
    image,
    href: text(item.href),
    alt: text(item.alt) || "Advertisement",
    active: item.active !== false,
  };
}

// GET /popup-ad — public. Returns null when no custom ad is configured (or
// the request fails), so the popup falls back to the built-in default.
export async function getPopupAd(): Promise<PopupAd | null> {
  if (!isBackendConfigured || !backendSupports.popupAd) return null;
  try {
    const result = object(
      await apiGetPublic<unknown>(integration.endpoints.popupAd)
    );
    return toPopupAd(result.ad);
  } catch {
    return null;
  }
}

// PUT /popup-ad — admin only. Send only the fields that changed.
export async function savePopupAd(input: {
  image?: string;
  href?: string;
  alt?: string;
  active?: boolean;
}): Promise<PopupAd | null> {
  const result = object(
    await apiPut<unknown>(integration.endpoints.popupAd, input)
  );
  return toPopupAd(result.ad);
}

// DELETE /popup-ad — admin only. Goes back to the built-in default popup.
export async function deletePopupAd() {
  return apiDelete<unknown>(integration.endpoints.popupAd);
}

function toAdminListing(value: unknown): AdminListing {
  const item = object(value);
  const owner = object(item.owner);
  const status = text(item.status);
  return {
    id: text(item.id),
    slug: text(item.slug),
    name: text(item.name),
    category: text(item.category),
    location: text(item.location),
    status: status === "approved" || status === "rejected" ? status : "pending",
    createdAt: text(item.createdAt) || new Date().toISOString(),
    ownerName: text(owner.name),
    ownerEmail: text(owner.email),
    isPartner: Boolean(item.isPartner ?? item.is_partner),
  };
}

export async function getAdminListings(): Promise<AdminListing[]> {
  return arrayPayload(
    await apiGet<unknown>(`${integration.endpoints.businesses}/admin/all`)
  ).map(toAdminListing);
}

// Full record for one listing, regardless of status — GET /businesses/:id
// 404s on anything that isn't approved yet, so review needs its own route.
export async function getAdminListingDetail(id: string): Promise<OwnerListing> {
  return toOwnerListing(
    itemPayload(
      await apiGet<unknown>(`${businessPath()}/admin/${encodeURIComponent(id)}`)
    )
  );
}

// Lets an admin correct fields before approving — PATCH /businesses/:id is
// owner-only, so this hits the admin-guarded route instead.
export async function adminUpdateListing(id: string, input: CreateListingInput) {
  return apiPatch<{ id: string }>(
    `${businessPath()}/admin/${encodeURIComponent(id)}`,
    listingPayload(input)
  );
}

// Toggles the "Trusted Partners" flag on the homepage — separate from
// adminUpdateListing so flipping it doesn't require sending the whole form.
export async function setListingPartnerStatus(id: string, isPartner: boolean) {
  return apiPatch<{ id: string }>(`${businessPath()}/admin/${encodeURIComponent(id)}`, {
    isPartner,
  });
}

// Permanently removes the listing plus its reviews, bookings and products.
export async function deleteListing(id: string) {
  return apiDelete<unknown>(`${businessPath()}/admin/${encodeURIComponent(id)}`);
}

export async function approveListing(id: string) {
  return apiPatch<unknown>(`${businessPath(id)}/approve`);
}

export async function rejectListing(id: string) {
  return apiPatch<unknown>(`${businessPath(id)}/reject`);
}



/* ------------------------------------------------------------------ */
/* Writes — unchanged for now, see integration notes before wiring     */
/* ------------------------------------------------------------------ */

function toBackendTime(timeWindow: string) {
  const match = timeWindow.match(/\((\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!match) {
    throw new ApiError("Please select a valid booking time.");
  }

  const [, rawHour, rawMinutes = "00", meridiem] = match;
  let hour = Number(rawHour);

  if (meridiem.toLowerCase() === "pm" && hour !== 12) hour += 12;
  if (meridiem.toLowerCase() === "am" && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${rawMinutes}`;
}

function toBackendHours(openingHours: DayHours[]) {
  return Object.fromEntries(
    openingHours.map(({ day, hours }) => {
      if (!hours || hours.toLowerCase() === "closed") {
        return [day.toLowerCase(), null];
      }

      const [open, close] = hours.split(/\s*(?:-|–)\s*/);
      return [day.toLowerCase(), open && close ? { open, close } : null];
    })
  );
}

export async function createBooking(input: CreateBookingInput) {
  return apiPost<{ id: string }>(integration.endpoints.bookings, {
    businessId: input.businessId,
    date: input.date,
    time: toBackendTime(input.timeWindow),
    service: input.service,
    details: input.details,
    contactName: `${input.firstName} ${input.lastName}`.trim(),
    contactPhone: input.phone,
    contactEmail: input.email,
  });
}

export async function createListing(input: CreateListingInput) {
  return apiPost<{ id: string }>(businessPath(), listingPayload(input));
}

function listingPayload(input: CreateListingInput) {
  return {
    name: input.name,
    description: input.description,
    category: input.category,
    location: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    phone: input.phone,
    whatsapp: input.whatsapp,
    email: input.email,
    website: input.website,
    facebook: input.facebook,
    instagram: input.instagram,
    tiktok: input.tiktok,
    linkedin: input.linkedin,
    services: input.services,
    ...(input.openingHours.length ? { hours: toBackendHours(input.openingHours) } : {}),
    amenities: input.amenities,
    parkingAvailable: input.parkingAvailable,
    paymentMethods: input.paymentMethods,
    image: input.image,
    coverImage: input.coverImage,
    gallery: input.gallery,
  };
}

export async function updateListing(id: string, input: CreateListingInput) {
  return apiPatch<{ id: string }>(businessPath(id), listingPayload(input));
}

export async function createReview(
  businessId: string,
  input: CreateReviewInput
): Promise<Review> {
  return toReview(
    itemPayload(
      await apiPost<unknown>(`${businessPath(businessId)}/reviews`, {
        rating: input.rating,
        title: input.title,
        comment: input.message,
      })
    )
  );
}

export async function getMyListings(): Promise<OwnerListing[]> {
  if (!isBackendConfigured || !backendSupports.myListings) {
    assertDemoMode();
    return demoMyListings;
  }
  return arrayPayload(
    await apiGet<unknown>(integration.endpoints.myListings)
  ).map(toOwnerListing);
}

function toOwnerAccount(value: unknown): OwnerAccount {
  const item = object(value);
  return {
    ownerName: text(item.ownerName, item.name),
    username: text(item.username, item.email),
    email: text(item.email),
    phone: text(item.phone),
  };
}

export async function getMyAccount(): Promise<OwnerAccount> {
  if (!isBackendConfigured || !backendSupports.myAccount) {
    assertDemoMode();
    return demoMyAccount;
  }
  return toOwnerAccount(
    itemPayload(await apiGet<unknown>(integration.endpoints.myAccount))
  );
}

// PATCH /me/account only accepts name/phone — email is the login identity
// and isn't editable here, matching UpdateAccountDto on the backend.
export async function updateMyAccount(input: {
  ownerName?: string;
  phone?: string;
}): Promise<OwnerAccount> {
  return toOwnerAccount(
    itemPayload(
      await apiPatch<unknown>(integration.endpoints.myAccount, {
        name: input.ownerName,
        phone: input.phone,
      })
    )
  );
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  phone: string;
  isBanned: boolean;
  createdAt: string;
  businessCount: number;
}

function toAdminUser(value: unknown): AdminUser {
  const item = object(value);
  return {
    id: text(item.id),
    name: text(item.name),
    email: text(item.email),
    role: text(item.role) === "admin" ? "admin" : "user",
    phone: text(item.phone),
    isBanned: Boolean(item.isBanned),
    createdAt: text(item.createdAt) || new Date().toISOString(),
    businessCount: number(item.businessCount),
  };
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return arrayPayload(
    await apiGet<unknown>(integration.endpoints.users)
  ).map(toAdminUser);
}

export async function updateUserRole(
  id: string,
  role: "user" | "admin"
): Promise<AdminUser> {
  return toAdminUser(
    await apiPatch<unknown>(
      `${integration.endpoints.users}/${encodeURIComponent(id)}/role`,
      { role }
    )
  );
}

export async function updateUserBanStatus(
  id: string,
  isBanned: boolean
): Promise<AdminUser> {
  return toAdminUser(
    await apiPatch<unknown>(
      `${integration.endpoints.users}/${encodeURIComponent(id)}/ban`,
      { isBanned }
    )
  );
}
/* ------------------------------------------------------------------ */
/* Password reset, contact form, social login                          */
/* ------------------------------------------------------------------ */

// POST /auth/forgot-password always answers the same way whether or not the
// email exists, so the UI must not imply either.
export async function requestPasswordReset(email: string): Promise<void> {
  if (!isBackendConfigured || !backendSupports.passwordReset) {
    assertDemoMode();
    return;
  }
  await apiPost(integration.endpoints.forgotPassword, { email });
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  if (!isBackendConfigured || !backendSupports.passwordReset) {
    assertDemoMode();
    return;
  }
  await apiPost(integration.endpoints.resetPassword, { token, newPassword });
}

export async function sendContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  if (!isBackendConfigured || !backendSupports.contact) {
    assertDemoMode();
    return;
  }
  await apiPost(integration.endpoints.contact, input);
}

export type SocialProvider = "google" | "facebook";

// Full-page navigation, not fetch: the API answers with a redirect to the
// provider's consent screen.
export function startSocialLogin(provider: SocialProvider) {
  if (!isBackendConfigured || !backendSupports.socialLogin) {
    throw new ApiError("Social login needs the backend to be connected.");
  }
  const path =
    provider === "google"
      ? integration.endpoints.googleAuth
      : integration.endpoints.facebookAuth;
  window.location.assign(apiUrl(path));
}

// Called by /auth/callback?success=true. The API has already set the httpOnly
// session cookie before redirecting, so all that's left is to read the session.
export async function completeSocialLogin(): Promise<AuthUser> {
  const session = await getSession();
  if (!session) {
    throw new ApiError("We couldn't verify your login. Please try again.");
  }

  const account = await getMyAccount();
  return {
    id: session.userId,
    name: account.ownerName,
    email: account.email,
    role: session.role,
  };
}