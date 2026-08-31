// api.ts — a single place to call the backend API. Swap the placeholder logic below for real fetch calls once the backend team gives you the base URL.
import { categories as staticCategories } from "@/data/categories";
import { Category } from "@/types";

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