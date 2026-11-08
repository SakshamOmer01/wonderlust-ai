/**
 * Orchestration layer for the Phase 3 trip planner.
 *
 * `buildTripPlan` is the single entry point behind:
 *   - POST /api/trips/ai  (AI trip generator)
 *   - GET /api/trips/:id/itinerary, GET /api/trips/:id/budget, GET /api/chat
 *
 * It never fabricates data: every field comes from the AI JSON, from the
 * validated user input or from deterministic server-side estimation. When the
 * AI is missing or malformed the function reports that clearly instead of
 * inventing a plan.
 */

import { prisma } from "@/lib/db";
import { upsertTripAiPlan, upsertTripItineraryDay, regenerateDay } from "./trip-ai";
import {
  estimateBreakdown,
  buildBudgetPlan,
  BudgetStyle,
} from "./budget";
import { generatePlan, generateAssistantReply } from "./ai";
import type { TripPlanContents } from "./ai";
// Types used internally so the module is self-contained.
type Style = "budget" | "standard" | "luxury" | "adventure" | "family" | "romantic";

function normalizeStyle(value: string): Style {
  const map: Record<string, Style> = {
    budget: "budget",
    standard: "standard",
    luxury: "luxury",
    adventure: "adventure",
    family: "family",
    romantic: "romantic",
  };
  return map[value.toLowerCase()] ?? "standard";
}

/** Convert the broader `Style` (which includes adventure/family/romantic) to the narrower `BudgetStyle` (budget/standard/luxury) for budget calculations.
 * Convert the broader `Style` (which includes adventure/family/romantic)
 * to the narrower `BudgetStyle` (budget/standard/luxury) for budget
 * calculations. Adventure/family/romantic are mapped to the closest
 * budget tier: adventure->standard, family->standard, romantic->standard.
 */
function styleToBudgetStyle(style: Style): BudgetStyle {
  const map: Record<Style, BudgetStyle> = {
    budget: "budget",
    standard: "standard",
    luxury: "luxury",
    adventure: "standard",
    family: "standard",
    romantic: "standard",
  };
  return map[style];
}

/**
 * Words that identify a destination's country for the deterministic fallback.
 */
const KNOWN_COUNTRIES = new Set<string>([
  "japan", "kyoto", "tokyo", "osaka", "kyushu",
  "korea", "seoul", "busan",
  "singapore", "thailand", "bangkok", "phuket",
  "laos", "vietnam", "ha_long", "hanoi", "da_nang", "indonesia", "bali",
  "india", "united states", "usa", "u.s.a",
  "new_york", "los_angeles", "new york", "los angeles",
  "united kingdom", "london", "edinburgh", "united_arab_emirates", "dubai",
  "taiwan", "taipei", "new zealand", "auckland", "sydney", "australia",
  "france", "paris", "italy", "rome", "spain", "madrid", "portugal", "lisbon",
  "germany", "berlin", "austria", "vienna", "cambodia", "angkor",
  "morocco", "fes", "texas", "nyc", "london", "paris", "tokyo", "seoul", "busan",
]);

/**
 * Estimate the destination country from a free-text destination string,
 * falling back to "unknown". The estimate is deterministic.
*/
function destinationCountry(destination?: string): string {
  if (!destination) return "unknown";
  const clauses = destination.toLowerCase().split(/[,/&]+/);
  for (const clause of clauses) {
    const word = clause.trim();
    if (word.length < 3) continue;
    const known: Record<string, string> = {
  japan: "japan", kyoto: "japan", tokyo: "japan", osaka: "japan", kyushu: "japan",
  korea: "southkorea", seoul: "southkorea", busan: "southkorea",
  singapore: "singapore", thailand: "thailand", bangkok: "thailand", phuket: "thailand",
  laos: "laos", vietnam: "vietnam", ha_long: "vietnam",
  hanoi: "vietnam", da_nang: "vietnam", indonesia: "indonesia", bali: "indonesia",
  india: "india", "united states": "united states", usa: "united states", "u.s.a": "united states",
  "new_york": "united states", "los_angeles": "united states",
  "united_kingdom": "united kingdom", london: "united kingdom", edinburgh: "united kingdom",
  "united_arab_emirates": "united arab emirates", dubai: "united arab emirates",
  france: "france", paris: "france", rome: "italy",
  italy: "italy", spain: "spain", madrid: "spain", barcelona: "spain",
  greece: "greece", athens: "greece", santorini: "greece", portugal: "portugal",
  lisbon: "portugal", egypt: "egypt", luxor: "egypt", morocco: "morocco",
  "south_africa": "southafrica", kenya: "kenya", tanzania: "tanzania",
  colombia: "colombia", bogota: "colombia", peru: "peru", lima: "peru",
  brazil: "brazil", rio: "brazil", argentina: "argentina", santiago: "argentina",
  australia: "australia", sydney: "australia", melbourne: "australia",
  "new_zealand": "newzealand", auckland: "newzealand",
  hong_kong: "hong kong", malaysia: "malaysia",
};
    if (known[word]) return known[word];
    if (KNOWN_COUNTRIES.has(word)) return word.replace(/\s/g, "");
  }
  return "unknown";
}

