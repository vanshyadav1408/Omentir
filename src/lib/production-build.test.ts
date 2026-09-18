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

  test("keeps the live process up until a CI-prebuilt .next is ready to swap", () => {
    // 2b6d2eb still compiled on the box because GH_TOKEN never arrived, then
    // SIGKILLed at "Generating static pages using 1 worker (0/52)" with PM2
    // already stopped. Unpack first; only then stop the live process.
    const vpsBranch = (script.split("if [ -f .env.production ]")[1] ?? "").split("\nbun --bun next build\n")[0] ?? "";
    expect(vpsBranch.split("cutover_incoming")[0] ?? "").not.toMatch(/\bpm2\s+stop\b/);
    expect(script).toContain("pm2 stop omentir");
    expect(script).toContain('INCOMING=".next-incoming"');
    expect(nextConfig).toMatch(/distDir:\s*process\.env\.NEXT_DIST_DIR/);
  });

  test("installs a public CI-prebuilt .next on the VPS so the box never runs next build", () => {
    // The SSH wrapper drops GH_TOKEN. The repo is public, so verify publishes
    // next-build.tgz as release vps-next-$SHA and the VPS curls that URL.
    const vpsBranch = (script.split("if [ -f .env.production ]")[1] ?? "").split("\nbun --bun next build\n")[0] ?? "";
    expect(vpsBranch).not.toContain("bun --bun next build");
    expect(script).toContain("install_ci_prebuilt_next");
    expect(script).toContain("releases/download/vps-next-");
    expect(script).toContain("SSH_ORIGINAL_COMMAND");
    expect(script).toContain("CI-prebuilt .next is required because this VPS cannot next build.");
  });
});
