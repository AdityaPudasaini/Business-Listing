import type { Metadata } from "next";
import { AuthPage } from "@/components/sections/AuthPage";

// noindex: an auth form has nothing for search engines to index, and
// indexing it can draw crawler traffic to a login endpoint for no benefit.
export const metadata: Metadata = {
  title: "Log In",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <AuthPage initialMode="login" />;
}
