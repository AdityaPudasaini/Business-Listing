// services.ts — the master "Services Offered" catalog, used by both the

import { ServiceCategory } from "@/types";

export const serviceCatalog: ServiceCategory[] = [
  {
    label: "Vehicle Type",
    items: [
      "Petrol Vehicles",
      "Diesel Vehicles",
      "All Types of Small Petrol/Diesel Vehicles",
      "Construction Machinery (Dozer, Excavator, Road Roller, etc.)",
      "Electric Vehicles",
    ],
  },
  {
    label: "Washing & Cleaning",
    items: [
      "Bike Washing / Cleaning",
      "Small Vehicle Washing / Cleaning",
      "Interior Cleaning",
      "Car Detailing / Polishing",
      "Ceramic Coating / Waxing",
    ],
  },
  {
    label: "Mechanical",
    items: [
      "Brake Service",
      "Engine Repair",
      "Transmission Service",
      "Suspension & Steering Service",
      "Engine Overhaul",
      "Clutch Repair / Replacement",
      "Oil Change Service",
      "AC Repair / Gas Filling",
      "AC Servicing & Filter Cleaning",
      "Radiator / Cooling System Service",
      "Exhaust / Silencer Repair",
      "Oil Leak Repair",
    ],
  },
  {
    label: "Tire / Wheel",
    items: [
      "Tire Change",
      "Wheel Alignment",
      "Tire Balancing",
      "Puncture Repair",
    ],
  },
  {
    label: "Electrical / Diagnostics",
    items: [
      "Engine Diagnostics",
      "Computer Scanning & Programming",
      "Check Engine Light Diagnosis",
      "Electrical Diagnostics",
      "Headlight / Tail-light Repair & Replacement",
      "Wiring / Fuse Repair",
      "Car Key / Remote Programming",
    ],
  },
];
