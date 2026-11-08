import sys

def fix(f):
    with open(f, "r", encoding="utf-8") as fh:
        c = fh.read()

    # The file contains LITERAL "\\\\n" (two backslashes + n) in comments and
    # template literals, produced by double-escaping on write. Replace each
    # occurrence of two backslashes followed by n with a real newline.
    # Count occurrences of the 3-char sequence: backslash backslash n.
    count = c.count("\\" + "\\" + "n")
    if count == 0:
        print(f"  {f}: no double-backslash-n found")
        return
    c2 = c.replace("\\" + "\\" + "n", "\n")
    with open(f, "w", encoding="utf-8") as fh:
        fh.write(c2)
    print(f"  {f}: replaced {count} double-backslash-n with newlines")

for f in sys.argv[1:]:
    fix(f)
