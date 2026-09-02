// AddressAutocomplete.tsx — address input wired to Google Places Autocomplete
// (suggestions as you type) plus a free "Locate Me" button using the browser's
// built-in geolocation. See hooks/useGoogleMapsScript.ts for the required
// .env.local key.
"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
import { theme } from "@/config/theme";

interface Coords {
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  value: string;
  onValueChange: (address: string) => void;
  onCoordsChange: (coords: Coords | undefined) => void;
}

export function AddressAutocomplete({
  value,
  onValueChange,
  onCoordsChange,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scriptLoaded = useGoogleMapsScript();
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!scriptLoaded || !inputRef.current) return;
    const google = (window as any).google;
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

        const google = (window as any).google;
        if (!scriptLoaded || !google?.maps?.Geocoder) {
          onValueChange("Current Location");
          setLocating(false);
          return;
        }

        new google.maps.Geocoder().geocode(
          { location: coords },
          (results: any, status: string) => {
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
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div
      style={{ ["--focus-ring" as string]: theme.colors.primary }}
      className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 bg-white/90 shadow-lg transition-colors duration-200 hover:border-gray-400 focus-within:border-[var(--focus-ring)] focus-within:ring-1 focus-within:ring-[var(--focus-ring)]"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
          onCoordsChange(undefined); // typing manually invalidates a previously picked location
        }}
        placeholder="Enter your Address"
        className="w-full py-3 text-sm outline-none bg-transparent"
      />
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        className="flex items-center gap-1.5 text-sm text-gray-500 border-l-2 border-gray-400 pl-3 shrink-0 hover:text-gray-900 transition-colors disabled:opacity-50"
      >
        {locating ? (
          <MapPin size={16} className="animate-pulse" />
        ) : (
          <LocateFixed size={16} />
        )}
        {locating ? "Locating..." : "Locate Me"}
      </button>
    </div>
  );
}
