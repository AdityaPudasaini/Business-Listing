import type { Metadata } from "next";
import { DashboardPage } from "@/components/sections/DashboardPage";

// noindex: personal account area, not content for search engines.
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function Dashboard() {
  return <DashboardPage />;
}
