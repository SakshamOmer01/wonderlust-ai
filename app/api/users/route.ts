/**
 * User profile endpoints.
 *
 * GET /api/users — the authenticated user's profile
 * PUT /api/users — update the authenticated user's profile
 *
 * The user is always taken from the session; a client can never read or edit
 * another account through this endpoint.
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { HttpError, parseJson, requireUser, route } from "@/lib/api";
import { updateProfileSchema } from "@/lib/validation";

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  profile: { select: { bio: true, website: true } },
} as const;

export const GET = route(async () => {
  const sessionUser = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: publicUserSelect,
  });

  if (!user) {
    throw new HttpError("User not found", 404, "USER_NOT_FOUND");
  }

  return NextResponse.json({ user });
});

export const PUT = route(async (request: Request) => {
  const sessionUser = await requireUser();
  const { name, avatar, bio, website } = await parseJson(
    request,
    updateProfileSchema
  );

  const existing = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true },
  });

  if (!existing) {
    throw new HttpError("User not found", 404, "USER_NOT_FOUND");
  }

  const profileFields = { bio, website };
  const hasProfileUpdate =
    profileFields.bio !== undefined || profileFields.website !== undefined;

  const user = await prisma.user.update({
    where: { id: sessionUser.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
      ...(hasProfileUpdate
        ? {
            profile: {
              upsert: {
                create: { bio: bio ?? null, website: website ?? null },
                update: {
                  ...(bio !== undefined ? { bio } : {}),
                  ...(website !== undefined ? { website } : {}),
                },
              },
            },
          }
        : {}),
    },
    select: publicUserSelect,
  });

  return NextResponse.json({ user });
});
