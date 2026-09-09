import { notFound } from "next/navigation";
import { getBusinessById } from "@/services/api";
import { BusinessDetailPage } from "@/components/sections/BusinessDetailPage";

interface ListingDetailPageProps {
  params: { id: string };
}

export default async function ListingDetailPage({
  params,
}: ListingDetailPageProps) {
  const business = await getBusinessById(params.id);
  if (!business) notFound();

  return <BusinessDetailPage business={business} />;
}
