import { CustomersPage } from "@/components/sections/CustomersPage";
import { demoBusinessCustomers } from "@/data/businessCustomers";
import { isDemoMode } from "@/config/integration";

export default async function AdminBusinessCustomers({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Sample lookup only; with a live backend CustomersPage names the business
  // from the customer rows it fetches.
  const businessName = isDemoMode
    ? demoBusinessCustomers.find((customer) => customer.businessId === id)
        ?.businessName
    : undefined;

  return (
    <CustomersPage
      role="admin"
      businessId={id}
      businessName={businessName}
      backHref="/admin/listings"
      backLabel="Back to listings"
    />
  );
}
