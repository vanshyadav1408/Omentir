/**
 * Official landing-page captures used on comparison, integration, and a
 * small set of comparison blogs. Keep this list short: the capture budget
 * is limited, so only pages that sell a third-party product get a shot.
 */
export type SiteShot = {
  href: string;
  src: string;
  label: string;
};

export const OMENTIR_SITE_SHOT: SiteShot = {
  href: "https://omentir.com",
  src: "/blogs/ai-saas-ready-before-outbound/omentir.avif",
  label: "Omentir",
};

export const SITE_SHOTS: Record<string, SiteShot> = {
  gojiberry: { href: "https://gojiberry.ai", src: "/site-shots/gojiberry.avif", label: "Gojiberry" },
  apollo: { href: "https://www.apollo.io", src: "/site-shots/apollo.avif", label: "Apollo" },
  instantly: { href: "https://instantly.ai", src: "/site-shots/instantly.avif", label: "Instantly" },
  smartlead: { href: "https://www.smartlead.ai", src: "/site-shots/smartlead.avif", label: "Smartlead" },
  artisan: { href: "https://www.artisan.co", src: "/site-shots/artisan.avif", label: "Artisan" },
  "11x": { href: "https://www.11x.ai", src: "/site-shots/11x.avif", label: "11x" },
  lusha: { href: "https://www.lusha.com", src: "/site-shots/lusha.avif", label: "Lusha" },
  clay: { href: "https://www.clay.com", src: "/site-shots/clay.avif", label: "Clay" },
  cognism: { href: "https://www.cognism.com", src: "/site-shots/cognism.avif", label: "Cognism" },
  claude: { href: "https://claude.ai", src: "/blogs/ai-saas-ready-before-outbound/claude.avif", label: "Claude" },
  chatgpt: { href: "https://chatgpt.com", src: "/blogs/ai-saas-ready-before-outbound/chatgpt.avif", label: "ChatGPT" },
  cursor: { href: "https://cursor.com", src: "/blogs/ai-saas-ready-before-outbound/cursor.avif", label: "Cursor" },
  "claude-code": {
    href: "https://claude.com/product/claude-code",
    src: "/blogs/ai-saas-ready-before-outbound/claude-code.avif",
    label: "Claude Code",
  },
  grok: { href: "https://grok.com", src: "/site-shots/grok.avif", label: "Grok" },
  openclaw: { href: "https://openclaw.ai", src: "/site-shots/openclaw.avif", label: "OpenClaw" },
};

export function comparisonShot(slug: string): SiteShot | undefined {
  return SITE_SHOTS[slug.replace(/^omentir-vs-/, "")];
}

export function integrationShot(slug: string): SiteShot | undefined {
  return SITE_SHOTS[slug];
}
