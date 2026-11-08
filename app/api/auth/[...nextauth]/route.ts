/**
 * Auth.js (NextAuth v5) catch-all route handler.
 *
 * Serves the full Auth.js endpoint set under /api/auth:
 *   GET  /api/auth/session          — current session
 *   GET  /api/auth/csrf             — CSRF token
 *   POST /api/auth/callback/credentials — email/password login
 *   POST /api/auth/signout          — sign out and clear the session cookie
 *
 * Static sibling routes (/api/auth/register, /api/auth/forgot-password) take
 * precedence over this catch-all.
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
