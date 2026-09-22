import type { Metadata } from "next";
import { ListingsMapSection } from "@/components/sections/ListingsMapSection";

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

export default function ListingsPage({ searchParams }: ListingsPageProps) {
  const lat = searchParams.lat ? parseFloat(searchParams.lat) : undefined;
  const lng = searchParams.lng ? parseFloat(searchParams.lng) : undefined;

  return (
    <>
      <ListingsMapSection
        initialAddress={searchParams.address}
        initialLat={lat}
        initialLng={lng}
      />
    </>
  );
}
