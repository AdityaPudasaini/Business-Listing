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
