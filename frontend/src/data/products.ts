// products.ts — sample "Featured Brands" data (motor oil products). Swap for a
// real API call once the backend adds a Product model/endpoint.
import { Product } from "@/types";

export const sampleProducts: Product[] = [
  {
    id: "1",
    name: "Powerex",
    subtitle: "5W30 API SN",
    badge: "5W-30",
    description:
      "Fully synthetic formula built for everyday driving, protecting engines from wear across a wide temperature range.",
    viscosity: "5W-30",
    application: "Passenger Vehicles",
    image:
      "https://images.unsplash.com/photo-1590227763209-821c686b932f?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "2",
    name: "Powerex",
    subtitle: "5W40 API CH-4 Turbo",
    badge: "Turbo Plus",
    description:
      "High-performance oil engineered for turbocharged engines under heavy load and high temperatures.",
    viscosity: "5W-40",
    application: "Turbocharged Engines",
    image:
      "https://images.unsplash.com/photo-1635437536607-b8572f443763?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "3",
    name: "TrueGuard",
    subtitle: "10W40 API SL",
    badge: "10W-40",
    description:
      "Mineral-based oil offering reliable protection for older engines and moderate driving conditions.",
    viscosity: "10W-40",
    application: "Older Engines",
    image:
      "https://images.unsplash.com/photo-1590227763209-821c686b932f?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "4",
    name: "RoadMax",
    subtitle: "0W20 API SP",
    badge: "0W-20",
    description:
      "Ultra-low viscosity synthetic oil designed for modern fuel-efficient engines and cold starts.",
    viscosity: "0W-20",
    application: "Fuel-Efficient Engines",
    image:
      "https://images.unsplash.com/photo-1635437536607-b8572f443763?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "5",
    name: "DieselPro",
    subtitle: "15W40 API CI-4",
    badge: "Heavy Duty",
    description:
      "Heavy-duty diesel formula built for commercial fleets and long-haul trucks under sustained load.",
    viscosity: "15W-40",
    application: "Diesel & Commercial",
    image:
      "https://images.unsplash.com/photo-1590227763209-821c686b932f?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "6",
    name: "MotoShield",
    subtitle: "10W30 API SN",
    badge: "10W-30",
    description:
      "Two-wheeler specific formula that protects clutch performance while keeping the engine running smoothly.",
    viscosity: "10W-30",
    application: "Motorcycles",
    image:
      "https://images.unsplash.com/photo-1635437536607-b8572f443763?auto=format&fit=crop&w=600&q=80",
  },
];