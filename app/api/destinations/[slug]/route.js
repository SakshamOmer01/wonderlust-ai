/**
 * Single destination endpoint (public).
 *
 * GET /api/destinations/:slug — destination with its latest reviews.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError, route } from "@/lib/api";
export const GET = route(async (_request, context) => {
    const { slug } = await context.params;
    const destination = await prisma.destination.findUnique({
        where: { slug },
        include: {
            reviews: {
                orderBy: { createdAt: "desc" },
                take: 10,
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    user: { select: { id: true, name: true, avatar: true } },
                },
            },
        },
    });
    if (!destination) {
        throw new HttpError("Destination not found", 404, "DESTINATION_NOT_FOUND");
    }
    return NextResponse.json({ destination });
});
