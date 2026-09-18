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

try_enable_build_swap() {
  [ -r /proc/meminfo ] || return 0
  swap_kb=$(awk '/SwapTotal:/{print $2}' /proc/meminfo)
  if [ "${swap_kb:-0}" -gt 500000 ]; then
    return 0
  fi
  swapfile="$HOME/.omentir-build.swap"
  if [ ! -f "$swapfile" ]; then
    echo "Creating 2G build swap at $swapfile" >&2
    if command -v fallocate >/dev/null 2>&1; then
      fallocate -l 2G "$swapfile" || return 0
    else
      dd if=/dev/zero of="$swapfile" bs=1M count=2048 2>/dev/null || return 0
    fi
    chmod 600 "$swapfile"
    mkswap "$swapfile" >/dev/null 2>&1 || {
      rm -f "$swapfile"
      return 0
    }
  fi
  swapon "$swapfile" 2>/dev/null || true
}

cutover_incoming() {
  copy_standalone_assets "$INCOMING"
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
}

# GitHub Actions compiles on a 7GB runner. This VPS SIGKILLs during next build
# even after dropping CMS prerender to 52 pages. Unpack that artifact instead.
install_ci_prebuilt_next() {
  if [ -z "${GH_TOKEN:-}" ] || [ -z "${GH_RUN_ID:-}" ] || [ -z "${APP_REPOSITORY:-}" ]; then
    return 1
  fi
  echo "Downloading CI-prebuilt .next for run $GH_RUN_ID" >&2
  bun --eval '
    const token = process.env.GH_TOKEN;
    const repo = process.env.APP_REPOSITORY;
    const runId = process.env.GH_RUN_ID;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "omentir-deploy",
    };
    const listed = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${runId}/artifacts`, { headers });
    if (!listed.ok) throw new Error(`list artifacts HTTP ${listed.status}`);
    const data = await listed.json();
    const artifact = (data.artifacts || []).find((row) => row.name === "next-build" && !row.expired);
    if (!artifact) throw new Error("next-build artifact missing");
    const first = await fetch(artifact.archive_download_url, { headers, redirect: "manual" });
    const redirected = first.status === 301 || first.status === 302 || first.status === 307 || first.status === 308;
    const zipUrl = redirected ? first.headers.get("location") : artifact.archive_download_url;
    if (!zipUrl) throw new Error("artifact download URL missing");
    const zipRes = redirected ? await fetch(zipUrl) : first;
    if (!zipRes.ok) throw new Error(`download artifact HTTP ${zipRes.status}`);
    await Bun.write("/tmp/omentir-prebuilt.zip", zipRes);
  '
  rm -rf /tmp/omentir-prebuilt-zip "$INCOMING"
  mkdir -p /tmp/omentir-prebuilt-zip "$INCOMING"
  if command -v unzip >/dev/null 2>&1; then
    unzip -o /tmp/omentir-prebuilt.zip -d /tmp/omentir-prebuilt-zip >/dev/null
  else
    python3 - <<'PY'
import zipfile
zipfile.ZipFile("/tmp/omentir-prebuilt.zip").extractall("/tmp/omentir-prebuilt-zip")
PY
  fi
  tar xzf /tmp/omentir-prebuilt-zip/next-build.tgz -C "$INCOMING"
  rm -rf /tmp/omentir-prebuilt.zip /tmp/omentir-prebuilt-zip
  if [ ! -d "$INCOMING/static" ]; then
    echo "CI-prebuilt .next is missing static assets." >&2
    return 1
  fi
  return 0
}

run_sidecar_next_build() {
  RAYON_NUM_THREADS=1 \
    TOKIO_WORKER_THREADS=1 \
    NEXT_DIST_DIR="$INCOMING" \
    bun --bun next build --webpack
}

# The VPS SSH wrapper only runs ~/scripts/deploy-omentir.sh. Extra SSH sessions
# are rewritten into another rebuild, so cutover has to happen here.
# GitHub CI, Docker, and local builds have neither .env.production nor pm2.
if [ -f .env.production ] && command -v pm2 >/dev/null 2>&1; then
  rm -rf "$INCOMING"
  # Live `.next/types` still lists routes this commit deleted. tsconfig includes
  # that path, so tsc fails before the sidecar compile. Those files are not served.
  rm -rf .next/types .next/dev/types
  if [ -n "${GH_TOKEN:-}" ] && [ -n "${GH_RUN_ID:-}" ]; then
    if install_ci_prebuilt_next; then
      cutover_incoming
    fi
    echo "CI-prebuilt .next is required because this VPS cannot next build." >&2
    exit 1
  fi
  try_enable_build_swap
  # Webpack compile fits next to the live process. File tracing and the ~900
  # SEO pages do not: bun gets SIGKILL from the kernel. Stop PM2 first so
  # those phases have the RAM, and keep the sidecar so a failed compile can
  # restart the previous .next.
  pm2 stop omentir || true
  if run_sidecar_next_build; then
    cutover_incoming
  fi
  echo "next build failed. Restarting the previous .next." >&2
  rm -rf "$INCOMING"
  restart_app || true
  exit 1
fi

bun --bun next build
copy_standalone_assets .next
