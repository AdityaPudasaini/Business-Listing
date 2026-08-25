// Navbar.tsx — the site header, shown on every page via layout.tsx. Reads the brand name from theme.ts so it never needs to change per client.
import { theme } from "@/config/theme";

export function Navbar() {
  return (
    <header className="border-b">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <span className="font-bold text-lg" style={{ color: theme.colors.primary }}>
          {theme.brandName}
        </span>
        <nav className="flex gap-6 text-sm">
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </header>
  );
}
