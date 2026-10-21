// googleMapsLoader.ts — loads the Google Maps JavaScript API (with the Places
// library) once per page and shares the promise. Browser-only: never call this
// during server rendering. Kept out of the "use client" hook file so that
// services/api.ts (which also runs on the server) can import it safely.

let scriptPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;
    if (window.google?.maps?.places) {
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