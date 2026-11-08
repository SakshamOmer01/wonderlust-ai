/**
 * Lightweight in-process rate limiting for Wonderlust API routes.
 *
 * Uses a fixed-window counter keyed by an arbitrary string (usually
 * `route:identifier`). This protects against naive brute-force and
 * accidental abuse on a single server instance.
 *
 * Production note: counters live in process memory, so they reset on deploy
 * and are not shared across instances. For multi-instance deployments, back
 * this with a shared store (e.g. Upstash Redis, Cloudflare KV) using the same
 * interface.
 */

import { HttpError } from "@/lib/api";

type Window = { count: number; resetAt: number };

/**
 * Counters are stored on globalThis so every route bundle (and each dev
 * recompile) shares one map instead of getting a private copy.
 */
const globalForRateLimit = globalThis as unknown as {
  __wonderlustRateLimits?: Map<string, Window>;
};

const windows =
  globalForRateLimit.__wonderlustRateLimits ??
  (globalForRateLimit.__wonderlustRateLimits = new Map<string, Window>());

/** Periodically drop expired windows so the map cannot grow unbounded. */
const MAX_ENTRIES = 10_000;

function sweep(now: number) {
  if (windows.size < MAX_ENTRIES) return;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

/**
 * Consume one unit from a fixed window.
 *
 * @throws HttpError 429 when the limit for the window is exceeded.
 */
export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): void {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (existing.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    throw new HttpError(
      `Too many requests. Please try again in ${retryAfter}s.`,
      429,
      "RATE_LIMITED"
    );
  }

  existing.count += 1;
}

/** Best-effort client identifier for anonymous rate limiting. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  return ip || "unknown";
}

/** Test helper: clear all counters. */
export function resetRateLimits(): void {
  windows.clear();
}
