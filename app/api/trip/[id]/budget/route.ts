/**
 * Smart budget planner — GET /api/trip/:id/budget
 *
 * Returns the persisted BudgetPlan for a trip owned by the caller, or, when
 * the trip was created before Phase 3 (no BudgetPlan row), a deterministic
 * server-side estimate derived from the trip's style, dates, travellers and
 * destination. Values are clamped to non-negative numbers and floored to a
 * 50-cent increment, so the UI can render a chart without special-casing.
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth.server";
import {
  buildBudgetPlan,
} from "@/lib/budget";

type RouteContext = { params: Promise<{ id: string }> };

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
      image: true,
      price: true,
    },
  });

  if (!trip || trip.userId !== user.id) {
    throw new Error("TRIP_NOT_FOUND");
  }

  // Prefer the persisted breakdown. It was computed at plan-generation time
  // from the same deterministic model, so re-deriving a fallback should
  // always match.
  const stored = await prisma.budgetPlan.findUnique({ where: { tripId: id } });

  if (stored) {
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
      breakdown: stored,
      estimatedBudget: stored,
    });
  }

  // No stored breakdown — build one deterministically from the trip data.
  const start = trip.startDate ?? new Date();
  const end = trip.endDate ?? new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const style = (trip.budget && trip.budget in {
    budget: true,
    standard: true,
    luxury: true,
  } ? (trip.budget as "budget" | "standard" | "luxury") : "standard");
  const travellers = trip.travelers && trip.travelers > 0 ? trip.travelers : 2;

  const breakdown = buildBudgetPlan(style, trip.destinationName ?? "unknown", start, end, travellers);

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
    breakdown,
    estimatedBudget: breakdown,
  });
});
