// CategoryShowcase.tsx — a horizontal carousel of the Auto sub-categories,

"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { theme } from "@/config/theme";
import { categories } from "@/data/categories";
import { getNearbyListings } from "@/services/api";
import { getActiveVertical } from "@/features/verticals";

const showcaseItems = categories[0]?.subCategories ?? [];

// How far one arrow click scrolls, in px — roughly two cards' width.
const SCROLL_STEP = 400;

interface CategoryShowcaseProps {
  onCategorySelect?: (categoryId: string) => void;
}

export function CategoryShowcase({ onCategorySelect }: CategoryShowcaseProps) {
  const vertical = getActiveVertical();
  const trackRef = useRef<HTMLDivElement>(null);

  // null while loading, so tiles don't flash "0 Listings" before real counts arrive.
  const [listingCounts, setListingCounts] = useState<Record<
    string,
    number
  > | null>(null);

  useEffect(() => {
    let cancelled = false;

    getNearbyListings({})
      .then((businesses) => {
        if (cancelled) return;
        const counts: Record<string, number> = {};
        for (const business of businesses) {
          counts[business.category] = (counts[business.category] ?? 0) + 1;
        }
        setListingCounts(counts);
      })
      .catch(() => {
        // If the API fails, show 0 rather than breaking the homepage.
        if (!cancelled) setListingCounts({});
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelect(id: string) {
    onCategorySelect?.(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollByStep(direction: 1 | -1) {
    trackRef.current?.scrollBy({
      left: direction * SCROLL_STEP,
      behavior: "smooth",
    });
  }

  return (
    <section className="px-6 md:px-14 pt-6 pb-20">
      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
          Choose the Category You Want
        </h2>
        <p className="mt-3 text-sm md:text-base text-gray-500">
          Browse {vertical.brandName}&apos;s{" "}
          {vertical.labels.categoryDescription}
        </p>
      </div>

      <div className="relative mt-10">
        {/* Arrow controls float over the track edges, vertically centered */}
        <button
          type="button"
          aria-label="Scroll categories left"
          onClick={() => scrollByStep(-1)}
          className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-gray-300 bg-white shadow-sm items-center justify-center text-gray-600 hover:border-[var(--arrow-hover)] hover:text-[var(--arrow-hover)] transition-colors"
          style={{ ["--arrow-hover" as string]: theme.colors.primary }}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          aria-label="Scroll categories right"
          onClick={() => scrollByStep(1)}
          className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-gray-300 bg-white shadow-sm items-center justify-center text-gray-600 hover:border-[var(--arrow-hover)] hover:text-[var(--arrow-hover)] transition-colors"
          style={{ ["--arrow-hover" as string]: theme.colors.primary }}
        >
          <ChevronRight size={20} />
        </button>

        <div
          ref={trackRef}
          className="flex justify-start gap-5 [&>:first-child]:ml-auto [&>:last-child]:mr-auto overflow-x-auto snap-x snap-mandatory scroll-smooth px-2 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {showcaseItems.map((cat) => {
            const Icon = cat.icon;
            const count = listingCounts?.[cat.id] ?? 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelect(cat.id)}
                style={{
                  ["--hover-border" as string]: theme.colors.primary,
                  ["--hover-tint" as string]: `${theme.colors.primary}0D`, // ~5% tint
                }}
                className="group relative shrink-0 snap-start w-48 sm:w-56 rounded-xl border-2 border-gray-100 bg-white px-5 py-8 text-center transition-all duration-300 ease-out hover:border-[var(--hover-border)] hover:bg-[var(--hover-tint)] hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--hover-border)]"
              >
                <div className="relative mx-auto w-fit">
                  {Icon && (
                    <Icon
                      size={48}
                      strokeWidth={1.5}
                      className="mx-auto text-gray-700 transition-all duration-300 ease-out group-hover:text-[var(--hover-border)] group-hover:scale-110"
                    />
                  )}
                  {/* small decorative "active" dot — fades and scales in rather than popping */}
                  <span
                    style={{ borderColor: theme.colors.primary }}
                    className="flex absolute -bottom-1 -right-2 h-5 w-5 rounded-full border items-center justify-center bg-white opacity-0 scale-50 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100 pointer-events-none"
                  >
                    <span
                      style={{ backgroundColor: theme.colors.primary }}
                      className="h-2 w-2 rounded-full"
                    />
                  </span>
                </div>

                <p className="mt-4 font-bold text-gray-900 text-base">
                  {cat.label}
                </p>

                <div className="relative mt-1 h-5">
                  <p className="absolute inset-x-0 text-sm text-gray-500 transition-opacity duration-300 ease-out group-hover:opacity-0">
                    {listingCounts === null
                      ? "\u00A0"
                      : `${count} ${count === 1 ? "Listing" : "Listings"}`}
                  </p>
                  <p
                    style={{ color: theme.colors.primary }}
                    className="absolute inset-x-0 text-sm font-semibold underline opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
                  >
                    View All
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
