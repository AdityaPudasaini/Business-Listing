import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingPage } from "@/components/sections/LandingPage";
import { getActiveVertical } from "@/features/verticals";
import {
  MIN_LISTINGS_TO_INDEX,
  categoryHeading,
  categoryIntro,
  clip,
  findCategory,
  getAllListings,
  getCategoryEntries,
  listingsInCategory,
  locationsWithCounts,
  sortForLanding,
  categoriesWithCounts,
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

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

async function load(slug: string) {
  const entries = await getCategoryEntries();
  const category = findCategory(entries, slug);
  if (!category) return null;

  const all = await getAllListings();
  const listings = sortForLanding(listingsInCategory(all, category));
  return { entries, category, all, listings };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const data = await load((await params).slug);
  if (!data) return {};

  const vertical = getActiveVertical();
  const title = categoryHeading(data.category);
  const description = clip(
    categoryIntro(data.category, data.listings, vertical).join(" "),
  );
  const path = `/category/${data.category.id}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    // An empty category is a thin page: keep it out of the index (crawlers can
    // still follow its links) until it has listings.
    robots: {
      index: data.listings.length >= MIN_LISTINGS_TO_INDEX,
      follow: true,
    },
    openGraph: { title, description, url: path },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const data = await load((await params).slug);
  if (!data) notFound();

  const { entries, category, listings } = data;
  const vertical = getActiveVertical();
  const heading = categoryHeading(category);
  const intro = categoryIntro(category, listings, vertical);
  const path = `/category/${category.id}`;

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
            { name: category.label, path },
          ]),
        ]}
      />
      <LandingPage
        heading={heading}
        intro={intro}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Listings", href: "/listings" },
          { label: category.label },
        ]}
        listings={listings}
        relatedHeading={`${category.label} by location`}
        related={locationsWithCounts(listings).map(({ entry, count }) => ({
          href: `/location/${entry.slug}`,
          label: entry.name,
          count,
        }))}
        secondaryHeading="Other categories"
        secondary={categoriesWithCounts(entries, data.all)
          .filter((item) => item.entry.id !== category.id)
          .map(({ entry, count }) => ({
            href: `/category/${entry.id}`,
            label: entry.label,
            count,
          }))}
      />
    </>
  );
}
