// cookieConsent.ts — single source of truth for the cookie choice.


export type ConsentChoice = "accepted" | "declined";

const KEY = "cookie-consent";
const EVENT = "cookie-consent-change";

export function getConsent(): ConsentChoice | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(KEY, choice);
  } catch {
    /* storage blocked — the choice just won't persist */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: choice }));
}

export function hasOptionalConsent(): boolean {
  return getConsent() === "accepted";
}

// Use this to start analytics etc. the moment the user clicks Accept.
export function onConsentChange(cb: (choice: ConsentChoice) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<ConsentChoice>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}