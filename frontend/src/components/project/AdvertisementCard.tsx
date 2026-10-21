// AdvertisementCard.tsx — used in "Advertisements" (the restaurant-vertical
// equivalent of FeaturedBrands/ProductCard). Same hover-flip visual language
// as ProductCard so the two verticals still feel like one theme, but the
// content is a promo (title/badge/description) instead of a product spec sheet.
import Image from "next/image";
import { Advertisement } from "@/types";

interface AdvertisementCardProps {
  ad: Advertisement;
}

export function AdvertisementCard({ ad }: AdvertisementCardProps) {
  return (
    <div className="group relative h-72 rounded-2xl overflow-hidden bg-black cursor-pointer transition-shadow duration-300 hover:shadow-xl">
      <Image
        src={ad.image}
        alt={ad.title}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-all duration-500 ease-out group-hover:opacity-0 group-hover:scale-95"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent transition-opacity duration-500 group-hover:opacity-0" />

      <span className="absolute top-4 right-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900 shadow-sm transition-colors duration-500 group-hover:bg-gray-100">
        {ad.badge}
      </span>

      <div className="absolute inset-x-0 bottom-0 p-5 transition-opacity duration-300 group-hover:opacity-0">
        <h3 className="text-lg font-bold text-white">{ad.title}</h3>
        <p className="text-sm text-gray-200">{ad.subtitle}</p>
      </div>

      <div className="absolute inset-0 flex flex-col justify-center rounded-2xl border border-gray-200 bg-white p-5 opacity-0 scale-95 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100">
        <h3 className="pr-20 text-lg font-bold text-gray-900">{ad.title}</h3>
        <p className="mt-1 text-sm text-gray-500">{ad.subtitle}</p>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          {ad.description}
        </p>
      </div>
    </div>
  );
}
