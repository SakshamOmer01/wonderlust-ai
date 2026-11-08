/**
 * MOCK DATA for Wonderlust.
 *
 * NOTE: This is a frontend placeholder. The data is static seed data
 * used to build and verify the frontend foundation. The real backend
 * API will replace this module in a later phase.
 */

import type { Destination, Testimonial, Trip, StatItem, FAQItem } from "@/types";

export const STATS: StatItem[] = [
  { label: "Destinations", value: "120+", icon: "Map" },
  { label: "Travelers served", value: "25k+", icon: "Users" },
  { label: "Curated trips", value: "850+", icon: "Compass" },
  { label: "Avg. rating", value: "4.9/5", icon: "Star" },
];

export const CATEGORIES = [
  { id: "beach", label: "Beach", icon: "Star" },
  { id: "mountain", label: "Mountain", icon: "Mountain" },
  { id: "city", label: "City", icon: "City" },
  { id: "cultural", label: "Cultural", icon: "Compass" },
  { id: "adventure", label: "Adventure", icon: "Zap" },
  { id: "wellness", label: "Wellness", icon: "Heart" },
  { id: "nature", label: "Nature", icon: "TreePine" },
] as const;

export const CONTINENTS = [
  "asia",
  "europe",
  "north-america",
  "south-america",
  "africa",
  "oceania",
] as const;

export const DESTINATION_SLUGS = [
  "bali-indonesia",
  "mauritius",
  "athens",
  "kyoto",
  "quebec-city",
  "santorini",
  "cijuela",
  "patagonia",
] as const;

export const DESTINATIONS: Destination[] = [
  {
    id: "dalat-vietnam",
    name: "Da Lat",
    slug: "dalat-vietnam",
    country: "Vietnam",
    continent: "asia",
    category: "mountain",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1600&q=80",
    rating: 4.8,
    reviewCount: 1240,
    summary:
      "A misty highland paradise known as the 'City of Eternal Spring', where pine forests, flower farms and cool lakes create a serenity rarely found elsewhere.",
    bestTimeToVisit: "February - August",
  },
  {
    id: "mauritius",
    name: "Mauritius",
    slug: "mauritius",
    country: "Mauritius",
    continent: "africa",
    category: "beach",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1600&q=80",
    rating: 4.9,
    reviewCount: 2103,
    summary:
      "A tropical gem where turquoise lagoons, coral reefs and powder-white sand meet refined French colonial charm.",
    bestTimeToVisit: "October - April",
  },
  {
    id: "athens",
    name: "Athens",
    slug: "athens",
    country: "Greece",
    continent: "europe",
    category: "cultural",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80",
    rating: 4.7,
    reviewCount: 876,
    summary:
      "Where classical antiquity meets modern life, from the Parthenon to the city's legendary Mediterranean cuisine.",
    bestTimeToVisit: "April - June",
  },
  {
    id: "kyoto",
    name: "Kyoto",
    slug: "kyoto",
    country: "Japan",
    continent: "asia",
    category: "cultural",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80",
    rating: 4.9,
    reviewCount: 1967,
    summary:
      "A city of ten thousand temples, ancient gardens and karōshi moments, Kyoto is where tradition breathes in every season.",
    bestTimeToVisit: "March - May, October - November",
  },
  {
    id: "quebec-city",
    name: "Quebec City",
    slug: "quebec-city",
    country: "Canada",
    continent: "north-america",
    category: "cultural",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80",
    rating: 4.8,
    reviewCount: 643,
    summary:
      "A fortified old town of cobblestone streets, French-speaking charm and breathtaking winter landscapes.",
    bestTimeToVisit: "June - September",
  },
  {
    id: "santorini",
    name: "Santorini",
    slug: "santorini",
    country: "Greece",
    continent: "europe",
    category: "beach",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1600&q=80",
    rating: 4.9,
    reviewCount: 2687,
    summary:
      "Whitewashed villages perched above the Aegean, where sun-bleached ruins, blue-domed churches and volcanic sand converge.",
    bestTimeToVisit: "May - October",
  },
  {
    id: "cijuela",
    name: "Cijuela",
    slug: "cijuela",
    country: "Spain",
    continent: "europe",
    category: "cultural",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1600&q=80",
    rating: 4.6,
    reviewCount: 412,
    summary:
      "A tranquil Andalusian village where whitewashed alleys, sweeping views and slow-paced living preserve centuries of tradition.",
    bestTimeToVisit: "April - June, September - October",
  },
  {
    id: "patagonia",
    name: "Patagonia",
    slug: "patagonia",
    country: "Argentina",
    continent: "south-america",
    category: "adventure",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80",
    rating: 4.8,
    reviewCount: 1198,
    summary:
      "Towering peaks, glacier-laced lakes and windswept steppes where wildness still feels entirely untamed.",
    bestTimeToVisit: "October - April",
  },
];

