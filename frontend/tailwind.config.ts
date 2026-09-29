// tailwind.config.ts — Tailwind theme setup. Color values live in
// src/config/theme.ts and reach the page as CSS variables (see app/layout.tsx);
// these entries only point Tailwind at those variables.
import type { Config } from "tailwindcss";

const channel = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "primary": channel("primary"),
        "secondary": channel("secondary"),
        "accent": channel("accent"),
        "nav-bg": channel("nav-bg"),
        "surface": channel("surface"),
        "muted": channel("muted"),
        "on-dark": channel("on-dark"),
        "footer-bg": channel("footer-bg"),
      },
    },
  },
  plugins: [],
};
export default config;
