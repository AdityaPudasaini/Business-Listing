import { categories as staticCategories, businessMatchesCategory } from "@/data/categories";
import { sampleBusinesses } from "@/data/sampleBusinesses";
import { heroImages } from "@/data/heroImages";
import { distanceKm } from "@/lib/distance";
import { Category, Business } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API POST ${path} failed: ${res.status}`);
  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  return staticCategories;
}

export async function getNearbyListings(params: {
  location?: string;
  category?: string;
  lat?: number;
  lng?: number;
}): Promise<Business[]> {
  let results = sampleBusinesses;

  if (params.category) {
    results = results.filter((b) => businessMatchesCategory(b.category, params.category!));
  }

  if (params.lat !== undefined && params.lng !== undefined) {
    results = results
      .filter((b) => b.latitude !== undefined && b.longitude !== undefined)
      .map((b) => ({
        ...b,
        distanceKm: distanceKm(
          { lat: params.lat!, lng: params.lng! },
          { lat: b.latitude!, lng: b.longitude! }
        ),
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  } else if (params.location) {
    results = results.filter((b) =>
      b.location.toLowerCase().includes(params.location!.toLowerCase())
    );
  }

  return results;
}

// getBusinessById — looks up a single business by id for the /listings/[id]
export async function getBusinessById(id: string): Promise<Business | undefined> {
  const business = sampleBusinesses.find((b) => b.id === id);
  if (!business) return undefined;

  return {
    ...business,
    hours: business.hours ?? "9:00 AM - 7:00 PM, Daily",
    email: business.email ?? "info@example.com",
    gallery: business.gallery ?? [business.image, ...heroImages].slice(0, 4),
  };
}