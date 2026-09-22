import type { Metadata } from "next";
import { AuthPage } from "@/components/sections/AuthPage";

export const metadata: Metadata = {
  title: "Sign Up",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return <AuthPage initialMode="signup" />;
}
