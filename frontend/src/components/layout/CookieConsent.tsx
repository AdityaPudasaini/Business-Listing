// CookieConsent.tsx — cookie / local-storage consent banner. Rendered by AppChrome.tsx.
// Choice is saved via lib/cookieConsent.ts and applies instantly (no reload).
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  // Kept deliberately small: a slim bar on mobile (one short sentence, two
  // compact buttons) and a narrow card on desktop, so it never covers much of
  // the page. It is position: fixed, so it cannot cause layout shift either.
  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-2 bottom-2 z-[95] rounded-xl border border-gray-200 bg-white p-3 shadow-xl sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-sm"
    >
      <p className="text-xs leading-snug text-gray-600">
        We use cookies to keep the site working and, with your OK, to see how
        it&apos;s used.{" "}
        <Link href="/privacy" className="font-medium underline text-primary">
          Learn more
        </Link>
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="flex-1 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 bg-primary"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => choose("declined")}
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
