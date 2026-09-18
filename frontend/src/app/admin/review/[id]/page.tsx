import { AdminReviewPage } from "@/components/admin/AdminPages";

export default function AdminReviewListingRoute({
  params,
}: {
  params: { id: string };
}) {
  return <AdminReviewPage id={params.id} />;
}
