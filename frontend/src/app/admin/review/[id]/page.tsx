import { AdminReviewPage } from "@/components/admin/pages/ReviewPage";

export default async function AdminReviewListingRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminReviewPage id={id} />;
}
