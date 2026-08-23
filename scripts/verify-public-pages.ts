import sitemap from "../src/app/sitemap";
import {
  listPublicMarkdownPages,
  markdownPathFromHtmlPath,
  renderPublicMarkdown,
} from "../src/lib/public-page-markdown";

const SITEMAP_MD_ONLY = new Set(["/agents.md"]);
const SITEMAP_NO_MD_TWIN = new Set([
  "/llms.txt",
  "/llms-full.txt",
  "/agent.json",
]);

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const pages = listPublicMarkdownPages();
const missingMarkdown = pages
  .map((page) => page.htmlPath)
  .filter((htmlPath) => !renderPublicMarkdown(htmlPath));

if (missingMarkdown.length) {
  fail(
    `Markdown renderer returned empty for ${missingMarkdown.length} page(s):\n${missingMarkdown
      .slice(0, 10)
      .map((path) => `  - ${path}`)
      .join("\n")}`
  );
}

const sitemapPaths = new Set(
  sitemap().map((entry) => new URL(entry.url).pathname)
);

const htmlMissingFromSitemap = pages
  .map((page) => page.htmlPath)
  .filter((path) => !sitemapPaths.has(path));

if (htmlMissingFromSitemap.length) {
  fail(
    `Sitemap is missing ${htmlMissingFromSitemap.length} HTML page(s):\n${htmlMissingFromSitemap
      .slice(0, 10)
      .map((path) => `  - ${path}`)
      .join("\n")}`
  );
}

const twinsInSitemap = pages
  .map((page) => page.markdownPath)
  .filter((path) => sitemapPaths.has(path));

if (twinsInSitemap.length) {
  fail(
    `Sitemap lists ${twinsInSitemap.length} markdown twin(s). Those URLs are duplicates of HTML pages. Bing Webmaster often leaves the whole host unindexed when a sitemap is half copies.\n${twinsInSitemap
      .slice(0, 10)
      .map((path) => `  - ${path}`)
      .join("\n")}`
  );
}

const htmlMissingTwinRender = [...sitemapPaths]
  .filter(
    (path) =>
      !path.endsWith(".md") &&
      !SITEMAP_MD_ONLY.has(path) &&
      !SITEMAP_NO_MD_TWIN.has(path)
  )
  .filter((path) => {
    const twin = markdownPathFromHtmlPath(path);
    return twin ? !renderPublicMarkdown(path) : false;
  });

if (htmlMissingTwinRender.length) {
  fail(
    `Sitemap HTML entries whose markdown twin does not render:\n${htmlMissingTwinRender
      .slice(0, 10)
      .map((path) => `  - ${path}`)
      .join("\n")}`
  );
}

if (!sitemapPaths.has("/agents.md")) {
  fail("Sitemap is missing /agents.md (the machine guide, not an HTML twin).");
}

console.log(
  `Verified ${pages.length} public pages (${pages.length} HTML in sitemap, markdown twins omitted from sitemap, ${SITEMAP_MD_ONLY.size} md-only + ${SITEMAP_NO_MD_TWIN.size} machine indexes).`
);
