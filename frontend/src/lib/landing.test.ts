import { describe, expect, it } from "vitest";
import { clip, listingsInCategory, listingsInLocation } from "@/lib/landing";
import { locationForAddress } from "@/lib/locationMatch";
import { locations } from "@/data/locations";
import { buildListingSummary } from "@/lib/listingSummary";
import type { Business } from "@/types";

function business(overrides: Partial<Business> = {}): Business {
  return {
    id: "1",
    slug: "test-garage",
    name: "Test Garage",
    image: "/x.png",
    category: "auto-garage",
    location: "Thamel, Kathmandu",
    ...overrides,
  };
}

describe("location matching", () => {
  it("matches a city name and a neighbourhood alias", () => {
    expect(locationForAddress("Thamel, Kathmandu")?.slug).toBe("kathmandu");
    expect(locationForAddress("Jawalakhel")?.slug).toBe("lalitpur");
  });

  it("matches whole words only and ignores case", () => {
    expect(locationForAddress("KATHMANDU")?.slug).toBe("kathmandu");
    expect(locationForAddress("Kathmanduville")).toBeUndefined();
  });

  it("returns nothing for an address with no known place", () => {
    expect(locationForAddress("Location not provided")).toBeUndefined();
  });

  it("filters listings by location", () => {
    const kathmandu = locations.find((l) => l.slug === "kathmandu")!;
    const list = [business(), business({ id: "2", location: "Pulchowk, Lalitpur" })];
    expect(listingsInLocation(list, kathmandu).map((b) => b.id)).toEqual(["1"]);
  });
});

describe("category matching", () => {
  it("a parent category includes its children", () => {
    const parent = { id: "auto", label: "Auto", matchIds: ["auto", "auto-garage", "bike-garage"], isParent: true };
    const list = [business(), business({ id: "2", category: "bike-garage" }), business({ id: "3", category: "nepali" })];
    expect(listingsInCategory(list, parent).map((b) => b.id)).toEqual(["1", "2"]);
  });
});

describe("clip", () => {
  it("leaves short text alone and cuts long text at a word", () => {
    expect(clip("short text")).toBe("short text");
    const long = "word ".repeat(60);
    const out = clip(long, 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/wor…$/);
  });
});

describe("buildListingSummary", () => {
  it("states only facts the listing has", () => {
    const text = buildListingSummary(
      business({
        rating: 4.5,
        reviewCount: 2,
        services: [{ label: "Repairs", items: ["Brake Service", "Oil Change"] }],
        paymentMethods: ["Cash", "eSewa"],
      }),
      "Auto Garage",
    );
    expect(text).toContain("Test Garage is listed under Auto Garage in Thamel, Kathmandu.");
    expect(text).toContain("4.5 out of 5 from 2 reviews");
    expect(text).toContain("Services include Brake Service and Oil Change.");
    expect(text).toContain("Cash and eSewa");
    expect(text).not.toContain("Facilities");
  });

  it("omits the location and rating when unknown", () => {
    const text = buildListingSummary(
      business({ location: "Location not provided", rating: 0 }),
      "Auto Garage",
    );
    expect(text).toBe("Test Garage is listed under Auto Garage.");
  });
});