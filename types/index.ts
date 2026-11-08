/** Core domain types for Wonderlust. */

/** Root layout and page-level metadata props. */
export interface PageProps {
  children: React.ReactNode;
}

/** A destination returned by the (not-yet-built) backend. */
export interface Destination {
  id: string;
  name: string;
  slug: string;
  country: string;
  continent: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  summary: string;
  bestTimeToVisit: string;
}

export type DestinationCategory =
  | "beach"
  | "mountain"
  | "city"
  | "cultural"
  | "adventure"
  | "wellness"
  | "nature";

export type Continent =
  | "asia"
  | "europe"
  | "north-america"
  | "south-america"
  | "africa"
  | "oceania"
  | "antartica";

export interface Trip {
  id: string;
  title: string;
  slug: string;
  destination: Destination;
  destinationId: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: "budget" | "standard" | "luxury";
  durationDays: number;
  image: string;
  price: number;
  featured?: boolean;
  createdAt: string;
}

export interface TripFormData {
  title: string;
  destinationId: string;
  destinationSlug: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: "budget" | "standard" | "luxury";
  durationDays: number;
  image: string;
}

export interface DestinationFilter {
  search: string;
  continent: string;
  category: string;
}

export interface FilterOptions {
  continents: Continent[];
  categories: DestinationCategory[];
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  avatar: string;
  quote: string;
  rating: number;
}

export interface StatItem {
  label: string;
  value: string;
  icon: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}