export const FILTER_OPTIONS = {
  continents: CONTINENTS,
  categories: CATEGORIES.map((c) => c.id),
};

export const TRIPS: Trip[] = [
  {
    id: "t1",
    title: "Bali Highlands Retreat",
    slug: "bali-highlands-retreat",
    destination: DESTINATIONS[0],
    destinationId: DESTINATIONS[0].id,
    startDate: "2027-03-12",
    endDate: "2027-03-26",
    travelers: 2,
    budget: "luxury",
    durationDays: 14,
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1600&q=80",
    price: 4850,
    featured: true,
    createdAt: "2026-01-10",
  },
  {
    id: "t2",
    title: "Mauritius Island Hopping",
    slug: "mauritius-island-hopping",
    destination: DESTINATIONS[1],
    destinationId: DESTINATIONS[1].id,
    startDate: "2027-02-03",
    endDate: "2027-02-17",
    travelers: 3,
    budget: "standard",
    durationDays: 14,
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1600&q=80",
    price: 2980,
    featured: true,
    createdAt: "2026-01-12",
  },
  {
    id: "t3",
    title: "Kyoto Cultural Immersion",
    slug: "kyoto-cultural-immersion",
    destination: DESTINATIONS[3],
    destinationId: DESTINATIONS[3].id,
    startDate: "2027-04-05",
    endDate: "2027-04-23",
    travelers: 2,
    budget: "standard",
    durationDays: 18,
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80",
    price: 3620,
    createdAt: "2026-01-15",
  },
  {
    id: "t4",
    title: "Patagonia Adventure",
    slug: "patagonia-adventure",
    destination: DESTINATIONS[7],
    destinationId: DESTINATIONS[7].id,
    startDate: "2027-11-01",
    endDate: "2027-11-22",
    travelers: 3,
    budget: "budget",
    durationDays: 21,
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80",
    price: 2150,
    createdAt: "2026-01-18",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "g1",
    name: "Amélie R.",
    location: "Paris, France",
    avatar: "https://i.pravatar.cc/120?img=11",
    quote:
      "Wonderlust planned our Greek islet hop without one detail going wrong. Every thought had been considered.",
    rating: 5,
  },
  {
    id: "g2",
    name: "James & Laura T.",
    location: "San Diego, USA",
    avatar: "https://i.pravatar.cc/120?img=47",
    quote:
      "The itinerary was astonishingly personalised. We felt looked after at every turn of the journey.",
    rating: 5,
  },
  {
    id: "g3",
    name: "Priya S.",
    location: "Toronto, Canada",
    avatar: "https://i.pravatar.cc/120?img=42",
    quote:
      "From the first enquiry to the flight, everything was seamless. Truly a destination wedding made magical.",
    rating: 5,
  },
  {
    id: "g4",
    name: "Carlos M.",
    location: "Lima, Peru",
    avatar: "https://i.pravatar.cc/120?img=68",
    quote:
      "Our Patagonia expedition exceeded all expectations. The landscape alone is worth the trip.",
    rating: 4,
  },
];

export const FAQS: FAQItem[] = [
  {
    question: "How far in advance should we plan our trip?",
    answer:
      "We recommend planning at least 8–12 weeks ahead for the best selection of dates and travel companions.",
  },
  {
    question: "Can a booking support a custom itinerary?",
    answer:
      "Absolutely. Every Wonderlust trip is tailored to your preferences, pace and interests.",
  },
  {
    question: "What is included in a trip package?",
    answer:
      "Flights, accommodation, most meals, guided activities, internal transport and 24/7 support while you travel.",
  },
  {
    question: "How is my trip insured?",
    answer:
      "Every booking includes comprehensive travel insurance covering medical emergencies, trip cancellation and flight disruptions.",
  },
];

export const NAV_LINKS = [
  { label: "Home", href: "/", icon: "Home" },
  { label: "Explore", href: "/explore", icon: "Compass" },
  { label: "Trips", href: "/trips", icon: "Calendar" },
  { label: "About", href: "/about", icon: "Info" },
  { label: "Contact", href: "/contact", icon: "Mail" },
] as const;
