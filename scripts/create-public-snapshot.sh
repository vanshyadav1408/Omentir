#!/usr/bin/env bash
# Build a sanitized tree suitable for the initial public repository commit.
# Does not push or change remotes. Review the output, run gitleaks, then publish.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-"${ROOT}/../omentir-public-snapshot"}"

if [[ "$OUT" == "$ROOT" || "$OUT" == "$HOME" || "$OUT" == "/" ]]; then
  echo "ERROR: refusing unsafe snapshot destination: $OUT" >&2
  exit 1
fi
if [[ -d "$OUT" ]] && [[ -n "$(find "$OUT" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
  echo "ERROR: snapshot destination must be new or empty: $OUT" >&2
  exit 1
fi

EXCLUDES=(
  ".git"
  ".next"
  "node_modules"
  ".env"
  ".env.*"
  "!.env.example"
  ".vercel"
  ".clerk"
  ".claude"
  ".vscode"
  ".DS_Store"
  "AGENTS.md"
  "BLOG_GENERATION.md"
  "CLAUDE.md"
  "Design Prompt.md"
  "OPEN_SOURCE.md"
  "solution.md"
  "private-infra"
  "scripts/grant-subscription.mjs"
  "scripts/inspect-user.mjs"
  "scripts/send-test-welcome.mjs"
  "src/app/whop-analytics.tsx"
  "public/offer-letter-*"
  "tsconfig.tsbuildinfo"
  "coverage"
  "out"
  "build"
)

RSYNC_ARGS=( -a )
for pattern in "${EXCLUDES[@]}"; do
  # rsync --exclude does not support gitignore-style negation; skip !.env.example
  if [[ "$pattern" == "!.env.example" ]]; then
    continue
  fi
  RSYNC_ARGS+=( --exclude="$pattern" )
done

mkdir -p "$OUT"
rsync "${RSYNC_ARGS[@]}" "$ROOT/" "$OUT/"

# Ensure .env.example is present even if a broad .env* exclude was used elsewhere
if [[ -f "$ROOT/.env.example" ]]; then
  cp "$ROOT/.env.example" "$OUT/.env.example"
fi

# Guardrails
PRIVATE_PATHS=(
  "AGENTS.md"
  "BLOG_GENERATION.md"
  "CLAUDE.md"
  "Design Prompt.md"
  "OPEN_SOURCE.md"
  "solution.md"
  "private-infra"
  "scripts/grant-subscription.mjs"
  "scripts/inspect-user.mjs"
  "scripts/send-test-welcome.mjs"
  "src/app/whop-analytics.tsx"
)
for path in "${PRIVATE_PATHS[@]}"; do
  if [[ -e "$OUT/$path" ]]; then
    echo "ERROR: private material leaked into snapshot: $path" >&2
    exit 1
  fi
done
if [[ -f "$OUT/.env" ]]; then
  echo "ERROR: .env present in snapshot" >&2
  exit 1
fi
if [[ -n "$(find "$OUT/public" -name 'offer-letter-*' -print -quit 2>/dev/null)" ]]; then
  echo "ERROR: offer-letter asset leaked into snapshot" >&2
  exit 1
fi
if [[ -f "$OUT/.github/workflows/deploy-production.yml" ]]; then
  echo "ERROR: deploy-production.yml present in snapshot" >&2
  exit 1
fi

cat <<EOF
Public snapshot written to:
  $OUT

Next steps (manual, do not automate without approval):
  1. cd "$OUT" && git init && git add -A && git commit -s -m "Initial public release of Omentir"
  2. Run gitleaks detect --source . --verbose
  3. Manually review every tracked file
  4. Create an empty public GitHub repo and push this single commit
  5. Enable secret scanning, Dependabot, and branch protection
  6. Tag v0.1.0 when acceptance matrix is green
  7. Keep the private history archive private; never flip it public
EOF
