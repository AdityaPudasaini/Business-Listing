// TrustedPartners.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ListingCard } from "@/components/project/ListingCard";
import { ListingCardSkeleton } from "@/components/project/ListingCardSkeleton";
import { getNearbyListings } from "@/services/api";
import { Business } from "@/types";

const CARDS_PER_PAGE = 2;
const AUTO_ADVANCE_MS = 4000;
const SKELETON_COUNT = 4;

interface TrustedPartnersProps {
  // Optional override for tests/storybook — normally left unset so the
  // component fetches live partners itself, same pattern as NearbyListings.
  businesses?: Business[];
  category?: string;
  title?: string;
  description?: string;
}

export function TrustedPartners({
  businesses,
  category,
  title = "Our Trusted Partners",
  description = "These are our Trusted Patners assoicated with Luvya Trading ",
}: TrustedPartnersProps) {
  const [fetched, setFetched] = useState<Business[]>([]);
  const [loading, setLoading] = useState(businesses === undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    // An explicit `businesses` prop skips the fetch entirely.
    if (businesses !== undefined) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    getNearbyListings({ category })
      .then((data) => {
        if (!cancelled) setFetched(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businesses, category]);

  // getNearbyListings already applies the category filter server/client-side,
  // so here we only need to narrow down to partner flagged businesses.
  const partners = (businesses ?? fetched).filter((b) => b.isPartner);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pageCount = Math.max(1, Math.ceil(partners.length / CARDS_PER_PAGE));

  function getPageWidth() {
    const el = scrollRef.current;
    if (!el) return 0;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return el.clientWidth;
    const gap = 16;
    return (card.offsetWidth + gap) * CARDS_PER_PAGE;
  }

  function goToPage(page: number) {
    const el = scrollRef.current;
    if (!el) return;
    const pageWidth = getPageWidth();
    el.scrollTo({ left: page * pageWidth, behavior: "smooth" });
    setActivePage(page);
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const pageWidth = getPageWidth();
    if (!pageWidth) return;
    const page = Math.round(el.scrollLeft / pageWidth);
    setActivePage(Math.min(page, pageCount - 1));
  }

  useEffect(() => {
    if (pageCount <= 1 || isPaused) return;
    const id = setInterval(() => {
      setActivePage((current) => {
        const next = (current + 1) % pageCount;
        const el = scrollRef.current;
        if (el) {
          const pageWidth = getPageWidth();
          el.scrollTo({ left: next * pageWidth, behavior: "smooth" });
        }
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [pageCount, isPaused]);

  function scroll(direction: "left" | "right") {
    const next =
      direction === "left"
        ? Math.max(activePage - 1, 0)
        : Math.min(activePage + 1, pageCount - 1);
    goToPage(next);
  }

  // Unlike NearbyListings, an empty/error result here just hides the whole
  // section rather than showing a message — there's a "View all partners"
  // link elsewhere, and an empty carousel with no partners isn't worth a slot
  // on the homepage. Only the loading skeleton is shown up front.
  if (!loading && (error || partners.length === 0)) return null;

  return (
    <section className="px-6 md:px-14 pt-4 pb-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-gray-500">{description}</p>
        </div>
        <Link
          href="/partners"
          className="hidden sm:block whitespace-nowrap text-base font-semibold text-gray-900 underline underline-offset-4 decoration-2 hover:opacity-70 transition-opacity"
        >
          View all
        </Link>
      </div>

      <div
        className="relative mt-8"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {pageCount > 1 && (
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={activePage === 0}
            aria-label="Scroll left"
            className="hidden sm:flex absolute -left-11 top-[8.5rem] -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border bg-white shadow-md text-gray-500 hover:text-gray-900 disabled:opacity-40 disabled:hover:text-gray-500 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onTouchStart={() => setIsPaused(true)}
          className={`flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
            partners.length <= CARDS_PER_PAGE
              ? "justify-center"
              : "justify-start"
          }`}
        >
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className="snap-start shrink-0 w-[300px] sm:w-[340px]"
                >
                  <ListingCardSkeleton />
                </div>
              ))
            : partners.map((business) => (
                <div
                  key={business.id}
                  className="snap-start shrink-0 w-[300px] sm:w-[340px]"
                >
                  <ListingCard
                    business={business}
                    href={`/listings/${business.slug}`}
                  />
                </div>
              ))}
        </div>

        {pageCount > 1 && (
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={activePage === pageCount - 1}
            aria-label="Scroll right"
            className="hidden sm:flex absolute -right-11 top-[8rem] -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border bg-white shadow-md text-gray-500 hover:text-gray-900 disabled:opacity-40 disabled:hover:text-gray-500 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to page ${i + 1}`}
              onClick={() => goToPage(i)}
              className={`h-2 rounded-full transition-all ${
                i === activePage ? "w-6 bg-gray-900" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
