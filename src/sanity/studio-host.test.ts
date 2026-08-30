import { describe, expect, test } from "bun:test";
import { isPublicMarketingPath } from "@/lib/public-marketing-path";
import {
  SANITY_STUDIO_HOST,
  hostnameFromHostHeader,
  isSanityStudioHost,
  isSanityStudioRequest,
  isStudioAppPath,
  studioBasePathForHost,
  studioHostRedirectScript,
  studioPathFromPublicPath,
} from "./studio-host";

function headers(rows: Record<string, string>) {
  const map = new Map(Object.entries(rows).map(([key, value]) => [key.toLowerCase(), value]));
  return {
    get(name: string) {
      return map.get(name.toLowerCase()) ?? null;
    },
  };
}

describe("Sanity Studio host", () => {
  test("maps sanity.omentir.com onto /studio so the static homepage cannot hydrate over Studio", () => {
    expect(isSanityStudioHost(SANITY_STUDIO_HOST)).toBe(true);
    expect(isSanityStudioHost("omentir.com")).toBe(false);
    expect(isStudioAppPath("/studio")).toBe(true);
    expect(isStudioAppPath("/studio/structure")).toBe(true);
    expect(isStudioAppPath("/")).toBe(false);
    // / is a prerendered marketing page. Studio must live at /studio on both
    // hosts so the browser URL, Next.js route, and Sanity basePath match.
    expect(studioBasePathForHost(SANITY_STUDIO_HOST)).toBe("/studio");
    expect(studioBasePathForHost("omentir.com")).toBe("/studio");
    expect(studioPathFromPublicPath("/")).toBe("/studio");
    expect(studioPathFromPublicPath("/structure")).toBe("/studio/structure");
  });

  test("still finds the Studio host when Cloudflare appends the origin to x-forwarded-host", () => {
    expect(hostnameFromHostHeader("sanity.omentir.com, omentir.com")).toBe("sanity.omentir.com");
    expect(
      isSanityStudioRequest(
        headers({
          host: "omentir.com",
          "x-forwarded-host": "sanity.omentir.com, omentir.com",
        })
      )
    ).toBe(true);
    expect(
      isSanityStudioRequest(
        headers({
          host: "omentir.com",
          forwarded: "proto=https;host=sanity.omentir.com",
        })
      )
    ).toBe(true);
    expect(isSanityStudioRequest(headers({ host: "omentir.com", "x-omentir-studio": "1" }))).toBe(
      true
    );
    expect(isSanityStudioRequest(headers({ host: "omentir.com" }))).toBe(false);
  });

  test("keeps /studio a public path so the origin can render Studio when Cloudflare sends Host omentir.com", () => {
    expect(isPublicMarketingPath("/studio")).toBe(true);
    expect(isPublicMarketingPath("/studio/structure")).toBe(true);
  });

  test("head script sends the studio host to /studio before the marketing page can paint", () => {
    const script = studioHostRedirectScript();
    expect(script).toContain(SANITY_STUDIO_HOST);
    expect(script).toContain('location.replace((p==="/"?"/studio":"/studio"+p)');
    expect(script).toContain('p==="/studio"');
  });
});
