import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const script = readFileSync(join(import.meta.dir, "production-build.sh"), "utf8");
const nextConfig = readFileSync(join(import.meta.dir, "../next.config.ts"), "utf8");
const pkg = JSON.parse(readFileSync(join(import.meta.dir, "../package.json"), "utf8")) as {
  scripts: { postinstall: string };
};
const tsconfig = JSON.parse(readFileSync(join(import.meta.dir, "../tsconfig.json"), "utf8")) as {
  exclude: string[];
};

describe("production VPS build", () => {
  test("drops stale Next typegen on the VPS so deleting a route cannot fail tsc against the live .next", () => {
    // Production keeps compiled output across deploys. The previous
    // `.next/types/validator.ts` still imported /contact after that page was
    // removed, and VPS tsc failed before the sidecar compile could start.
    expect(pkg.scripts.postinstall).toContain(".next/types");
    expect(script).toContain("rm -rf .next/types .next/dev/types");
    expect(tsconfig.exclude).toContain(".next/types/validator.ts");
  });

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
