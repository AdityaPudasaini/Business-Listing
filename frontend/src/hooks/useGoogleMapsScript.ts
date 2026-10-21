"use client";
// useGoogleMapsScript — loads the Google Maps JavaScript API (with the Places
// https://console.cloud.google.com/google/maps-apis
import { useEffect, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

// Pass `enabled = false` to postpone loading the (large) Maps script until it
// is actually needed. Defaults to true so existing callers behave as before.
export function useGoogleMapsScript(enabled: boolean = true) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return loaded;
}