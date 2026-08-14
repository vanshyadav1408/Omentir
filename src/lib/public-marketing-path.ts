const EXACT_PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/agent.json",
  "/agents.md",
  "/blogs",
  "/comparisons",
  "/demo",
  "/features",
  "/for-agents",
  "/index.md",
  "/integrations",
  "/llms.txt",
  "/llms-full.txt",
  "/mcp-server",
  "/minimum-booking-guarantee",
  "/page-markdown",
  "/pricing",
  "/privacy-policy",
  "/robots.txt",
  "/sitemap.xml",
  "/terms-of-service",
]);

const PUBLIC_PATH_PREFIXES = [
  "/blogs/",
  "/comparisons/",
  "/features/",
  "/integrations/",
  "/page-markdown/",
];

const PUBLIC_MARKDOWN_ROOTS = new Set([
  "/",
  "/about",
  "/blogs",
  "/comparisons",
  "/features",
  "/for-agents",
  "/integrations",
  "/mcp-server",
  "/minimum-booking-guarantee",
  "/pricing",
  "/privacy-policy",
  "/terms-of-service",
]);

export function htmlPathFromMarkdownPath(pathname: string) {
  if (!pathname.endsWith(".md") || pathname === "/agents.md") return null;
  const withoutExt = pathname.slice(0, -3);
  if (withoutExt === "/index" || withoutExt === "") return "/";
  return withoutExt;
}

function isPublicHtmlMarketingPath(pathname: string) {
  return (
    EXACT_PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function isPublicMarkdownTwin(pathname: string) {
  const htmlPath = htmlPathFromMarkdownPath(pathname);
  if (!htmlPath) return false;
  return (
    PUBLIC_MARKDOWN_ROOTS.has(htmlPath) ||
    PUBLIC_PATH_PREFIXES.some((prefix) => htmlPath.startsWith(prefix))
  );
}

/** Public pages do not need Clerk middleware to render or establish identity. */
export function isPublicMarketingPath(pathname: string) {
  return isPublicHtmlMarketingPath(pathname) || isPublicMarkdownTwin(pathname);
}

/** Internal route that serves the baked markdown twin of a public HTML page. */
export function markdownRewritePath(pathname: string) {
  if (!isPublicMarkdownTwin(pathname)) return null;
  const htmlPath = htmlPathFromMarkdownPath(pathname);
  if (!htmlPath) return null;
  return htmlPath === "/" ? "/page-markdown" : `/page-markdown${htmlPath}`;
}
