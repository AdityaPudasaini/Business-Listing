import type { Metadata } from "next";
import { RegisterPage } from "@/components/sections/RegisterPage";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const metadata: Metadata = {
  title: "Register Your Business",
  description: "List your business and reach more customers.",
  alternates: { canonical: "/register" },
  robots: { index: false, follow: false },
};

export default function Register() {
  return (
    <RequireAuth>
      <RegisterPage />
    </RequireAuth>
  );
}
