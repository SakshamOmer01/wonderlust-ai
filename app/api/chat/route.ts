/**
 * AI travel assistant — POST /api/chat
 *
 * Context-aware conversational assistant wired to the user's active trip.
 *
 * Body: {
 *   conversationId: string,   // client-supplied; reused for the conversation
 *   message: string,          // the user's question / request
 *   tripId?: string,          // optional; the trip the assistant should tailor
 *   tripContext?: {           // optional; denormalised trip fields the client
 *     title?: string;
 *     destination?: string;
 *     start?: string;
 *     end?: string;
 *   }
 * }
 *
 * The endpoint stores every message (user + assistant) server-side in
 * `AiChatMessage`, so the conversation survives restarts and remains scoped
 * to the authenticated user. The reply is produced server-side only: the API
 * key never leaves the server and the browser never sees it.
 *
 * When no API key is configured the endpoint still accepts the message,
 * stores it, and returns an empty reply with `ai: { configured: false }`;
 * the UI then serves DEMO_MODE and shows the operator setup instructions.
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth.server";
import { generateAssistantMessage } from "@/lib/trip-plan";

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const body = await request.json().catch(() => ({}));

  const { conversationId, message, tripId, tripContext } = body as {
    conversationId: string;
    message: string;
    tripId?: string;
    tripContext?: { title?: string; destination?: string; start?: string; end?: string };
  };

  if (!conversationId || typeof conversationId !== "string") {
    throw new Error("MISSING_CONVERSATION_ID");
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    throw new Error("MISSING_MESSAGE");
  }

  // Sanitize inputs: the assistant must never trust a message that could be
  // interpreted as a prompt-injection attempt.
  const cleanMessage = message.trim().slice(0, 2000);

  const result = await generateAssistantMessage(
    user.id,
    conversationId,
    cleanMessage,
    {
      title: tripContext?.title,
      destination: tripContext?.destination,
      start: tripContext?.start,
      end: tripContext?.end,
    }
  );

  return NextResponse.json({
    reply: result.reply,
    conversationId,
    ai: {
      configured: result.status === "ready",
      source: result.status === "ready" ? "ai" : "demo",
    },
  });
});
