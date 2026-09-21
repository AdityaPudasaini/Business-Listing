
import { apiUpload } from "@/services/api";

export async function resolveImage(
  value: File | string | null | undefined
): Promise<string | null | undefined> {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "string") return value;
  return apiUpload(value);
}

export async function resolveGallery(
  items: (File | string)[]
): Promise<string[]> {
  return Promise.all(
    items.map((item) => (typeof item === "string" ? item : apiUpload(item)))
  );
}