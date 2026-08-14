/**
 * Brand-consistent SVG fallbacks when Gemini rate-limits a hero image.
 * Usage: bun scripts/make-seo-svg-fallback.ts <family> <slug> "Headline" "Subline"
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const [family, slug, headline = "Omentir", subline = "LinkedIn outbound"] =
  process.argv.slice(2);

if (!family || !slug) {
  console.error("Usage: bun scripts/make-seo-svg-fallback.ts <family> <slug> headline subline");
  process.exit(1);
}

const dir = join("public", "seo", family);
mkdirSync(dir, { recursive: true });
const outPngWouldBe = join(dir, `${slug}.png`);
if (existsSync(outPngWouldBe)) {
  console.log("png exists, skip", outPngWouldBe);
  process.exit(0);
}

// Escape XML text
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const h = esc(headline.slice(0, 48));
const s = esc(subline.slice(0, 72));

const palette =
  family === "comparisons"
    ? { bg: "#f4f2ec", accent: "#1a73e8", bar: "#111111" }
    : family === "integrations"
      ? { bg: "#eef2ff", accent: "#4338ca", bar: "#111111" }
      : { bg: "#f4f2ec", accent: "#0f766e", bar: "#111111" };

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="${palette.bg}"/>
  <circle cx="1080" cy="120" r="180" fill="${palette.accent}" opacity="0.12"/>
  <circle cx="160" cy="620" r="220" fill="${palette.bar}" opacity="0.06"/>
  <rect x="80" y="80" width="8" height="560" rx="4" fill="${palette.bar}"/>
  <text x="120" y="280" font-family="Georgia, serif" font-size="54" font-weight="700" fill="${palette.bar}">${h}</text>
  <text x="120" y="350" font-family="system-ui, sans-serif" font-size="28" fill="#52525b">${s}</text>
  <rect x="120" y="400" width="160" height="10" rx="5" fill="${palette.accent}"/>
  <text x="120" y="620" font-family="system-ui, sans-serif" font-size="22" font-weight="600" fill="${palette.bar}">Omentir</text>
</svg>
`;

// Store as .svg and also reference - pages expect .png. Write svg path and note.
// For Image component compatibility, write SVG with .png extension is bad.
// Write .svg and update pages to accept either - better: write as SVG file and change convention.

const outSvg = join(dir, `${slug}.svg`);
writeFileSync(outSvg, svg);
console.log("wrote", outSvg);
