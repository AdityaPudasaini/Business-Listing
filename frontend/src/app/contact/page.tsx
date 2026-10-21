import type { Metadata } from "next";
import { ContactPage } from "@/components/sections/ContactPage";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with our team — questions, feedback, or support.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return <ContactPage />;
}
