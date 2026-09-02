import { categories as staticCategories } from "@/data/categories";
import { sampleBusinesses } from "@/data/sampleBusinesses";
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
  // TODO: replace with a real fetch once wired to the backend, e.g.
  // return apiGet<Business[]>(`/businesses?category=${params.category ?? ""}&lat=${params.lat ?? ""}&lng=${params.lng ?? ""}`);
  let results = sampleBusinesses;

  if (params.category) {
    results = results.filter((b) => b.category === params.category);
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