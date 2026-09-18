import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "../..");
const script = readFileSync(join(root, "production-build.sh"), "utf8");
const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  scripts: { postinstall: string };
};
const tsconfig = JSON.parse(readFileSync(join(root, "tsconfig.json"), "utf8")) as {
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

  test("compiles the VPS sidecar with webpack and one worker so next build cannot SIGKILL the live process", () => {
    // 3d57653's production deploy died here: bun reported SIGKILL during
    // Turbopack "Creating an optimized production build" while PM2 still
    // served the previous .next. GitHub CI has enough RAM for Turbopack;
    // the VPS does not once the running server is counted.
    const vpsBranch = script.split("if [ -f .env.production ]")[1] ?? "";
    expect(vpsBranch).toContain("bun --bun next build --webpack");
    expect(vpsBranch).toContain("RAYON_NUM_THREADS=1");
    expect(nextConfig).toContain("process.env.NEXT_DIST_DIR");
    expect(nextConfig).toContain("webpackBuildWorker: false");
    expect(nextConfig).toContain("cpus: 1");
  });
});
