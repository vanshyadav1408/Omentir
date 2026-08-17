/**
 * 1600x600 cream posters for /slug search guides.
 * Usage: bun scripts/compose-guide-banners.ts
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { ALL_GUIDES } from "../src/app/guides/guide-data";

const WIDTH = 1600;
const HEIGHT = 600;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FONT = join(process.cwd(), "src/app/fonts/google-sans-latin.woff2");
const TMP = join(process.cwd(), ".tmp-guide-banners");
const OUT = join(process.cwd(), "public", "seo", "guides");

const LOGO = `
<svg viewBox="0 0 200 200" width="28" height="28" fill="#161616" aria-hidden="true">
  <g transform="translate(100 100) rotate(22.5)">
    <g transform="rotate(0)"><rect x="-7" y="-90" width="14" height="180" rx="2"/></g>
    <g transform="rotate(45)"><rect x="-7" y="-90" width="14" height="180" rx="2"/></g>
    <g transform="rotate(90)"><rect x="-7" y="-90" width="14" height="180" rx="2"/></g>
    <g transform="rotate(135)"><rect x="-7" y="-90" width="14" height="180" rx="2"/></g>
  </g>
</svg>
`;

const ACCENT: Record<string, { a: string; b: string }> = {
  linkedin: { a: "#1e3a5f", b: "#93c5fd" },
  b2b: { a: "#0f766e", b: "#99f6e4" },
  email: { a: "#b45309", b: "#fde68a" },
  general: { a: "#1a73e8", b: "#bfdbfe" },
};

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function html(title: string, lede: string, kicker: string, cluster: string) {
  const p = ACCENT[cluster] ?? ACCENT.general;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
@font-face { font-family: "OmentirSans"; src: url("file://${FONT}") format("woff2"); font-weight: 400 700; }
html, body { margin:0; padding:0; width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden; background:#faf9f6; color:#161616; font-family: OmentirSans, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
.frame { position:relative; width:${WIDTH}px; height:${HEIGHT}px; padding:48px 56px; overflow:hidden; }
.blob { position:absolute; border-radius:50%; pointer-events:none; }
.a { width:420px; height:420px; right:-80px; top:-120px; background:${p.a}; opacity:0.10; }
.b { width:240px; height:240px; right:220px; bottom:-90px; background:${p.b}; opacity:0.55; }
.copy { position:relative; z-index:1; max-width:920px; }
.brand { display:flex; align-items:center; gap:10px; font-size:18px; font-weight:600; }
.kicker { display:inline-block; margin-top:18px; padding:6px 12px; border-radius:999px; background:#fff; border:1px solid #e6e1d6; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#5c574e; }
h1 { margin:16px 0 12px; font-size:52px; line-height:1.06; letter-spacing:-0.03em; font-weight:700; }
.lede { margin:0; max-width:22em; font-size:22px; line-height:1.4; color:#3f3c36; }
.rule { margin-top:28px; width:72px; height:6px; border-radius:99px; background:${p.a}; }
</style>
</head>
<body>
<div class="frame">
  <div class="blob a"></div>
  <div class="blob b"></div>
  <div class="copy">
    <div class="brand">${LOGO}<span>Omentir</span></div>
    <div class="kicker">${esc(kicker)}</div>
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(lede)}</p>
    <div class="rule"></div>
  </div>
</div>
</body>
</html>`;
}

const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7);
const jobs = only ? ALL_GUIDES.filter((page) => page.slug === only) : ALL_GUIDES;
mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });
for (const page of jobs) {
  const htmlPath = join(TMP, `${page.slug}.html`);
  const tmpPng = join(TMP, `${page.slug}.png`);
  writeFileSync(htmlPath, html(page.title, page.description, page.kicker, page.cluster));
  const shot = spawnSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${WIDTH},${HEIGHT}`,
      `--screenshot=${tmpPng}`,
      "--virtual-time-budget=3000",
      `file://${htmlPath}`,
    ],
    { encoding: "utf8" }
  );
  if (shot.status !== 0) {
    throw new Error(`Chrome failed for ${page.slug}: ${shot.stderr || shot.stdout}`);
  }
  const pngPath = join(OUT, `${page.slug}.png`);
  const avifPath = join(OUT, `${page.slug}.avif`);
  spawnSync("cp", [tmpPng, pngPath]);
  const avif = spawnSync("sips", ["-s", "format", "avif", pngPath, "--out", avifPath], {
    encoding: "utf8",
  });
  if (avif.status !== 0) {
    throw new Error(`sips avif failed for ${avifPath}\n${avif.stderr}`);
  }
  console.log("wrote", page.slug);
}
rmSync(TMP, { recursive: true, force: true });
console.log(`composed ${jobs.length} guide banners`);
