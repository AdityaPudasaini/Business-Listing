// The `google` namespace types come from @types/google.maps. At runtime the
// global only exists once useGoogleMapsScript has loaded the Maps script, so
// feature checks go through the optional `window.google`.
declare global {
  interface Window {
    google?: typeof google;
  }
}

export {};
