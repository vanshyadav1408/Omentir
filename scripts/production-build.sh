#!/usr/bin/env bash
set -euo pipefail

# The VPS never builds: it OOM-kills next build. CI builds via this script and
# ships the finished .next to the VPS (see .github/workflows/deploy-production.yml).
bun --bun next build

# next start and the standalone server both serve /_next/static and /public
# from these copies, so a partial copy here is what breaks production CSS.
mkdir -p .next/standalone/public .next/standalone/.next/static
cp -R public/. .next/standalone/public/
cp -R .next/static/. .next/standalone/.next/static/
