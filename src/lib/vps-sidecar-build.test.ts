import { afterEach, describe, expect, test } from "bun:test";
import { skipStaticParamsOnVpsSidecar } from "./vps-sidecar-build";

describe("VPS sidecar prerender", () => {
  const original = process.env.NEXT_DIST_DIR;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_DIST_DIR;
    else process.env.NEXT_DIST_DIR = original;
  });

  test("skips CMS static params on the VPS sidecar so next build cannot SIGKILL at 900 pages", () => {
    // 1a55c44 stopped PM2 and still died at "Generating static pages using 1
    // worker (0/889)". GitHub CI and this laptop have enough RAM. The VPS does
    // not. NEXT_DIST_DIR is the sidecar-only signal.
    process.env.NEXT_DIST_DIR = ".next-incoming";
    expect(skipStaticParamsOnVpsSidecar()).toBe(true);
  });

  test("still prerenders CMS pages for CI and local builds that have the RAM", () => {
    delete process.env.NEXT_DIST_DIR;
    expect(skipStaticParamsOnVpsSidecar()).toBe(false);
  });
});
