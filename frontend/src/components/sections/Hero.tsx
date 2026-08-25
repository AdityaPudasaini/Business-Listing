// Hero.tsx — the big banner section at the top of the homepage. Copy this pattern for any other homepage section (About, Gallery, Reviews, etc).
import { theme } from "@/config/theme";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="py-20 text-center" style={{ backgroundColor: `${theme.colors.primary}10` }}>
      <h1 className="text-4xl font-bold">{theme.brandName}</h1>
      <p className="text-gray-600 mt-3">Replace this subtitle with the real homepage headline.</p>
      <div className="mt-6">
        <Button label="Get Started" />
      </div>
    </section>
  );
}
