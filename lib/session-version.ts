/**
 * Server-signed proof that a credential version was issued by the application.
 *
 * `unstable_update()` re-encodes the caller's session cookie, but the same
 * `jwt` callback also receives data from the browser via `useSession().update()`
 * (Auth.js documents that data as untrusted). Without a guard, a client holding
 * an already-revoked token could post `{ sessionVersion: N }` guessed from the
 * database and revive its own session.
 *
 * So a version only lands in the token when it is accompanied by an HMAC that
 * only the server can produce. The client never sees `AUTH_SECRET`, so it
 * cannot mint one.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET is required to sign session versions");
  }
  return value;
}

export function signSessionVersion(userId: string, version: number): string {
  return createHmac("sha256", secret())
    .update(`session-version:${userId}:${version}`)
    .digest("base64url");
}

/** True only for a version/proof pair minted by this server for this user. */
export function verifySessionVersionProof(
  userId: unknown,
  version: unknown,
  proof: unknown
): boolean {
  if (typeof userId !== "string" || userId.length === 0) return false;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 0) {
    return false;
  }
  if (typeof proof !== "string") return false;

  const expected = Buffer.from(signSessionVersion(userId, version));
  const actual = Buffer.from(proof);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
