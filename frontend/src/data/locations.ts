// locations.ts — the places that get their own /location/[slug] landing page.
//
// A listing belongs to a location when its free-text address contains the
// location's `name` or any of its `aliases` (case-insensitive, whole words).
// Pages are only published (and added to the sitemap) for locations that
// actually have listings, so it is safe to keep extra places in this list.
//
// To add a place: add an entry here. Optionally write a one- or two-sentence
// `blurb` — real, specific text is what makes the page worth ranking.

export interface LocationEntry {
  slug: string;
  name: string;
  /** Other names or neighbourhoods that appear in listing addresses. */
  aliases?: string[];
  /** Optional hand-written sentence(s) shown at the top of the page. */
  blurb?: string;
}

export const locations: LocationEntry[] = [
  {
    slug: "kathmandu",
    name: "Kathmandu",
    aliases: [
      "Thamel",
      "Baneshwor",
      "Koteshwor",
      "Maharajgunj",
      "Balaju",
      "Kalanki",
      "Chabahil",
      "Boudha",
      "Tripureshwor",
      "Putalisadak",
      "Naxal",
      "Lazimpat",
    ],
    blurb:
      "Kathmandu is Nepal's capital and its busiest city, so it has the widest choice of workshops and services in the country.",
  },
  {
    slug: "lalitpur",
    name: "Lalitpur",
    aliases: [
      "Patan",
      "Jawalakhel",
      "Pulchowk",
      "Kupondole",
      "Lagankhel",
      "Satdobato",
      "Imadol",
      "Ekantakuna",
    ],
    blurb:
      "Lalitpur, also known as Patan, sits just south of Kathmandu across the Bagmati River and is part of the same Kathmandu Valley urban area.",
  },
  {
    slug: "bhaktapur",
    name: "Bhaktapur",
    aliases: ["Thimi", "Suryabinayak", "Lokanthali"],
    blurb:
      "Bhaktapur is the third main city of the Kathmandu Valley, east of Kathmandu.",
  },
  {
    slug: "pokhara",
    name: "Pokhara",
    aliases: ["Lakeside"],
  },
  { slug: "biratnagar", name: "Biratnagar" },
  { slug: "birgunj", name: "Birgunj" },
  { slug: "butwal", name: "Butwal" },
  { slug: "bharatpur", name: "Bharatpur", aliases: ["Chitwan"] },
  { slug: "hetauda", name: "Hetauda" },
  { slug: "dharan", name: "Dharan" },
  { slug: "itahari", name: "Itahari" },
  { slug: "janakpur", name: "Janakpur" },
  { slug: "nepalgunj", name: "Nepalgunj" },
  { slug: "dhangadhi", name: "Dhangadhi" },
];