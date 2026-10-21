import { autoConfig } from "./auto/config";
import { restaurantConfig } from "./restaurant/config";
import { VerticalConfig, VerticalId } from "./types";
import { integration } from "@/config/integration";

export type { VerticalConfig, VerticalId } from "./types";

const verticals: Record<VerticalId, VerticalConfig> = {
  auto: autoConfig,
  restaurant: restaurantConfig,
};

// The project remains AutoHub-ready by default. Set NEXT_PUBLIC_VERTICAL to
// "restaurant" in a Bhojan Hub deployment, or replace this with a backend
// site-config request when tenant selection becomes dynamic.
export function getActiveVertical(): VerticalConfig {
  return verticals[integration.platform as VerticalId] ?? autoConfig;
}
