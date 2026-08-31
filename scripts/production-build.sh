#!/bin/sh
set -eu

copy_standalone_assets() {
  mkdir -p .next/standalone/public .next/standalone/.next/static
  cp -R public/. .next/standalone/public/
  cp -R .next/static/. .next/standalone/.next/static/
}

# The VPS SSH wrapper only runs ~/scripts/deploy-omentir.sh, so RAM relief has
# to happen inside this build. Detect the VPS by the production env file plus
# pm2 (GitHub CI, Docker, and local builds have neither together).
if [ -f .env.production ] && command -v pm2 >/dev/null 2>&1; then
  backup_dir="${HOME}/omentir-deploy-backup"
  mkdir -p "$backup_dir"
  if [ -d .next ]; then
    rm -rf "$backup_dir/.next"
    cp -a .next "$backup_dir/.next"
  fi
  pm2 stop omentir || true
  if ! bun --bun next build; then
    if [ -d "$backup_dir/.next" ]; then
      echo "next build failed. Restoring the previous .next." >&2
      rm -rf .next
      cp -a "$backup_dir/.next" .next
      pm2 restart omentir --update-env || true
    fi
    exit 1
  fi
  copy_standalone_assets
  exit 0
fi

bun --bun next build
copy_standalone_assets
