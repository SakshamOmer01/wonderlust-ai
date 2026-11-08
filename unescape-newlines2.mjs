import { readFileSync, writeFileSync } from "node:fs";

// Convert literal backslash-n sequences to actual newlines in TS/JS files.
// Handles: normal strings, template literals (backticks), // and /* */ comments,
// and single-quoted strings. Skips content inside quotes/comments so we never
// break string literals or escape sequences.
function unescape(content) {
  let out = "";
  let i = 0;
  const n = content.length;

  // State: 0 = code, 1 = single-quoted string, 2 = double-quoted string,
  // 3 = template literal, 4 = // line comment, 5 = /* block comment.
  let state = 0;

  while (i < n) {
    const ch = content[i];

    // ---- handle block-comment exit ----
    if (state === 5 && ch === "*" && i + 1 < n && content[i + 1] === "/") {
      out += ch;
      i++;
      out += content[i];
      i++;
      state = 0;
      continue;
    }

    // ---- block comment ----
    if (state === 0 && ch === "/" && i + 1 < n && content[i + 1] === "*") {
      state = 5;
      out += ch + content[i + 1];
      i += 2;
      continue;
    }

    // ---- line comment ----
    if (state === 0 && ch === "/" && i + 1 < n && content[i + 1] === "/") {
      state = 4;
      out += ch + content[i + 1];
      i += 2;
      continue;
    }

    // ---- string / template literals ----
    if (state === 0 && (ch === "'" || ch === '"' || ch === "`")) {
      state = ch === "`" ? 3 : ch === "'" ? 1 : 2;
      out += ch;
      i++;
      continue;
    }
    if (state === 1) {
      if (ch === "'" && content[i - 1] !== "\\") state = 0;
      out += ch;
      i++;
      continue;
    }
    if (state === 2) {
      if (ch === '"' && content[i - 1] !== "\\") state = 0;
      out += ch;
      i++;
      continue;
    }
    if (state === 3) {
      if (ch === "`") state = 0;
      out += ch;
      i++;
      continue;
    }
    if (state === 4) {
      // newline ends a line comment; keep the newline so line numbers stay sane
      if (ch === "\n") state = 0;
      out += ch;
      i++;
      continue;
    }

    // ---- plain code ----
    if (ch === "\\" && i + 1 < n && content[i + 1] === "n") {
      // Unescape a literal \n into a real newline (safe: we are not in a
      // string or comment, so this only appears in code that has already
      // been stringified; converting to a newline is what the template
      // intended).
      out += "\n";
      i += 2;
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

const files = [
  "app/api/trips/ai/route.ts",
  "app/api/trips/[id]/itinerary/route.ts",
  "app/api/trip/[id]/budget/route.ts",
  "app/api/chat/route.ts",
  "lib/ai.ts",
  "lib/budget.ts",
  "lib/trip-ai.ts",
  "lib/trip-plan.ts",
];

for (const rel of files) {
  const abs = rel; // run from project root cwd
  const c = readFileSync(abs, "utf8");
  const out = unescape(c);
  writeFileSync(abs, out);
  const diffs = c.length - out.length;
  console.log(`${rel}: ${c.length} -> ${out.length} (${diffs} chars saved)`);
}
