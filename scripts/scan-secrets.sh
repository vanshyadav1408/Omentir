#!/usr/bin/env bash
# Secret scan for publication readiness. Prefers gitleaks; falls back to heuristics.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Rules and path exclusions live in .gitleaks.toml so this local scan and the
# gitleaks-action in CI apply the exact same ruleset. This --no-git scan reads
# every file on disk, so it would also flag the developer's real local .env
# (gitignored, and excluded from the public snapshot). We therefore scan with a
# temporary config that EXTENDS the shipped .gitleaks.toml and additionally
# allowlists gitignored dotenv files. The shipped config stays strict on
# purpose: in CI it must still catch a .env that was committed by mistake.
SCAN_CONFIG=""
CLEANUP_CONFIG=""
if [[ -f "$ROOT/.gitleaks.toml" ]]; then
  SCAN_CONFIG="$(mktemp -t gitleaks-local.XXXXXX.toml)"
  CLEANUP_CONFIG="$SCAN_CONFIG"
  cat > "$SCAN_CONFIG" <<EOF
[extend]
path = "$ROOT/.gitleaks.toml"

[allowlist]
description = "Local-only: ignore gitignored dotenv files (never published)"
paths = ['''(^|/)\\.env(\\..*)?\$''']
EOF
fi
trap '[[ -n "$CLEANUP_CONFIG" ]] && rm -f "$CLEANUP_CONFIG"' EXIT

CONFIG_ARGS=()
[[ -n "$SCAN_CONFIG" ]] && CONFIG_ARGS=( --config "$SCAN_CONFIG" )

if command -v gitleaks >/dev/null 2>&1; then
  echo "Running gitleaks..."
  gitleaks detect --source . --no-git --verbose --redact "${CONFIG_ARGS[@]}"
  exit 0
fi

if command -v docker >/dev/null 2>&1; then
  echo "Running gitleaks via Docker..."
  DOCKER_CONFIG_ARGS=()
  if [[ -f "$ROOT/.gitleaks.toml" ]]; then
    # The container sees the repo at /path, so the extend path must be
    # container-relative, not the host $ROOT the native scan uses.
    cat > "$ROOT/.gitleaks.local.toml" <<'EOF'
[extend]
path = "/path/.gitleaks.toml"

[allowlist]
description = "Local-only: ignore gitignored dotenv files (never published)"
paths = ['''(^|/)\.env(\..*)?$''']
EOF
    # shellcheck disable=SC2064
    trap "rm -f '$CLEANUP_CONFIG' '$ROOT/.gitleaks.local.toml'" EXIT
    DOCKER_CONFIG_ARGS=( --config '/path/.gitleaks.local.toml' )
  fi
  docker run --rm -v "$ROOT:/path" zricethezav/gitleaks:v8.21.2 detect \
    --source="/path" --no-git --verbose --redact "${DOCKER_CONFIG_ARGS[@]}"
  exit 0
fi

echo "gitleaks not installed; running heuristic scan (install gitleaks for CI-parity)."

fail=0
# High-confidence live credential shapes only. Placeholder PEMs in .env.example /
# unit tests use short "test"/"replace-me" material and are excluded.
while IFS= read -r -d '' file; do
  case "$file" in
    ./node_modules/*|./.next/*|./.git/*|./.env|./.env.local|./private-infra/*|./.env.example)
      continue
      ;;
  esac
  if grep -nE \
    'sk_live_[A-Za-z0-9]{20,}|sk_test_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{20,}|apik_[A-Za-z0-9]{20,}|re_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----\nMII[A-Za-z0-9+/]{40,}' \
    "$file" 2>/dev/null; then
    echo "Potential secret material in: $file" >&2
    fail=1
  fi
done < <(find . -type f \( \
  -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' -o \
  -name '*.json' -o -name '*.yml' -o -name '*.yaml' -o -name '*.md' -o \
  -name '.env.example' \
\) -print0)

# Explicitly reject a committed .env (gitignored, but snapshot mistakes happen)
if [[ -f .env ]] && git check-ignore -q .env 2>/dev/null; then
  : # local only — fine
elif [[ -f .env ]] && git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "ERROR: .env is tracked by git" >&2
  fail=1
fi

if [[ -f .github/workflows/deploy-production.yml ]]; then
  echo "ERROR: production deploy workflow must not live in the public app tree (use private-infra/)" >&2
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  echo "Heuristic secret scan failed." >&2
  exit 1
fi

echo "Heuristic secret scan passed. Install gitleaks for a full scan before public cutover."
