import { HomePage } from "@/components/sections/HomePage";
import { JsonLd } from "@/components/seo/JsonLd";
import { getActiveVertical } from "@/features/verticals";
import { buildSiteJsonLd } from "@/lib/structuredData";
import { getHeroImages, getNearbyListings } from "@/services/api";

// Fetched on the server so the listings are in the initial HTML for search
// engines. A failed fetch passes undefined, and that section retries in the
// browser instead of taking the whole page down.
//
// Categories are not fetched here: they carry their icon as a React component,
// which can't be serialized from a server component to a client one.
export default async function Page() {
  const [listings, heroImages] = await Promise.all([
    getNearbyListings({}).catch(() => undefined),
    getHeroImages().catch(() => undefined),
  ]);

  return (
    <>
      <JsonLd data={buildSiteJsonLd(getActiveVertical())} />
      <HomePage
        initialListings={listings}
        initialHeroImages={heroImages?.map((image) => image.url)}
      />
    </>
  );
}
