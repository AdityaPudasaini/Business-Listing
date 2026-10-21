import { integration } from "@/config/integration";

// Uploaded images live at <api>/files/<name>. The database may hold an old
// origin (localhost, a previous domain), so rebuild the URL from the current
// API base. External images (Unsplash, CDNs) are left alone.
function isOwnUpload(value: string) {
  if (value.startsWith("/files/")) return true;
  try {
    const url = new URL(value);
    return (
      url.pathname.startsWith("/files/") &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

export function publicImageUrl(value?: string | null): string {
  if (!value) return "";
  const base = integration.apiBaseUrl;
  if (!base || !isOwnUpload(value)) return value;
  const path = value.startsWith("/files/")
    ? value
    : new URL(value).pathname;
  return `${base}${path}`;
}