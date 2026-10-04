// structuredData.ts — builders for the schema.org JSON-LD emitted by the
// homepage and listing detail pages. Pure functions: no fetching, no React.
import { absoluteUrl, siteUrl } from "@/config/site";
import { getCategoryLabel } from "@/data/categories";
import type { VerticalConfig } from "@/features/verticals";
import type { Business, DayHours } from "@/types";

export type JsonLdObject = Record<string, unknown>;

// ISO 3166-1 alpha-2. Override per deployment with NEXT_PUBLIC_COUNTRY_CODE.
const COUNTRY_CODE = process.env.NEXT_PUBLIC_COUNTRY_CODE?.trim() || "NP";

const NO_ADDRESS = "location not provided";

// Google needs absolute image/link URLs; the API can return "/uploads/x.jpg".
function toAbsolute(url?: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return absoluteUrl(url);
  return undefined; // data: URIs, bare strings — useless to a crawler
}

function toExternalUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // "example.com" or "www.example.com" typed without a scheme
  if (/^[\w-]+(\.[\w-]+)+/.test(trimmed)) return `https://${trimmed}`;
  return undefined;
}

// Most specific schema.org type we can justify from the category. Falls back
// to plain LocalBusiness, which is always valid. Order matters: "bike garage"
// must hit the motorcycle rule before the generic "garage" rule.
function schemaTypeFor(business: Business, vertical: VerticalConfig): string {
  if (vertical.id === "restaurant") {
    const c = `${business.category} ${getCategoryLabel(business.category)}`.toLowerCase();
    if (/caf[eé]|bakery|coffee/.test(c)) return "CafeOrCoffeeShop";
    return "Restaurant";
  }

  const c = `${business.category} ${getCategoryLabel(business.category)}`.toLowerCase();
  if (/bike|motorcycle|scooter/.test(c)) return "MotorcycleRepair";
  if (/parts/.test(c)) return "AutoPartsStore";
  if (/wash/.test(c)) return "AutoWash";
  if (/denting|paint|body/.test(c)) return "AutoBodyShop";
  if (/rental|rent/.test(c)) return "AutoRental";
  if (/recondition|dealer|showroom/.test(c)) return "AutoDealer";
  if (/garage|repair|workshop|service|electric/.test(c)) return "AutoRepair";
  return "LocalBusiness";
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Accepts "09:00", "9:00 AM", "6 pm" → "HH:MM" (24h), or undefined.
function to24h(value: string): string | undefined {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return undefined;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ?? "00";
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (hours > 24 || parseInt(minutes, 10) > 59) return undefined;

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

// api.ts produces rows like { day: "Monday", hours: "09:00 – 18:00" } or
// { day: "Sunday", hours: "Closed" }. Closed days are simply omitted, which is
// how schema.org expresses them. Rows we can't parse are skipped, never guessed.
function openingHoursSpec(rows?: DayHours[]): JsonLdObject[] | undefined {
  if (!rows?.length) return undefined;

  const specs: JsonLdObject[] = [];
  for (const row of rows) {
    const day = DAY_NAMES.find(
      (name) => name.toLowerCase() === row.day.trim().toLowerCase(),
    );
    if (!day) continue;

    const [rawOpen, rawClose] = row.hours.split(/\s*[–—-]\s*/);
    if (!rawOpen || !rawClose) continue; // "Closed", "By appointment", ...

    const opens = to24h(rawOpen);
    const closes = to24h(rawClose);
    if (!opens || !closes) continue;

    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${day}`,
      opens,
      closes,
    });
  }
  return specs.length ? specs : undefined;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

export function buildLocalBusinessJsonLd(
  business: Business,
  vertical: VerticalConfig,
): JsonLdObject {
  const url = absoluteUrl(`/listings/${business.slug}`);

  const images = [business.image, ...(business.gallery ?? [])]
    .map(toAbsolute)
    .filter((src): src is string => Boolean(src));

  const sameAs = [
    business.website,
    business.facebook,
    business.instagram,
    business.tiktok,
    business.linkedin,
  ]
    .map(toExternalUrl)
    .filter((href): href is string => Boolean(href));

  const hasAddress =
    business.location && business.location.toLowerCase() !== NO_ADDRESS;

  const hasRating =
    business.rating !== undefined &&
    business.rating > 0 &&
    (business.reviewCount ?? 0) > 0;

  const data: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": schemaTypeFor(business, vertical),
    "@id": `${url}#business`,
    name: business.name,
    url,
  };

  if (business.description) {
    data.description = truncate(business.description.replace(/\s+/g, " "), 500);
  }
  if (images.length) data.image = Array.from(new Set(images)).slice(0, 6);
  if (business.phone) data.telephone = business.phone;
  if (business.email) data.email = business.email;
  if (sameAs.length) data.sameAs = Array.from(new Set(sameAs));

  if (hasAddress) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: business.location,
      addressCountry: COUNTRY_CODE,
    };
  }

  if (business.latitude !== undefined && business.longitude !== undefined) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: business.latitude,
      longitude: business.longitude,
    };
  }

  const hours = openingHoursSpec(business.hoursByDay);
  if (hours) data.openingHoursSpecification = hours;

  if (business.paymentMethods?.length) {
    data.paymentAccepted = business.paymentMethods.join(", ");
  }

  // Only when real reviews exist — an empty or zero rating is invalid markup
  // and can earn a manual action for fabricated review data.
  if (hasRating) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(business.rating!.toFixed(1)),
      reviewCount: business.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Individual reviews are optional: getBusinessBySlug doesn't always load
  // them (they're fetched client-side), so this only fires when present.
  const reviews = (business.reviews ?? [])
    .filter((r) => r.rating >= 1 && r.rating <= 5 && r.authorName)
    .slice(0, 5)
    .map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorName },
      datePublished: r.createdAt,
      name: r.title || undefined,
      reviewBody: r.message || undefined,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
    }));
  if (reviews.length && hasRating) data.review = reviews;

  return data;
}

export function buildBreadcrumbJsonLd(
  items: { name: string; path: string }[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

// Category / location landing pages: a CollectionPage whose main entity is the
// list of businesses shown on the page.
export function buildCollectionJsonLd(input: {
  name: string;
  description: string;
  path: string;
  businesses: Business[];
}): JsonLdObject {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#page`,
    name: input.name,
    description: input.description,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.businesses.length,
      itemListElement: input.businesses.map((business, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/listings/${business.slug}`),
        name: business.name,
      })),
    },
  };
}

// Homepage-only: tells Google the site's name and logo (feeds the brand name
// shown in results and the knowledge panel).
export function buildSiteJsonLd(vertical: VerticalConfig): JsonLdObject[] {
  const logo = toAbsolute(vertical.logoUrl);

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: vertical.brandName,
      url: siteUrl,
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: vertical.brandName,
      url: siteUrl,
      ...(logo ? { logo } : {}),
    },
  ];
}