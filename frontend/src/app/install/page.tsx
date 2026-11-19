import type { Metadata } from "next";
import { InstallPage } from "@/components/sections/InstallPage";

// noindex: this page only matters once, on a brand-new server.
export const metadata: Metadata = {
  title: "Install",
  robots: { index: false, follow: false },
};

export default function Install() {
  return <InstallPage />;
}
