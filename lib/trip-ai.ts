/**
 * Server-side database operations for the Phase 3 AI features.
 *
 * All reads are scoped to the authenticated caller (where applicable) and the
 * data is stored as validated JSON/structured tables. Returns null for resources
 * that do not belong to the caller.
 */

import { prisma } from "@/lib/db";
import type { TripPlanContents } from "@/lib/ai";

/**
 * Upsert (create-or-replace) the structured AI plan for a trip owned by
 * `userId`. Returns the persisted row; throws if the trip does not exist or
 * does not belong to the caller.
 */
export async function upsertTripAiPlan(
  userId: string,
  tripId: string,
  plan: TripPlanContents
) {
  // Ownership is enforced by the caller; we verify here so the route cannot be
  // tricked into storing a plan for a foreign trip.
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  }) as unknown as { id: string; userId: string | null } | null;
  if (!trip) {
    throw new Error("TRIP_NOT_FOUND");
  }
  if (trip.userId !== userId) {
    throw new Error("FORBIDDEN");
  }

  return prisma.tripAiPlan.upsert({
    where: { tripId },
    create: {
      tripId,
      contents: {
        title: plan.title,
        destination: plan.destination,
        start: plan.start,
        end: plan.end,
        travelers: plan.travelers,
        style: plan.style,
        interests: plan.interests,
        itinerary: plan.itinerary,
        budget: plan.budget,
      },
    },
    update: {
      contents: {
        title: plan.title,
        destination: plan.destination,
        start: plan.start,
        end: plan.end,
        travelers: plan.travelers,
        style: plan.style,
        interests: plan.interests,
        itinerary: plan.itinerary,
        budget: plan.budget,
      },
    },
  });
}

/**
 * Read the structured AI plan for a trip owned by `userId`.
 * Returns null when the trip is missing or belongs to another user.
 */
export async function getTripAiPlan(userId: string, tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, userId: true },
  });

  if (!trip || trip.userId !== userId) return null;

  return prisma.tripAiPlan.findUnique({ where: { tripId } });
}

/**
 * Generate a day-level itinerary day (1-based) for a trip owned by `userId`.
 * Returns the persisted row; throws if the trip is not owned by the caller.
 */
export async function upsertTripItineraryDay(
  userId: string,
  tripId: string,
  day: number,
  morning: string[],
  afternoon: string[],
  evening: string[],
  foods: string[],
  transport: string[],
  tips: string[],
  location?: string
) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, userId: true },
  });

  if (!trip || trip.userId !== userId) {
    throw new Error("FORBIDDEN");
  }

  // Ensure the day fits inside the trip's own date span.
  const itinerary = await prisma.tripItinerary.findMany({
    where: { tripId },
    orderBy: { dayNumber: "asc" },
    select: { dayNumber: true },
  });

  const maxDay = itinerary.length > 0 ? Math.max(...itinerary.map((d) => d.dayNumber)) : 0;
  if (day > maxDay + 1 && maxDay > 0) {
    // Regenerating a day beyond the last one is not allowed; rotating into
    // newly generated days is handled by the caller's date bounds.
    throw new Error("INVALID_DAY");
  }

  // Find existing itinerary row for this trip+day using the compound unique key.
  const existing = await prisma.tripItinerary.findUnique({
    where: { tripId_dayNumber: { tripId, dayNumber: day } },
  });

  if (existing) {
    // Update existing row.
    return prisma.tripItinerary.update({
      where: { id: existing.id },
      data: {
        activity: morning[0] || afternoon[0] || evening[0] || "Activity pending",
        description: `${morning.join(" ")}\n${afternoon.join(" ")}\n${evening.join(" ")}`,
        startTime: "09:00",
        endTime: "21:00",
        location: location ?? "Not specified",
      },
    });
  }

  // Create new row.
  return prisma.tripItinerary.create({
    data: {
      tripId,
      dayNumber: day,
      activity: morning[0] || afternoon[0] || evening[0] || "Activity pending",
      description: `${morning.join(" ")}\n${afternoon.join(" ")}\n${evening.join(" ")}`,
      startTime: "09:00",
      endTime: "21:00",
      location: location ?? "Not specified",
    },
  });
}

/**
 * Regenerate an individual day of a trip's itinerary and its AI plan.
 * Returns the newly generated plan contents and the updated itinerary day.
 */
