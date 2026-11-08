/**
 * Password mutation helpers.
 *
 * Any change to a user's password must go through `setUserPassword`, because it
 * also bumps `User.sessionVersion`. That version is embedded in every JWT at
 * sign-in and re-checked against the database on each authenticated request
 * (see lib/auth.server.ts), which is what makes existing sessions revocable.
 *
 * Adding a "change password" endpoint later should call this helper too.
 */

import bcrypt from "bcrypt";

import { prisma } from "@/lib/db";

const BCRYPT_COST = 12;

/**
 * Hash and store a new password, revoking every existing session for the user
 * in the same database write.
 */
export async function setUserPassword(
  userId: string,
  plainPassword: string
): Promise<void> {
  const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_COST);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      sessionVersion: { increment: 1 },
    },
  });
}

/**
 * Sign a user out everywhere without changing their password.
 * Useful for "sign out of all devices" or after a security incident.
 */
export async function revokeUserSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}
