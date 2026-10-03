/**
 * Official brand marks used on /comparisons pages.
 * Files live in public/comparison-logos and were taken from each company's
 * own site (favicon, apple icon, or published brand SVG). Do not replace
 * these with generated artwork.
 */
export type ComparisonBrand = {
  id: string;
  name: string;
  src: string;
  darkSrc?: string;
  /** True when the file already fills a square and should not be padded. */
  bleed?: boolean;
};

export const OMENTIR_BRAND: ComparisonBrand = {
  id: "omentir",
  name: "Omentir",
  src: "/omentir-logo.svg",
};

export const COMPARISON_BRANDS: Record<string, ComparisonBrand> = {
  gojiberry: {
    id: "gojiberry",
    name: "Gojiberry",
    src: "/comparison-logos/gojiberry.avif",
    bleed: true,
  },
  apollo: {
    id: "apollo",
    name: "Apollo",
    src: "/comparison-logos/apollo.svg",
    darkSrc: "/comparison-logos/apollo-dark.svg",
  },
  instantly: {
    id: "instantly",
    name: "Instantly",
    src: "/comparison-logos/instantly.avif",
    bleed: true,
  },
  smartlead: {
    id: "smartlead",
    name: "Smartlead",
    src: "/comparison-logos/smartlead.avif",
    bleed: true,
  },
  artisan: {
    id: "artisan",
    name: "Artisan AI",
    src: "/comparison-logos/artisan.avif",
    bleed: true,
  },
  "11x": {
    id: "11x",
    name: "11x AI",
    src: "/comparison-logos/11x.avif",
    bleed: true,
  },
  lusha: {
    id: "lusha",
    name: "Lusha",
    src: "/comparison-logos/lusha.avif",
    bleed: true,
  },
  clay: {
    id: "clay",
    name: "Clay",
    src: "/comparison-logos/clay.avif",
    bleed: true,
  },
  cognism: {
    id: "cognism",
    name: "Cognism",
    src: "/comparison-logos/cognism.svg",
    darkSrc: "/comparison-logos/cognism-dark.svg",
  },
  heyreach: {
    id: "heyreach",
    name: "HeyReach",
    src: "/comparison-logos/heyreach.webp",
    bleed: true,
  },
  expandi: {
    id: "expandi",
    name: "Expandi",
    src: "/comparison-logos/expandi.webp",
    bleed: true,
  },
  lemlist: {
    id: "lemlist",
    name: "Lemlist",
    src: "/comparison-logos/lemlist.webp",
    bleed: true,
  },
  phantombuster: {
    id: "phantombuster",
    name: "PhantomBuster",
    src: "/comparison-logos/phantombuster.webp",
    bleed: true,
  },
  amplemarket: {
    id: "amplemarket",
    name: "Amplemarket",
    src: "/comparison-logos/amplemarket.webp",
    bleed: true,
  },
  "la-growth-machine": {
    id: "la-growth-machine",
    name: "La Growth Machine",
    src: "/comparison-logos/la-growth-machine.webp",
    bleed: true,
  },
  warmly: {
    id: "warmly",
    name: "Warmly",
    src: "/comparison-logos/warmly.webp",
    bleed: true,
  },
  aisdr: {
    id: "aisdr",
    name: "AiSDR",
    src: "/comparison-logos/aisdr.webp",
    bleed: true,
  },
  "grok-bot": {
    id: "grok-bot",
    name: "Grok Bot",
    src: "/integration-logos/grok-bot.svg",
    bleed: true,
  },
  "meta-muse": {
    id: "meta-muse",
    name: "Meta Muse",
    src: "/integration-logos/meta-muse.webp",
    bleed: true,
  },
  "openai-dots": {
    id: "openai-dots",
    name: "OpenAI Dots",
    src: "/integration-logos/openai-dots.webp",
    bleed: true,
  },
  "manus-cue": {
    id: "manus-cue",
    name: "Manus Cue",
    src: "/integration-logos/manus-cue.webp",
    bleed: true,
  },
  grok: {
    id: "grok",
    name: "Grok",
    src: "/integration-logos/grok.svg",
  },
  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    src: "/integration-logos/chatgpt.svg",
  },
  claude: {
    id: "claude",
    name: "Claude",
    src: "/integration-logos/claude.svg",
  },
  cursor: {
    id: "cursor",
    name: "Cursor",
    src: "/integration-logos/cursor.svg",
  },
};

export function comparisonBrandFromSlug(slug: string): ComparisonBrand | undefined {
  const afterOmentir = slug.replace(/^omentir-vs-/, "");
  if (COMPARISON_BRANDS[afterOmentir]) return COMPARISON_BRANDS[afterOmentir];
  for (const part of slug.split("-vs-")) {
    if (COMPARISON_BRANDS[part]) return COMPARISON_BRANDS[part];
  }
  return undefined;
}

export function comparisonBrandFromName(name: string): ComparisonBrand | undefined {
  const normalized = name.trim().toLowerCase();
  if (normalized === "omentir") return OMENTIR_BRAND;
  const compact = normalized.replace(/\s+ai$/, "").replace(/[^a-z0-9]/g, "");
  return Object.values(COMPARISON_BRANDS).find((brand) => {
    const id = brand.id.replace(/[^a-z0-9]/g, "");
    return id === compact || brand.name.toLowerCase() === normalized;
  });
}
