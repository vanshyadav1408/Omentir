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
  "/8f3c1a9e6b24d0c75e18a4f2b9d63c07.txt",
  "/integrations",
  "/llms.txt",
  "/llms-full.txt",
  "/minimum-booking-guarantee",
  "/page-markdown",
  "/pricing",
  "/privacy-policy",
  "/robots.txt",
  "/sitemap.xml",
  "/studio",
  "/terms-of-service",
  "/tools",
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
  "/studio/",
  "/tools/",
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
  "/tools",
  "/use-cases",
]);

const ROOT_APP_SEGMENTS = new Set([
  "overview",
  "actions",
  "activity",
  "agents",
  "api-keys",
  "billing",
  "campaigns",
  "checkout",
  "connect",
  "contact",
  "dashboard",
  "leads",
  "login",
  "logout",
  "messages",
  "my-product",
  "new-user-experience",
  "onboarding",
  "oauth",
  "reconnect",
  "settings",
  "setup",
  "signup",
  "sso-callback",
  "subscription-creation-successful",
  "upgrade",
  "api",
]);

export function htmlPathFromMarkdownPath(pathname: string) {
  if (!pathname.endsWith(".md") || pathname === "/agents.md") return null;
  const withoutExt = pathname.slice(0, -3);
  if (withoutExt === "/index" || withoutExt === "") return "/";
  return withoutExt;
}

function isCmsGuidePath(pathname: string) {
  const htmlPath = pathname.endsWith(".md") ? htmlPathFromMarkdownPath(pathname) : pathname;
  if (!htmlPath || htmlPath === "/") return false;
  const segments = htmlPath.split("/").filter(Boolean);
  if (segments.length !== 1) return false;
  return !ROOT_APP_SEGMENTS.has(segments[0]!);
}

function isPublicHtmlMarketingPath(pathname: string) {
  return (
    EXACT_PUBLIC_PATHS.has(pathname) ||
    GUIDE_PATHS.has(pathname) ||
    isCmsGuidePath(pathname) ||
    PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function isPublicMarkdownTwin(pathname: string) {
  const htmlPath = htmlPathFromMarkdownPath(pathname);
  if (!htmlPath) return false;
  return (
    PUBLIC_MARKDOWN_ROOTS.has(htmlPath) ||
    GUIDE_PATHS.has(htmlPath) ||
    isCmsGuidePath(htmlPath) ||
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
