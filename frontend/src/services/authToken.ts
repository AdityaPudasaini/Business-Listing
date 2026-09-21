// authToken.ts — holds the logged-in user's JWT for the API layer.
//
// Deliberately framework-free: services/api.ts imports this, and api.ts also
// runs inside server components (see app/listings/[slug]/page.tsx). Anything
// that pulled in React, zustand or localStorage at module scope would break
// there, so every storage access is guarded.
//
// Trade-off worth knowing: localStorage is readable by any script on the page,
// so a JWT kept here is exposed to XSS. The backend issues bearer tokens with
// no refresh flow and no cookie option, so this is the pragmatic fit for now.
// If the API later sets an httpOnly cookie, delete this file and put
// `credentials: "include"` back on the fetch calls in api.ts.

const STORAGE_KEY = "bl.accessToken";

let cachedToken: string | null = null;
let hydrated = false;

function canUseStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

export function getAccessToken(): string | null {
  // Server render: there is no per-user token, and that is fine — every route
  // we call from the server (listings list, listing detail) is public.
  if (!canUseStorage()) return null;

  if (!hydrated) {
    try {
      cachedToken = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      cachedToken = null;
    }
    hydrated = true;
  }

  return cachedToken;
}

export function setAccessToken(token: string | null) {
  cachedToken = token;
  hydrated = true;

  if (!canUseStorage()) return;

  try {
    if (token) window.localStorage.setItem(STORAGE_KEY, token);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or storage disabled. The in-memory copy still works for
    // this tab, so the session survives until reload.
  }
}

export function clearAccessToken() {
  setAccessToken(null);
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}