/**
 * Delete a review.
 *
 * DELETE /api/reviews/:id — the review author or an administrator.
 * The destination's aggregate rating is recalculated afterwards.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError, requireUser, route } from "@/lib/api";
export const DELETE = route(async (_request, context) => {
    const user = await requireUser();
    const { id } = await context.params;
    const review = await prisma.review.findUnique({
        where: { id },
        select: { id: true, userId: true, destinationId: true },
    });
    if (!review) {
        throw new HttpError("Review not found", 404, "REVIEW_NOT_FOUND");
    }
    if (review.userId !== user.id && user.role !== "admin") {
        throw new HttpError("You can only delete your own reviews", 403, "FORBIDDEN");
    }
    await prisma.$transaction(async (tx) => {
        await tx.review.delete({ where: { id } });
        if (review.destinationId) {
            const aggregate = await tx.review.aggregate({
                where: { destinationId: review.destinationId },
                _avg: { rating: true },
                _count: { _all: true },
            });
            await tx.destination.update({
                where: { id: review.destinationId },
                data: {
                    rating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
                    reviewCount: aggregate._count._all,
                },
            });
        }
    });
    return NextResponse.json({ message: "Review deleted successfully" });
});
