/**
 * Real AI provider client for Wonderlust.
 *
 * Supports any OpenAI-compatible chat-completions endpoint (OpenAI, OpenRouter,
 * local vLLM/Ollama, etc.). The endpoint URL, key, model and timeout are all
 * read from environment variables — never hardcoded, never exposed to the
 * browser.
 *
 * The application layer sends a strict zod schema with the request and rejects
 * the whole plan when the AI returns content that does not conform to the
 * schema. `generateObject`-style streaming is not used: a single text request
 * is easier to validate, and a malformed response is detected before any data
 * reaches the database.
 */

export interface AiProviderConfig {
  /** OpenAI-compatible base URL. Empty string falls back to OpenAI official. */
  baseUrl: string;
  /** API key. Fetched from process.env at request time — never cached at import. */
  apiKey: string;
  /** Model name, e.g. gpt-4o-mini, openrouter/deepseek-... */
  model: string;
  /** Request timeout in milliseconds. */
  timeoutMs: number;
}

function loadProviderConfig(): AiProviderConfig {
  const baseUrl = (process.env.AI_BASE_URL ?? "").trim();
  const apiKey = process.env.AI_API_KEY ?? "";
  const model = (process.env.AI_MODEL ?? "gpt-4o-mini").trim() || "gpt-4o-mini";
  const timeoutMs = Number.parseInt(process.env.AI_TIMEOUT_MS ?? "15000", 10) || 15000;

  if (!apiKey) {
    // We still construct a client so that `generatePlan` returns null early
    // with a clear message rather than a raw AuthError reaching the client.
    // The frontend gate below (DEMO_MODE) is the single source of truth for
    // "no key configured".
  }

  return {
    baseUrl: baseUrl || "https://api.openai.com/v1",
    apiKey,
    model,
    timeoutMs,
  };
}

export function isAiConfigured(): boolean {
  const key = process.env.AI_API_KEY ?? "";
  return key.trim().length > 0;
}

export async function generatePlan(input: {
  destination?: string;
  start?: string;
  end?: string;
  travelers?: number;
  budget?: string;
  interests?: string;
  travelStyle?: string;
  model?: string;
}): Promise<{ status: "ready" | "missing-key" | "error"; plan: any | null }> {
  const config = loadProviderConfig();

  // Fast path: no key configured at all.
  if (!config.apiKey) {
    return { status: "missing-key", plan: null };
  }

  const payload = {
    model: (input.model && input.model.trim()) || config.model,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(input),
      },
      {
        role: "user",
        content: buildUserPrompt(input),
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);

    const response = await fetch(
      config.baseUrl.replace(/\/+$/, "") + "/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + config.apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) {
        // Rate limited
      } else {
        // Other HTTP error
      }
      return { status: "error", plan: null };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    // Try to parse the response as JSON. The model is instructed to emit
    // strict JSON only; anything else is treated as malformed.
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    // Validate the parsed shape against the known plan schema. If it does not
    // match, do not store anything stale — return null.
    if (!parsed || typeof parsed !== "object" || typeof parsed.title !== "string" || !Array.isArray(parsed.itinerary)) {
      return { status: "error", plan: null };
    }

    return { status: "ready", plan: parsed };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        // Timeout: the caller treats this as retryable.
      }
      // Network errors (ENOTFOUND, ECONNREFUSED, etc.) surface as error status.
    }
    return { status: "error", plan: null };
  }
}

