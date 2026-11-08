/**
 * Booking collection endpoints.
 *
 * GET  /api/bookings — the authenticated user's bookings (admins may filter)
 * POST /api/bookings — create a booking for a trip
 *
 * Prices and traveller counts are derived from the trip record on the server;
 * a client cannot choose its own total price or confirm its own booking.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError, parseJson, parsePagination, requireUser, route } from "@/lib/api";
import { createBookingSchema } from "@/lib/validation";
const bookingInclude = {
    trip: {
        select: {
            id: true,
            title: true,
            slug: true,
            destinationId: true,
            destinationName: true,
            startDate: true,
            endDate: true,
            travelers: true,
            budget: true,
            image: true,
            price: true,
        },
    },
};
export const GET = route(async (request) => {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const { limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status")?.trim();
    const scope = searchParams.get("scope");
    // Only admins may list other users' bookings.
    const ownerFilter = scope === "all" && user.role === "admin" ? {} : { userId: user.id };
    const where = {
        ...ownerFilter,
        ...(status ? { status } : {}),
    };
    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
            include: bookingInclude,
        }),
        prisma.booking.count({ where }),
    ]);
    return NextResponse.json({
        bookings,
        pagination: { limit, offset, total, hasMore: offset + limit < total },
    });
});
export const POST = route(async (request) => {
    const user = await requireUser();
    const input = await parseJson(request, createBookingSchema);
    const trip = await prisma.trip.findUnique({
        where: { id: input.tripId },
        select: {
            id: true,
            userId: true,
            isFavorite: true,
            price: true,
            travelers: true,
            startDate: true,
        },
    });
    if (!trip) {
        throw new HttpError("Trip not found", 404, "TRIP_NOT_FOUND");
    }
    const isPublicTrip = trip.isFavorite || trip.userId === null;
    if (!isPublicTrip && trip.userId !== user.id) {
        throw new HttpError("This trip is not available to book", 403, "FORBIDDEN");
    }
    if (trip.startDate.getTime() < Date.now()) {
        throw new HttpError("This trip has already started and cannot be booked", 400, "TRIP_PAST");
    }
    const travelers = input.travelers ?? trip.travelers;
    const booking = await prisma.booking.create({
        data: {
            userId: user.id,
            tripId: trip.id,
            travelers,
            totalPrice: Math.round(trip.price * travelers * 100) / 100,
            status: "pending",
        },
        include: bookingInclude,
    });
    return NextResponse.json({ booking }, { status: 201 });
});
