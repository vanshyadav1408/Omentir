import { GUIDE_PATHS } from "@/app/guides/slugs";

const EXACT_PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/agent.json",
  "/agents.md",
  "/blogs",
  "/alternatives",
  "/comparisons",
  "/demo",
  "/features",
  "/help",
  "/index.md",
  "/indexnow-key.txt",
  "/integrations",
  "/llms.txt",
  "/llms-full.txt",
  "/minimum-booking-guarantee",
  "/page-markdown",
  "/pricing",
  "/privacy-policy",
  "/robots.txt",
  "/sitemap.xml",
  "/terms-of-service",
  "/use-cases",
]);

const PUBLIC_PATH_PREFIXES = [
  "/alternatives/",
  "/blogs/",
  "/comparisons/",
  "/features/",
  "/help/",
  "/integrations/",
  "/page-markdown/",
  "/use-cases/",
];

const PUBLIC_MARKDOWN_ROOTS = new Set([
  "/",
  "/about",
  "/alternatives",
  "/blogs",
  "/comparisons",
  "/features",
  "/help",
  "/integrations",
  "/minimum-booking-guarantee",
  "/pricing",
  "/privacy-policy",
  "/terms-of-service",
  "/use-cases",
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
    GUIDE_PATHS.has(pathname) ||
    PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function isPublicMarkdownTwin(pathname: string) {
  const htmlPath = htmlPathFromMarkdownPath(pathname);
  if (!htmlPath) return false;
  return (
    PUBLIC_MARKDOWN_ROOTS.has(htmlPath) ||
    GUIDE_PATHS.has(htmlPath) ||
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
