/**
 * AI trip generator — POST /api/trips/ai
 *
 * Creates a trip from the user's travel selection and immediately produces a
 * structured, validated plan:
 *   - AI-generated itinerary persisted in TripItinerary
 *   - Smart budget breakdown persisted in BudgetPlan
 *
 * Input is validated with zod (the shared `createTripSchema` with an `ai`
 * extension). The AI output is parsed and validated against a strict JSON
 * schema in the AI client — malformed responses are rejected, never stored.
 *
 * When no API key is configured the endpoint returns `ai: { configured: false }`
 * and still stores a deterministic server-side plan, so the UI can serve
 * DEMO_MODE and tell the operator how to finish setup.
 */

import { NextResponse } from "next/server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { route, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth.server";
import { createTripSchema } from "@/lib/validation";
import { buildTripPlan } from "@/lib/trip-plan";
import { isAiConfigured } from "@/lib/ai";
import { upsertTripItineraryDay, saveTripPlan } from "@/lib/trip-ai";
import { slugify } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

const createTripWithAiSchema = createTripSchema.extend({
  budgetTotal: z.number().min(0).max(10_000_000).optional(),
  interests: z.string().max(500).optional(),
  travelStyle: z.enum(["budget", "standard", "luxury", "adventure", "family", "romantic"]).optional(),
  travelPreferences: z.string().max(500).optional(),
  ai: z.object({
    destination: z.string().trim().max(120).optional(),
    start: z.string(),
    end: z.string(),
    travelers: z.number().int().min(1).max(50).optional(),
    budget: z.enum(["budget", "standard", "luxury"]).optional(),
    budgetTotal: z.number().min(0).max(10_000_000).optional(),
    interests: z.string().max(500).optional(),
    travelStyle: z.enum(["budget", "standard", "luxury", "adventure", "family", "romantic"]).optional(),
    travelPreferences: z.string().max(500).optional(),
  }).optional(),
});

type TripWithAiInput = z.infer<typeof createTripWithAiSchema>;

