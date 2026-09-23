import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { CustomersPage } from "@/components/sections/CustomersPage";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

export default function DashboardCustomers() {
  return (
    <RequireAuth>
      <CustomersPage
        role="owner"
        backHref="/dashboard"
        backLabel="Back to dashboard"
      />
    </RequireAuth>
  );
}
