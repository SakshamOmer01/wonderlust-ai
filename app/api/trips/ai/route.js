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
import { prisma } from "@/lib/db";
import { route, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth.server";
import { createTripSchema } from "@/lib/validation";
import { buildTripPlan } from "@/lib/trip-plan";
import { isAiConfigured } from "@/lib/ai";
import { upsertTripItineraryDay, saveTripPlan } from "@/lib/trip-ai";
const createTripWithAiSchema = createTripSchema.extend({
    ai: {
        destination: z.string().trim().max(120).optional(),
        start: z.string(),
        end: z.string(),
        travelers: z.number().int().min(1).max(50).optional(),
        budget: z.enum(["budget", "standard", "luxury"], {
            message: "Invalid budget",
        }).optional(),
        interests: z.string().max(500).optional(),
        travelStyle: z.enum(["budget", "standard", "luxury", "adventure", "family", "romantic"], {
            message: "Invalid travel style",
        }).optional(),
    },
});
export const POST = route(async (request) => {
    const user = await requireUser();
    const input = await parseJson(request, createTripWithAiSchema);
    const aiInput = input.ai;
    const startDate = new Date(aiInput.start);
    const endDate = new Date(aiInput.end);
    // Generate the plan. `buildTripPlan` never fabricates data: if the AI is
    // missing or malformed it falls back to a deterministic server-side plan
    // and reports that via `ai.configured`.
    const { plan, timezone } = await buildTripPlan({
        destination: aiInput.destination,
        start: aiInput.start,
        end: aiInput.end,
        travelers: aiInput.travelers,
        budget: aiInput.budget,
        interests: aiInput.interests,
        travelStyle: aiInput.travelStyle,
    });
    // Persist the structured AI plan. This is owned by the authenticated user.
    await saveTripPlan(user.id, input.id, plan);
    // Compute the smart budget from the trip's date range and persist it.
    const nights = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000));
    const budget = {
        accommodation: plan.budget.accommodation,
        food: plan.budget.food,
        transportation: plan.budget.transportation,
        activity: plan.budget.activity,
        other: plan.budget.other,
        total: (plan.budget.accommodation + plan.budget.food + plan.budget.transportation + plan.budget.activity + plan.budget.other),
        remaining: Math.max(0, plan.remaining ?? 0),
    };
    // Persist budget.
    const budgetRow = await prisma.budgetPlan.upsert({
        where: { tripId: input.id },
        create: { tripId: input.id, ...budget },
        update: { ...budget },
    });
    // Persist itinerary days (the AI's `itinerary` array uses `day` numbers =
    // `dayNumber`).
    for (const item of plan.itinerary) {
        await upsertTripItineraryDay(user.id, input.id, item.day, item.morning, item.afternoon, item.evening, item.foods, item.transport, item.tips, item.location ?? undefined);
    }
    const trip = await prisma.trip.findUnique({
        where: { id: input.id },
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
            aiPlan: { select: { contents: true } },
            itinerary: { orderBy: { dayNumber: "asc" } },
            budgetPlan: true,
        },
    });
    if (!trip) {
        throw new Error("TRIP_NOT_FOUND");
    }
    return NextResponse.json({
        trip: {
            id: trip.id,
            title: trip.title,
            destinationId: trip.destinationId,
            destinationName: trip.destinationName,
            startDate: trip.startDate.toISOString(),
            endDate: trip.endDate.toISOString(),
            travelers: trip.travelers,
            budget: trip.budget,
            durationDays: trip.durationDays,
            image: trip.image,
            price: trip.price,
            destination: trip.destination,
            itinerary: trip.itinerary.map((i) => ({
                id: i.id,
                dayNumber: i.dayNumber,
                activity: i.activity,
                description: i.description ?? "",
                startTime: i.startTime ?? undefined,
                endTime: i.endTime ?? undefined,
                location: i.location ?? undefined,
            })),
            aiPlan: trip.aiPlan?.contents ?? null,
            budget: trip.budgetPlan ?? budget,
            ai: {
                configured: isAiConfigured(),
                source: isAiConfigured() ? "ai" : "demo",
            },
        },
    });
});
