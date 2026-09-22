import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppChrome } from "@/components/layout/AppChrome";
import { getActiveVertical } from "@/features/verticals";
import { theme } from "@/config/theme";
import { siteUrl } from "@/config/site";

const vertical = getActiveVertical();
const description = `${vertical.brandName} — find trusted local businesses near you.`;

// Every other page's metadata (see listings/[slug]/page.tsx, about/page.tsx,
// etc.) is merged on top of this by Next's metadata resolution, so brand
// name, OG image and canonical base only need to live here once.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: vertical.brandName,
    template: `%s | ${vertical.brandName}`,
  },
  description,
  applicationName: vertical.brandName,
  // Search engines are allowed by default; pages behind auth (dashboard,
  // admin) override this with `robots: { index: false }` in their own
  // metadata export.
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  // app/opengraph-image.tsx (social preview) are picked up automatically by
  // Next's file-convention routes and injected into <head> on their own.
};

// Kept separate from `metadata` per Next's convention (colocating it in
// `metadata.viewport` is deprecated as of Next 14).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: theme.colors.primary,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
