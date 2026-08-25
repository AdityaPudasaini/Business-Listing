// Footer.tsx — the site footer, shown on every page via layout.tsx.
import { theme } from "@/config/theme";

export function Footer() {
  return (
    <footer className="border-t mt-12">
      <div className="max-w-6xl mx-auto p-4 text-sm text-gray-500 text-center">
        © {new Date().getFullYear()} {theme.brandName}. All rights reserved.
      </div>
    </footer>
  );
}
