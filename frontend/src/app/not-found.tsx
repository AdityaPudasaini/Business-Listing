// not-found.tsx — Next.js renders this automatically for any unmatched
// route, and also when a page explicitly calls notFound() (see
// listings/[id]/page.tsx). No "use client" needed — nothing here is
// interactive beyond a plain link.
import Link from "next/link";
import { SearchX } from "lucide-react";
import { theme } from "@/config/theme";
import { getActiveVertical } from "@/features/verticals";

export default function NotFound() {
  const vertical = getActiveVertical();

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
          <SearchX size={28} />
        </span>

        <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold text-gray-900">
          Page not found
        </h1>
        <p className="mt-3 text-gray-500">
          We couldn&apos;t find what you&apos;re looking for. It may have been
          moved, or the {vertical.labels.business} you were after is no longer
          listed.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            style={{ backgroundColor: theme.colors.primary }}
            className="w-full sm:w-auto rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
          >
            Back to Home
          </Link>
          <Link
            href="/listings"
            className="w-full sm:w-auto rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50"
          >
            Browse Listings
          </Link>
        </div>
      </div>
    </div>
  );
}
