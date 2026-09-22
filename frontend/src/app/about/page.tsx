import type { Metadata } from "next";
import { AboutPage } from "@/components/sections/AboutPage";

// The stats strip now pulls live counts from the API (see AboutPage.tsx) —
// revalidate hourly rather than refetching on every single page view, since
// business/category counts don't change minute to minute.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about our mission to connect you with trusted local businesses.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return <AboutPage />;
}
