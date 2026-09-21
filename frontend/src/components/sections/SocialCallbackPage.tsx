"use client";

// SocialCallbackPage.tsx — where the API sends the browser after Google/Facebook login.
//   success: /auth/callback#token=<jwt>      (fragment, so it never hits server logs)
//   failure: /auth/callback?error=<code>
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/project/AuthCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { theme } from "@/config/theme";
import { useDemoAuthStore } from "@/features/auth/useDemoAuthStore";
import { completeSocialLogin } from "@/services/api";

const errorMessages: Record<string, string> = {
  provider_not_configured:
    "This login method isn't set up yet. Please use your email and password instead.",
  access_denied:
    "The login was cancelled. You can try again whenever you're ready.",
  invalid_state:
    "The login attempt expired or couldn't be verified. Please try again.",
  no_email:
    "We couldn't get an email address from that account. Please sign up with your email instead.",
  email_unverified:
    "That account's email address isn't verified, so we can't use it to log you in.",
  login_failed: "We couldn't complete the login. Please try again.",
};

export function SocialCallbackPage() {
  const router = useRouter();
  const setAuthenticatedUser = useDemoAuthStore(
    (state) => state.setAuthenticatedUser,
  );
  const [error, setError] = useState("");

  // React strict mode runs effects twice in dev, and the token is removed from
  // the URL on the first run — so make sure the work only happens once.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const query = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(
      window.location.hash.replace(/^#/, ""),
    );

    const errorCode = query.get("error");
    if (errorCode) {
      setError(errorMessages[errorCode] ?? errorMessages.login_failed);
      return;
    }

    const token = fragment.get("token");
    if (!token) {
      setError(errorMessages.login_failed);
      return;
    }

    // Don't leave the token sitting in the address bar / browser history.
    window.history.replaceState(null, "", window.location.pathname);

    completeSocialLogin(token)
      .then((user) => {
        setAuthenticatedUser(user);
        router.replace("/dashboard");
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : errorMessages.login_failed,
        );
      });
  }, [router, setAuthenticatedUser]);

  if (error) {
    return (
      <AuthCard title="Login didn't complete">
        <p role="alert" className="text-sm text-gray-600">
          {error}
        </p>

        <Link
          href="/login"
          style={{ backgroundColor: theme.colors.primary }}
          className="mt-6 inline-flex rounded-md px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
        >
          Back to log in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Signing you in…">
      <LoadingSpinner />
    </AuthCard>
  );
}
