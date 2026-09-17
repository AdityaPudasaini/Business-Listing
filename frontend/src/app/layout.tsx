// layout.tsx — the root layout that wraps every page (Navbar + Footer live here, not on each page).
import type { Metadata } from "next";
import { ChatWidget } from "@/components/project/ChatWidget";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { theme } from "@/config/theme";
import { getActiveVertical } from "@/features/verticals";

const vertical = getActiveVertical();

export const metadata: Metadata = {
  title: vertical.brandName,
  description: `${vertical.brandName} — find trusted local businesses near you.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  );
}
