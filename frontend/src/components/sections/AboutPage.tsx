// AboutPage.tsx — the /about page. No live reference data here (no

import {
  Search,
  ListChecks,
  PhoneCall,
  ShieldCheck,
  MapPinned,
  Building2,
  Users,
  TrendingUp,
  HeartHandshake,
} from "lucide-react";
import { FeaturedBrands } from "@/components/sections/FeaturedBrands";
import { OwnABusiness } from "@/components/sections/OwnABusiness";
import { theme } from "@/config/theme";

const STATS = [
  { icon: Building2, value: "500+", label: "Businesses Listed" },
  { icon: MapPinned, value: "7", label: "Cities Covered" },
  { icon: Users, value: "10K+", label: "Monthly Visitors" },
  { icon: TrendingUp, value: "50+", label: "Categories" },
];

const STEPS = [
  {
    icon: Search,
    title: "Search",
    description:
      "Find garages, shops, and services near you by category, name, or your current location.",
  },
  {
    icon: ListChecks,
    title: "Compare",
    description:
      "Check ratings, reviews, opening hours, and services offered before you decide.",
  },
  {
    icon: PhoneCall,
    title: "Connect",
    description:
      "Call, message, or book directly through the listing — no middleman, no hassle.",
  },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Verified Listings",
    description:
      "Every business on Localist is checked before it goes live, so you're never guessing.",
  },
  {
    icon: HeartHandshake,
    title: "Built for Local",
    description:
      "We focus on the businesses in your own neighborhood — not faceless national chains.",
  },
  {
    icon: Users,
    title: "Real Reviews",
    description:
      "Ratings come from real customers, not paid placements or fake stars.",
  },
];

export function AboutPage() {
  return (
    <div className="pt-24 sm:pt-28 pb-16">
      {/* Hero */}
      <section
        style={{ backgroundColor: theme.colors.surface }}
        className="px-4 sm:px-6 md:px-10 py-16 sm:py-20 text-center"
      >
        <p
          style={{ color: theme.colors.primary }}
          className="text-xs font-semibold uppercase tracking-wide"
        >
          About Us
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900">
          Connecting You to Your Neighborhood
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-gray-600">
          {theme.brandName} helps you discover trusted local businesses — from
          your neighborhood garage to your go-to repair shop — all in one place,
          without endless searching or unreliable word of mouth.
        </p>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 md:px-10 -mt-8 sm:-mt-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm"
            >
              <span
                style={{
                  ["--accent-tint" as string]: `${theme.colors.primary}0D`,
                  ["--accent" as string]: theme.colors.primary,
                }}
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-tint)] text-[var(--accent)]"
              >
                <Icon size={18} />
              </span>
              <p className="mt-3 text-2xl font-extrabold text-gray-900">
                {value}
              </p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="px-4 sm:px-6 md:px-10 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Our Story
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            {theme.brandName} started with a simple frustration: finding a
            reliable local business shouldn't mean scrolling through outdated
            listings or asking around town. So we built a place where local
            businesses can be found, compared, and contacted in minutes — built
            around real reviews, real hours, and real people, not paid rankings.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section
        style={{ backgroundColor: theme.colors.muted }}
        className="px-4 sm:px-6 md:px-10 py-16 sm:py-20"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900">
            How {theme.brandName} Works
          </h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map(({ icon: Icon, title, description }, i) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <div className="flex items-center gap-3">
                  <span
                    style={{ backgroundColor: theme.colors.primary }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
                  >
                    {i + 1}
                  </span>
                  <Icon size={20} className="text-gray-400" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="px-4 sm:px-6 md:px-10 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900">
            Why Choose Us
          </h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {VALUES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center">
                <span
                  style={{
                    ["--accent-tint" as string]: `${theme.colors.primary}0D`,
                    ["--accent" as string]: theme.colors.primary,
                  }}
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-tint)] text-[var(--accent)]"
                >
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Brands — reused as-is for visual consistency */}
      <FeaturedBrands />

      {/* CTA — reuses the same "Own a local business?" section as the
          homepage, so both pages share one visual and one source of truth. */}
      <OwnABusiness />
    </div>
  );
}
