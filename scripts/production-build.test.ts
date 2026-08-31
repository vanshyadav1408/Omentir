import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const script = readFileSync(join(import.meta.dir, "production-build.sh"), "utf8");
const nextConfig = readFileSync(join(import.meta.dir, "../next.config.ts"), "utf8");

describe("production VPS build", () => {
  test("keeps the live process on the old .next until the new compile is finished", () => {
    // Visitors get 502 for the whole VPS compile when PM2 is stopped first.
    // The sidecar distDir is what lets next build wipe output without taking
    // down the running server. The later pm2 stop is only the cutover swap.
    const vpsBranch = script.split("if [ -f .env.production ]")[1] ?? "";
    const beforeCompile = vpsBranch.split("bun --bun next build")[0] ?? "";
    const afterCompile = vpsBranch.split("bun --bun next build")[1] ?? "";
    expect(beforeCompile).not.toMatch(/\bpm2\s+stop\b/);
    expect(afterCompile).toMatch(/\bpm2\s+stop\b/);
    expect(script).toContain('NEXT_DIST_DIR="$INCOMING"');
    expect(script).toContain('INCOMING=".next-incoming"');
    expect(nextConfig).toMatch(/distDir:\s*process\.env\.NEXT_DIST_DIR/);
  });
});
