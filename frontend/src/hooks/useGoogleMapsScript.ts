"use client";
// useGoogleMapsScript — loads the Google Maps JavaScript API (with the Places
// https://console.cloud.google.com/google/maps-apis
import { useEffect, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

export function useGoogleMapsScript() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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
  }, []);

  return loaded;
}