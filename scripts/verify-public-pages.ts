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

const mdMissingFromSitemap = pages
  .map((page) => page.markdownPath)
  .filter((path) => !sitemapPaths.has(path));

if (mdMissingFromSitemap.length) {
  fail(
    `Sitemap is missing ${mdMissingFromSitemap.length} markdown twin(s):\n${mdMissingFromSitemap
      .slice(0, 10)
      .map((path) => `  - ${path}`)
      .join("\n")}`
  );
}

const htmlWithoutTwin = [...sitemapPaths]
  .filter(
    (path) =>
      !path.endsWith(".md") &&
      !SITEMAP_MD_ONLY.has(path) &&
      !SITEMAP_NO_MD_TWIN.has(path)
  )
  .filter((path) => {
    const twin = markdownPathFromHtmlPath(path);
    return twin ? !sitemapPaths.has(twin) : false;
  });

if (htmlWithoutTwin.length) {
  fail(
    `Sitemap HTML entries without markdown twins:\n${htmlWithoutTwin
      .slice(0, 10)
      .map((path) => `  - ${path}`)
      .join("\n")}`
  );
}

console.log(
  `Verified ${pages.length} public pages (${pages.length} HTML + ${pages.length} markdown twins + ${SITEMAP_MD_ONLY.size} md-only + ${SITEMAP_NO_MD_TWIN.size} machine indexes).`
);
