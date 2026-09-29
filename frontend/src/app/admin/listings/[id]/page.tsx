import { CustomersPage } from "@/components/sections/CustomersPage";
import { demoBusinessCustomers } from "@/data/businessCustomers";
import { isDemoMode } from "@/config/integration";

export default function AdminBusinessCustomers({
  params,
}: {
  params: { id: string };
}) {
  // Sample lookup only; with a live backend CustomersPage names the business
  // from the customer rows it fetches.
  const businessName = isDemoMode
    ? demoBusinessCustomers.find(
    (customer) => customer.businessId === params.id,
      )?.businessName
    : undefined;

  return (
    <CustomersPage
      role="admin"
      businessId={params.id}
      businessName={businessName}
      backHref="/admin/listings"
      backLabel="Back to listings"
    />
  );
}
