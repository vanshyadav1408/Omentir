import { describe, expect, test } from "bun:test";
import {
  SANITY_STUDIO_HOST,
  isSanityStudioHost,
  isStudioAppPath,
  studioBasePathForHost,
  studioPathFromPublicPath,
} from "./studio-host";

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
});
