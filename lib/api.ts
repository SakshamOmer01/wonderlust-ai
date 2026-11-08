/**
 * Shared helpers for Wonderlust API route handlers.
 *
 * Provides:
 *   - a typed HttpError for expected failures
 *   - `route()` wrapper that maps errors to consistent JSON responses
 *   - zod body validation
 *   - session-based authentication helpers
 *
 * Error responses always use the shape: { error: string, code: string }.
 */

import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { Prisma } from "@prisma/client";

import { AuthError, getSessionUser, type SessionUser } from "@/lib/auth.server";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

/**
 * Wrap a route handler so unexpected errors become 500s and known errors keep
 * their status. Never leaks internal error details to the client.
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AuthError || error instanceof HttpError) {
        return errorResponse(error.message, error.status, error.code);
      }

      if (error instanceof ZodError) {
        const first = error.issues[0];
        return errorResponse(
          first?.message ?? "Invalid request body",
          400,
          "VALIDATION_ERROR"
        );
      }

      // Prisma "record not found" (P2025) and unique violations (P2002).
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return errorResponse("Resource not found", 404, "NOT_FOUND");
        }
        if (error.code === "P2002") {
          return errorResponse("That record already exists", 409, "DUPLICATE");
        }
      }

      console.error("API route error:", error);
      return errorResponse("Internal server error", 500, "INTERNAL_ERROR");
    }
  };
}

/** Require an authenticated session; throws a 401 HttpError otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new HttpError("Authentication required", 401, "UNAUTHORIZED");
  }
  return user;
}

/** Parse and validate a JSON request body against a zod schema. */
export async function parseJson<T>(
  request: Request,
  schema: ZodType<T>
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new HttpError("Request body must be valid JSON", 400, "INVALID_JSON");
  }
  return schema.parse(raw);
}

/** Parse bounded pagination parameters from a query string. */
export function parsePagination(searchParams: URLSearchParams) {
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const offsetRaw = Number.parseInt(searchParams.get("offset") ?? "0", 10);

  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 100)
    : 20;
  const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? offsetRaw : 0;

  return { limit, offset };
}
