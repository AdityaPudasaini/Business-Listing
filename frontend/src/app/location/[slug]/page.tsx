import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingPage } from "@/components/sections/LandingPage";
import { getActiveVertical } from "@/features/verticals";
import {
  MIN_LISTINGS_TO_INDEX,
  categoriesWithCounts,
  clip,
  findLocation,
  getAllListings,
  getCategoryEntries,
  listingsInLocation,
  locationHeading,
  locationIntro,
  locationsWithCounts,
  sortForLanding,
} from "@/lib/landing";
import {
  buildBreadcrumbJsonLd,
  buildCollectionJsonLd,
} from "@/lib/structuredData";

// Rebuilt in the background at most every 5 minutes; listings come from the
// cached public API (see apiGetPublic), so this adds no per-visit backend load.
export const revalidate = 300;

// Renders each page on its first visit, then serves it from cache and refreshes
// it in the background every `revalidate` seconds (on-demand ISR). Nothing is
// built up front, so `next build` doesn't need the backend to be reachable.
export async function generateStaticParams() {
  return [];
}

interface LocationPageProps {
  params: Promise<{ slug: string }>;
}

async function load(slug: string) {
  const location = findLocation(slug);
  if (!location) return null;

  const [entries, all] = await Promise.all([
    getCategoryEntries(),
    getAllListings(),
  ]);
  const listings = sortForLanding(listingsInLocation(all, location));
  return { entries, location, all, listings };
}

export async function generateMetadata({
  params,
}: LocationPageProps): Promise<Metadata> {
  const data = await load((await params).slug);
  if (!data) return {};

  const vertical = getActiveVertical();
  const title = locationHeading(data.location, vertical);
  const description = clip(
    locationIntro(data.location, data.listings, data.entries, vertical).join(
      " ",
    ),
  );
  const path = `/location/${data.location.slug}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    // No listings here yet: keep the page out of the index.
    robots: {
      index: data.listings.length >= MIN_LISTINGS_TO_INDEX,
      follow: true,
    },
    openGraph: { title, description, url: path },
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const data = await load((await params).slug);
  if (!data) notFound();

  const { entries, location, listings, all } = data;
  const vertical = getActiveVertical();
  const heading = locationHeading(location, vertical);
  const intro = locationIntro(location, listings, entries, vertical);
  const path = `/location/${location.slug}`;

  return (
    <>
      <JsonLd
        data={[
          buildCollectionJsonLd({
            name: heading,
            description: clip(intro.join(" ")),
            path,
            businesses: listings.slice(0, 24),
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Listings", path: "/listings" },
            { name: location.name, path },
          ]),
        ]}
      />
      <LandingPage
        heading={heading}
        intro={intro}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Listings", href: "/listings" },
          { label: location.name },
        ]}
        listings={listings}
        relatedHeading={`Categories in ${location.name}`}
        related={categoriesWithCounts(entries, listings).map(
          ({ entry, count }) => ({
            href: `/category/${entry.id}`,
            label: entry.label,
            count,
          }),
        )}
        secondaryHeading="Other locations"
        secondary={locationsWithCounts(all)
          .filter((item) => item.entry.slug !== location.slug)
          .map(({ entry, count }) => ({
            href: `/location/${entry.slug}`,
            label: entry.name,
            count,
          }))}
      />
    </>
  );
}
