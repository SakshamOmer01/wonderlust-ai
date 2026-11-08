/**
 * Itinerary endpoints for a trip.
 *
 *   GET    /api/trips/:id/itinerary — the structured day-by-day plan
 *   POST   /api/trips/:id/itinerary  — regenerate one day (the AI rewrites
 *                                       that day's content; neighbouring
 *                                       days are untouched)
 *   DELETE /api/trips/:id/itinerary/:day — remove a day's persisted content
 *
 * Every endpoint is scoped to the authenticated owner: `tripId` is never
 * trusted from the client; it is re-checked against the database before any
 * query runs.
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth.server";
import { upsertTripItineraryDay, upsertTripAiPlan, regenerateDay } from "@/lib/trip-ai";
import { buildTripPlan } from "@/lib/trip-plan";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/trips/:id/itinerary
 *
 * Returns the persisted day-by-day itinerary. If the trip has no structured
 * itinerary rows yet (e.g. created before Phase 3, or the AI could not
 * generate a plan), the endpoint returns a deterministic fallback built from
 * the trip's budget style, dates and destination.
 */
export const GET = route(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const user = await requireUser();

  const trip = await prisma.trip.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      title: true,
      destinationName: true,
      startDate: true,
      endDate: true,
      travelers: true,
      budget: true,
      durationDays: true,
      image: true,
      price: true,
      itinerary: { orderBy: { dayNumber: "asc" } },
      budgetPlan: true,
    },
  });

  if (!trip || trip.userId !== user.id) {
    throw new Error("TRIP_NOT_FOUND");
  }

  let itinerary = trip.itinerary.map((i) => ({
    id: i.id,
    dayNumber: i.dayNumber,
    activity: i.activity,
    description: i.description ?? "",
    startTime: i.startTime ?? undefined,
    endTime: i.endTime ?? undefined,
    location: i.location ?? undefined,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));

  // Fallback ordering: every day from 1..durationDays is present, so the
  // frontend can always render a grid.
  if (itinerary.length === 0) {
    const expectedDays = trip.durationDays && trip.durationDays > 0 ? trip.durationDays : 7;
    itinerary = Array.from({ length: expectedDays }, (_, i) => ({
      id: `fallback-${i + 1}`,
      dayNumber: i + 1,
      activity: "Activity pending",
      description: `Day ${i + 1} plan`,
      startTime: "09:00",
      endTime: "21:00",
      location: "Not specified",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  return NextResponse.json({
    trip: {
      id: trip.id,
      title: trip.title,
      destinationName: trip.destinationName,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      travelers: trip.travelers,
      budget: trip.budget,
      image: trip.image,
      price: trip.price,
    },
    itinerary,
    estimatedBudget: trip.budgetPlan ?? null,
  });
});

/**
 * POST /api/trips/:id/itinerary — regenerate a day (or the whole trip).
 *
 * Body: { day?: number } — when `day` is present, only that day is rewritten.
 * When `day` is absent but `regenerateWhole` is true, the AI generates a new
 * plan for the trip and the itinerary is rebuilt day-by-day.
 */
export const POST = route(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const user = await requireUser();
  const body = await request.json().catch(() => ({}));

  const { day, regenerateWhole } = body as { day?: number; regenerateWhole?: boolean };

  // Regenerate a single day.
  if (day !== undefined) {
    if (!Number.isInteger(day) || day < 1) {
      throw new Error("INVALID_DAY");
    }
    const result = await regenerateDay(user.id, id, day);
    if (!result.plan) {
      throw new Error("REGENERATION_FAILED");
    }
    const dayRow = result.itineraryDay;
    return NextResponse.json({
      trip: { id, title: (await prisma.trip.findUnique({ where: { id } }).then((t) => t?.title)) ?? "Trip" },
      itineraryDay: dayRow,
      regeneratedDay: day,
      plan: result.plan,
      ai: { configured: true },
    });
  }

  // Regenerate the whole trip.
  if (regenerateWhole) {
    const result = await buildTripPlanFull({ id, userId: user.id });
    return NextResponse.json({
      trip: { id, title: (await prisma.trip.findUnique({ where: { id } }).then((t) => t?.title)) ?? "Trip" },
      itinerary: result.itinerary,
      ai: { configured: true },
    });
  }

  throw new Error("BAD_REQUEST");
});

/**
 * DELETE /api/trips/:id/itinerary/:day — remove one day's persisted content.
 */
export const DELETE = route(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const user = await requireUser();
  const url = new URL(request.url);
  const day = Number.parseInt(url.searchParams.get("day") ?? "", 10);

  if (!Number.isInteger(day) || day < 1) {
    throw new Error("INVALID_DAY");
  }

  const existing = await prisma.trip.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!existing || existing.userId !== user.id) {
    throw new Error("FORBIDDEN");
  }

  await prisma.tripItinerary.deleteMany({ where: { tripId: id, dayNumber: day } });

  return NextResponse.json({
    trip: { id, title: (await prisma.trip.findUnique({ where: { id } }).then((t) => t?.title)) ?? "Trip" },
    deletedDay: day,
  });
});

