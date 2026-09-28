// CookieConsent.tsx — cookie / local-storage consent banner. Rendered by AppChrome.tsx.
// Choice is saved via lib/cookieConsent.ts and applies instantly (no reload).
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { theme } from "@/config/theme";
import { getConsent, setConsent } from "@/lib/cookieConsent";

export function CookieConsent({ enabled }: { enabled: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (getConsent() === null) setShow(true);
  }, [enabled]);

  if (!show) return null;

  function choose(choice: "accepted" | "declined") {
    setConsent(choice);
    setShow(false);
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-[95] rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-md"
    >
      <p className="text-sm font-semibold text-gray-900">We use cookies</p>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">
        We use essential storage to keep you signed in and make the site work.
        With your OK, we may also use optional cookies to understand how the
        site is used.{" "}
        <Link
          href="/privacy"
          className="font-medium underline"
          style={{ color: theme.colors.primary }}
        >
          Learn more
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => choose("accepted")}
          style={{ backgroundColor: theme.colors.primary }}
          className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => choose("declined")}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