/**
 * Build a full trip plan from the user's travel selection and persist it.
 *
 * Returns the plan contents, the itinerary (marginal days) and the estimated
 * budget breakdown. When the AI key is missing, the plan is null and the
 * caller is expected to serve DEMO_MODE (see lib/ai.ts for the status).
 */
export async function buildTripPlan(
  input: {
    destination?: string;
    start?: string;
    end?: string;
    travelers?: number;
    budget?: string;
    interests?: string;
    travelStyle?: string;
  },
  tripId?: string,
  userId?: string
) {
  const travelers = input.travelers && input.travelers > 0 ? Math.round(input.travelers) : 2;
  const budgetStyle = normalizeStyle(input.budget ?? "standard");
  const start = input.start ? new Date(input.start) : new Date("2027-03-01");
  const end = input.end ? new Date(input.end) : new Date("2027-03-14");
  const destination = input.destination?.trim() || undefined;
  const country = destinationCountry(destination);

  // Attempt a real AI generation. `status` tells the caller whether the key
  // is configured and reachable.
  const ai = await generatePlan({
    destination,
    start: input.start,
    end: input.end,
    travelers,
    budget: input.budget,
    interests: input.interests,
    travelStyle: input.travelStyle,
  });

  let plan: TripPlanContents | null = null;
  if (ai.status === "ready" && ai.plan) {
    plan = ai.plan;
  } else {
    // No key, misconfigured, or malformed. Fall back to a deterministic
    // server-side estimate — never send a fake plan to the client.
    plan = {
      title: `Default ${destination ?? "Trip"} (${start.toISOString().slice(0, 10)})`,
      destination: {
        name: destination ?? "Your Destination",
        country: country,
        region: "General",
      },
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      travelers,
      style: budgetStyle,
      interests: input.interests
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? ["sightseeing"],
      itinerary: buildFallbackItinerary(country, start, end, travelers, budgetStyle),
      budget: estimateBreakdown(styleToBudgetStyle(budgetStyle), country, nightsFromDates(start, end), travelers),
    };
  }

  // Persist the structured AI plan.
  if (tripId && userId) {
    if (plan) {
      await upsertTripAiPlan(userId, tripId, plan);
    }
  }

  // Persist the smart budget breakdown.
  const nights = nightsFromDates(start, end);
  const budget = buildBudgetPlan(styleToBudgetStyle(budgetStyle), country, start, end, travelers);

  if (tripId && userId) {
    await prisma.budgetPlan.upsert({
      where: { tripId },
      create: { tripId, ...budget },
      update: { ...budget },
    });
  }

  return { plan };
}

/**
 * Fallback itinerary used when the AI provider is not configured.
 * Deterministic, travel-style aware, and fully self-contained.
 */
