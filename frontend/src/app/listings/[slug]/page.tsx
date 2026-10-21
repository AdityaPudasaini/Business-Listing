import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/services/api";
import { BusinessDetailPage } from "@/components/sections/BusinessDetailPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { getActiveVertical } from "@/features/verticals";
import {
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
} from "@/lib/structuredData";

interface ListingDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Listings change rarely; cache each page and refresh it in the background.
export const revalidate = 300;

// Renders each page on its first visit, then serves it from cache and refreshes
// it in the background every `revalidate` seconds (on-demand ISR). Nothing is
// built up front, so `next build` doesn't need the backend to be reachable.
export async function generateStaticParams() {
  return [];
}

// Runs before the page itself renders, so a shared link to a specific
export async function generateMetadata({
  params,
}: ListingDetailPageProps): Promise<Metadata> {
  const business = await getBusinessBySlug((await params).slug);
  if (!business) return {};

  const title = business.name;
  const description =
    business.description ||
    `${business.name} — ${business.category} in ${business.location}. See hours, reviews, and contact details.`;

  return {
    title,
    description,
    alternates: { canonical: `/listings/${business.slug}` },
    openGraph: {
      title,
      description,
      url: `/listings/${business.slug}`,
      // Falls back to app/opengraph-image.tsx when the listing has no photo.
      images: business.image ? [{ url: business.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: business.image ? [business.image] : undefined,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: ListingDetailPageProps) {
  const business = await getBusinessBySlug((await params).slug);
  if (!business) notFound();

  const vertical = getActiveVertical();

  // Rendered here, in the server component, so the markup is in the initial
  // HTML — BusinessDetailPage is a client component and would hide it from
  // anything that doesn't run JS.
  return (
    <>
      <JsonLd
        data={[
          buildLocalBusinessJsonLd(business, vertical),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Listings", path: "/listings" },
            { name: business.name, path: `/listings/${business.slug}` },
          ]),
        ]}
      />
      <BusinessDetailPage business={business} />
    </>
  );
}
