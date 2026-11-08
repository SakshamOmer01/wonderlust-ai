/**
 * Trip collection endpoints.
 *
 * GET  /api/trips        — public: featured trips (optionally filtered)
 * GET  /api/trips?mine=1 — the authenticated user's trips
 * POST /api/trips        — create a trip owned by the authenticated user
 *
 * A trip belongs to exactly one user and is created with the owner taken from
 * the session — never from the request body.
 */

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { HttpError, parseJson, parsePagination, requireUser, route } from "@/lib/api";
import { createTripSchema } from "@/lib/validation";

const tripInclude = {
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
} as const;

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return base || "trip";
}

export const GET = route(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const { limit, offset } = parsePagination(searchParams);

  const mine = searchParams.get("mine") === "1";
  const requestedUserId = searchParams.get("user_id");
  const destinationId = searchParams.get("destination_id")?.trim();

  let where: Prisma.TripWhereInput;

  if (mine || requestedUserId) {
    const user = await requireUser();

    if (requestedUserId && requestedUserId !== user.id) {
      throw new HttpError(
        "You can only list your own trips",
        403,
        "FORBIDDEN"
      );
    }

    where = { userId: user.id };
  } else {
    // Public itinerary ideas: curated favourites or trips without an owner.
    where = { OR: [{ isFavorite: true }, { userId: null }] };
  }

  if (destinationId) {
    where = { AND: [where, { destinationId }] };
  }

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: tripInclude,
    }),
    prisma.trip.count({ where }),
  ]);

  return NextResponse.json({
    trips,
    pagination: { limit, offset, total, hasMore: offset + limit < total },
  });
});

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const input = await parseJson(request, createTripSchema);

  const destination = await prisma.destination.findUnique({
    where: { id: input.destinationId },
    select: { id: true, name: true, image: true },
  });

  if (!destination) {
    throw new HttpError("Destination not found", 404, "DESTINATION_NOT_FOUND");
  }

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  const durationDays =
    input.durationDays ??
    Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000));

  // Ensure the generated slug is unique without leaking a 500 on collision.
  let slug = slugify(input.title);
  const collision = await prisma.trip.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (collision) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const trip = await prisma.trip.create({
    data: {
      title: input.title,
      slug,
      destinationId: destination.id,
      destinationName: destination.name,
      startDate,
      endDate,
      travelers: input.travelers,
      budget: input.budget,
      durationDays,
      image: input.image || destination.image,
      price: input.price ?? 0,
      userId: user.id,
      ...(input.itinerary?.length
        ? {
            itinerary: {
              create: input.itinerary.map((item) => ({
                dayNumber: item.dayNumber,
                activity: item.activity,
                description: item.description ?? null,
                startTime: item.startTime ?? null,
                endTime: item.endTime ?? null,
                location: item.location ?? null,
              })),
            },
          }
        : {}),
    },
    include: {
      ...tripInclude,
      itinerary: { orderBy: { dayNumber: "asc" } },
    },
  });

  return NextResponse.json({ trip }, { status: 201 });
});
