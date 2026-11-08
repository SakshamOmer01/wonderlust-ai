/**
 * Single trip endpoints.
 *
 * GET    /api/trips/:id — readable by the owner, admins, or anyone if public
 * PUT    /api/trips/:id — owner or admin
 * DELETE /api/trips/:id — owner or admin
 */

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { HttpError, parseJson, requireUser, route } from "@/lib/api";
import { getSessionUser } from "@/lib/auth.server";
import { updateTripSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

const tripDetailInclude = {
  destination: {
    select: {
      id: true,
      name: true,
      slug: true,
      country: true,
      continent: true,
      category: true,
      rating: true,
      image: true,
    },
  },
  itinerary: {
    orderBy: { dayNumber: "asc" },
    select: {
      id: true,
      dayNumber: true,
      activity: true,
      description: true,
      startTime: true,
      endTime: true,
      location: true,
    },
  },
  reviews: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { id: true, name: true, avatar: true } },
    },
  },
} as const;

export const GET = route(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: tripDetailInclude,
  });

  if (!trip) {
    throw new HttpError("Trip not found", 404, "TRIP_NOT_FOUND");
  }

  if (trip.userId) {
    const viewer = await getSessionUser();
    const isOwner = viewer?.id === trip.userId;
    const isAdmin = viewer?.role === "admin";

    if (!isOwner && !isAdmin && !trip.isFavorite) {
      // Don't reveal that a private trip exists.
      throw new HttpError("Trip not found", 404, "TRIP_NOT_FOUND");
    }
  }

  return NextResponse.json({ trip });
});

export const PUT = route(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const user = await requireUser();
  const input = await parseJson(request, updateTripSchema);

  const existing = await prisma.trip.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      startDate: true,
      endDate: true,
      title: true,
    },
  });

  if (!existing) {
    throw new HttpError("Trip not found", 404, "TRIP_NOT_FOUND");
  }

  if (existing.userId !== user.id && user.role !== "admin") {
    throw new HttpError("You can only edit your own trips", 403, "FORBIDDEN");
  }

  const startDate = input.startDate ? new Date(input.startDate) : existing.startDate;
  const endDate = input.endDate ? new Date(input.endDate) : existing.endDate;

  if (endDate <= startDate) {
    throw new HttpError(
      "End date must be after the start date",
      400,
      "INVALID_DATES"
    );
  }

  const data: Prisma.TripUpdateInput = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.startDate !== undefined ? { startDate } : {}),
    ...(input.endDate !== undefined ? { endDate } : {}),
    ...(input.travelers !== undefined ? { travelers: input.travelers } : {}),
    ...(input.budget !== undefined ? { budget: input.budget } : {}),
    ...(input.durationDays !== undefined
      ? { durationDays: input.durationDays }
      : {}),
    ...(input.image !== undefined ? { image: input.image } : {}),
    ...(input.price !== undefined ? { price: input.price } : {}),
    ...(input.isFavorite !== undefined ? { isFavorite: input.isFavorite } : {}),
  };

  if (input.destinationId) {
    const destination = await prisma.destination.findUnique({
      where: { id: input.destinationId },
      select: { id: true, name: true },
    });

    if (!destination) {
      throw new HttpError("Destination not found", 404, "DESTINATION_NOT_FOUND");
    }

    data.destination = { connect: { id: destination.id } };
    data.destinationName = destination.name;
  }

  const trip = await prisma.trip.update({
    where: { id },
    data,
    include: tripDetailInclude,
  });

  return NextResponse.json({ trip });
});

export const DELETE = route(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const user = await requireUser();

  const existing = await prisma.trip.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!existing) {
    throw new HttpError("Trip not found", 404, "TRIP_NOT_FOUND");
  }

  if (existing.userId !== user.id && user.role !== "admin") {
    throw new HttpError("You can only delete your own trips", 403, "FORBIDDEN");
  }

  await prisma.trip.delete({ where: { id } });

  return NextResponse.json({ message: "Trip deleted successfully" });
});