export async function regenerateDay(
  userId: string,
  tripId: string,
  day: number
): Promise<{ plan: TripPlanContents | null; itineraryDay: any | null }> {
  // Regeneration always uses the original trip selection, so we read the
  // AI plan to recover the user's original intent.
  const planRow = await getTripAiPlan(userId, tripId);
  const plan = planRow?.contents as TripPlanContents | null;

  if (!plan) {
    throw new Error("NO_PLAN");
  }

  // Reuse the untouched plan's dates/budget/interests; only the day changes.
  const start = plan.start;
  const end = plan.end;
  const travelers = plan.travelers;

  // Delegate to the AI client — the caller (`regenerateDay` in trip-plan.ts)
  // has already validated the trip ownership.
  const ai = await import("@/lib/ai").then((mod) => mod.generatePlan({ destination: plan.destination?.name, start, end, travelers, budget: String(plan.budget?.total), interests: plan.interests?.join(", "), travelStyle: plan.style }));

  if (ai.status !== "ready" || !ai.plan) {
    return { plan: null, itineraryDay: null };
  }

  // Find the trip to get its duration and construct a contiguous day range.
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      durationDays: true,
      itinerary: { select: { dayNumber: true, id: true } },
    },
  });

  if (!trip) return { plan: ai.plan, itineraryDay: null };

  // Build the day list: keep existing days except `day` which is replaced.
  const existingDays = trip.itinerary.map((d) => d.dayNumber).sort((a, b) => a - b);
  const maxDay = trip.durationDays || Math.max(...existingDays, 1);

  // Delete existing entries for `day` (we replace the whole day content).
  await prisma.tripItinerary.deleteMany({
    where: { tripId, dayNumber: day },
  });

  // Generate a full day range that is contiguous from 1..maxDay.
  const fullItinerary: any[] = [];
  for (let d = 1; d <= maxDay; d++) {
    if (d === day) {
      // Regenerated day: reuse the fresh AI plan day
      fullItinerary.push({
        dayNumber: d,
        morning: ai.plan.itinerary.find((i: any) => i.day === d)?.morning ?? [],
        afternoon: ai.plan.itinerary.find((i: any) => i.day === d)?.afternoon ?? [],
        evening: ai.plan.itinerary.find((i: any) => i.day === d)?.evening ?? [],
        foods: ai.plan.itinerary.find((i: any) => i.day === d)?.foods ?? [],
        transport: ai.plan.itinerary.find((i: any) => i.day === d)?.transport ?? [],
        tips: ai.plan.itinerary.find((i: any) => i.day === d)?.tips ?? [],
        location: undefined,
      });
    } else {
      // Existing day: keep as-is (not regenerated).
      fullItinerary.push({ dayNumber: d, location: undefined });
    }
  }

  // Persist the full sorted itinerary in one bulk write.
  await prisma.tripItinerary.createMany({
    data: fullItinerary.map((item, i) => ({
      tripId: trip.id,
      dayNumber: item.dayNumber,
      activity: item.morning?.[0] ?? item.afternoon?.[0] ?? item.evening?.[0] ?? `Day ${item.dayNumber} activity`,
      description: JSON.stringify(item),
      startTime: "09:00",
      endTime: "21:00",
      location: item.location ?? "Not specified",
    })),
    skipDuplicates: true,
  });

  // Update the trip's duration to match the regenerated range.
  await prisma.trip.update({
    where: { id: tripId },
    data: { durationDays: Math.max(...fullItinerary.map((i) => i.dayNumber)) },
  });

  const dayRow = await prisma.tripItinerary.findUnique({
    where: { tripId_dayNumber: { tripId, dayNumber: day } },
  });

  return { plan: ai.plan, itineraryDay: dayRow };
}

/**
 * Save/refresh the AI-generated structured plan for a trip.
 * Creates or replaces the plan; ownership is enforced by the caller.
 */
export async function saveTripPlan(
  userId: string,
  tripId: string,
  plan: TripPlanContents
) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, userId: true },
  });
  if (!trip || trip.userId !== userId) {
    throw new Error("FORBIDDEN");
  }

  return upsertTripAiPlan(userId, tripId, plan);
}

/**
 * Read the persisted AI plan for a trip (owner only, or null).
 */
export async function getSavedTripPlan(userId: string, tripId: string) {
  return getTripAiPlan(userId, tripId);
}

/**
 * Delete the persisted AI plan for a trip owned by `userId`.
 * Returns true when a row was deleted; false when no row existed.
 */
export async function deleteTripPlan(userId: string, tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, userId: true },
  });

  if (!trip || trip.userId !== userId) return false;

  await prisma.tripAiPlan.deleteMany({ where: { tripId } });
  return true;
}