/**
 * Full-plan generator used by the regenerate-whole path.
 * Rebuilds the trip's itinerary day-by-day from a fresh plan and persists it.
 */
async function buildTripPlanFull(input: { id: string; userId: string }) {
  const trip = await prisma.trip.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      userId: true,
      destinationName: true,
      startDate: true,
      endDate: true,
      travelers: true,
      budget: true,
      destination: { select: { country: true } },
      itinerary: { orderBy: { dayNumber: "asc" } },
    },
  });
  if (!trip || trip.userId !== input.userId) {
    throw new Error("FORBIDDEN");
  }

  const start = trip.startDate ?? new Date("2027-03-01");
  const end = trip.endDate ?? new Date("2027-03-14");

  const { plan } = await buildTripPlan({
    destination: trip.destination?.country ?? trip.destinationName,
    start: start.toISOString(),
    end: end.toISOString(),
    travelers: trip.travelers,
    budget: trip.budget,
    interests: trip.itinerary.map((i) => i.activity).join(", "),
    travelStyle: trip.budget,
  });
  if (!plan) {
    throw new Error("PLAN_GENERATION_FAILED");
  }

  const itinerary = plan.itinerary.map((item: { day: number; morning: string[]; afternoon: string[]; evening: string[]; foods: string[]; transport: string[]; tips: string[] }, i: number) => ({
    tripId: input.id,
    dayNumber: item.day,
    activity: item.morning?.[0] ?? item.afternoon?.[0] ?? item.evening?.[0] ?? `Day ${item.day}`,
    description: JSON.stringify(item),
    startTime: "09:00",
    endTime: "21:00",
    location: "Not specified",
  }));

  // Persist the regenerated plan, budget and itinerary.
  await upsertTripAiPlan(input.userId, input.id, plan);
  await prisma.budgetPlan.upsert({
    where: { tripId: input.id },
    create: {
      tripId: input.id,
      accommodation: plan.budget.accommodation,
      food: plan.budget.food,
      transportation: plan.budget.transportation,
      activity: plan.budget.activity,
      other: plan.budget.other,
      total: plan.budget.total,
      remaining: Math.max(0, plan.budget.total - plan.budget.total),
    },
    update: {
      accommodation: plan.budget.accommodation,
      food: plan.budget.food,
      transportation: plan.budget.transportation,
      activity: plan.budget.activity,
      other: plan.budget.other,
      total: plan.budget.total,
      remaining: Math.max(0, plan.budget.total - plan.budget.total),
    },
  });
  await prisma.tripItinerary.deleteMany({ where: { tripId: input.id } });
  await prisma.tripItinerary.createMany({
    data: itinerary,
    skipDuplicates: true,
  });
  await prisma.trip.update({ where: { id: input.id }, data: { durationDays: itinerary.length } });

  return { itinerary };
}
