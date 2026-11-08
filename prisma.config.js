/** Prisma 7 configuration for Wonderlust.
 *
 * PostgreSQL database via DATABASE_URL environment variable.
 *
 * Required environment variables:
 *   DATABASE_URL — PostgreSQL connection string
 *
 * Example:
 *   DATABASE_URL="postgresql://user:password@localhost:5432/wonderlust"
 */
import "dotenv/config";
import { defineConfig } from "@prisma/config";
export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url: process.env.DATABASE_URL,
    },
});
