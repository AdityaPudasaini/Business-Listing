// landingCopy.ts — hand-written intro text for category landing pages.
//
// Keys are category ids (see data/autoCategories.ts and
// data/restaurantCategories.ts). Categories without an entry fall back to a
// generic sentence built from the category name, so a category added in the
// admin dashboard still gets a working page — add copy here to improve it.
//
// Each entry is one or two short paragraphs. Keep them factual: they sit at
// the top of a page Google reads to decide what the page is about.

export const categoryCopy: Record<string, string[]> = {
  // --- Auto ---------------------------------------------------------------
  auto: [
    "Everything for keeping a vehicle on the road: garages and workshops, parts shops, washing centres, denting and painting, rentals and more. Pick a category or a location below to narrow down the list.",
  ],
  "auto-garage": [
    "Auto garages handle everyday car servicing and repair: oil and filter changes, brakes, suspension, tyres and wheel alignment, clutch and engine work, and computer diagnostics.",
    "Compare garages by area and reviews, check which services each one lists and its opening hours, then call or book directly from the listing.",
  ],
  "heavy-vehicle-garage": [
    "Heavy vehicle garages service and repair trucks, buses, tippers and other commercial vehicles, including engine overhauls, brake and axle work, and on-site breakdown help.",
    "Check each listing for the vehicle types it works on and whether it offers roadside or on-site service.",
  ],
  "bike-garage": [
    "Bike garages service and repair motorcycles and scooters: general servicing, chain and brake work, tyre changes, engine tuning and electrical faults.",
    "Browse bike garages by area, read reviews from other riders, and contact the workshop directly from its listing.",
  ],
  "auto-parts": [
    "Auto parts shops sell spare parts and accessories for cars, bikes and commercial vehicles, from filters, batteries and tyres to brake pads and lighting.",
    "Open a listing to see what the shop stocks, where it is and how to reach it.",
  ],
  "auto-recondition": [
    "Recondition centres prepare and refurbish used vehicles for sale. Open a listing to see what the centre does and how to contact it.",
  ],
  "auto-rental": [
    "Vehicle rental businesses that hire out cars and other vehicles by the day or longer. Check each listing for the vehicles available, location and contact details.",
  ],
  "denting-painting": [
    "Denting and painting workshops repair body damage, remove dents and scratches, and respray panels or whole vehicles.",
    "Compare workshops by area and reviews, then contact them directly for a quote.",
  ],
  "washing-center": [
    "Washing centres clean vehicles inside and out, from a basic wash to detailing and polishing.",
    "Find one near you and check its opening hours and services before you go.",
  ],
  "electric-vehicle-garage": [
    "Electric vehicle garages service and repair electric cars and scooters, including battery, charging and drivetrain work.",
    "Listings show the services each garage offers and how to contact it.",
  ],

  // --- Restaurants --------------------------------------------------------
  restaurant: [
    "Restaurants, cafés and eateries, from traditional Nepali kitchens to international menus. Choose a cuisine or a location below to narrow down the list.",
  ],
  nepali: [
    "Restaurants serving Nepali cuisine, from everyday dal bhat to regional specialities. Open a listing for the menu, opening hours and contact details.",
  ],
  newari: [
    "Restaurants serving Newari food, the traditional cuisine of the Newar community in the Kathmandu Valley. Open a listing for the menu, hours and contact details.",
  ],
  cafe: [
    "Cafés and bakeries for coffee, tea, pastries and light meals. Open a listing for hours, location and contact details.",
  ],
  international: [
    "Restaurants serving international cuisine. Open a listing for the menu, opening hours and contact details.",
  ],
  momo: [
    "Places to eat momo and other snacks. Open a listing for the menu, opening hours and contact details.",
  ],
  dessert: [
    "Dessert shops and sweet spots. Open a listing for what is on offer, opening hours and contact details.",
  ],
};