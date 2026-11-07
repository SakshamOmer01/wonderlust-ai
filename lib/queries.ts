import type { DestinationFilter } from "@/types";

/**
 * Filter helper used by the explore page.
 *
 * NOTE: In a later phase this reads from the backend API instead of
 * the static seed data in lib/data.ts.
 */
import { filterDestinations } from "./utils";
import { DESTINATIONS, FILTER_OPTIONS } from "./data";

export function getFilteredDestinations(filters: DestinationFilter) {
  return filterDestinations(DESTINATIONS, filters);
}

export function getAvailableFilters() {
  return FILTER_OPTIONS;
}

export function getFilteredTrips() {
  // In a later phase this will query the trips endpoint.
  return [];
}
