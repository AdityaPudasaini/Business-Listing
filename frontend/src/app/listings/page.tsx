import type { Metadata } from "next";
import { ListingsMapSection } from "@/components/sections/ListingsMapSection";
import { getNearbyListings } from "@/services/api";

// Overrides the site-wide default from the root layout. Canonical is pinned
// to the clean /listings URL so ?address=/lat=/lng= filter variations don't
// get indexed as separate pages.
export const metadata: Metadata = {
  title: "Browse Listings",
  description:
    "Search and browse trusted local businesses near you. Filter by location to find the right one.",
  alternates: { canonical: "/listings" },
};

interface ListingsPageProps {
  searchParams: { address?: string; lat?: string; lng?: string };
}

function parseCoordinate(value?: string) {
  if (!value) return undefined;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const lat = parseCoordinate(searchParams.lat);
  const lng = parseCoordinate(searchParams.lng);

  // Server-side so the listing grid is in the initial HTML for crawlers. On
  // failure the section fetches (and shows its error) in the browser instead.
  const initialListings = await getNearbyListings({ lat, lng }).catch(
    () => undefined,
  );

  return (
    <ListingsMapSection
      initialAddress={searchParams.address}
      initialLat={lat}
      initialLng={lng}
      initialListings={initialListings}
    />
  );
}
