import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dir, "../..");
const deploy = readFileSync(join(root, ".github/workflows/deploy-production.yml"), "utf8");
const ci = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const dockerfile = readFileSync(join(root, "Dockerfile"), "utf8");

function checkLog(body: string) {
  const log = join(mkdtempSync(join(tmpdir(), "cms-prerender-")), "next-build.log");
  writeFileSync(log, body);
  return Bun.spawnSync(["sh", join(root, "scripts/require-cms-prerender.sh"), log], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
}

describe("GitHub CMS prerender", () => {
  test("configure Sanity on GitHub verify so production ships ~889 pages instead of 69", () => {
    // 892df9b compiled on the runner with no Sanity project id, so generateStaticParams
    // returned [] for every CMS family. The VPS then installed that 69-page .next.
    expect(deploy).toContain("SANITY_API_READ_TOKEN: ${{ secrets.SANITY_API_READ_TOKEN }}");
    expect(ci).toContain("SANITY_API_READ_TOKEN: ${{ secrets.SANITY_API_READ_TOKEN }}");
    expect(deploy).toContain("scripts/require-cms-prerender.sh");
    expect(ci).toContain("scripts/require-cms-prerender.sh");
    expect(dockerfile).toContain("ARG NEXT_PUBLIC_SANITY_PROJECT_ID");
  });

  test("inlines the PostHog project key so Web Analytics pageviews survive VPS deploys", () => {
    // The VPS unpacks this job's .next. NEXT_PUBLIC_* is baked at compile time,
    // so a missing key means posthog-js never inits. Server events keep flowing
    // from VPS env, which is why AI citations still move while unique users freeze.
    expect(deploy).toMatch(/NEXT_PUBLIC_POSTHOG_KEY:\s*phc_/);
    expect(ci).toMatch(/NEXT_PUBLIC_POSTHOG_KEY:\s*phc_/);
    expect(deploy).toContain("Require PostHog project key");
  });

  test("rejects a 69-page build because that means Sanity was not queried", () => {
    const result = checkLog("  Generating static pages using 3 workers (69/69) in 1335ms\n");
    expect(result.exitCode).not.toBe(0);
  });

  test("accepts the hosted ~889 page prerender", () => {
    const result = checkLog("✓ Generating static pages using 9 workers (889/889) in 10.6s\n");
    expect(result.exitCode).toBe(0);
  });
});
