// Card.tsx — a plain reusable content container. Use this as the base for any project-specific card (MenuCard, NewsCard, ListingCard, etc) instead of starting from scratch.
interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noPadding?: boolean; // set true when a child (e.g. an edge-to-edge image) needs to touch the card's border
}

export function Card({
  children,
  className = "",
  style,
  noPadding = false,
}: CardProps) {
  return (
    <div
      style={style}
      className={`rounded-lg border bg-white ${noPadding ? "" : "p-4"} ${className}`}
    >
      {children}
    </div>
  );
}
