import { OwnerListing } from "@/types";

const autoOwnerListings: OwnerListing[] = [
  {
    id: "owner-1",
    slug: "ring-road-auto-garage",
    name: "Ring Road Auto Garage",
    category: "Auto Garage",
    location: "Kathmandu, Nepal",
    services: ["Engine & Diagnostics", "Brakes & Suspension"],
    phone: "12345678",
    submittedAt: "2026-08-10",
    status: "published",
  },
  {
    id: "owner-2",
    slug: "speedy-bike-garage",
    name: "Speedy Bike Garage",
    category: "Bike Garage",
    location: "Lalitpur, Nepal",
    services: ["Bike Servicing"],
    phone: "98765432",
    submittedAt: "2026-08-10",
    status: "published",
  },
  {
    id: "owner-3",
    slug: "prime-auto-parts",
    name: "Prime Auto Parts",
    category: "Auto Parts",
    location: "Bhaktapur, Nepal",
    services: ["Spare Parts"],
    phone: "12345678",
    submittedAt: "2026-08-10",
    status: "published",
  },
  {
    id: "owner-4",
    slug: "clean-wheels-washing-center",
    name: "Clean Wheels Washing Center",
    category: "Washing Center",
    location: "Kathmandu, Nepal",
    services: ["Car Wash", "Detailing"],
    phone: "11223344",
    submittedAt: "2026-08-10",
    status: "pending",
  },
];

const restaurantOwnerListings: OwnerListing[] = [
  {
    id: "owner-1",
    slug: "thamel-kitchen",
    name: "Thamel Kitchen",
    category: "Nepali",
    location: "Thamel, Kathmandu",
    services: ["Nepali Set", "Momo"],
    phone: "+977 9800000001",
    submittedAt: "2026-08-10",
    status: "published",
  },
  {
    id: "owner-2",
    slug: "patan-newa-house",
    name: "Patan Newa House",
    category: "Newari",
    location: "Patan Durbar Square, Lalitpur",
    services: ["Newari Favourites"],
    phone: "+977 9800000002",
    submittedAt: "2026-08-10",
    status: "published",
  },
  {
    id: "owner-3",
    slug: "himalayan-brew-cafe",
    name: "Himalayan Brew Café",
    category: "Cafe",
    location: "Jhamsikhel, Lalitpur",
    services: ["Coffee & Brunch"],
    phone: "+977 9800000003",
    submittedAt: "2026-08-10",
    status: "published",
  },
  {
    id: "owner-4",
    slug: "momo-junction",
    name: "Momo Junction",
    category: "Momo",
    location: "New Road, Kathmandu",
    services: ["Momo & Snacks"],
    phone: "+977 9800000004",
    submittedAt: "2026-08-10",
    status: "pending",
  },
];

export const myListings: OwnerListing[] =
  process.env.NEXT_PUBLIC_VERTICAL === "restaurant"
    ? restaurantOwnerListings
    : autoOwnerListings;