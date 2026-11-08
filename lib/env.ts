/**
 * Central environment variable access for Wonderlust.
 *
 * All env vars are read at request time (not import time) so that updates to
 * the `.env` file are picked up without a restart.
 */

import { createEnv } from "@/lib/env.server";

export const env = createEnv({
  /**
   * Keys that MUST be present in production. Reading a missing keythrows
   * immediately, which is what we want during actual request handling.
   */
  required: {
    DATABASE_URL: process.env.DATABASE_URL,
      
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    AI_BASE_URL: process.env.AI_BASE_URL,
    AI_API_KEY: process.env.AI_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
    AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS,
  },
  /**
   * Keys that are optional (e.g. when a feature is disabled). Returns the
   * value or `undefined` when the key is missing.
   */
  optional: {
    REDIS_URL: process.env.REDIS_URL,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
  },
});
