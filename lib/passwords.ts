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
 *
 * Returns the new credential version. Callers that need to keep the current
 * session alive (the change-password endpoint) feed it back through
 * `unstable_update` after signing it with `signSessionVersion`.
 */
export async function setUserPassword(
  userId: string,
  plainPassword: string
): Promise<number> {
  const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_COST);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      sessionVersion: { increment: 1 },
    },
    select: { sessionVersion: true },
  });

  return updated.sessionVersion;
}

/**
 * Check a plaintext password against the stored hash.
 * Returns false for unknown users and accounts without a local password.
 */
export async function verifyUserPassword(
  userId: string,
  plainPassword: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) return false;

  return bcrypt.compare(plainPassword, user.passwordHash);
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
