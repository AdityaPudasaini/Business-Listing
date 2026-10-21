// landing.ts — shared logic for the /category/[slug] and /location/[slug]
// landing pages: which categories and locations exist, which listings belong
// to each, and the text that goes at the top of the page. Server-side only.
import { businessMatchesCategory, categories as staticCategories } from "@/data/categories";
import { categoryCopy } from "@/data/landingCopy";
import { locations, type LocationEntry } from "@/data/locations";
import { addressInLocation } from "@/lib/locationMatch";
import { countryName } from "@/config/site";
import type { VerticalConfig } from "@/features/verticals";
import { getCategories, getNearbyListings } from "@/services/api";
import type { Business, Category } from "@/types";

/** A listing page grid is capped so a huge category doesn't become a huge page. */
export const LANDING_PAGE_SIZE = 24;

/** A page with fewer listings than this is "thin": it is noindexed and left out of the sitemap. */
export const MIN_LISTINGS_TO_INDEX = 1;

export interface CategoryEntry {
  id: string;
  label: string;
  /** Category ids whose listings belong on this page (itself + children). */
  matchIds: string[];
  isParent: boolean;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

function flattenCategories(tree: Category[]): CategoryEntry[] {
  const entries: CategoryEntry[] = [];
  for (const parent of tree) {
    const children = parent.subCategories ?? [];
    entries.push({
      id: parent.id,
      label: parent.label,
      matchIds: [parent.id, ...children.map((child) => child.id)],
      isParent: children.length > 0,
    });
    for (const child of children) {
      entries.push({
        id: child.id,
        label: child.label,
        matchIds: [child.id],
        isParent: false,
      });
    }
  }
  return entries;
}

// Admin-managed categories when the backend has them, the bundled list otherwise.
export async function getCategoryEntries(): Promise<CategoryEntry[]> {
  try {
    const tree = await getCategories();
    if (tree.length) return flattenCategories(tree);
  } catch {
    // fall through to the static list
  }
  return flattenCategories(staticCategories);
}

// A malformed %-escape in the URL would make decodeURIComponent throw (a 500);
// treat it as "no such page" instead.
export function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function findCategory(entries: CategoryEntry[], slug: string) {
  return entries.find((entry) => entry.id === safeDecode(slug));
}

export function listingsInCategory(listings: Business[], entry: CategoryEntry) {
  return listings.filter(
    (business) =>
      entry.matchIds.includes(business.category) ||
      businessMatchesCategory(business.category, entry.id),
  );
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

export function listingInLocation(business: Business, entry: LocationEntry) {
  return addressInLocation(business.location, entry);
}

export function findLocation(slug: string) {
  return locations.find((entry) => entry.slug === safeDecode(slug));
}

export function listingsInLocation(listings: Business[], entry: LocationEntry) {
  return listings.filter((business) => listingInLocation(business, entry));
}

/** Locations that have at least one of `listings`, with how many. */
export function locationsWithCounts(listings: Business[]) {
  return locations
    .map((entry) => ({
      entry,
      count: listings.filter((business) => listingInLocation(business, entry)).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

/** Categories that have at least one of `listings`, with how many. */
export function categoriesWithCounts(entries: CategoryEntry[], listings: Business[]) {
  return entries
    .filter((entry) => !entry.isParent)
    .map((entry) => ({ entry, count: listingsInCategory(listings, entry).length }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

// Every approved listing. The same URL is requested by every landing page, so
// the Next.js data cache (see apiGetPublic) serves them all from one cached
// response instead of one backend call per page. Throws if the backend is
// down, on purpose: a failed fetch must not be turned into an "empty" page and
// cached as noindex.
export function getAllListings() {
  return getNearbyListings({});
}

/** Best-rated first, then most reviewed, then A–Z. */
export function sortForLanding(listings: Business[]) {
  return [...listings].sort(
    (a, b) =>
      (b.rating ?? 0) - (a.rating ?? 0) ||
      (b.reviewCount ?? 0) - (a.reviewCount ?? 0) ||
      a.name.localeCompare(b.name),
  );
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

/** "Auto services" / "Restaurants" — what a listing is called on this site. */
export function verticalPlural(vertical: VerticalConfig) {
  return vertical.id === "restaurant" ? "Restaurants" : "Auto services";
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function categoryHeading(entry: CategoryEntry) {
  return `${entry.label} in ${countryName}`;
}

export function locationHeading(entry: LocationEntry, vertical: VerticalConfig) {
  return `${verticalPlural(vertical)} in ${entry.name}`;
}

export function categoryIntro(
  entry: CategoryEntry,
  listings: Business[],
  vertical: VerticalConfig,
): string[] {
  const copy = categoryCopy[entry.id] ?? [
    `Browse ${entry.label} listings on ${vertical.brandName}. Open a listing to see its services, opening hours, reviews and contact details.`,
  ];

  const places = locationsWithCounts(listings).slice(0, 4).map((item) => item.entry.name);
  const count = listings.length;
  const summary =
    `${vertical.brandName} lists ${count} ${entry.label} ${count === 1 ? "business" : "businesses"}` +
    (places.length ? `, including in ${joinNames(places)}.` : ".");

  return [...copy, summary];
}

export function locationIntro(
  entry: LocationEntry,
  listings: Business[],
  entries: CategoryEntry[],
  vertical: VerticalConfig,
): string[] {
  const count = listings.length;
  const topCategories = categoriesWithCounts(entries, listings)
    .slice(0, 4)
    .map((item) => item.entry.label);

  const summary =
    `${vertical.brandName} lists ${count} ${count === 1 ? "business" : "businesses"} in ${entry.name}` +
    (topCategories.length ? `, including ${joinNames(topCategories)}.` : ".") +
    " Open a listing to see its services, opening hours, reviews and contact details.";

  return [entry.blurb, summary].filter((text): text is string => Boolean(text));
}

/** Meta descriptions over ~155 characters get cut off in search results. */
export function clip(text: string, max = 155) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  // Back up to the last space so we don't cut a word in half.
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut)
    .trimEnd()
    .replace(/[.,;:]+$/, "");
  return `${trimmed}…`;
}