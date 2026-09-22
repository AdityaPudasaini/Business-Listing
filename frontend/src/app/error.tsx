"use client";

// error.tsx — Next.js renders this in place of any route segment (and
// everything below it) that throws during render, so the rest of the layout
// (Navbar/Footer via AppChrome) stays on screen. This does NOT catch errors
// thrown by the root layout itself — see global-error.tsx for that case.
//
// Must be a Client Component: Next attaches `reset` at render time and it
// wouldn't be serializable across the server/client boundary otherwise.

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { theme } from "@/config/theme";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Swap for a real error-reporting call (Sentry, etc.) when one is wired
    // up. `error.digest` is the id Next prints server-side for this error.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
      <div className="text-center max-w-md">
        <span
          style={{
            ["--accent" as string]: theme.colors.primary,
            ["--accent-tint" as string]: `${theme.colors.primary}14`,
          }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-tint)] text-[var(--accent)]"
        >
          <TriangleAlert size={28} />
        </span>

        <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold text-gray-900">
          Something went wrong
        </h1>
        <p className="mt-3 text-gray-500">
          An unexpected error occurred while loading this page. You can try
          again, or head back to the homepage.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            style={{ backgroundColor: theme.colors.primary }}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
          >
            <RotateCcw size={16} />
            Try again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
