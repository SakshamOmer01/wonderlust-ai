/**
 * Destination listing endpoint (public).
 *
 * GET /api/destinations
 *   category   — filter by category
 *   continent  — filter by continent
 *   search     — case-insensitive match on name, country or summary
 *   limit      — 1..100 (default 20)
 *   offset     — pagination offset
 */

import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { parsePagination, route } from "@/lib/api";

export const GET = route(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const { limit, offset } = parsePagination(searchParams);

  const category = searchParams.get("category")?.trim();
  const continent = searchParams.get("continent")?.trim();
  const search = searchParams.get("search")?.trim();

  const where: Prisma.DestinationWhereInput = {
    ...(category ? { category } : {}),
    ...(continent ? { continent } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { country: { contains: search, mode: "insensitive" } },
            { summary: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [destinations, total] = await Promise.all([
    prisma.destination.findMany({
      where,
      orderBy: [{ rating: "desc" }, { name: "asc" }],
      take: limit,
      skip: offset,
    }),
    prisma.destination.count({ where }),
  ]);

  return NextResponse.json({
    destinations,
    pagination: { limit, offset, total, hasMore: offset + limit < total },
  });
});
