/**
 * Password reset tokens.
 *
 * Security properties:
 *   - 256 bits of entropy from `crypto.randomBytes`, base64url encoded.
 *   - Only a SHA-256 hash is persisted, so a database leak cannot be replayed.
 *   - Tokens expire after 30 minutes.
 *   - Tokens are single-use: consumption atomically flips `usedAt` from null,
 *     so concurrent requests cannot both succeed.
 *   - Requesting a new token invalidates the previous unused ones.
 */

import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/db";

export const RESET_TOKEN_TTL_MINUTES = 30;

const RESET_TOKEN_TTL_MS = RESET_TOKEN_TTL_MINUTES * 60 * 1000;

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildResetUrl(token: string): string {
  const base = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}

/**
 * Issue a new reset token for a user, invalidating any outstanding ones.
 * Returns the raw token — it is never stored and must be emailed immediately.
 */
export async function createPasswordResetToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: { userId, usedAt: null },
    }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    }),
  ]);

  return { token, expiresAt };
}

/**
 * Atomically claim a reset token.
 *
 * Returns null when the token is unknown, expired or already used. Callers get
 * the owning user ID on success; the token cannot be claimed twice.
 */
export async function claimPasswordResetToken(
  token: string
): Promise<{ userId: string } | null> {
  const tokenHash = hashResetToken(token);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const record = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });

    if (!record || record.usedAt || record.expiresAt <= now) {
      return null;
    }

    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });

    if (claimed.count !== 1) {
      return null;
    }

    // Any other outstanding links for this user are no longer valid.
    await tx.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: now },
    });

    return { userId: record.userId };
  });
}

/** Housekeeping: remove tokens that expired more than a day ago. */
export async function pruneExpiredResetTokens(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { count } = await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: cutoff } },
  });
  return count;
}
