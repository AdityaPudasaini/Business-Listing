import type { Metadata } from "next";
import { ResetPasswordPage } from "@/components/sections/ResetPasswordPage";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResetPasswordPage />;
}
