import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/services/api";
import { BusinessDetailPage } from "@/components/sections/BusinessDetailPage";

interface ListingDetailPageProps {
  params: { slug: string };
}

// Runs before the page itself renders, so a shared link to a specific
// business shows its own name/description/photo in search results and
// social previews instead of the site-wide default in the root layout.
export async function generateMetadata({
  params,
}: ListingDetailPageProps): Promise<Metadata> {
  const business = await getBusinessBySlug(params.slug);
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
  const business = await getBusinessBySlug(params.slug);
  if (!business) notFound();

  return <BusinessDetailPage business={business} />;
}
