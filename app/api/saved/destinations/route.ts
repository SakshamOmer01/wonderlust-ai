/**
 * Saved destinations endpoints.
 *
 * GET  /api/saved/destinations — the authenticated user's saved destinations
 * POST /api/saved/destinations — save a destination
 *
 * Authentication is mandatory; results are always scoped to the session user,
 * so one account can never read another account's list.
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { HttpError, parseJson, parsePagination, requireUser, route } from "@/lib/api";
import { saveDestinationSchema } from "@/lib/validation";

const destinationSelect = {
  id: true,
  slug: true,
  name: true,
  country: true,
  continent: true,
  category: true,
  rating: true,
  image: true,
  reviewCount: true,
} as const;

export const GET = route(async (request: Request) => {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const { limit, offset } = parsePagination(searchParams);

  const where = { userId: user.id };

  const [saved, total] = await Promise.all([
    prisma.savedDestination.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: { destination: { select: destinationSelect } },
    }),
    prisma.savedDestination.count({ where }),
  ]);

  return NextResponse.json({
    destinations: saved.map((entry) => ({
      ...entry.destination,
      savedAt: entry.createdAt,
      savedId: entry.id,
    })),
    pagination: { limit, offset, total, hasMore: offset + limit < total },
  });
});

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const { destinationId } = await parseJson(request, saveDestinationSchema);

  const destination = await prisma.destination.findUnique({
    where: { id: destinationId },
    select: { id: true },
  });

  if (!destination) {
    throw new HttpError("Destination not found", 404, "DESTINATION_NOT_FOUND");
  }

  const alreadySaved = await prisma.savedDestination.findUnique({
    where: {
      userId_destinationId: { userId: user.id, destinationId },
    },
    select: { id: true },
  });

  if (alreadySaved) {
    return NextResponse.json(
      { error: "Destination already saved", code: "ALREADY_SAVED" },
      { status: 409 }
    );
  }

  const saved = await prisma.savedDestination.create({
    data: { userId: user.id, destinationId },
    include: { destination: { select: destinationSelect } },
  });

  return NextResponse.json({ saved }, { status: 201 });
});
