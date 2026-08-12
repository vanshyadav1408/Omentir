import { expect, test } from "bun:test";
import { ALL_BLOGS, isBlogLive } from "../src/app/blogs/blog-data";
import robots from "../src/app/robots";
import sitemap from "../src/app/sitemap";
import {
  createPageMetadata,
  createWebPageJsonLd,
  normalizeDate,
  siteUrl,
} from "../src/app/seo";

test("registered blog metadata stays aligned with the publication registry", () => {
  for (const blog of ALL_BLOGS) {
    const metadata = createPageMetadata({
      title: "Stale route title",
      description: "Stale route description",
      path: `/blogs/${blog.slug}`,
    });

    expect(metadata.title).toBe(`${blog.title} - Omentir`);
    expect(metadata.description).toBe(blog.description);
  }
});

test("blog dates stay calendar-day stable for semantic HTML and JSON-LD", () => {
  expect(normalizeDate("July 26, 2026")).toBe("2026-07-26");
});

test("public policy pages expose stable WebPage structured data", () => {
  expect(
    createWebPageJsonLd({
      name: "Terms of Service",
      description: "The rules for using Omentir.",
      url: `${siteUrl}/terms-of-service`,
      dateModified: "August 9, 2026",
    })
  ).toMatchObject({
    "@type": "WebPage",
    "@id": `${siteUrl}/terms-of-service#webpage`,
    dateModified: "2026-08-09",
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#organization` },
  });
});

test("robots keeps public pages crawlable and operational routes out", () => {
  expect(robots()).toEqual({
    rules: {
      userAgent: "*",
      allow: ["/api/agent/v1/openapi.json"],
      disallow: ["/api/", "/surveys/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  });
});

test("sitemap contains unique absolute URLs for released pages only", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);
  const liveSlugs = new Set(
    ALL_BLOGS.filter((blog) => isBlogLive(blog)).map((blog) => blog.slug)
  );

  expect(new Set(urls).size).toBe(urls.length);
  expect(urls[0]).toBe(siteUrl);

  for (const entry of entries) {
    expect(new URL(entry.url).origin).toBe(new URL(siteUrl).origin);
    expect(entry.url).not.toContain("/api/");
    expect(entry.url).not.toContain("/surveys/");
  }

  const blogUrls = urls
    .filter((url) => url.startsWith(`${siteUrl}/blogs/`))
    .map((url) => url.slice(`${siteUrl}/blogs/`.length));

  expect(new Set(blogUrls)).toEqual(liveSlugs);
});
