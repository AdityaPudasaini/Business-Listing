// tailwind.config.ts — Tailwind theme setup. Colors pull from src/config/theme.ts at build time if you wire them in; for now they are static defaults.
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#B11226",
        secondary: "#000000",
        accent: "#D4AF37",
      },
    },
  },
  plugins: [],
};
export default config;
