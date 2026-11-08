/**
 * Utilities for reading environment variables.
 *
 * The `env` object (imported as `@/lib/env`) wraps Zod for runtime
 * validation. In development it returns whatever is on `process.env`; in
 * production, missing required keys throw immediately so that config errors
 * surface early instead of failing mid-request with a cryptic database error.
 */

import { z } from "zod";

/**
 * Reads an environment variable and optionally validates its shape.
 *
 * Returns the string value, or `undefined` when the key is not set and is
 * marked optional.
 */
export function readEnv(key: string): string | undefined {
  const value = process.env[key];
  return value?.trim() === "" ? undefined : value;
}

/**
 * A type-level helper for a flat map of `string | undefined` values. `createEnv`
 * uses this so that the typed `env` object matches `process.env`.
 */
export type EnvMap = Record<string, string | undefined>;

/**
 * Build a typed `env` object using Zod validation.
 *
 * - `required`: keys that must be present. Reading a missing key throws a
 *   descriptive error. In production, this fails fast at import time.
 * - `optional`: keys that may be absent. Returns the trimmed value or
 *   `undefined`.
 *
 * Example:
 *   import { env } from "@/lib/env";
 *   const dbUrl = env.DATABASE_URL!; // throws if missing
 *   const redis = env.REDIS_URL;     // undefined when not set
 */
export function createEnv<T extends EnvMap, U extends EnvMap = Record<string, never>>(
  config: {
    required: T;
    optional?: U;
  }
): T & U {
  const { required, optional = {} } = config;

  // The returned object has the same shape as `required` + `optional`.
  const env: T & U = {} as T & U;

  // Required keys: fail fast in production.
  for (const [key, fallback] of Object.entries(required)) {
    const value = readEnv(key);
    if (!value) {
      throw new Error(
        `[env] Missing required environment variable: ${key}. ` +
          `Set it in your .env file (e.g. DATABASE_URL, JWT_SECRET).`
      );
    }
    (env as unknown as Record<string, string>)[key] = value;
  }

  // Optional keys: read or leave undefined.
  for (const [key, fallback] of Object.entries(optional)) {
    const value = readEnv(key);
    if (value !== undefined) {
      (env as unknown as Record<string, string>)[key] = value;
    }
  }

  return env;
}
