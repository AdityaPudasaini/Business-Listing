import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { getNearbyListings } from "@/services/api";

const STATIC_ROUTES = [
  "",
  "/listings",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
];

// Next serves this at /sitemap.xml automatically.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  let listingEntries: MetadataRoute.Sitemap = [];
  try {
    const listings = await getNearbyListings({});
    listingEntries = listings
      .filter((business) => business.slug)
      .map((business) => ({
        url: `${siteUrl}/listings/${business.slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
  } catch {
    // Backend unreachable at build time — ship the static routes only.
  }

  return [...staticEntries, ...listingEntries];
}