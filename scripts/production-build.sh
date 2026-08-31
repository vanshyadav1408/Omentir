#!/bin/sh
set -eu

# Non-interactive deploy shells often omit the paths where bun installed pm2.
PATH="$PATH:$HOME/.bun/bin:$HOME/.local/bin:/usr/local/bin"

INCOMING=".next-incoming"
PREVIOUS=".next-previous"

copy_standalone_assets() {
  dist="${1:-.next}"
  mkdir -p "$dist/standalone/public" "$dist/standalone/.next/static"
  cp -R public/. "$dist/standalone/public/"
  cp -R "$dist/static/." "$dist/standalone/.next/static/"
}

restart_app() {
  if pm2 reload omentir --update-env || pm2 restart omentir --update-env; then
    pm2 save || true
    return 0
  fi
  return 1
}

wait_for_app() {
  if ! command -v curl >/dev/null 2>&1; then
    return 0
  fi
  n=0
  while [ "$n" -lt 30 ]; do
    if curl -fsS -o /dev/null --max-time 5 http://127.0.0.1:3000/api/health; then
      return 0
    fi
    n=$((n + 1))
    sleep 2
  done
  return 1
}

swap_incoming_into_place() {
  rm -rf "$PREVIOUS"
  if [ -d .next ]; then
    mv .next "$PREVIOUS"
  fi
  mv "$INCOMING" .next
}

restore_previous() {
  if [ -d "$PREVIOUS" ]; then
    rm -rf .next
    mv "$PREVIOUS" .next
  fi
}

# The VPS SSH wrapper only runs ~/scripts/deploy-omentir.sh. Extra SSH sessions
# are rewritten into another rebuild, so cutover has to happen here.
# GitHub CI, Docker, and local builds have neither .env.production nor pm2.
if [ -f .env.production ] && command -v pm2 >/dev/null 2>&1; then
  rm -rf "$INCOMING"
  # next build wipes its distDir. Compile into a sidecar so the live process
  # keeps serving the previous output until this compile finishes.
  if NEXT_DIST_DIR="$INCOMING" bun --bun next build; then
    copy_standalone_assets "$INCOMING"
    # Stop only for the swap. Leaving the old process up across the mv would
    # serve new hashed chunks from HTML that still names the old ones.
    pm2 stop omentir || true
    swap_incoming_into_place
    if restart_app && wait_for_app; then
      rm -rf "$PREVIOUS"
      exit 0
    fi
    echo "New build did not become healthy. Restoring the previous .next." >&2
    restore_previous
    restart_app || true
    exit 1
  fi
  echo "next build failed. Live process was left on the previous .next." >&2
  rm -rf "$INCOMING"
  exit 1
fi

bun --bun next build
copy_standalone_assets .next
