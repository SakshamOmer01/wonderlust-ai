-- Phase 3: AI trip generator, structured itinerary, smart budget planner,
-- AI travel assistant, and trip management (save/view/edit/delete/regenerate).
--
-- These fields are only the storage layer. The application layer parses the
-- AI output into these columns and e2e validates the numbers with zod+Prisma.

-- Rich structured itinerary JSON for a trip.
CREATE TABLE "TripAiPlan" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "contents" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TripAiPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TripAiPlan_tripId_key" ON "TripAiPlan"("tripId");

-- Aggregate budget table for chart rendering and remaining-balance math.
CREATE TABLE "BudgetPlan" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "accommodation" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "food" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "transportation" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "activity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "other" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "remaining" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BudgetPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BudgetPlan_tripId_key" ON "BudgetPlan"("tripId");

-- Real AI provider config (OpenAI-compatible). The key is read exclusively by
-- server-side API routes and is never shipped to the browser.
CREATE TABLE "AiConfig" (
  "key" TEXT NOT NULL,
  "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  "baseUrl" TEXT NOT NULL DEFAULT 'https://api.openai.com/v1',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AiConfig_pkey" PRIMARY KEY ("key")
);

-- Conversation history for the AI travel assistant (server-side store).
CREATE TABLE "AiChatMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AiChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiChatMessage_conversationId_idx" ON "AiChatMessage"("conversationId");

-- One-to-one back references from Trip to the structured tables.
ALTER TABLE "TripAiPlan"
  ADD CONSTRAINT "TripAiPlan_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BudgetPlan"
  ADD CONSTRAINT "BudgetPlan_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
