import { AdminReviewPage } from "@/components/admin/pages/ReviewPage";

export default function AdminReviewListingRoute({
  params,
}: {
  params: { id: string };
}) {
  return <AdminReviewPage id={params.id} />;
}
