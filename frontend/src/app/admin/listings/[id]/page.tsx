import { CustomersPage } from "@/components/sections/CustomersPage";
import { demoBusinessCustomers } from "@/data/businessCustomers";

export default function AdminBusinessCustomers({
  params,
}: {
  params: { id: string };
}) {
  const businessName = demoBusinessCustomers.find(
    (customer) => customer.businessId === params.id,
  )?.businessName;

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
