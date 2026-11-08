/**
 * Review collection endpoints.
 *
 * GET  /api/reviews — public list of reviews (filterable, paginated)
 * POST /api/reviews — create a review as the authenticated user
 *
 * One review per user per destination is enforced by a database constraint and
 * re-checked here with a 409 response. Creating a review recalculates the
 * destination's average rating inside the same transaction.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError, parseJson, parsePagination, requireUser, route } from "@/lib/api";
import { createReviewSchema } from "@/lib/validation";
const reviewInclude = {
    user: { select: { id: true, name: true, avatar: true } },
};
export const GET = route(async (request) => {
    const { searchParams } = new URL(request.url);
    const { limit, offset } = parsePagination(searchParams);
    const destinationId = searchParams.get("destination_id")?.trim();
    const tripId = searchParams.get("trip_id")?.trim();
    const userId = searchParams.get("user_id")?.trim();
    const where = {
        ...(destinationId ? { destinationId } : {}),
        ...(tripId ? { tripId } : {}),
        ...(userId ? { userId } : {}),
    };
    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
            include: reviewInclude,
        }),
        prisma.review.count({ where }),
    ]);
    return NextResponse.json({
        reviews,
        pagination: { limit, offset, total, hasMore: offset + limit < total },
    });
});
export const POST = route(async (request) => {
    const user = await requireUser();
    const input = await parseJson(request, createReviewSchema);
    if (input.destinationId) {
        const destination = await prisma.destination.findUnique({
            where: { id: input.destinationId },
            select: { id: true },
        });
        if (!destination) {
            throw new HttpError("Destination not found", 404, "DESTINATION_NOT_FOUND");
        }
        const existing = await prisma.review.findUnique({
            where: {
                userId_destinationId: {
                    userId: user.id,
                    destinationId: input.destinationId,
                },
            },
            select: { id: true },
        });
        if (existing) {
            return NextResponse.json({
                error: "You have already reviewed this destination",
                code: "ALREADY_REVIEWED",
            }, { status: 409 });
        }
    }
    if (input.tripId) {
        const trip = await prisma.trip.findUnique({
            where: { id: input.tripId },
            select: { id: true },
        });
        if (!trip) {
            throw new HttpError("Trip not found", 404, "TRIP_NOT_FOUND");
        }
    }
    const review = await prisma.$transaction(async (tx) => {
        const created = await tx.review.create({
            data: {
                userId: user.id,
                destinationId: input.destinationId ?? null,
                tripId: input.tripId ?? null,
                rating: input.rating,
                comment: input.comment ?? null,
            },
            include: reviewInclude,
        });
        if (input.destinationId) {
            const aggregate = await tx.review.aggregate({
                where: { destinationId: input.destinationId },
                _avg: { rating: true },
                _count: { _all: true },
            });
            await tx.destination.update({
                where: { id: input.destinationId },
                data: {
                    rating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
                    reviewCount: aggregate._count._all,
                },
            });
        }
        return created;
    });
    return NextResponse.json({ review }, { status: 201 });
});
