"use client";
// OwnABusiness.tsx — the "Own a local business?" banner near the bottom
import { Button } from "@/components/ui/Button";
import { theme } from "@/config/theme";

export function OwnABusiness() {
  const registerHref =
    theme.nav.links.find((l) => l.label === "Register Your Business")?.href ??
    "/register";

  return (
    <section
      className="relative mx-6 md:mx-14 mt-10 mb-10 overflow-hidden rounded-3xl px-6 py-14 text-center bg-secondary"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-20 h-96 w-96 rounded-full blur-3xl bg-primary"
        style={{ opacity: 0.55 }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full blur-3xl bg-primary"
        style={{ opacity: 0.45 }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-primary"
        style={{ opacity: 0.12 }}
      />

      <div className="relative">
        <h2
          className="text-2xl md:text-3xl font-extrabold text-on-dark"
        >
          Own a local business?
        </h2>
        <p
          className="mt-3 max-w-xl mx-auto text-sm md:text-base text-on-dark/70"
        >
          List your business for free, connect with customers, and start
          collecting reviews today.
        </p>
        <div className="mt-6">
          <Button
            label="Get Started"
            onClick={() => (window.location.href = registerHref)}
            className="px-40 py-3 text-base"
          />
        </div>
      </div>
    </section>
  );
}
