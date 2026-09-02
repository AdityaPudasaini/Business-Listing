// FeaturedBrands.tsx — "Our Featured Brands": a grid of ProductCard, each
// flipping from a compact dark preview to a detailed white panel on hover.
import Link from "next/link";
import { ProductCard } from "@/components/project/ProductCard";
import { sampleProducts } from "@/data/products";
import { Product } from "@/types";

interface FeaturedBrandsProps {
  products?: Product[];
  title?: string;
}

export function FeaturedBrands({
  products = sampleProducts,
  title = "Our Featured Brands",
}: FeaturedBrandsProps) {
  if (products.length === 0) return null;

  return (
    <section className="px-6 md:px-14 pt-4 pb-16">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          {title}
        </h2>
        <Link
          href="/brands"
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