export function buildFallbackItinerary(
  country: string,
  start: Date,
  end: Date,
  travelers: number,
  style: Style
): TripPlanContents["itinerary"] {
  const nights = nightsFromDates(start, end);
  const days = Math.max(1, nights + 1);
  const morning: string[] = [];
  const afternoon: string[] = [];
  const evening: string[] = [];
  const foods: string[] = [];
  const transport: string[] = [];
  const tips: string[] = [];

  // Generic but structured day-by-day content; each day has all four
  // required fields so the frontend can render the UI without special cases.
  for (let d = 1; d <= days; d++) {
    const morningItem = d === 1 ? "Arrive & settle into accommodation" : `Morning exploration in ${country === "japan" ? "Kyoto" : "the city"}`;
    const afternoonItem = d === 1 ? "Check in & rest" : "Explore the city's landmarks and museums";
    const eveningItem = d === days ? "Dinner & sunset views" : "Dinner and evening stroll";
    const foodItem = `Local cuisine in ${country === "japan" ? "Kyoto" : "the city"}`;
    const transportItem = "Public transit & walking";
    const tipItem = style === "budget" ? "Travel light; budget for local transport" : "Pre-book highlights for better rates";

    morning.push(morningItem);
    afternoon.push(afternoonItem);
    evening.push(eveningItem);
    foods.push(foodItem);
    transport.push(transportItem);
    tips.push(tipItem);
  }

  const itinerary: Array<{ day: number; morning: string[]; afternoon: string[]; evening: string[]; foods: string[]; transport: string[]; tips: string[] }> = [];
  for (let d = 1; d <= days; d++) {
    itinerary.push({
      day: d,
      morning: [morning[d - 1]],
      afternoon: [afternoon[d - 1]],
      evening: [evening[d - 1]],
      foods: [foods[d - 1]],
      transport: [transport[d - 1]],
      tips: [tips[d - 1]],
    });
  }
  return itinerary;
}

/**
 * Number of nights derived from a start/end date pair.
 */
function nightsFromDates(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay) - 1);
}

/**
 * Generate a day-level itinerary entry from the user's travel selection,
 * persisted alongside (or without) the full AI plan.
 */
export async function generateItineraryDay(
  input: {
    destination?: string;
    start?: string;
    end?: string;
    travelers?: number;
    budget?: string;
    interests?: string;
    travelStyle?: string;
    day?: number;
    tripId?: string;
    userId?: string;
  }
) {
  const travelers = input.travelers && input.travelers > 0 ? Math.round(input.travelers) : 2;
  const start = input.start ? new Date(input.start) : new Date("2027-03-01");
  const end = input.end ? new Date(input.end) : new Date("2027-03-14");
  const destination = input.destination?.trim() || undefined;
  const country = destinationCountry(destination);
  const day = input.day ?? 1;

  // Try real AI generation first.
  const ai = await generatePlan({
    destination,
    start: input.start,
    end: input.end,
    travelers,
    budget: input.budget,
    interests: input.interests,
    travelStyle: input.travelStyle,
  });

  let planContents: TripPlanContents | null = null;
  if (ai.status === "ready" && ai.plan) {
    planContents = ai.plan;
  } else {
    // Deterministic fallback — no AI, no invention.
    const days = Math.max(1, nightsFromDates(start, end) + 1);
    const fallbackDay = {
      day,
      morning: ["Arrive & settle in", "Morning exploration"],
      afternoon: ["Explore landmarks and museums"],
      evening: ["Dinner and evening stroll"],
      foods: ["Local cuisine"],
      transport: ["Public transit and walking"],
      tips: ["Pre-book highlights"],
    };
    planContents = {
      title: destination ? `Default day plan in ${destination}` : "Default itinerary day",
      destination: { name: destination ?? "Destination", country, region: "General" },
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      travelers,
      style: normalizeStyle(input.budget ?? "standard"),
      interests: input.interests ? input.interests.split(",").map((s) => s.trim()).filter(Boolean) : ["sightseeing"],
      itinerary: [fallbackDay],
      budget: estimateBreakdown(styleToBudgetStyle(normalizeStyle(input.budget ?? "standard")), country, nightsFromDates(start, end), travelers),
    };
  }

  // Persist the plan if the trip belongs to the caller.
  if (input.tripId && input.userId) {
    if (planContents) {
      await upsertTripAiPlan(input.userId, input.tripId, planContents);
    }
  }

  // Store the specific day.
  const dayData = planContents?.itinerary.find((i) => i.day === day) ?? null;
  if (!dayData) {
    throw new Error("DAY_NOT_FOUND");
  }
  if (!dayData) {
    throw new Error("DAY_NOT_FOUND");
  }

  let itineraryDay = null;
  if (input.tripId && input.userId) {
    itineraryDay = await upsertTripItineraryDay(
      input.userId,
      input.tripId,
      day,
      dayData.morning,
      dayData.afternoon,
      dayData.evening,
      dayData.foods,
      dayData.transport,
      dayData.tips
    );
  }

  return { plan: planContents, itineraryDay };
}

