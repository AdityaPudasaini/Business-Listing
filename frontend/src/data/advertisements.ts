// advertisements.ts — sample "Advertisements" data for the restaurant

import { Advertisement } from "@/types";

export const sampleAdvertisements: Advertisement[] = [
  {
    id: "1",
    title: "Dashain Thali Special",
    subtitle: "Valid through the festival season",
    badge: "20% OFF",
    description:
      "Celebrate Dashain with a full traditional thali spread — book ahead to guarantee a table for your family gathering.",
    image:
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "2",
    title: "Momo Monday",
    subtitle: "Every Monday, all locations",
    badge: "Buy 1 Get 1",
    description:
      "Start the week right — steamed or fried, our partner kitchens are running buy-one-get-one on momo plates every Monday.",
    image:
      "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "3",
    title: "Weekend Brunch Combo",
    subtitle: "Saturday & Sunday, 9am - 1pm",
    badge: "Limited Time",
    description:
      "A curated brunch set with a hot drink included, available only on weekends at select partner restaurants.",
    image:
      "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80",
  },
];