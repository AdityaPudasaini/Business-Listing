// TrustedPartners.tsx — "Our Trusted Partners": a horizontally scrollable row of
// ListingCards (same card used in NearbyListings/search results), filtered from
// the shared Business list by the (not-yet-built) admin "Partnered with us?"
// checkbox — see Business.isPartner in @/types. Auto-advances every 4s like the
// Hero image slideshow (same setInterval pattern), wrapping back to page 0 at
// the end. Pauses while the user hovers or interacts. Arrows + dots also let
// the user jump pages manually, same as NearbyListings.
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ListingCard } from "@/components/project/ListingCard";
import { sampleBusinesses } from "@/data/sampleBusinesses";
import { Business } from "@/types";

const CARDS_PER_PAGE = 2;
const AUTO_ADVANCE_MS = 4000;

interface TrustedPartnersProps {
  businesses?: Business[];
  title?: string;
  description?: string;
}

export function TrustedPartners({
  businesses = sampleBusinesses,
  title = "Our Trusted Partners",
  description = "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Nam semper nisl diam, nec accumsan odio cursus in.",
}: TrustedPartnersProps) {
  const partners = businesses.filter((b) => b.isPartner);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pageCount = Math.max(1, Math.ceil(partners.length / CARDS_PER_PAGE));

  function getPageWidth() {
    const el = scrollRef.current;
    if (!el) return 0;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return el.clientWidth;
    const gap = 16; // matches gap-4
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

  // Auto-advance, same setInterval pattern as the Hero image slideshow —
  // pauses while the user is hovering or has manually interacted recently.
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

  if (partners.length === 0) return null;

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
          {partners.map((business) => (
            <div
              key={business.id}
              className="snap-start shrink-0 w-[300px] sm:w-[340px]"
            >
              <ListingCard
                business={business}
                onClick={() =>
                  (window.location.href = `/listings/${business.id}`)
                }
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
