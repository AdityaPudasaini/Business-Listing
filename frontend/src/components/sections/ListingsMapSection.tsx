// ListingsMapSection.tsx — the filter bar + map at the top of /listings, plus
"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  Send,
  MapPin,
  Search as SearchIcon,
} from "lucide-react";
import { AddressAutocomplete } from "@/components/project/AddressAutocomplete";
import { CategoryFilter } from "@/components/project/CategoryFilter";
import { ListingCard } from "@/components/project/ListingCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
import { getNearbyListings } from "@/services/api";
import { theme } from "@/config/theme";
import { Business } from "@/types";

type SortOption = "alphabetical" | "distance";
type SearchMode = "location" | "name";

const SORT_LABELS: Record<SortOption, string> = {
  alphabetical: "Alphabetical (A–Z)",
  distance: "Distance (Nearest)",
};

// Kathmandu — matches the center point already used across your sample data.
const DEFAULT_CENTER = { lat: 27.7172, lng: 85.324 };

interface AppliedFilters {
  category?: string;
  searchText: string;
  sortBy: SortOption;
  location: { lat: number; lng: number } | null;
}

interface ListingsMapSectionProps {
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
}

export function ListingsMapSection({
  initialAddress,
  initialLat,
  initialLng,
}: ListingsMapSectionProps) {
  const initialLocation =
    initialLat !== undefined && initialLng !== undefined
      ? { lat: initialLat, lng: initialLng }
      : null;

  // Draft filters — what's currently sitting in the bar, not yet applied.
  const [searchMode, setSearchMode] = useState<SearchMode>("location");
  const [category, setCategory] = useState<string>();
  const [searchText, setSearchText] = useState(initialAddress ?? "");
  const [sortBy, setSortBy] = useState<SortOption>(
    initialLocation ? "distance" : "alphabetical",
  );
  const [sortOpen, setSortOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(initialLocation);

  // Applied filters — only updated when "Send" is clicked, except for
  // whatever came in from the homepage search, which applies immediately.
  const [applied, setApplied] = useState<AppliedFilters>({
    category: undefined,
    searchText: initialAddress ?? "",
    sortBy: initialLocation ? "distance" : "alphabetical",
    location: initialLocation,
  });

  const [listings, setListings] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const mapsLoaded = useGoogleMapsScript();
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Flipping the switch starts each mode fresh so a leftover address string
  // or a previously-picked coordinate never leaks into the other mode.
  function toggleSearchMode() {
    const next: SearchMode = searchMode === "location" ? "name" : "location";
    setSearchMode(next);
    setSearchText("");
    setUserLocation(null);
  }

  // Fetch + locally filter/sort whenever the applied filters change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getNearbyListings({
      category: applied.category,
      lat: applied.location?.lat,
      lng: applied.location?.lng,
    })
      .then((data) => {
        if (cancelled) return;
        let results = data;

        // Only run the free-text match when there's no resolved coordinate.
        if (applied.searchText && !applied.location) {
          const q = applied.searchText.toLowerCase();
          results = results.filter(
            (b) =>
              b.name.toLowerCase().includes(q) ||
              b.location.toLowerCase().includes(q) ||
              b.category.toLowerCase().includes(q) ||
              (b.description?.toLowerCase().includes(q) ?? false),
          );
        }

        if (applied.sortBy === "alphabetical") {
          results = [...results].sort((a, b) => a.name.localeCompare(b.name));
        }
        // "distance" sort is already applied by getNearbyListings whenever
        // applied.location is set — nothing extra to do here for that case.

        setListings(results);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applied]);

  // Create the map once the Google Maps script has loaded.
  useEffect(() => {
    if (!mapsLoaded || !mapDivRef.current || mapInstanceRef.current) return;
    const google = (window as any).google;
    mapInstanceRef.current = new google.maps.Map(mapDivRef.current, {
      center: userLocation ?? DEFAULT_CENTER,
      zoom: userLocation ? 14 : 12,
      streetViewControl: true,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_LEFT,
      },
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
    });
  }, [mapsLoaded]);

  // Re-plot markers whenever the listings list changes.
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const google = (window as any).google;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    listings.forEach((biz) => {
      if (biz.latitude === undefined || biz.longitude === undefined) return;
      const position = { lat: biz.latitude, lng: biz.longitude };
      const marker = new google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: biz.name,
      });
      marker.addListener("click", () => {
        window.location.href = `/listings/${biz.id}`;
      });
      markersRef.current.push(marker);
      bounds.extend(position);
      hasPoints = true;
    });

    if (hasPoints) mapInstanceRef.current.fitBounds(bounds, 60);
  }, [listings]);

  function handleSend() {
    setApplied({ category, searchText, sortBy, location: userLocation });
  }

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-24 sm:pt-28 pb-10">
      {/* Filter bar — items sit directly on the shared gray bar (no individual
          white boxes) except Search and Send, matching the wireframe. */}
      <div className="relative z-10 flex flex-wrap items-center gap-4 sm:gap-6 rounded-lg border border-gray-200 bg-white px-4 sm:px-6 py-3 shadow-lg -translate-y-0.5">
        {/* Sort By — dropdown, same interaction pattern as CategoryFilter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-2 font-semibold text-gray-900 transition-colors duration-200 hover:text-gray-600"
          >
            <ArrowUpDown size={16} />
            Sort By
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}
            />
          </button>

          {sortOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setSortOpen(false)}
              />
              <div className="absolute z-20 mt-2 w-56 rounded-lg border bg-white py-1 shadow-lg">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSortBy(opt);
                      setSortOpen(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm transition-colors duration-150 hover:bg-gray-50 ${
                      sortBy === opt
                        ? "font-semibold text-gray-900"
                        : "text-gray-600"
                    }`}
                  >
                    {SORT_LABELS[opt]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex min-w-[240px] flex-1 items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={searchMode === "location"}
            onClick={toggleSearchMode}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 transition-colors duration-300 ease-in-out"
          >
            {searchMode === "location" ? (
              <MapPin
                size={16}
                className="text-red-500 transition-colors duration-300 ease-in-out"
              />
            ) : (
              <SearchIcon
                size={16}
                className="text-gray-500 transition-colors duration-300 ease-in-out"
              />
            )}
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap transition-colors duration-300 ease-in-out">
              {searchMode === "location" ? "Location" : "Name"}
            </span>
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out ${
                searchMode === "location" ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ease-in-out ${
                  searchMode === "location" ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </span>
          </button>

          <div className="relative flex-1">
            <div
              className={`transition-opacity duration-300 ease-in-out ${
                searchMode === "location"
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none absolute inset-0"
              }`}
            >
              <AddressAutocomplete
                value={searchMode === "location" ? searchText : ""}
                onValueChange={setSearchText}
                onCoordsChange={(coords) => {
                  setUserLocation(coords ?? null);
                  if (coords) setSortBy("distance");
                }}
                hideHoverEffect
              />
            </div>

            <div
              className={`transition-opacity duration-300 ease-in-out ${
                searchMode === "name"
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none absolute inset-0"
              }`}
            >
              <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 bg-white">
                <input
                  value={searchMode === "name" ? searchText : ""}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by name"
                  className="w-full py-3 text-sm outline-none bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <CategoryFilter
          value={category}
          onChange={setCategory}
          showIcon={false}
        />

        <Button
          label="Send"
          icon={<Send size={16} />}
          variant="secondary"
          onClick={handleSend}
        />
      </div>

      {/* Map */}
      <div className="mt-4 h-[320px] w-full overflow-hidden rounded-xl border border-gray-200 sm:h-[380px] md:h-[440px] shadow-md -translate-y-0.5">
        {mapsLoaded ? (
          <div ref={mapDivRef} className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50 text-sm text-gray-400">
            Loading map...
          </div>
        )}
      </div>

      {/* Results grid — 3 per row, matching the wireframe's row of cards
          below the map. Reuses the existing ListingCard component. */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <LoadingSpinner />}
        {!loading && listings.length === 0 && (
          <div className="col-span-full">
            <EmptyState message="No listings match your filters." />
          </div>
        )}
        {!loading &&
          listings.map((biz) => (
            <ListingCard
              key={biz.id}
              business={biz}
              onClick={() => (window.location.href = `/listings/${biz.id}`)}
            />
          ))}
      </div>
    </section>
  );
}
