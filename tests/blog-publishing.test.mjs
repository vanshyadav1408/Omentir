import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const blogsDir = new URL("../src/app/blogs/", import.meta.url);
const blogData = readFileSync(new URL("blog-data.ts", blogsDir), "utf8");
const seo = readFileSync(new URL("../src/app/seo.ts", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../src/app/sitemap.ts", import.meta.url), "utf8");
const blogsIndex = readFileSync(new URL("page.tsx", blogsDir), "utf8");
const llmsTxt = readFileSync(new URL("../src/app/llms.txt/route.ts", import.meta.url), "utf8");

// The date the site first existed. Nothing on it can predate this.
const SITE_GO_LIVE = new Date("2026-07-22T00:00:00Z");

const publishedDates = [...blogData.matchAll(/publishedDate: "([^"]+)"/g)].map((m) => m[1]);
const updatedDates = [...blogData.matchAll(/updatedDate: "([^"]+)"/g)].map((m) => m[1]);

const postFiles = readdirSync(blogsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `${entry.name}/page.tsx`);

test("no post claims to predate the site", () => {
  assert.ok(publishedDates.length > 0, "expected posts in blog-data");

  // Backdating a post to fake an older library is contradicted by Google's own
  // crawl log, and a datePublished that disagrees with the first-crawl date is
  // a documented manual-action trigger. There is also nothing to gain: age
  // helps through accumulated links, not through a date string.
  for (const date of [...publishedDates, ...updatedDates]) {
    const parsed = new Date(`${date} UTC`);
    assert.ok(!Number.isNaN(parsed.getTime()), `unparseable date: ${date}`);
    assert.ok(
      parsed >= SITE_GO_LIVE,
      `${date} predates the site going live (${SITE_GO_LIVE.toISOString().slice(0, 10)})`,
    );
  }
});

test("blog-data is the only source of post dates", () => {
  // A page that hardcodes its own date silently desynchronises the byline from
  // the JSON-LD and the sitemap, which is what teaches a crawler to distrust
  // every date on the site.
  for (const file of postFiles) {
    const source = readFileSync(new URL(file, blogsDir), "utf8");
    assert.doesNotMatch(
      source,
      /(?:published|updated)Date=/,
      `${file} hardcodes a date; dates belong in blog-data.ts`,
    );
  }
});

test("calendar dates are parsed as UTC everywhere they reach a crawler", () => {
  // `new Date("July 22, 2026")` is parsed as local time, so toISOString()
  // reports the previous day on any server east of UTC. That would make
  // datePublished, lastmod and the rendered byline disagree by a day depending
  // on where the build ran.
  assert.match(seo, /new Date\(`\$\{value\} UTC`\)/);
  assert.match(sitemap, /new Date\(`\$\{blog\.updatedDate \|\| blog\.publishedDate\} UTC`\)/);
});

test("unreleased posts stay out of every crawlable surface", () => {
  // A post whose release date has not arrived must not be advertised anywhere,
  // or the release schedule is cosmetic and the whole library is still exposed
  // as a single bulk drop.
  assert.match(blogData, /export function isBlogLive\(/);
  assert.match(blogData, /export function liveBlogs\(/);

  // Sitemap and the /blogs index list released posts only.
  assert.match(sitemap, /liveBlogs\(\)\.map\(/);
  assert.match(blogsIndex, /blogs=\{liveBlogs\(\)\}/);

  // Article metadata is noindex until release, without each page opting in.
  assert.match(seo, /noIndex \|\| \(blog && !isBlogLive\(blog\)\)/);

  // The collection JSON-LD counts released posts, matching what /blogs shows.
  assert.doesNotMatch(seo, /numberOfItems: ALL_BLOGS\.length/);

  // llms.txt must not recommend a URL the site tells crawlers to ignore.
  assert.match(llmsTxt, /!isBlogLive\(blog\)/);
});

test("cached crawler surfaces revalidate so releases cannot stall", () => {
  // sitemap.xml and llms.txt are otherwise built once and would keep omitting
  // posts indefinitely after their release date passed.
  assert.match(sitemap, /export const revalidate = \d+/);
  assert.match(llmsTxt, /export const revalidate = \d+/);
  assert.doesNotMatch(llmsTxt, /force-static/);
});
