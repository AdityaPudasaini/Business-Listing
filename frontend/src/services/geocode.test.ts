// geocode.test.ts — covers how listings without coordinates get geocoded.
// Browser: Maps JS API Geocoder (works with a referrer-restricted public key).
// Server:  REST endpoint, only with GOOGLE_MAPS_SERVER_API_KEY; otherwise skipped.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PUBLIC_KEY = "public-browser-key";
const SERVER_KEY = "server-only-key";

const business = {
  id: "b1",
  name: "Test Garage",
  slug: "test-garage",
  category: "Mechanic",
  location: "Thamel, Kathmandu",
};

function mockFetch() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("https://maps.googleapis.com/")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "OK",
          results: [{ geometry: { location: { lat: 27.71, lng: 85.31 } } }],
        }),
      };
    }
    return { ok: true, status: 200, json: async () => [business] };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function mockBrowserGeocoder(geocode: ReturnType<typeof vi.fn>) {
  class FakeGeocoder {
    geocode = geocode;
  }
  (window as unknown as { google: unknown }).google = {
    maps: { places: {}, Geocoder: FakeGeocoder },
  };
}

async function loadApi() {
  vi.resetModules(); // fresh module = fresh geocode cache
  return import("@/services/api");
}

const nearby = { lat: 27.7, lng: 85.3 };

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", PUBLIC_KEY);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as unknown as { google?: unknown }).google;
});

describe("geocoding listings that have no coordinates", () => {
  it("in the browser, uses the Maps JS Geocoder and never the REST endpoint", async () => {
    const fetchMock = mockFetch();
    const geocode = vi.fn().mockResolvedValue({
      results: [{ geometry: { location: { lat: () => 27.7, lng: () => 85.3 } } }],
    });
    mockBrowserGeocoder(geocode);

    const { getNearbyListings } = await loadApi();
    const [result] = await getNearbyListings(nearby);

    expect(geocode).toHaveBeenCalledWith({ address: "Thamel, Kathmandu" });
    expect(result.latitude).toBe(27.7);
    expect(result.longitude).toBe(85.3);
    expect(result.distanceKm).toBeDefined();
    const calledGoogleRest = fetchMock.mock.calls.some(([url]) =>
      String(url).includes("maps.googleapis.com"),
    );
    expect(calledGoogleRest).toBe(false);
  });

  it("caches a genuine ZERO_RESULTS answer so it isn't asked again", async () => {
    mockFetch();
    const geocode = vi.fn().mockRejectedValue({ code: "ZERO_RESULTS" });
    mockBrowserGeocoder(geocode);

    const { getNearbyListings } = await loadApi();
    const [first] = await getNearbyListings(nearby);
    await getNearbyListings(nearby);

    expect(first.latitude).toBeUndefined();
    expect(geocode).toHaveBeenCalledTimes(1);
  });

  it("does not cache transient failures (e.g. denied key), so it retries", async () => {
    mockFetch();
    const geocode = vi.fn().mockRejectedValue({ code: "REQUEST_DENIED" });
    mockBrowserGeocoder(geocode);

    const { getNearbyListings } = await loadApi();
    const [first] = await getNearbyListings(nearby);
    await getNearbyListings(nearby);

    expect(first.latitude).toBeUndefined(); // degrades gracefully, no throw
    expect(geocode).toHaveBeenCalledTimes(2);
  });

  it("on the server without a server key, skips geocoding and doesn't hang", async () => {
    const fetchMock = mockFetch();
    const { getNearbyListings } = await loadApi();

    vi.stubGlobal("window", undefined); // simulate server rendering
    const [result] = await getNearbyListings(nearby);

    expect(result.latitude).toBeUndefined();
    const calledGoogleRest = fetchMock.mock.calls.some(([url]) =>
      String(url).includes("maps.googleapis.com"),
    );
    expect(calledGoogleRest).toBe(false);
  });

  it("on the server with a server key, uses REST with that key (not the public one)", async () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", SERVER_KEY);
    const fetchMock = mockFetch();
    const { getNearbyListings } = await loadApi();

    vi.stubGlobal("window", undefined);
    const [result] = await getNearbyListings(nearby);

    const googleCall = fetchMock.mock.calls
      .map(([url]) => String(url))
      .find((url) => url.includes("maps.googleapis.com"));
    expect(googleCall).toContain(`key=${SERVER_KEY}`);
    expect(googleCall).not.toContain(PUBLIC_KEY);
    expect(result.latitude).toBe(27.71);
    expect(result.longitude).toBe(85.31);
  });
});