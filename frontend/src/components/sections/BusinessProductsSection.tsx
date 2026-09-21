import { BusinessProductCard } from "@/components/project/BusinessProductCard";
import type { BusinessProduct } from "@/types";

interface BusinessProductsSectionProps {
  products: BusinessProduct[];
  title?: string;
}

export function BusinessProductsSection({
  products,
  title = "Products & services",
}: BusinessProductsSectionProps) {
  if (!products.length) return null;

  return (
    <section className="px-6 md:px-14 pt-4 pb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <BusinessProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
