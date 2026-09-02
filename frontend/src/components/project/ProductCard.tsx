// ProductCard.tsx — used in "Our Featured Brands". Default state: dark card,
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative h-72 rounded-2xl overflow-hidden bg-black cursor-pointer transition-shadow duration-300 hover:shadow-xl">
      {/* Product image — fades and scales down slightly on hover to make room for the detail panel */}
      <img
        src={product.image}
        alt={product.name}
        className="absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-out group-hover:opacity-0 group-hover:scale-95"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent transition-opacity duration-500 group-hover:opacity-0" />

      {/* Spec badge, top-right — present in both states */}
      <span className="absolute top-4 right-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900 shadow-sm transition-colors duration-500 group-hover:bg-gray-100">
        {product.badge}
      </span>

      {/* Default: name + subtitle, bottom-left over the image */}
      <div className="absolute inset-x-0 bottom-0 p-5 transition-opacity duration-300 group-hover:opacity-0">
        <h3 className="text-lg font-bold text-white">{product.name}</h3>
        <p className="text-sm text-gray-200">{product.subtitle}</p>
      </div>

      {/* Hover: white detail panel */}
      <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 opacity-0 scale-95 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100">
        <div>
          <h3 className="pr-20 text-lg font-bold text-gray-900">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{product.subtitle}</p>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {product.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
              Viscosity
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              {product.viscosity}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
              Application
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              {product.application}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
