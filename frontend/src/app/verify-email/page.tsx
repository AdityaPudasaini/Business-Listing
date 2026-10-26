import type { Metadata } from "next";
import { VerifyEmailPage } from "@/components/sections/VerifyEmailPage";

export const metadata: Metadata = {
  title: "Confirm Your Email",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <VerifyEmailPage />;
}
