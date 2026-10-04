// listingSummary.ts — a plain-sentence summary of what we know about a listing,
// for the detail page. Many listings (especially imported ones) have a one-line
// description or none; this turns the structured fields we do have into real,
// crawlable text. It only states facts present on the listing — never invents.
import type { Business } from "@/types";

const MAX_SERVICES = 10;

function list(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function buildListingSummary(
  business: Business,
  categoryLabel: string,
): string {
  const parts: string[] = [];

  const hasLocation =
    business.location && business.location.toLowerCase() !== "location not provided";
  parts.push(
    hasLocation
      ? `${business.name} is listed under ${categoryLabel} in ${business.location}.`
      : `${business.name} is listed under ${categoryLabel}.`,
  );

  if (business.rating && business.rating > 0 && (business.reviewCount ?? 0) > 0) {
    const count = business.reviewCount!;
    parts.push(
      `It has an average rating of ${business.rating.toFixed(1)} out of 5 from ${count} ${count === 1 ? "review" : "reviews"}.`,
    );
  }

  const services = (business.services ?? [])
    .flatMap((group) => (group.items?.length ? group.items : [group.label]))
    .filter(Boolean);
  if (services.length) {
    const shown = services.slice(0, MAX_SERVICES);
    parts.push(
      `Services include ${list(shown)}${services.length > shown.length ? ", and more" : ""}.`,
    );
  }

  // Per-day hours when we have them ("Hours vary by day" says nothing).
  if (business.hoursByDay?.length) {
    const days = business.hoursByDay.map((row) =>
      row.hours.toLowerCase() === "closed"
        ? `${row.day} closed`
        : `${row.day} ${row.hours}`,
    );
    parts.push(`Opening hours: ${days.join(", ")}.`);
  } else if (business.hours) {
    parts.push(`Opening hours: ${business.hours}.`);
  }

  const amenities = (business.amenities ?? []).map((a) => a.label).filter(Boolean);
  if (amenities.length) parts.push(`Facilities: ${list(amenities)}.`);

  if (business.paymentMethods?.length) {
    parts.push(`Accepted payment methods: ${list(business.paymentMethods)}.`);
  }

  return parts.join(" ");
}