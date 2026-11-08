/**
 * Unit tests for the Phase 3 trip planner.
 *
 * Tests: buildTripPlan, buildFallbackItinerary, estimateBreakdown
 */

import { describe, it, expect } from "vitest";
import { buildTripPlan } from "../lib/trip-plan";
import { buildFallbackItinerary } from "../lib/trip-plan";
import { estimateBreakdown } from "../lib/budget";

describe("buildTripPlan", () => {
  it("should build a deterministic plan when AI is not configured", async () => {
    const result = await buildTripPlan({
      destination: "Paris, France",
      start: "2027-06-01",
      end: "2027-06-08",
      travelers: 2,
      budget: "standard",
      interests: "sightseeing, food",
      travelStyle: "standard",
    });

    expect(result).toBeDefined();
    expect(result.plan).toBeDefined();
    const plan = result.plan!;
    expect(plan).toHaveProperty("title");
    expect(plan).toHaveProperty("destination");
    expect(plan).toHaveProperty("itinerary");
    expect(plan).toHaveProperty("budget");
    expect(Array.isArray(plan.itinerary)).toBe(true);
    expect(plan.itinerary.length).toBeGreaterThan(0);
    expect(plan.budget).toHaveProperty("accommodation");
    expect(plan.budget).toHaveProperty("food");
    expect(plan.budget).toHaveProperty("total");
  });

  it("should fallback to deterministic plan when AI is missing", async () => {
    const result = await buildTripPlan({
      destination: "Tokyo, Japan",
      start: "2027-08-15",
      end: "2027-08-25",
      travelers: 3,
      budget: "budget",
      interests: "culture, nature",
      travelStyle: "standard",
    });

    expect(result).toBeDefined();
    expect(result.plan).toBeDefined();
    const plan = result.plan!;
    expect(plan.destination).toBeDefined();
    expect(plan.destination?.country).toBe("japan");
    expect(plan.budget).toBeDefined();
    expect(plan.budget?.total).toBeGreaterThan(0);
  });

  it("should handle missing destination gracefully", async () => {
    const result = await buildTripPlan({
      start: "2027-07-01",
      end: "2027-07-10",
      travelers: 1,
      budget: "luxury",
      interests: "",
      travelStyle: "adventure",
    });

    expect(result).toBeDefined();
    expect(result.plan).toBeDefined();
    const plan = result.plan!;
    expect(plan.destination).toBeDefined();
  });
});

describe("buildFallbackItinerary", () => {
  it("should generate itinerary for a 7-day trip", () => {
    const itinerary = buildFallbackItinerary("France", new Date("2027-06-01"), new Date("2027-06-08"), 2, "standard");

    expect(Array.isArray(itinerary)).toBe(true);
    expect(itinerary.length).toBe(7);
    expect(itinerary[0].day).toBe(1);
    expect(itinerary[0]).toHaveProperty("morning");
    expect(itinerary[0]).toHaveProperty("afternoon");
    expect(itinerary[0]).toHaveProperty("evening");
    expect(itinerary[0]).toHaveProperty("foods");
    expect(itinerary[0]).toHaveProperty("transport");
    expect(itinerary[0]).toHaveProperty("tips");
  });

  it("should handle 1-day trip (minimum 1 night)", () => {
    const itinerary = buildFallbackItinerary("Tokyo", new Date("2027-08-01"), new Date("2027-08-03"), 2, "budget");

    expect(itinerary.length).toBeGreaterThanOrEqual(1);
    expect(itinerary[0].day).toBe(1);
  });

  it("should generate budget-aware tips", () => {
    const standard = buildFallbackItinerary("Paris", new Date("2027-06-01"), new Date("2027-06-08"), 2, "standard");
    const budget = buildFallbackItinerary("Paris", new Date("2027-06-01"), new Date("2027-06-08"), 2, "budget");

    expect(standard[0].tips[0]).toContain("Pre-book");
    expect(budget[0].tips[0]).toContain("Travel light");
  });
});

describe("estimateBreakdown", () => {
  it("should estimate a budget breakdown for a standard trip", () => {
    const breakdown = estimateBreakdown("standard", "France", 7, 2);

    expect(breakdown).toBeDefined();
    expect(breakdown.accommodation).toBeGreaterThan(0);
    expect(breakdown.food).toBeGreaterThan(0);
    expect(breakdown.transportation).toBeGreaterThan(0);
    expect(breakdown.activity).toBeGreaterThan(0);
    expect(breakdown.other).toBeGreaterThan(0);
    expect(breakdown.total).toBeGreaterThan(0);
  });

  it("should estimate lower budget for budget style", () => {
    const standard = estimateBreakdown("standard", "France", 7, 2);
    const budget = estimateBreakdown("budget", "France", 7, 2);

    expect(budget.total).toBeLessThan(standard.total);
  });

  it("should estimate higher budget for luxury style", () => {
    const standard = estimateBreakdown("standard", "France", 7, 2);
    const luxury = estimateBreakdown("luxury", "France", 7, 2);

    expect(luxury.total).toBeGreaterThan(standard.total);
  });

  it("should scale with nights and travelers", () => {
    const short = estimateBreakdown("standard", "Japan", 3, 1);
    const long = estimateBreakdown("standard", "Japan", 7, 1);

    expect(long.total).toBeGreaterThan(short.total);
  });

  it("should handle 1-night trip", () => {
    const breakdown = estimateBreakdown("budget", "Tokyo", 1, 2);

    expect(breakdown.total).toBeGreaterThan(0);
    expect(breakdown.accommodation).toBeGreaterThan(0);
  });
});
