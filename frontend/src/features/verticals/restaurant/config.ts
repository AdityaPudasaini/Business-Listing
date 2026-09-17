import { Search, Calendar, Utensils } from "lucide-react";
import { VerticalConfig } from "../types";

const brandName = "RestaurantHub";

export const restaurantConfig: VerticalConfig = {
  id: "restaurant",
  brandName,
  labels: {
    business: "restaurant",
    businessOwner: "restaurant owner",
    registrationName: "Restaurant name",
    registrationNamePlaceholder: "e.g. Thamel Kitchen",
    registrationDescriptionPlaceholder: "Tell diners about your food, atmosphere, and specialties...",
    bookingTitle: "Reserve a Table",
    bookingSelection: "Dining Preference",
    heroEyebrow: "Discover local flavours near you",
    heroHeading: "Discover your next favourite meal",
    heroDescription: "Find restaurants, cafés, and local favourites near you.",
    addListing: "List a Restaurant",
    nearbyHeading: "Restaurants near you",
    nearbyDescription: "Find great food and local favourites in your area",
    nearbyEmpty: "No nearby restaurants found yet.",
    nearbyError: "Couldn't load nearby restaurants. Please try again shortly.",
    categoryDescription: "Browse restaurants by cuisine and dining style.",
    footerDescription: "Find memorable local food and trusted restaurants near you, all in one place.",
    detailBookingCta: "Reserve a Table",
    featuredTitle: "Advertisements",
  },
  booking: {
    timeWindows: [
      "Breakfast (8am - 11am)",
      "Lunch (12pm - 4pm)",
      "Dinner (5pm - 9pm)",
    ],
    extraFields: [
      {
        name: "partySize",
        label: "Number of Guests",
        placeholder: "2",
        type: "number",
        required: true,
      },
      {
        name: "notes",
        label: "Special Requests",
        placeholder: "Dietary needs, occasion, or seating preference",
      },
    ],
  },
  howItWorksSteps: [
    {
      icon: Search,
      title: `Browse ${brandName}`,
      description:
        "Find great restaurants and cafés near you, filtered by cuisine and location.",
    },
    {
      icon: Calendar,
      title: "Reserve a Table",
      description:
        "Call or message the restaurant directly and reserve your table in minutes.",
    },
    {
      icon: Utensils,
      title: "Enjoy Your Meal",
      description:
        "Show up at your reserved time and enjoy a meal made just for you.",
    },
  ],
};