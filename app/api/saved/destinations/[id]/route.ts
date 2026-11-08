/**
 * Remove a saved destination.
 *
 * DELETE /api/saved/destinations/:id — owner only
 *
 * The record is looked up by (id, session user) so a client cannot delete
 * another user's saved destination by guessing an ID.
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { HttpError, requireUser, route } from "@/lib/api";

export const DELETE = route(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    const saved = await prisma.savedDestination.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!saved) {
      throw new HttpError(
        "Saved destination not found",
        404,
        "SAVED_NOT_FOUND"
      );
    }

    await prisma.savedDestination.delete({ where: { id } });

    return NextResponse.json({ message: "Destination unsaved successfully" });
  }
);
