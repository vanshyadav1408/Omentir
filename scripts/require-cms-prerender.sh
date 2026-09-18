#!/bin/sh
set -eu

# Hosted SEO lives in Sanity. GitHub verify without the project id only
# prerenders ~69 app/marketing shells, then production SSRs the rest on
# first hit. Fail that build so we cannot ship it again.
log="${1:-}"
if [ -z "$log" ] || [ ! -f "$log" ]; then
  echo "usage: $0 next-build.log" >&2
  exit 1
fi

python3 - "$log" <<'PY'
import re
import sys

text = open(sys.argv[1], encoding="utf-8", errors="replace").read()
matches = re.findall(
    r"Generating static pages using \d+ workers \((\d+)/(\d+)\)",
    text,
)
if not matches:
    print("No static page generation line found.", file=sys.stderr)
    sys.exit(1)
done, total = map(int, matches[-1])
print(f"Prerendered {done}/{total} pages")
if total < 800:
    print(
        "Expected ~889 prerendered pages (Sanity CMS). "
        "A low count means Sanity was not configured.",
        file=sys.stderr,
    )
    sys.exit(1)
if done != total:
    print(f"Static generation incomplete: {done}/{total}", file=sys.stderr)
    sys.exit(1)
PY
