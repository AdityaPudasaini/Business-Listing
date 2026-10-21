// RatingStars.tsx
// A star-rating component used both for display and for collecting a review rating.
// Used in: ListingCard, Detail page, Review form.

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  readOnly?: boolean;
  onChange?: (r: number) => void;
  className?: string;
}

export function RatingStars({
  rating,
  maxRating = 5,
  readOnly,
  onChange,
  className = "",
}: RatingStarsProps) {
  return (
    <div className={`flex gap-1 ${className}`}>
      {Array.from({ length: maxRating }).map((_, i) => (
        <span
          key={i}
          onClick={() => !readOnly && onChange?.(i + 1)}
          className={`${i < rating ? "text-yellow-500" : "text-gray-300"} ${
            !readOnly ? "cursor-pointer" : ""
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
