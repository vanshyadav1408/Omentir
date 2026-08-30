import { describe, expect, test } from "bun:test";
import { isPublicMarketingPath } from "@/lib/public-marketing-path";
import {
  SANITY_STUDIO_HOST,
  hostnameFromHostHeader,
  isSanityStudioHost,
  isSanityStudioRequest,
  isStudioAppPath,
  studioBasePathForHost,
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
  test("maps sanity.omentir.com paths onto the internal Studio route without exposing /studio", () => {
    expect(isSanityStudioHost(SANITY_STUDIO_HOST)).toBe(true);
    expect(isSanityStudioHost("omentir.com")).toBe(false);
    expect(isStudioAppPath("/studio")).toBe(true);
    expect(isStudioAppPath("/studio/structure")).toBe(true);
    expect(isStudioAppPath("/")).toBe(false);
    expect(studioBasePathForHost(SANITY_STUDIO_HOST)).toBe("/");
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
});
