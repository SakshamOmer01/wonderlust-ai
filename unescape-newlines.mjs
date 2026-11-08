import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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
  const abs = join(process.cwd(), rel);
  let c = readFileSync(abs, "utf8");
  const before = c.length;

  let out = "";
  let inSingle = false;
  let inDouble = false;
  let escape = false;

  for (let i = 0; i < c.length; i++) {
    const ch = c[i];
    if (escape) {
      out += ch;
      escape = false;
      continue;
    }
    if (inSingle) {
      if (ch === "'") {
        inSingle = false;
        out += ch;
      } else if (ch === "\\" && i + 1 < c.length && c[i + 1] === "'") {
        inSingle = false;
        out += "\\'";
        i++;
      } else if (ch === "\\") {
        out += ch;
        escape = true;
      } else {
        out += ch;
      }
      continue;
    }
    if (inDouble) {
      if (ch === '"') {
        inDouble = false;
        out += ch;
      } else if (ch === "\\" && i + 1 < c.length && c[i + 1] === '"') {
        inDouble = false;
        out += '"';
        i++;
      } else if (ch === "\\") {
        out += ch;
        escape = true;
      } else {
        out += ch;
      }
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      out += ch;
    } else if (ch === '"') {
      inDouble = true;
      out += ch;
    } else if (ch === "\\" && i + 1 < c.length && c[i + 1] === "n") {
      out += "\n";
      i++;
    } else {
      out += ch;
    }
  }

  writeFileSync(abs, out);
  console.log(`${rel}: ${before} -> ${out.length} chars`);
}
