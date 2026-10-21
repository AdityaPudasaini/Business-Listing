import type { Metadata } from "next";
import { PrivacyPage } from "@/components/sections/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we collect, use, and protect your data.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return <PrivacyPage />;
}
