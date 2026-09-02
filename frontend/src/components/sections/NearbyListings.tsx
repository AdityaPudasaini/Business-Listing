// NearbyListings.tsx — "Your Nearest Auto Service": a horizontally scrollable row of
// ListingCards, filtered by the category selected in Categories.tsx and the address
// entered in Hero.tsx (both lifted up to page.tsx as shared state).
"use client";

import { useEffect, useState } from "react";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ListingCard } from "@/components/project/ListingCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { getNearbyListings } from "@/services/api";
import { Business } from "@/types";

interface NearbyListingsProps {
  location?: string;
  category?: string;
  lat?: number;
  lng?: number;
}

export function NearbyListings({
  location,
  category,
  lat,
  lng,
}: NearbyListingsProps) {
  const [listings, setListings] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    getNearbyListings({ location, category, lat, lng })
      .then((data) => {
        if (!cancelled) setListings(data);
      })
      .catch(() => {
        // Backend unreachable, wrong URL, CORS, etc — show a real error
        // state instead of silently leaving the row looking empty.
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location, category, lat, lng]);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = (el.firstElementChild as HTMLElement)?.clientWidth ?? 280;
    el.scrollBy({
      left: direction === "left" ? -(cardWidth + 16) : cardWidth + 16,
      behavior: "smooth",
    });
  }

  return (
    <section className="px-6 md:px-14 pt-6 pb-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Your Nearest Auto Service
        </h2>
        <p className="mt-2 text-gray-500">
          Find the closest and most reliable auto services in your area
        </p>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="hidden sm:flex absolute -left-11 top-[12rem] -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border bg-white shadow-md text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {loading && <LoadingSpinner />}
          {!loading && error && (
            <EmptyState message="Couldn't load nearby services. Please try again shortly." />
          )}
          {!loading && !error && listings.length === 0 && (
            <EmptyState message="No nearby services found yet." />
          )}
          {!loading &&
            !error &&
            listings.map((biz, index) => (
              <div
                key={biz.id}
                className="snap-start shrink-0 w-[300px] sm:w-[340px] animate-fade-in-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <ListingCard
                  business={biz}
                  onClick={() => (window.location.href = `/listings/${biz.id}`)}
                />
              </div>
            ))}
        </div>

        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="hidden sm:flex absolute -right-11 top-[11.5rem] -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border bg-white shadow-md text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
