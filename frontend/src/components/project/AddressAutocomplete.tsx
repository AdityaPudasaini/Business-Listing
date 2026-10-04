// AddressAutocomplete.tsx — address input wired to Google Places Autocomplete

"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

interface Coords {
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  value: string;
  onValueChange: (address: string) => void;
  onCoordsChange: (coords: Coords | undefined) => void;
  // Opt out of the hover border — used on /listings, where the bar sits in
  // a busier row and the hover felt like noise. Homepage Hero leaves this
  // unset so its behavior is unchanged.
  hideHoverEffect?: boolean;
}

export function AddressAutocomplete({
  value,
  onValueChange,
  onCoordsChange,
  hideHoverEffect = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // The Maps script is large, so don't download it on page load. Start loading
  // when the visitor first hovers, touches or focuses the address box.
  const [wantMaps, setWantMaps] = useState(false);
  const scriptLoaded = useGoogleMapsScript(wantMaps);
  const startLoadingMaps = () => setWantMaps(true);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!scriptLoaded || !inputRef.current) return;
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) onValueChange(place.formatted_address);
      if (place.geometry?.location) {
        onCoordsChange({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [scriptLoaded, onValueChange, onCoordsChange]);

  function handleLocateMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        onCoordsChange(coords);
        onValueChange("Locating address..."); // shown briefly while we reverse-geocode

        // Make sure the Maps script is loaded (it may not be yet, since it is
        // deferred until the address box is used), then reverse-geocode.
        loadGoogleMaps()
          .then(() => {
            if (!window.google?.maps?.Geocoder) {
              onValueChange("Current Location");
              setLocating(false);
              return;
            }
            new google.maps.Geocoder().geocode(
              { location: coords },
              (results, status) => {
                if (status === "OK" && results?.[0]?.formatted_address) {
                  onValueChange(results[0].formatted_address);
                } else {
                  // Reverse geocoding failed (rare) — fall back rather than
                  // leaving the input on the "Locating address..." placeholder.
                  onValueChange("Current Location");
                }
                setLocating(false);
              },
            );
          })
          .catch(() => {
            onValueChange("Current Location");
            setLocating(false);
          });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div
      onPointerEnter={startLoadingMaps}
      onTouchStart={startLoadingMaps}
      onFocusCapture={startLoadingMaps}
      className={`flex min-w-0 flex-1 items-center gap-2 border border-gray-300 rounded-lg px-3 bg-white/90 shadow-lg transition-colors duration-200 ${
        hideHoverEffect ? "" : "hover:border-gray-400"
      } focus-within:border-primary focus-within:ring-1 focus-within:ring-primary`}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
          onCoordsChange(undefined); // typing manually invalidates a previously picked location
        }}
        placeholder="Enter your Address"
        // min-w-0 lets the input shrink below its default intrinsic width —
        // without it, on narrow screens the input refuses to shrink and pushes
        // the Locate Me button off screen instead.
        className="w-full min-w-0 py-3 text-sm outline-none bg-transparent"
      />
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        aria-label={locating ? "Locating..." : "Locate Me"}
        className="flex shrink-0 items-center gap-1.5 border-l-2 border-gray-400 pl-2 sm:pl-3 text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
      >
        {locating ? (
          <MapPin size={16} className="shrink-0 animate-pulse" />
        ) : (
          <LocateFixed size={16} className="shrink-0" />
        )}
        {/* Text collapses to icon-only below sm so the button never forces
            the row wider than the screen. */}
        <span className="hidden sm:inline">
          {locating ? "Locating..." : "Locate Me"}
        </span>
      </button>
    </div>
  );
}
