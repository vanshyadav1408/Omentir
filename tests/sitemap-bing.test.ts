import { describe, expect, test } from "bun:test";
import sitemap from "../src/app/sitemap";
import robots from "../src/app/robots";
import { createPageMetadata, indexRobots } from "../src/app/seo";
import {
  listPublicMarkdownPages,
  markdownPathFromHtmlPath,
} from "../src/lib/public-page-markdown";

describe("sitemap URLs search engines should index", () => {
  test("omits markdown twins so Google and Bing are not asked to index duplicate URLs", () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);
    const twinPaths = new Set(
      listPublicMarkdownPages().map((page) => page.markdownPath)
    );
    const twinsInSitemap = paths.filter((path) => twinPaths.has(path));

    expect(twinsInSitemap).toEqual([]);
    expect(paths).not.toContain("/pricing.md");
    expect(paths).not.toContain("/index.md");
  });

  test("still lists every public HTML page, which is what Google already indexes", () => {
    const paths = new Set(sitemap().map((entry) => new URL(entry.url).pathname));
    const htmlPaths = listPublicMarkdownPages().map((page) => page.htmlPath);
    const missing = htmlPaths.filter((path) => !paths.has(path));

    expect(missing).toEqual([]);
    expect(paths.has("/") || paths.has("")).toBe(true);
    expect(paths).toContain("/pricing");
    expect(paths).toContain("/blogs");
    expect(paths).toContain("/about");
    expect(markdownPathFromHtmlPath("/pricing")).toBe("/pricing.md");
  });
});

describe("Google can still index the HTML pages", () => {
  test("createPageMetadata keeps googleBot index,follow on public HTML", () => {
    const metadata = createPageMetadata({
      title: "Pricing",
      description: "Plans.",
      path: "/pricing",
    });

    expect(metadata.robots).toEqual(indexRobots);
    const robots = metadata.robots;
    if (!robots || typeof robots === "string") {
      throw new Error("expected structured robots metadata");
    }
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
    if ("googleBot" in robots) {
      const googleBot = robots.googleBot;
      if (googleBot && typeof googleBot === "object") {
        expect(googleBot.index).toBe(true);
        expect(googleBot.follow).toBe(true);
      }
    }
  });

  test("robots.txt does not block Google from HTML marketing URLs", () => {
    const rules = robots().rules;
    const starRule = Array.isArray(rules)
      ? rules.find((rule) => {
          const agent = Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent];
          return agent.includes("*");
        })
      : rules;
    if (!starRule || Array.isArray(starRule)) {
      throw new Error("expected a * robots rule");
    }
    const disallow = [starRule.disallow].flat().filter(Boolean);
    expect(disallow).not.toContain("/");
    expect(disallow.some((path) => path === "/blogs" || path === "/blogs/")).toBe(false);
    expect(disallow.some((path) => path === "/pricing" || path === "/pricing/")).toBe(false);
    expect(robots().sitemap).toContain("/sitemap.xml");
  });
});
