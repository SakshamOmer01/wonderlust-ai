/**
 * Single booking endpoints.
 *
 * GET   /api/bookings/:id — owner or admin
 * PATCH /api/bookings/:id — owner may cancel; admins may set any status
 * DELETE /api/bookings/:id — owner cancels and the record is removed
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError, parseJson, requireUser, route } from "@/lib/api";
import { updateBookingSchema } from "@/lib/validation";
const bookingInclude = {
    trip: {
        select: {
            id: true,
            title: true,
            slug: true,
            destinationName: true,
            startDate: true,
            endDate: true,
            image: true,
            price: true,
        },
    },
};
async function loadOwnedBooking(id, userId, role) {
    const booking = await prisma.booking.findUnique({
        where: { id },
        select: { id: true, userId: true, status: true },
    });
    if (!booking) {
        throw new HttpError("Booking not found", 404, "BOOKING_NOT_FOUND");
    }
    if (booking.userId !== userId && role !== "admin") {
        throw new HttpError("You can only manage your own bookings", 403, "FORBIDDEN");
    }
    return booking;
}
export const GET = route(async (_request, context) => {
    const user = await requireUser();
    const { id } = await context.params;
    await loadOwnedBooking(id, user.id, user.role);
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: bookingInclude,
    });
    return NextResponse.json({ booking });
});
export const PATCH = route(async (request, context) => {
    const user = await requireUser();
    const { id } = await context.params;
    const { status } = await parseJson(request, updateBookingSchema);
    const booking = await loadOwnedBooking(id, user.id, user.role);
    if (user.role !== "admin") {
        // Customers may only cancel their own pending/confirmed booking.
        if (status !== "cancelled") {
            throw new HttpError("Only an administrator can change a booking to that status", 403, "FORBIDDEN");
        }
        if (booking.status === "cancelled") {
            throw new HttpError("Booking is already cancelled", 409, "ALREADY_CANCELLED");
        }
        if (booking.status === "completed") {
            throw new HttpError("A completed booking cannot be cancelled", 409, "BOOKING_COMPLETED");
        }
    }
    const updated = await prisma.booking.update({
        where: { id },
        data: {
            status,
            ...(status === "confirmed" ? { confirmedAt: new Date() } : {}),
        },
        include: bookingInclude,
    });
    return NextResponse.json({ booking: updated });
});
export const DELETE = route(async (_request, context) => {
    const user = await requireUser();
    const { id } = await context.params;
    await loadOwnedBooking(id, user.id, user.role);
    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ message: "Booking cancelled successfully" });
});
