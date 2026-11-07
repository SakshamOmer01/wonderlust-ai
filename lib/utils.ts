import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Destination, DestinationFilter } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Capitalize the first letter of a string. */
export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/** Format a currency string in USD. */
export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/**
 * Return a filtered array of destinations matching the current filter state.
 */
export function filterDestinations(
  destinations: Destination[],
  filters: DestinationFilter
) {
  return destinations.filter((destination) => {
    const q = filters.search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      destination.name.toLowerCase().includes(q) ||
      destination.country.toLowerCase().includes(q) ||
      destination.category.toLowerCase().includes(q);

    const matchesContinent =
      !filters.continent || destination.continent === filters.continent;

    const matchesCategory =
      !filters.category || destination.category === filters.category;

    return matchesSearch && matchesContinent && matchesCategory;
  });
}

/** Deterministic slug from a title (backend-independent). */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
