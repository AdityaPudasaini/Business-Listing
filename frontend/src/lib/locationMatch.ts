

// locationMatch.ts — decides which /location/[slug] page a listing's free-text
// address belongs to. Pure and dependency-free so client components can use it
// too (lib/landing.ts, which pulls in the API layer, is server-only in spirit).
import { locations, type LocationEntry } from "@/data/locations";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const matcherCache = new Map<string, RegExp>();

function matcherFor(entry: LocationEntry): RegExp {
  let matcher = matcherCache.get(entry.slug);
  if (!matcher) {
    const names = [entry.name, ...(entry.aliases ?? [])].map(escapeRegExp);
    matcher = new RegExp(`(^|[^\\p{L}])(${names.join("|")})($|[^\\p{L}])`, "iu");
    matcherCache.set(entry.slug, matcher);
  }
  return matcher;
}

export function addressInLocation(address: string, entry: LocationEntry) {
  return matcherFor(entry).test(address);
}

/** The first configured location whose name or alias appears in the address. */
export function locationForAddress(address: string): LocationEntry | undefined {
  return locations.find((entry) => addressInLocation(address, entry));
}