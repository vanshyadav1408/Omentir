import { describe, expect, test } from "bun:test";
import {
  faviconFallbackUrl,
  looksLikeImageContentType,
  parseFaviconCandidates,
} from "./website-favicon";

describe("parseFaviconCandidates", () => {
  test("prefers the apple-touch-icon over a tiny ico so workspace avatars stay sharp", () => {
    const html = `
      <link rel="shortcut icon" href="/favicon.ico">
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    `;
    expect(parseFaviconCandidates(html, "https://harborline.com/")).toEqual([
      "https://harborline.com/apple-touch-icon.png",
      "https://harborline.com/favicon-32.png",
      "https://harborline.com/favicon.ico",
    ]);
  });

  test("resolves relative and protocol-relative hrefs against the landing page URL", () => {
    const html = `<link rel="icon" href="//cdn.harborline.com/mark.svg">`;
    expect(parseFaviconCandidates(html, "https://harborline.com/pricing")).toEqual([
      "https://cdn.harborline.com/mark.svg",
      "https://harborline.com/favicon.ico",
    ]);
  });

  test("skips data URIs so Firestore never stores a giant inline icon", () => {
    const html = `<link rel="icon" href="data:image/png;base64,aaaa">`;
    expect(parseFaviconCandidates(html, "https://acme.test/")).toEqual([
      "https://acme.test/favicon.ico",
    ]);
  });
});

describe("faviconFallbackUrl", () => {
  test("uses the site host so a missing <link rel=icon> still gets a public icon", () => {
    expect(faviconFallbackUrl("https://www.harborline.com/pricing")).toBe(
      "https://www.google.com/s2/favicons?domain=www.harborline.com&sz=128",
    );
  });
});

describe("looksLikeImageContentType", () => {
  test("accepts image types and ico served as octet-stream", () => {
    expect(looksLikeImageContentType("image/png", "https://x.test/icon.png")).toBe(true);
    expect(looksLikeImageContentType("application/octet-stream", "https://x.test/favicon.ico")).toBe(
      true,
    );
    expect(looksLikeImageContentType("text/html", "https://x.test/favicon.ico")).toBe(false);
  });
});