type TripResponse = {
  id: string;
  title: string;
  destinationId: string;
  destinationName: string;
  startDate: Date;
  endDate: Date;
  travelers: number;
  budget: string;
  durationDays: number | null;
  image: string | null;
  price: number | null;
  destination: { country: string } | null;
  itinerary: { id: string; dayNumber: number; activity: string; description: string | null; startTime: string | null; endTime: string | null; location: string | null }[];
  aiPlan: unknown | null;
  ai: { configured: boolean; source: "ai" | "demo" };
  tripAiPlan: unknown | null;
  budgetPlan: unknown | null;
  // The `budget` field is intentionally omitted here because it is
  // computed dynamically in the POST handler.
};

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const input: TripWithAiInput = await parseJson(request, createTripWithAiSchema);

  const aiRaw = input.ai;
  const interests = aiRaw?.interests ?? input.interests ?? "";
  const travelStyle = aiRaw?.travelStyle ?? input.travelStyle ?? input.budget ?? "standard";
  const budgetTotalRaw = aiRaw?.budgetTotal ?? input.budgetTotal;
  const budgetTotal = typeof budgetTotalRaw === "number" && Number.isFinite(budgetTotalRaw) ? budgetTotalRaw : undefined;
  const aiInput = {
    destination: aiRaw?.destination ?? input.title,
    start: aiRaw?.start ?? input.startDate,
    end: aiRaw?.end ?? input.endDate,
    travelers: aiRaw?.travelers ?? input.travelers,
    budget: aiRaw?.budget ?? input.budget,
    interests,
    travelStyle,
  };
  const startDate = new Date(aiInput.start);
  const endDate = new Date(aiInput.end);

  // Create the trip in the database to get the trip ID.
  const destination = await prisma.destination.findUnique({
    where: { id: input.destinationId },
  });
  if (!destination) {
    throw new Error("DESTINATION_NOT_FOUND");
  }
  const trip = await prisma.trip.create({
    data: {
      title: input.title,
      slug: slugify(input.title),
      destinationId: input.destinationId,
      destinationName: destination.name,
      startDate: aiInput.start,
      endDate: aiInput.end,
      travelers: aiInput.travelers ?? 2,
      durationDays: 1,
      budget: aiInput.budget ?? "standard",
      image: input.image ?? "",
      price: input.price ?? 0,
      userId: user.id,
    } satisfies Prisma.TripUncheckedCreateInput,
  }) as unknown as { id: string };

  // Generate the plan. `buildTripPlan` never fabricates data: if the AI is
  // missing or malformed it falls back to a deterministic server-side plan
  // and reports that via `ai.configured`.
  const { plan } = await buildTripPlan({
    destination: aiInput.destination,
    start: aiInput.start,
    end: aiInput.end,
    travelers: aiInput.travelers,
    budget: aiInput.budget,
    budgetTotal,
    interests: aiInput.interests,
    travelStyle: aiInput.travelStyle,
  }, trip.id, user.id);
  if (!plan) {
    throw new Error("PLAN_GENERATION_FAILED");
  }

  await saveTripPlan(user.id, trip.id, plan);

  // Compute the smart budget from the trip's date range and persist it.
  const totalEst = Number(plan.budget.accommodation) + Number(plan.budget.food) + Number(plan.budget.transportation) + Number(plan.budget.activity) + Number(plan.budget.other);
  const budget = {
    accommodation: Number(plan.budget.accommodation),
    food: Number(plan.budget.food),
    transportation: Number(plan.budget.transportation),
    activity: Number(plan.budget.activity),
    other: Number(plan.budget.other),
    total: Math.round((totalEst + Number.EPSILON) * 100) / 100,
    remaining: budgetTotal !== undefined ? Math.max(0, Math.round((budgetTotal - totalEst + Number.EPSILON) * 100) / 100) : Math.max(0, Number(plan.budget.remaining ?? 0)),
  };

  // Persist budget.
  const budgetRow = await prisma.budgetPlan.upsert({
    where: { tripId: trip.id },
    create: { tripId: trip.id, ...budget },
    update: { ...budget },
  });

  // Persist itinerary days (the AI's `itinerary` array uses `day` numbers =
  // `dayNumber`).
  for (const item of plan.itinerary) {
    await upsertTripItineraryDay(
      user.id,
      trip.id,
      item.day,
      item.morning,
      item.afternoon,
      item.evening,
      item.foods,
      item.transport,
      item.tips,
      undefined
    );
  }

  // The 'id' field is selectively fetched but the type system doesn't resolve it.
  const tripResult = await prisma.trip.findUnique({
    where: { id: trip.id },
    select: {
      id: true,
      title: true,
      destinationId: true,
      destinationName: true,
      startDate: true,
      endDate: true,
      travelers: true,
      budget: true,
      durationDays: true,
      image: true,
      price: true,
      destination: true,
      itinerary: true,
      tripAiPlan: true,
      budgetPlan: true,
    },
  });
  if (!tripResult) {
    throw new Error("TRIP_NOT_FOUND");
  }
  const tripTyped = tripResult as unknown as TripResponse;
  const tripAiPlan = tripTyped.tripAiPlan as { contents: unknown } | null;
  const tripBudgetPlan = tripTyped.budgetPlan as { total?: number } | null;

  return NextResponse.json({
    trip: {
      id: tripTyped.id,
      title: tripTyped.title,
      destinationId: tripTyped.destinationId,
      destinationName: tripTyped.destinationName,
      startDate: tripTyped.startDate.toISOString(),
      endDate: tripTyped.endDate.toISOString(),
      travelers: tripTyped.travelers,
      durationDays: tripTyped.durationDays,
      image: tripTyped.image,
      price: tripTyped.price,
      destination: tripTyped.destination,
      itinerary: tripTyped.itinerary.map((i) => ({
        id: i.id,
        dayNumber: i.dayNumber,
        activity: i.activity,
        description: i.description ?? "",
        startTime: i.startTime ?? undefined,
        endTime: i.endTime ?? undefined,
        location: i.location ?? undefined,
      })),
      aiPlan: tripAiPlan?.contents ?? null,
      budget: tripBudgetPlan?.total ?? budget,
      ai: {
        configured: isAiConfigured(),
        source: isAiConfigured() ? "ai" : "demo",
      },
    },
  });
});
