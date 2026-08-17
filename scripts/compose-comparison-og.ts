/**
 * Compose comparison OG images from official brand marks.
 * Usage: bun scripts/compose-comparison-og.ts
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ALL_COMPARISONS } from "../src/app/comparisons/comparison-data";
import {
  comparisonBrandFromSlug,
  OMENTIR_BRAND,
} from "../src/app/comparisons/comparison-logos";

const WIDTH = 1280;
const HEIGHT = 720;
const BG = "#f4f2ec";
const MARK = 176;

function publicPath(src: string) {
  return join(process.cwd(), "public", src.replace(/^\//, ""));
}

async function rasterize(src: string) {
  return sharp(publicPath(src))
    .resize(MARK, MARK, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function compose(slug: string, title: string, competitorSrc: string) {
  const omentir = await rasterize(OMENTIR_BRAND.src);
  const competitor = await rasterize(competitorSrc);
  const frame = Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${BG}"/>
      <rect x="292" y="176" width="216" height="216" rx="36" fill="#ffffff" stroke="#d8d4cb"/>
      <rect x="772" y="176" width="216" height="216" rx="36" fill="#ffffff" stroke="#d8d4cb"/>
      <circle cx="640" cy="284" r="28" fill="#ffffff" stroke="#d8d4cb"/>
      <text x="640" y="290" text-anchor="middle" font-size="16" font-family="Georgia, serif" font-weight="700" fill="#6b4f2a">VS</text>
      <text x="640" y="500" text-anchor="middle" font-size="44" font-family="Georgia, serif" font-weight="700" fill="#161616">${title}</text>
      <text x="640" y="546" text-anchor="middle" font-size="22" font-family="Georgia, serif" fill="#5c574e">Omentir as an alternative</text>
    </svg>
  `);

  const out = join("public", "seo", "comparisons", `${slug}.png`);
  await sharp(frame)
    .composite([
      { input: omentir, left: 312, top: 196 },
      { input: competitor, left: 792, top: 196 },
    ])
    .png()
    .toFile(out);
  console.log("wrote", out);
}

async function main() {
  mkdirSync(join("public", "seo", "comparisons"), { recursive: true });
  for (const page of ALL_COMPARISONS) {
    if (page.layout === "faceoff") continue;
    const brand = comparisonBrandFromSlug(page.slug);
    if (!brand || brand.id === "omentir") {
      console.log("skip compose (no competitor mark)", page.slug);
      continue;
    }
    await compose(page.slug, page.title, brand.src);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
