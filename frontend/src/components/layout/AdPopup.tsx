// AdPopup.tsx — entry ad popup. Rendered by AppChrome.tsx.

"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { popupAd as defaultAd } from "@/data/popupAd";
import { getPopupAd } from "@/services/api";

const STORAGE_KEY = "popup-ad-last-closed";
// Once closed, stay away for a day (it used to come back after 1 minute).
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
// Don't open the moment the page loads: Google penalises pop-ups that cover
// the content right after a visitor arrives, and it competes with the cookie
// banner. Give people a few seconds with the page first.
const SHOW_DELAY_MS = 8000;

function isCoolingDown(): boolean {
  try {
    const last = Number(window.localStorage.getItem(STORAGE_KEY));
    return last > 0 && Date.now() - last < COOLDOWN_MS;
  } catch {
    return false; // storage blocked — just show it
  }
}

// What the popup actually renders. Comes from the admin dashboard when a
// custom ad exists, otherwise from the built-in data/popupAd.ts.
type AdContent = { image: string; alt: string; href: string };

export function AdPopup({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false); // drives the fade/scale-in
  const [popupAd, setPopupAd] = useState<AdContent>(defaultAd);

  useEffect(() => {
    if (!enabled) return;
    if (isCoolingDown()) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    void getPopupAd()
      .then((custom) => {
        if (cancelled) return;
        // A custom ad the admin switched off means "show nothing", not "show
        // the default" — hiding the popup has to actually hide it.
        if (custom && !custom.active) return;
        if (custom) {
          setPopupAd({
            image: custom.image,
            alt: custom.alt,
            href: custom.href,
          });
        }
        timer = setTimeout(() => {
          setOpen(true);
          requestAnimationFrame(() => setVisible(true));
        }, SHOW_DELAY_MS);
      })
      .catch(() => {
        // No ad data means no popup; it's optional.
      });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled]);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => setOpen(false), 200);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  if (!open) return null;

  const img = (
    <Image
      src={popupAd.image}
      alt={popupAd.alt}
      width={defaultAd.width}
      height={defaultAd.height}
      // Rendered at most ~768px wide, so don't let Next ship the full 1042px
      // original; and no `priority` — it isn't part of the initial page.
      sizes="(min-width: 768px) 768px, 100vw"
      className="block h-auto w-full"
    />
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Advertisement"
      onClick={close}
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-3xl bg-white p-2 shadow-2xl transition-transform duration-200 sm:p-4 ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close advertisement"
          autoFocus
          className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-md transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {popupAd.href ? (
          <a href={popupAd.href} target="_blank" rel="noopener noreferrer">
            {img}
          </a>
        ) : (
          img
        )}
      </div>
    </div>
  );
}
