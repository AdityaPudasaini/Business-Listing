// ListingCard.tsx
// A reusable listing card — the same component works for a car dealership, hotel, or property listing.
// Used in: Featured Listings, Search results grid, Nearby section.

import { Card } from "@/components/ui/Card";
import { RatingStars } from "./RatingStars";

interface Business {
  id: string;
  name: string;
  image: string;
  rating: number;
  category: string;
  location: string;
}

interface ListingCardProps {
  business: Business;
  onClick?: () => void;
}

export function ListingCard({ business, onClick }: ListingCardProps) {
  return (
    <Card className="p-0 overflow-hidden cursor-pointer">
      <div onClick={onClick}>
        <img
          src={business.image}
          alt={business.name}
          className="w-full h-40 object-cover"
        />
        <div className="p-3">
          <h4 className="font-semibold">{business.name}</h4>
          <p className="text-sm text-gray-500">
            {business.category} · {business.location}
          </p>
          <RatingStars rating={business.rating} readOnly />
        </div>
      </div>
    </Card>
  );
}
