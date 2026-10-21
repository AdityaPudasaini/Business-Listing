// slugify.ts — turns a business name into a URL-safe slug for /listings/[slug].
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Business names aren't guaranteed unique — de-duplicate by appending
// -2, -3, ... to later occurrences.
export function withUniqueSlugs<T extends { name: string }>(
  items: T[],
): (T & { slug: string })[] {
  const seen = new Map<string, number>();

  return items.map((item) => {
    const base = slugify(item.name) || "listing";
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);

    return { ...item, slug: count === 1 ? base : `${base}-${count}` };
  });
}