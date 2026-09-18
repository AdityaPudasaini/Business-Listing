import type { Metadata } from "next";
import "./globals.css";
import { AppChrome } from "@/components/layout/AppChrome";
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
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
