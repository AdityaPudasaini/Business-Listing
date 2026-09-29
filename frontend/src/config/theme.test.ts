import { describe, expect, it } from "vitest";
import { theme, themeCssVariables } from "@/config/theme";

describe("themeCssVariables", () => {
  it("exposes every theme color as an RGB channel CSS variable", () => {
    const vars = themeCssVariables as Record<string, string>;

    expect(Object.keys(vars)).toHaveLength(Object.keys(theme.colors).length);
    expect(vars["--color-primary"]).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
  });

  it("converts hex to channels and kebab-cases the names", () => {
    const vars = themeCssVariables as Record<string, string>;

    expect(vars["--color-primary"]).toBe(hexToChannels(theme.colors.primary));
    expect(vars["--color-on-dark"]).toBe(hexToChannels(theme.colors.onDark));
    expect(vars["--color-footer-bg"]).toBeDefined();
  });
});

function hexToChannels(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}
