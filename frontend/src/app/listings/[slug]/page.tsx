import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/services/api";
import { BusinessDetailPage } from "@/components/sections/BusinessDetailPage";

interface ListingDetailPageProps {
  params: { slug: string };
}

export default async function ListingDetailPage({
  params,
}: ListingDetailPageProps) {
  const business = await getBusinessBySlug(params.slug);
  if (!business) notFound();

  return <BusinessDetailPage business={business} />;
}
