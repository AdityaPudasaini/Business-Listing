// slugify.ts
// Turns a business name into a URL-safe slug, e.g. "Test Café!" -> "test-cafe"

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')                  // split accented chars, e.g. é -> e + accent mark
    .replace(/[\u0300-\u036f]/g, '')   // strip the accent marks
    .replace(/[^a-z0-9]+/g, '-')       // any run of non-alphanumeric chars -> single hyphen
    .replace(/^-+|-+$/g, '');          // trim leading/trailing hyphens
}