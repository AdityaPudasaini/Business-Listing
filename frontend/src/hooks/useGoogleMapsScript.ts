"use client";
// useGoogleMapsScript — loads the Google Maps JavaScript API (with the Places
// library) exactly once, no matter how many components need it. Requires
// NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local (Places API + Maps JavaScript
// API enabled on that key) — get one free at
// https://console.cloud.google.com/google/maps-apis
import { useEffect, useState } from "react";

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;
    if ((window as any).google?.maps?.places) {
      resolve();
      return;
    }
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function useGoogleMapsScript() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadScript()
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