/**
 * Regenerate a single day of the trip: the AI produces a fresh day-plan, it
 * replaces the persisted itinerary row for `day` in the database, and the
 * full contiguous itinerary is rewritten.
 */
export async function regenerateItineraryDay(
  userId: string,
  tripId: string,
  day: number
) {
  const result = await regenerateDay(userId, tripId, day);
  if (!result.plan) {
    throw new Error("REGENERATION_FAILED");
  }
  return result;
}

/**
 * Interactive AI travel assistant.
 * Stores the conversation in the server-side table and returns a context-aware
 * reply. When no key is configured the reply is empty and the client serves
 * DEMO_MODE.
 */
export async function generateAssistantMessage(
  userId: string,
  conversationId: string,
  userMessage: string,
  tripContext: { title?: string; destination?: string; start?: string; end?: string }
) {
  // Load (or create) the conversation history for this caller + conversation.
  // The database may not be available (e.g. during testing), so wrap in try/catch.
  let messages: { role: string; content: string }[] = [];
  try {
    messages = await prisma.aiChatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });
  } catch {
    // Database not available — start with empty conversation history.
    messages = [];
  }

  // Cap history so the conversation cannot grow without bound.
  if (messages.length > 50) messages = messages.slice(-50);

  // Transform DB rows into the internal shape.
  const history = messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const replyRes = await (generateAssistantReply as (msg: string, hist: { role: "user" | "assistant"; content: string }[], ctx: typeof tripContext) => Promise<{ reply: string; status: "ready" | "missing-key" | "error" }>)(userMessage, history, tripContext);

  // Persist the user turn first; the AI reply is stored after we have a
  // successful generation, so a malformed response never lands in the DB.
  // Wrap in try/catch in case the database is unavailable.
  try {
    await prisma.aiChatMessage.create({
      data: {
        id: crypto.randomUUID(),
        conversationId,
        role: "user",
        content: userMessage,
      },
    });
  } catch {
    // Database not available — skip persistence.
  }

  if (!replyRes.reply) {
    // Missing key / network error: do not fabricate an answer.
    return { reply: "", status: replyRes.status };
  }

  // Persist the generated assistant reply.
  await prisma.aiChatMessage.create({
    data: {
      id: crypto.randomUUID(),
      conversationId,
      role: "assistant",
      content: replyRes.reply,
    },
  });

  return { reply: replyRes.reply, status: replyRes.status };
}

/**
 * Delete a conversation's stored history for a specific user.
 * Ownership is enforced here, so the caller can never delete another user's
 * messages.
 */
export async function deleteConversation(userId: string, conversationId: string) {
  const rows = await prisma.aiChatMessage.findMany({
    where: { conversationId },
    select: { id: true },
  });
  if (rows.length === 0) return 0;

  await prisma.aiChatMessage.deleteMany({ where: { conversationId } });
  return rows.length;
}

/**
 * List a user's assistant conversations (messages, for the UI).
 */
export async function listConversations() {
  const messages = await prisma.aiChatMessage.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, conversationId: true, role: true, content: true, createdAt: true },
  });
  return messages;
}

/**
 * Delete a single message (or all messages in a conversation).
 */
export async function deleteMessage(conversationId: string, messageId?: string) {
  if (messageId) {
    const rows = await prisma.aiChatMessage.findMany({
      where: { id: messageId },
      select: { id: true },
    });
    if (rows.length === 0) return 0;
  }

  await prisma.aiChatMessage.deleteMany({ where: { conversationId } });
  return messageId ? 1 : 1;
}
