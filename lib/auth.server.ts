/**
 * Server-side authentication utilities for Wonderlust.
 *
 * These helpers wrap the Auth.js (NextAuth v5) `auth()` function and are the
 * single source of truth for "who is making this request" in server components
 * and API route handlers.
 *
 * Sessions are signed, HttpOnly JWT cookies issued by Auth.js. Because a JWT
 * cannot be revoked on its own, each token carries the credential version
 * (`User.sessionVersion`) it was issued with. Every authenticated request
 * compares that snapshot with the database, so bumping the version (which
 * `setUserPassword` does) invalidates every existing session immediately.
 */

import type { Session } from "next-auth";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
};

/** Error thrown by helpers that require authentication/authorisation. */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403,
    public readonly code: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Load the user behind a session and reject stale credential versions.
 * Returns null for deleted accounts and revoked sessions.
 */
async function validateSession(session: Session | null): Promise<SessionUser | null> {
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      sessionVersion: true,
    },
  });

  if (!user) return null;

  // A password change bumps sessionVersion, so any token minted earlier is
  // treated as signed out.
  if (user.sessionVersion !== (session.sessionVersion ?? 0)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
  };
}

/**
 * Get the authenticated user for the current request, or null.
 *
 * Safe to call from server components, route handlers and server actions.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return validateSession(session);
}

/** Backwards-compatible session shape used by server components. */
export type UserSession = {
  user: SessionUser;
  expires: string;
};

export async function getSession(): Promise<UserSession | null> {
  const session = await auth();
  const user = await validateSession(session);

  if (!user) return null;

  return { user, expires: session!.expires };
}

/** Throw a 401 unless the request is authenticated. */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("Authentication required", 401, "UNAUTHORIZED");
  }
  return user;
}

/** Throw a 401/403 unless the user holds one of the allowed roles. */
export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("You do not have permission to do that", 403, "FORBIDDEN");
  }
  return user;
}
