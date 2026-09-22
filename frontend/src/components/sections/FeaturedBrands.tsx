import Link from "next/link";
import { ProductCard } from "@/components/project/ProductCard";
import { AdvertisementCard } from "@/components/project/AdvertisementCard";
import { sampleProducts } from "@/data/products";
import { sampleAdvertisements } from "@/data/advertisements";
import { Product } from "@/types";
import { getActiveVertical } from "@/features/verticals";

interface FeaturedBrandsProps {
  products?: Product[];
  title?: string;
}

export function FeaturedBrands({
  products = sampleProducts,
  title,
}: FeaturedBrandsProps) {
  const vertical = getActiveVertical();
  const heading = title ?? vertical.labels.featuredTitle;

  // Restaurant deployment: same section, different content — a promo/ad
  // grid instead of a product spec sheet, since Product's fields
  // (viscosity, application) don't mean anything for a restaurant.
  if (vertical.id === "restaurant") {
    if (sampleAdvertisements.length === 0) return null;

    return (
      <section className="px-6 md:px-14 pt-4 pb-16">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {heading}
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleAdvertisements.map((ad) => (
            <AdvertisementCard key={ad.id} ad={ad} />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="px-6 md:px-14 pt-4 pb-16">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          {heading}
        </h2>
        <Link
          href="https://luvyatrading.com"
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap text-base font-semibold text-gray-900 underline underline-offset-4 decoration-2 hover:opacity-70 transition-opacity"
        >
          View all
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
