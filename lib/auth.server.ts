/**
 * Server-side authentication utilities for Wonderlust.
 *
 * These helpers wrap the Auth.js (NextAuth v5) `auth()` function and are the
 * single source of truth for "who is making this request" in server components
 * and API route handlers.
 *
 * The session is a signed, HttpOnly JWT cookie issued by Auth.js. It is never
 * derived from request headers, query parameters, or client-supplied IDs.
 */

import { auth } from "@/lib/auth";

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
 * Get the authenticated user for the current request, or null.
 *
 * Safe to call from server components, route handlers and server actions.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    avatar: session.user.image ?? null,
    role: session.user.role ?? "user",
  };
}

/** Backwards-compatible session shape used by server components. */
export type UserSession = {
  user: SessionUser;
  expires: string;
};

export async function getSession(): Promise<UserSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name ?? null,
      avatar: session.user.image ?? null,
      role: session.user.role ?? "user",
    },
    expires: session.expires,
  };
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
