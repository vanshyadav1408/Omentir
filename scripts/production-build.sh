#!/bin/sh
set -eu

# Non-interactive deploy shells often omit the paths where bun installed pm2.
PATH="$PATH:$HOME/.bun/bin:$HOME/.local/bin:/usr/local/bin"

copy_standalone_assets() {
  mkdir -p .next/standalone/public .next/standalone/.next/static
  cp -R public/. .next/standalone/public/
  cp -R .next/static/. .next/standalone/.next/static/
}

restart_app() {
  pm2 restart omentir --update-env || true
  pm2 save || true
}

# The VPS SSH wrapper only runs ~/scripts/deploy-omentir.sh. Extra SSH sessions
# are rewritten into another rebuild, so RAM relief has to happen here.
# GitHub CI, Docker, and local builds have neither .env.production nor pm2.
if [ -f .env.production ] && command -v pm2 >/dev/null 2>&1; then
  backup_dir="${HOME}/omentir-deploy-backup"
  mkdir -p "$backup_dir"
  if [ -d .next ]; then
    rm -rf "$backup_dir/.next"
    cp -a .next "$backup_dir/.next"
  fi
  # next build on this box is OOM-killed if the live app is still resident.
  pm2 stop omentir || true
  if bun --bun next build; then
    copy_standalone_assets
    restart_app
    exit 0
  fi
  echo "next build failed. Restoring the previous .next." >&2
  if [ -d "$backup_dir/.next" ]; then
    rm -rf .next
    cp -a "$backup_dir/.next" .next
  fi
  restart_app
  exit 1
fi

bun --bun next build
copy_standalone_assets
