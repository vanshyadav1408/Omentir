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

  test("stops the live process before next build so file tracing cannot SIGKILL the VPS", () => {
    // Webpack compile finished with PM2 still up. The kernel then SIGKILLed
    // bun during "Collecting build traces" and "Generating static pages
    // (0/889)". Sidecar output is still required so a failed compile can
    // restart the previous .next.
    const vpsBranch = script.split("if [ -f .env.production ]")[1] ?? "";
    const [beforeBuild, afterBuild] = vpsBranch.split("run_sidecar_next_build");
    expect(beforeBuild ?? "").toMatch(/\bpm2\s+stop\b/);
    expect(afterBuild ?? "").not.toMatch(/\bpm2\s+stop\b/);
    expect(script).toContain('NEXT_DIST_DIR="$INCOMING"');
    expect(script).toContain('INCOMING=".next-incoming"');
    expect(nextConfig).toMatch(/distDir:\s*process\.env\.NEXT_DIST_DIR/);
  });

  test("compiles the VPS sidecar with webpack and one worker so next build cannot SIGKILL the box", () => {
    // 3d57653's production deploy died here: bun reported SIGKILL during
    // Turbopack "Creating an optimized production build" while PM2 still
    // served the previous .next. GitHub CI has enough RAM for Turbopack;
    // the VPS does not once the running server is counted.
    expect(script).toContain("bun --bun next build --webpack");
    expect(script).not.toContain("--experimental-build-mode");
    expect(script).toContain("RAYON_NUM_THREADS=1");
    expect(nextConfig).toContain("webpackBuildWorker: false");
    expect(nextConfig).toContain("cpus: 1");
  });

  test("adds build swap and restarts the previous .next if compile is killed", () => {
    // Stopping PM2 frees the live server. Swap covers tracing ~900 SEO pages
    // if the remaining RAM is still too small. A killed compile must bring
    // the previous process back.
    const vpsBranch = script.split("if [ -f .env.production ]")[1] ?? "";
    expect(script).toContain("try_enable_build_swap");
    expect(script).toContain("swapon");
    expect(vpsBranch).toContain("Restarting the previous .next");
    expect(vpsBranch).toContain("restart_app || true");
  });
});
