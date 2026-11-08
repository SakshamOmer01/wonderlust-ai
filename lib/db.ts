/**
 * Database client for Wonderlust.
 *
 * Prisma 7 requires a driver adapter; `@prisma/adapter-pg` connects over the
 * standard PostgreSQL protocol using DATABASE_URL.
 *
 * Required environment variable:
 *   DATABASE_URL="postgresql://user:password@host:5432/wonderlust"
 *
 * If DATABASE_URL is missing, the client is still constructed so that imports
 * work during a build, but every query fails with a clear connection error
 * instead of silently succeeding.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL ?? "";

if (!connectionString && process.env.NODE_ENV !== "test") {
  console.warn(
    "[db] DATABASE_URL is not set — database queries will fail. " +
      "Copy .env.example to .env and provide a PostgreSQL connection string."
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
