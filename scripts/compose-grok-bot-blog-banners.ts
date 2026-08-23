/**
 * Cream posters for the Grok Bot blog cluster.
 * Usage: bun scripts/compose-grok-bot-blog-banners.ts
 */
import { mkdirSync, rmSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const WIDTH = 1536;
const HEIGHT = 1024;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FONT = join(process.cwd(), "src/app/fonts/google-sans-latin.woff2");
const TMP = join(process.cwd(), ".tmp-grok-bot-blog-banners");
const OUT = join(process.cwd(), "public");

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

const jobs = [
  {
    slug: "automate-cold-messaging-with-grok-bot",
    title: "Automate cold messaging with Grok Bot",
    lede: "Overnight drafts. Paced send. You still take the meeting.",
    accent: "#b45309",
    wash: "#fde68a",
  },
  {
    slug: "grok-bot-for-sales",
    title: "Grok Bot for sales",
    lede: "Research and drafts overnight. LinkedIn stays in Omentir.",
    accent: "#1e3a5f",
    wash: "#93c5fd",
  },
  {
    slug: "grok-bot-vs-chatgpt-for-outbound",
    title: "Grok Bot vs ChatGPT for outbound",
    lede: "Overnight computer versus a session you watch. Same send path.",
    accent: "#6d28d9",
    wash: "#ddd6fe",
  },
];

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function html(title: string, lede: string, accent: string, wash: string) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
@font-face { font-family: "OmentirSans"; src: url("file://${FONT}") format("woff2"); font-weight: 400 700; }
html, body { margin:0; padding:0; width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden; background:#faf9f6; color:#161616; font-family: OmentirSans, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
.frame { position:relative; width:${WIDTH}px; height:${HEIGHT}px; padding:72px 80px; overflow:hidden; }
.blob { position:absolute; border-radius:50%; pointer-events:none; }
.a { width:520px; height:520px; right:-100px; top:-140px; background:${accent}; opacity:0.12; }
.b { width:280px; height:280px; right:240px; bottom:-80px; background:${wash}; opacity:0.7; }
.copy { position:relative; z-index:1; max-width:980px; }
.brand { display:flex; align-items:center; gap:10px; font-size:20px; font-weight:600; }
.kicker { display:inline-block; margin-top:28px; padding:6px 12px; border-radius:999px; background:${wash}; font-size:13px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; }
h1 { margin:18px 0 16px; font-size:64px; line-height:1.06; letter-spacing:-0.03em; font-weight:700; }
.lede { margin:0; max-width:18em; font-size:28px; line-height:1.35; color:#3f3c36; }
.rule { margin-top:36px; width:80px; height:7px; border-radius:99px; background:${accent}; }
</style>
</head>
<body>
<div class="frame">
  <div class="blob a"></div>
  <div class="blob b"></div>
  <div class="copy">
    <div class="brand">${LOGO}<span>Omentir</span></div>
    <div class="kicker">Grok Bot</div>
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(lede)}</p>
    <div class="rule"></div>
  </div>
</div>
</body>
</html>`;
}

mkdirSync(TMP, { recursive: true });
for (const job of jobs) {
  const htmlPath = join(TMP, `${job.slug}.html`);
  const tmpPng = join(TMP, `${job.slug}.png`);
  writeFileSync(htmlPath, html(job.title, job.lede, job.accent, job.wash));
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
    throw new Error(`Chrome failed for ${job.slug}: ${shot.stderr || shot.stdout}`);
  }
  const avifPath = join(OUT, `${job.slug}.avif`);
  const pngPath = join(OUT, `${job.slug}.png`);
  const avif = spawnSync("sips", ["-s", "format", "avif", tmpPng, "--out", avifPath], {
    encoding: "utf8",
  });
  if (avif.status !== 0) {
    throw new Error(`sips avif failed for ${avifPath}\n${avif.stderr}`);
  }
  if (existsSync(pngPath)) unlinkSync(pngPath);
  console.log("wrote", job.slug);
}
rmSync(TMP, { recursive: true, force: true });
console.log(`composed ${jobs.length} blog banners`);
