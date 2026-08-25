// Card.tsx — a plain reusable content container. Use this as the base for any project-specific card (MenuCard, NewsCard, ListingCard, etc) instead of starting from scratch.
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return <div className={`rounded-lg border p-4 bg-white ${className}`}>{children}</div>;
}
