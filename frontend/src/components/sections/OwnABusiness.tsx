// OwnABusiness.tsx — the "Own a local business?" banner near the bottom
import { Button } from "@/components/ui/Button";
import { theme } from "@/config/theme";

export function OwnABusiness() {
  const registerHref =
    theme.nav.links.find((l) => l.label === "Register Your Business")?.href ??
    "/register";

  return (
    <section
      style={{ backgroundColor: theme.colors.muted }}
      className="mx-6 md:mx-14 mt-10 mb-10 px-6 py-14 text-center rounded-3xl"
    >
      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
        Own a local business?
      </h2>
      <p className="mt-3 text-sm md:text-base text-gray-400 max-w-xl mx-auto">
        List your business for free, connect with customers, and start
        collecting reviews today.
      </p>
      <div className="mt-6">
        <Button
          label="Get Started"
          onClick={() => (window.location.href = registerHref)}
          className="px-20 py-3 text-base"
        />
      </div>
    </section>
  );
}
