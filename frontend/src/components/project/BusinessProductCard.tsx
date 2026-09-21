// BusinessProductCard.tsx — displays one real product/menu item fetched from
// GET /businesses/:businessId/products. Kept separate from ProductCard.tsx,
// which renders the static, auto-parts-specific "Featured Brands" home
// section (viscosity/application fields that don't apply to a generic
// business's real product catalog).
import type { BusinessProduct } from "@/types";
import { theme } from "@/config/theme";

interface BusinessProductCardProps {
  product: BusinessProduct;
}

export function BusinessProductCard({ product }: BusinessProductCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-40 w-full bg-gray-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-wide text-gray-400">
            No image
          </div>
        )}
        {!product.isAvailable && (
          <span className="absolute left-3 top-3 rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-bold text-white">
            Unavailable
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900">{product.name}</h3>
          {product.price !== undefined && (
            <span
              style={{ color: theme.colors.primary }}
              className="whitespace-nowrap text-sm font-extrabold"
            >
              Rs {product.price.toLocaleString()}
            </span>
          )}
        </div>

        {product.category && (
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {product.category}
          </p>
        )}

        {product.description && (
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {product.description}
          </p>
        )}
      </div>
    </div>
  );
}
