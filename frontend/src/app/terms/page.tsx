import type { Metadata } from "next";
import { TermsPage } from "@/components/sections/TermsPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions for using this site.",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return <TermsPage />;
}
