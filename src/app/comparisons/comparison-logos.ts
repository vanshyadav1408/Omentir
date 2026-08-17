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
    src: "/comparison-logos/heyreach.svg",
    bleed: true,
  },
  expandi: {
    id: "expandi",
    name: "Expandi",
    src: "/comparison-logos/expandi.png",
    bleed: true,
  },
  lemlist: {
    id: "lemlist",
    name: "Lemlist",
    src: "/comparison-logos/lemlist.png",
    bleed: true,
  },
  phantombuster: {
    id: "phantombuster",
    name: "PhantomBuster",
    src: "/comparison-logos/phantombuster.png",
    bleed: true,
  },
  amplemarket: {
    id: "amplemarket",
    name: "Amplemarket",
    src: "/comparison-logos/amplemarket.png",
    bleed: true,
  },
  "la-growth-machine": {
    id: "la-growth-machine",
    name: "La Growth Machine",
    src: "/comparison-logos/la-growth-machine.png",
    bleed: true,
  },
  warmly: {
    id: "warmly",
    name: "Warmly",
    src: "/comparison-logos/warmly.png",
    bleed: true,
  },
  aisdr: {
    id: "aisdr",
    name: "AiSDR",
    src: "/comparison-logos/aisdr.png",
    bleed: true,
  },
};

export function comparisonBrandFromSlug(slug: string): ComparisonBrand | undefined {
  const afterOmentir = slug.replace(/^omentir-vs-/, "");
  if (COMPARISON_BRANDS[afterOmentir]) return COMPARISON_BRANDS[afterOmentir];
  const first = slug.split("-vs-")[0];
  return COMPARISON_BRANDS[first];
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
