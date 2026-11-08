import re
import sys

files = [
    "app/api/trips/ai/route.ts",
    "app/api/trips/[id]/itinerary/route.ts",
    "app/api/trip/[id]/budget/route.ts",
    "app/api/chat/route.ts",
    "lib/ai.ts",
    "lib/budget.ts",
    "lib/trip-ai.ts",
    "lib/trip-plan.ts",
]

for rel in files:
    with open(rel, "r", encoding="utf-8") as f:
        c = f.read()

    # Replace backslash+n with newline, but only when the backslash is NOT
    # itself escaped (i.e. not preceded by an odd number of backslashes).
    def repl(m):
        return "\n"

    # Walk and replace
    out = []
    i = 0
    n = len(c)
    while i < n:
        ch = c[i]
        if ch == "\\" and i + 1 < n and c[i + 1] == "n":
            # Count preceding backslashes (odd => escaped, skip)
            j = i - 1
            backslash_count = 0
            while j >= 0 and c[j] == "\\":
                backslash_count += 1
                j -= 1
            if backslash_count % 2 == 0:
                out.append("\n")
                i += 2
                continue
        out.append(ch)
        i += 1

    new_c = "".join(out)
    if new_c != c:
        with open(rel, "w", encoding="utf-8") as f:
            f.write(new_c)
        print(f"{rel}: {len(c)} -> {len(new_c)} ({len(c) - len(new_c)} chars)")
    else:
        print(f"{rel}: unchanged")
