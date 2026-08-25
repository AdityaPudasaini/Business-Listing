// layout.tsx — the root layout that wraps every page (Navbar + Footer live here, not on each page).
import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { theme } from "@/config/theme";

export const metadata: Metadata = {
  title: theme.brandName,
  description: `${theme.brandName} — built on the shared commercial theme architecture`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
