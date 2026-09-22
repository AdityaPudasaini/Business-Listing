// SearchFilterBar.tsx
// A search + filter bar (category, location, rating, price, open-now).
// Used in: The top of the listing search page.
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Star,
  Clock,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CategoryFilter } from "@/components/project/CategoryFilter";
import { theme } from "@/config/theme";

export interface SearchFilters {
  category?: string;
  location?: string;
  /** Minimum star rating, 1–5. Omit or 0 means "any rating". */
  minRating?: number;
  /** Only meaningful when `showPriceFilter` is set — most verticals price per
   * listing item (e.g. Product), not per Business, so this is opt-in rather
   * than always rendered. */
  priceMin?: number;
  priceMax?: number;
  openNow?: boolean;
}

interface SearchFilterBarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  /** Show the price range inputs. Off by default since the shared Business
   * model has no generic price field — turn this on for verticals (e.g.
   * Property, Hotel) that filter listings by price. */
  showPriceFilter?: boolean;
  className?: string;
}

const RATING_OPTIONS = [4, 3, 2, 1];

export function SearchFilterBar({
  filters,
  onFilterChange,
  onSearch,
  showPriceFilter = false,
  className = "",
}: SearchFilterBarProps) {
  const [ratingOpen, setRatingOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const ratingRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);

  // Close either popover on outside click, matching CategoryFilter's pattern.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ratingRef.current && !ratingRef.current.contains(e.target as Node)) {
        setRatingOpen(false);
      }
      if (priceRef.current && !priceRef.current.contains(e.target as Node)) {
        setPriceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function patch(next: Partial<SearchFilters>) {
    onFilterChange({ ...filters, ...next });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch();
  }

  const priceLabel =
    filters.priceMin || filters.priceMax
      ? `Rs. ${filters.priceMin ?? 0}${filters.priceMax ? ` – ${filters.priceMax}` : "+"}`
      : "Price";

  const ratingLabel = filters.minRating
    ? `${filters.minRating}+ Stars`
    : "Rating";

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm ${className}`}
    >
      {/* Location */}
      <div className="min-w-[180px] flex-1">
        <Input
          value={filters.location ?? ""}
          onChange={(e) => patch({ location: e.target.value })}
          placeholder="Search location"
          trailing={<Search size={16} className="text-gray-400" />}
          containerClassName="!px-4 !py-0"
          className="!py-2.5"
        />
      </div>

      {/* Category — reuses the same dropdown as the rest of the app */}
      <CategoryFilter
        value={filters.category}
        onChange={(category) => patch({ category })}
      />

      {/* Rating */}
      <div className="relative" ref={ratingRef}>
        <button
          type="button"
          onClick={() => setRatingOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 font-semibold text-gray-900 transition-colors duration-200 hover:bg-gray-200"
        >
          <Star
            size={16}
            className={
              filters.minRating ? "fill-yellow-500 text-yellow-500" : ""
            }
          />
          {ratingLabel}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${ratingOpen ? "rotate-180" : ""}`}
          />
        </button>

        {ratingOpen && (
          <div className="absolute z-20 mt-2 w-44 rounded-lg border bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                patch({ minRating: undefined });
                setRatingOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm font-semibold hover:bg-gray-50 ${
                !filters.minRating ? "text-gray-900" : "text-gray-600"
              }`}
            >
              Any rating
            </button>
            {RATING_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  patch({ minRating: r });
                  setRatingOpen(false);
                }}
                className={`flex w-full items-center gap-1 px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                  filters.minRating === r
                    ? "font-semibold text-gray-900"
                    : "text-gray-600"
                }`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={
                      i < r
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-gray-300"
                    }
                  />
                ))}
                <span className="ml-1">& up</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price — opt-in, since not every vertical prices at the Business level */}
      {showPriceFilter && (
        <div className="relative" ref={priceRef}>
          <button
            type="button"
            onClick={() => setPriceOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 font-semibold text-gray-900 transition-colors duration-200 hover:bg-gray-200"
          >
            <SlidersHorizontal size={16} />
            {priceLabel}
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${priceOpen ? "rotate-180" : ""}`}
            />
          </button>

          {priceOpen && (
            <div className="absolute z-20 mt-2 w-64 rounded-lg border bg-white p-4 shadow-lg">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={filters.priceMin ?? ""}
                  onChange={(e) =>
                    patch({
                      priceMin: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="Min"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--focus-border)]"
                  style={{ ["--focus-border" as string]: theme.colors.primary }}
                />
                <span className="text-gray-400">–</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={filters.priceMax ?? ""}
                  onChange={(e) =>
                    patch({
                      priceMax: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="Max"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--focus-border)]"
                  style={{ ["--focus-border" as string]: theme.colors.primary }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  patch({ priceMin: undefined, priceMax: undefined });
                  setPriceOpen(false);
                }}
                className="mt-3 text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Open Now toggle */}
      <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-900">
        <Clock
          size={16}
          className={filters.openNow ? "text-[var(--accent)]" : "text-gray-500"}
          style={{ ["--accent" as string]: theme.colors.primary }}
        />
        Open Now
        <span
          role="switch"
          aria-checked={filters.openNow ?? false}
          onClick={() => patch({ openNow: !filters.openNow })}
          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200"
          style={{
            backgroundColor: filters.openNow ? theme.colors.primary : "#d1d5db",
          }}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
              filters.openNow ? "translate-x-[18px]" : "translate-x-1"
            }`}
          />
        </span>
      </label>

      <Button
        label="Search"
        icon={<Search size={16} />}
        type="submit"
        className="justify-center"
      />
    </form>
  );
}
