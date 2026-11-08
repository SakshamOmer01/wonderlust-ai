/**
 * Database seed script for Wonderlust.
 *
 * Inserts a small catalogue of destinations plus an administrator account so
 * the API can be exercised locally. Safe to re-run: upserts by unique keys.
 *
 * Usage: npm run db:seed
 * Requires DATABASE_URL.
 */

import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be set to seed the database");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const destinations = [
  {
    slug: "bali-indonesia",
    name: "Bali",
    country: "Indonesia",
    continent: "Asia",
    category: "beach",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21",
    rating: 4.8,
    summary: "Rice terraces, temples and surf breaks on a volcanic island.",
    bestTimeToVisit: "April to October",
  },
  {
    slug: "kyoto-japan",
    name: "Kyoto",
    country: "Japan",
    continent: "Asia",
    category: "cultural",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
    rating: 4.9,
    summary: "Thousand-year-old temples, tea houses and bamboo groves.",
    bestTimeToVisit: "March to May",
  },
  {
    slug: "patagonia-chile",
    name: "Patagonia",
    country: "Chile",
    continent: "South America",
    category: "adventure",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
    rating: 4.7,
    summary: "Granite spires, glaciers and windswept trekking routes.",
    bestTimeToVisit: "November to March",
  },
  {
    slug: "santorini-greece",
    name: "Santorini",
    country: "Greece",
    continent: "Europe",
    category: "beach",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff",
    rating: 4.6,
    summary: "Whitewashed villages above a flooded volcanic caldera.",
    bestTimeToVisit: "May to October",
  },
];

async function main() {
  for (const destination of destinations) {
    await prisma.destination.upsert({
      where: { slug: destination.slug },
      update: destination,
      create: destination,
    });
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@wonderlust.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Wonderlust123!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Wonderlust Admin",
      role: "admin",
      profile: { create: { bio: "Platform administrator" } },
    },
  });

  console.log(
    `Seeded ${destinations.length} destinations and admin account ${email}`
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
