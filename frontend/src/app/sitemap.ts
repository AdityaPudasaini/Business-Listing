import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { locations } from "@/data/locations";
import {
  MIN_LISTINGS_TO_INDEX,
  getAllListings,
  getCategoryEntries,
  listingsInCategory,
  listingsInLocation,
} from "@/lib/landing";
import type { Business } from "@/types";

// Regenerated at most every 5 minutes (listings come from the cached API).
export const revalidate = 300;

// A single sitemap file may hold 50,000 URLs. Well past that, switch to
// generateSitemaps() and a sitemap index; until then, never emit an invalid file.
const MAX_URLS = 50_000;

const STATIC_ROUTES = [
  "",
  "/listings",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
];

// The newest `updatedAt` among a set of listings — the honest "last modified"
// for a page that is just a list of them. undefined when none have a date.
function newest(listings: Business[]): Date | undefined {
  let latest = 0;
  for (const business of listings) {
    const time = Date.parse(business.updatedAt ?? business.createdAt ?? "");
    if (Number.isFinite(time) && time > latest) latest = time;
  }
  return latest ? new Date(latest) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages get no lastModified: we don't track when their text changes,
  // and a made-up date (e.g. "now") teaches Google to ignore the field.
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  let dynamicEntries: MetadataRoute.Sitemap = [];
  try {
    const [listings, categoryEntries] = await Promise.all([
      getAllListings(),
      getCategoryEntries(),
    ]);

    const listingEntries: MetadataRoute.Sitemap = listings
      .filter((business) => business.slug)
      .map((business) => ({
        url: `${siteUrl}/listings/${business.slug}`,
        lastModified: newest([business]),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    // Landing pages: only ones with listings on them (the others are noindexed).
    const categoryPages: MetadataRoute.Sitemap = categoryEntries.flatMap((entry) => {
      const inCategory = listingsInCategory(listings, entry);
      return inCategory.length >= MIN_LISTINGS_TO_INDEX
        ? [
            {
              url: `${siteUrl}/category/${entry.id}`,
              lastModified: newest(inCategory),
              changeFrequency: "daily" as const,
              priority: 0.7,
            },
          ]
        : [];
    });

    const locationPages: MetadataRoute.Sitemap = locations.flatMap((entry) => {
      const inLocation = listingsInLocation(listings, entry);
      return inLocation.length >= MIN_LISTINGS_TO_INDEX
        ? [
            {
              url: `${siteUrl}/location/${entry.slug}`,
              lastModified: newest(inLocation),
              changeFrequency: "daily" as const,
              priority: 0.7,
            },
          ]
        : [];
    });

    dynamicEntries = [...categoryPages, ...locationPages, ...listingEntries];
  } catch {
    // Backend unreachable at build time — ship the static routes only.
  }

  const entries = [...staticEntries, ...dynamicEntries];
  if (entries.length > MAX_URLS) {
    console.warn(
      `sitemap.ts: ${entries.length} URLs exceeds the 50,000 limit; truncating. Split into multiple sitemaps with generateSitemaps().`,
    );
  }
  return entries.slice(0, MAX_URLS);
}