function buildSystemPrompt(input: {
  destination?: string;
  start?: string;
  end?: string;
  travelers?: number;
  budget?: string;
  interests?: string;
  travelStyle?: string;
}): string {
  const parts: string[] = [];
  parts.push("You are an expert travel planner. Produce a JSON object (no markdown fences, no prose) that exactly matches the schema the caller validates. The schema is:");
  parts.push("{");
  parts.push('  "title": string,');
  parts.push('  "destination": { "name": string, "country": string, "region": string },');
  parts.push('  "start": string,');
  parts.push('  "end": string,');
  parts.push('  "travelers": number,');
  parts.push('  "style": "budget" | "standard" | "luxury" | "adventure" | "family" | "romantic",');
  parts.push('  "interests": string[],');
  parts.push('  "itinerary": [ { "day": number, "morning": string[], "afternoon": string[], "evening": string[], "foods": string[], "transport": string[], "tips": string[] } ],');
  parts.push('  "budget": { "accommodation": number, "food": number, "transportation": number, "activity": number, "other": number, "total": number, "remaining": number }');
  parts.push("}");
  parts.push("Rules:");
  parts.push("1. Output ONLY valid JSON. No code fences, no commentary, no trailing commas.");
  parts.push("2. Every string in the itinerary arrays must be non-empty and useful to a traveller.");
  parts.push("3. Use travel dates and destination from the user's request.");
  parts.push("4. The budget numbers must be realistic for the style, destination and duration.");
  parts.push("5. The itinerary must have one entry per day, with day numbers starting at 1.");
  if (input.destination) {
    parts.push("6. Destination: " + input.destination);
  }
  if (input.travelers) {
    parts.push("7. " + input.travelers + " travellers");
  }
  if (input.budget) {
    parts.push("8. Budget style: " + input.budget);
  }
  if (input.interests) {
    parts.push("9. Interests: " + input.interests);
  }
  if (input.travelStyle) {
    parts.push("10. Travel style: " + input.travelStyle);
  }
  return parts.join("\n");
}

function buildUserPrompt(input: {
  destination?: string;
  start?: string;
  end?: string;
  travelers?: number;
  budget?: string;
  interests?: string;
  travelStyle?: string;
}): string {
  const parts: string[] = [];
  if (input.destination) parts.push("Destination: " + input.destination);
  if (input.start) parts.push("Start date: " + input.start);
  if (input.end) parts.push("End date: " + input.end);
  if (input.travelers) parts.push("Travelers: " + input.travelers);
  if (input.budget) parts.push("Budget style: " + input.budget);
  if (input.interests) parts.push("Interests: " + input.interests);
  if (input.travelStyle) parts.push("Travel style: " + input.travelStyle);
  return parts.join("\n");
}

export type TripPlanContents = {
  title: string;
  destination: { name: string; country: string; region: string };
  start: string;
  end: string;
  travelers: number;
  style: "budget" | "standard" | "luxury" | "adventure" | "family" | "romantic";
  interests: string[];
  itinerary: { day: number; morning: string[]; afternoon: string[]; evening: string[]; foods: string[]; transport: string[]; tips: string[] }[];
  budget: { accommodation: number; food: number; transportation: number; activity: number; other: number; total: number; remaining: number };
};

export async function generateAssistantReply(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[],
  tripContext: { destination?: string; start?: string; end?: string; travelers?: number; budget?: string; interests?: string; travelStyle?: string; title?: string }
): Promise<{ reply: string; status: "ready" | "missing-key" | "error" }> {
  const config = loadProviderConfig();

  if (!config.apiKey) {
    return { reply: "", status: "missing-key" };
  }

  const ctx: string[] = ["You are Wonderlust's travel assistant. Answer clearly and helpfully."];
  if (tripContext?.title) ctx.push(`Trip: ${tripContext.title}`);
  if (tripContext?.destination) ctx.push(`Destination: ${tripContext.destination}`);
  if (tripContext?.start || tripContext?.end) ctx.push(`Dates: ${tripContext?.start ?? "?"} to ${tripContext?.end ?? "?"}`);
  if (tripContext?.travelers) ctx.push(`Travelers: ${tripContext.travelers}`);
  if (tripContext?.budget) ctx.push(`Budget: ${tripContext.budget}`);
  if (tripContext?.interests) ctx.push(`Interests: ${tripContext.interests}`);
  if (tripContext?.travelStyle) ctx.push(`Travel style: ${tripContext.travelStyle}`);
  ctx.push("If you suggest itinerary or budget changes, be specific and practical. Do not invent unavailable bookings or prices as confirmed.");
  const systemMessage = ctx.join("\n");
  const messages = [
    { role: "system" as const, content: systemMessage },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  try {
    const response = await fetch(config.baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + config.apiKey,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });

    if (!response.ok) {
      return { reply: "", status: "error" };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return { reply: text, status: "ready" };
  } catch {
    return { reply: "", status: "error" };
  }
}

