/**
 * Illustrated SEO posters for pages that previously got square Gemini art.
 * Features / use-cases / alternatives: 1600x600 (match older feature heroes).
 * Comparisons: 1280x720 (match older comparison OG cards).
 *
 * Usage: bun scripts/compose-new-seo-banners.ts
 * Optional: bun scripts/compose-new-seo-banners.ts --only=reply-drafts
 */
import { mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { ALL_ALTERNATIVES } from "../src/app/alternatives/alternative-data";
import { ALL_COMPARISONS } from "../src/app/comparisons/comparison-data";
import {
  COMPARISON_BRANDS,
  OMENTIR_BRAND,
  type ComparisonBrand,
} from "../src/app/comparisons/comparison-logos";
import { ALL_FEATURES } from "../src/app/features/feature-data";
import type { SeoFamily } from "../src/app/seo-content/types";
import { ALL_USE_CASES } from "../src/app/use-cases/use-case-data";

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FONT = join(process.cwd(), "src/app/fonts/google-sans-latin.woff2");
const TMP_DIR = join(process.cwd(), ".tmp-new-seo-banners");
const PUBLIC = join(process.cwd(), "public");

const NEW_FEATURE_SLUGS = new Set([
  "reply-drafts",
  "demo-booking",
  "linkedin-warmup",
]);
const NEW_COMPARISON_SLUGS = new Set([
  "amplemarket-vs-11x",
  "heyreach-vs-expandi",
  "lemlist-vs-instantly",
  "omentir-vs-aisdr",
  "omentir-vs-amplemarket",
  "omentir-vs-heyreach",
  "omentir-vs-la-growth-machine",
  "omentir-vs-lemlist",
  "omentir-vs-phantombuster",
  "omentir-vs-sales-navigator",
  "omentir-vs-warmly",
  "phantombuster-vs-clay",
  "sales-navigator-vs-apollo",
]);

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

type Palette = {
  ink: string;
  paper: string;
  card: string;
  a: string;
  b: string;
  c: string;
  d: string;
};

const PALETTES: Record<string, Palette> = {
  teal: {
    ink: "#161616",
    paper: "#f4f2ec",
    card: "#fffdf8",
    a: "#0f766e",
    b: "#99f6e4",
    c: "#d4a017",
    d: "#1a73e8",
  },
  gold: {
    ink: "#161616",
    paper: "#f4f2ec",
    card: "#fffdf8",
    a: "#b45309",
    b: "#fde68a",
    c: "#0f766e",
    d: "#c45c26",
  },
  terracotta: {
    ink: "#161616",
    paper: "#f4efe6",
    card: "#fffaf4",
    a: "#c45c26",
    b: "#f4c7a8",
    c: "#1e3a5f",
    d: "#d4a017",
  },
  navy: {
    ink: "#161616",
    paper: "#f3f5f8",
    card: "#fffdf8",
    a: "#1e3a5f",
    b: "#93c5fd",
    c: "#0f766e",
    d: "#c45c26",
  },
  rose: {
    ink: "#161616",
    paper: "#f6f0ee",
    card: "#fffdf8",
    a: "#9f1239",
    b: "#fecdd3",
    c: "#0f766e",
    d: "#1a73e8",
  },
  purple: {
    ink: "#161616",
    paper: "#f4f1f8",
    card: "#fffdf8",
    a: "#6d28d9",
    b: "#ddd6fe",
    c: "#b45309",
    d: "#0f766e",
  },
  blue: {
    ink: "#161616",
    paper: "#f2f5f8",
    card: "#fffdf8",
    a: "#1a73e8",
    b: "#bfdbfe",
    c: "#c45c26",
    d: "#0f766e",
  },
};

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dataUri(src: string) {
  const abs = join(PUBLIC, src.replace(/^\//, ""));
  const buf = readFileSync(abs);
  const ext = extname(abs).slice(1).toLowerCase();
  const mime =
    ext === "svg"
      ? "image/svg+xml"
      : ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "avif"
            ? "image/avif"
            : ext === "webp"
              ? "image/webp"
              : "application/octet-stream";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function brandTile(name: string, src: string | undefined, fill: string) {
  const mark = src
    ? `<img src="${dataUri(src)}" alt="" />`
    : `<span class="letter">${esc(name.slice(0, 1))}</span>`;
  return `
    <div class="brand-tile" style="background:${fill}">
      <div class="brand-mark">${mark}</div>
      <div class="brand-name">${esc(name)}</div>
    </div>`;
}

function ico(kind: string, fill = "#161616") {
  const icons: Record<string, string> = {
    chat: `<path d="M4 5h16v11H8l-4 3V5z" fill="${fill}"/>`,
    calendar: `<path d="M5 4h14v16H5z" fill="none" stroke="${fill}" stroke-width="2"/><path d="M5 9h14" stroke="${fill}" stroke-width="2"/><rect x="8" y="12" width="3" height="3" fill="${fill}"/><rect x="13" y="12" width="3" height="3" fill="${fill}"/>`,
    envelope: `<path d="M3 6h18v12H3z" fill="none" stroke="${fill}" stroke-width="2"/><path d="M3 6l9 7 9-7" fill="none" stroke="${fill}" stroke-width="2"/>`,
    funnel: `<path d="M5 4h14l-5 8v6l-4 2v-8z" fill="${fill}"/>`,
    person: `<circle cx="12" cy="8" r="3.2" fill="${fill}"/><path d="M5 19c1.4-3.4 3.6-5 7-5s5.6 1.6 7 5" fill="${fill}"/>`,
    box: `<path d="M4 8l8-4 8 4v10l-8 4-8-4z" fill="none" stroke="${fill}" stroke-width="2"/><path d="M12 4v16M4 8l8 4 8-4" fill="none" stroke="${fill}" stroke-width="2"/>`,
    search: `<circle cx="11" cy="11" r="5.5" fill="none" stroke="${fill}" stroke-width="2"/><path d="M15.5 15.5L20 20" stroke="${fill}" stroke-width="2"/>`,
    flame: `<path d="M12 3c2 4-2 5-1 9 3-2 6 0 6 5a7 7 0 11-14 0c0-4 3-7 9-14z" fill="${fill}"/>`,
    puzzle: `<path d="M4 8h5V6a2 2 0 114 0v2h7v5h-2a2 2 0 100 4h2v5H4v-5h2a2 2 0 100-4H4z" fill="${fill}"/>`,
    send: `<path d="M3 12l18-8-6 18-3-7z" fill="${fill}"/>`,
    book: `<path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 00-3 3V4z" fill="none" stroke="${fill}" stroke-width="2"/>`,
    window: `<path d="M4 5h16v14H4z" fill="none" stroke="${fill}" stroke-width="2"/><path d="M4 9h16" stroke="${fill}" stroke-width="2"/><circle cx="7" cy="7" r="0.8" fill="${fill}"/><circle cx="10" cy="7" r="0.8" fill="${fill}"/>`,
    comment: `<circle cx="7" cy="12" r="2" fill="${fill}"/><circle cx="12" cy="12" r="2" fill="${fill}"/><circle cx="17" cy="12" r="2" fill="${fill}"/>`,
    check: `<path d="M5 12l4 4 10-10" fill="none" stroke="${fill}" stroke-width="2.4" stroke-linecap="round"/>`,
    star: `<path d="M12 3l2.4 6.6H21l-5.4 4.2 2 6.6L12 16.8 6.4 20.4l2-6.6L3 9.6h6.6z" fill="${fill}"/>`,
  };
  return `<svg viewBox="0 0 24 24" width="22" height="22">${icons[kind] || icons.star}</svg>`;
}

function chipRow(items: string[]) {
  return items
    .slice(0, 3)
    .map((item, i) => {
      const cls = i === 0 ? "chip accent" : i === 1 ? "chip soft" : "chip";
      return `<span class="${cls}">${esc(item)}</span>`;
    })
    .join("");
}

function wideCss(width: number, height: number, p: Palette) {
  return `
    @font-face {
      font-family: "OmentirSans";
      src: url("file://${FONT}") format("woff2");
      font-weight: 400 700;
      font-style: normal;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      width: ${width}px; height: ${height}px;
      overflow: hidden;
      background: ${p.paper};
      color: ${p.ink};
      font-family: OmentirSans, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .frame {
      position: relative;
      width: ${width}px; height: ${height}px;
      padding: 36px 48px;
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 40px;
      align-items: center;
      overflow: hidden;
    }
    .blob {
      position: absolute; border-radius: 50%; pointer-events: none;
    }
    .blob-a { width: 460px; height: 460px; right: -90px; top: -140px; background: ${p.a}; opacity: 0.14; }
    .blob-b { width: 280px; height: 280px; right: 210px; bottom: -120px; background: ${p.b}; opacity: 0.7; }
    .blob-c { width: 160px; height: 160px; left: 42%; top: -50px; background: ${p.c}; opacity: 0.22; }
    .ring {
      position: absolute; right: 40px; top: 36px;
      width: 92px; height: 92px; border-radius: 50%;
      border: 10px solid ${p.d}; opacity: 0.18;
    }
    .dot {
      position: absolute; width: 14px; height: 14px; border-radius: 50%;
    }
    .dot-1 { left: 48%; bottom: 28px; background: ${p.a}; }
    .dot-2 { left: 51%; bottom: 48px; background: ${p.c}; }
    .dot-3 { left: 54.5%; bottom: 22px; background: ${p.d}; }
    .copy, .art { position: relative; z-index: 1; }
    .brand {
      display: flex; align-items: center; gap: 10px;
      font-size: 18px; font-weight: 600; letter-spacing: -0.02em;
    }
    .kicker {
      display: inline-flex; align-items: center; gap: 8px;
      margin-top: 18px; padding: 6px 12px;
      border-radius: 999px; background: ${p.b};
      color: ${p.ink}; font-size: 12px; font-weight: 700;
      letter-spacing: 0.12em; text-transform: uppercase;
    }
    h1 {
      margin: 14px 0 12px;
      font-size: 48px; line-height: 1.06;
      letter-spacing: -0.03em; font-weight: 700;
    }
    .lede {
      margin: 0; max-width: 22em;
      font-size: 20px; line-height: 1.4; color: #3f3c36;
    }
    .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
    .chip {
      padding: 8px 14px; border: 1px solid #d8d4cb; border-radius: 999px;
      background: ${p.card}; font-size: 15px; color: #2a2722;
    }
    .chip.accent { background: ${p.a}; color: #fff; border-color: ${p.a}; }
    .chip.soft { background: ${p.b}; border-color: transparent; }
    .stage {
      height: 100%;
      padding: 22px;
      border: 1px solid #d8d4cb;
      border-radius: 28px;
      background: ${p.card};
      box-shadow: 0 18px 40px rgba(22,22,22,0.06);
      display: flex; flex-direction: column; gap: 12px;
      justify-content: center;
    }
    .row { display: flex; gap: 12px; align-items: stretch; }
    .card {
      flex: 1; padding: 14px 16px; border-radius: 16px;
      border: 1px solid #e6e1d6; background: ${p.paper};
    }
    .card.solid { color: #fff; border: 0; }
    .label {
      font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; margin-bottom: 6px; opacity: 0.8;
    }
    .card h3 { margin: 0; font-size: 17px; font-weight: 700; }
    .card p { margin: 6px 0 0; font-size: 13px; line-height: 1.35; color: #3f3c36; }
    .card.solid p { color: rgba(255,255,255,0.86); }
    .ico {
      width: 40px; height: 40px; border-radius: 12px;
      display: grid; place-items: center; margin-bottom: 8px;
      background: #fff;
    }
    .bubble {
      max-width: 92%; padding: 12px 16px; border-radius: 16px 16px 16px 4px;
      background: ${p.b}; font-size: 15px; line-height: 1.35; font-weight: 600;
    }
    .bubble.you {
      align-self: flex-end; border-radius: 16px 16px 4px 16px;
      background: ${p.a}; color: #fff;
    }
    .bubble.draft {
      border: 2px dashed ${p.c}; background: #fffdf8;
    }
    .cal {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;
    }
    .day {
      height: 34px; border-radius: 8px; background: ${p.paper};
      display: grid; place-items: center; font-size: 12px; font-weight: 700;
    }
    .day.on { background: ${p.c}; color: #fff; }
    .day.mid { background: ${p.b}; }
    .ramp { display: flex; align-items: flex-end; gap: 12px; height: 160px; padding: 8px 8px 0; }
    .bar {
      flex: 1; border-radius: 12px 12px 4px 4px;
      display: flex; align-items: flex-end; justify-content: center;
      padding-bottom: 10px; color: #fff; font-size: 12px; font-weight: 700;
    }
    .note-card {
      padding: 16px; border-radius: 16px; background: ${p.b};
    }
    .note-card h3 { margin: 0 0 8px; font-size: 16px; }
    .line { height: 8px; border-radius: 99px; background: #fff; margin: 8px 0; opacity: 0.85; }
    .line.s { width: 62%; }
    .post {
      padding: 14px; border-radius: 16px; background: ${p.a}; color: #fff;
    }
    .post h3 { margin: 0 0 8px; font-size: 15px; }
    .comments { display: flex; flex-direction: column; gap: 8px; }
    .pill {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 12px; background: ${p.paper};
      font-size: 14px; font-weight: 600;
    }
    .swatch { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .arrow {
      text-align: center; font-size: 12px; font-weight: 700;
      letter-spacing: 0.12em; text-transform: uppercase; color: ${p.a};
    }
    .tiles { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .mini {
      padding: 12px 8px; border-radius: 14px; text-align: center;
      font-size: 12px; font-weight: 700; background: ${p.paper};
    }
    .mini.solid { color: #fff; }
    .vs {
      align-self: center; width: 42px; height: 42px; border-radius: 50%;
      display: grid; place-items: center; background: #fff; border: 1px solid #d8d4cb;
      font-size: 11px; font-weight: 800;
    }
  `;
}

function widePoster(opts: {
  width: number;
  height: number;
  title: string;
  lede: string;
  chips: string[];
  kicker: string;
  palette: Palette;
  art: string;
}) {
  const p = opts.palette;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${wideCss(opts.width, opts.height, p)}</style>
</head>
<body>
  <div class="frame">
    <div class="blob blob-a"></div>
    <div class="blob blob-b"></div>
    <div class="blob blob-c"></div>
    <div class="ring"></div>
    <div class="dot dot-1"></div>
    <div class="dot dot-2"></div>
    <div class="dot dot-3"></div>
    <div class="copy">
      <div class="brand">${LOGO}<span>Omentir</span></div>
      <div class="kicker">${esc(opts.kicker)}</div>
      <h1>${esc(opts.title)}</h1>
      <p class="lede">${esc(opts.lede)}</p>
      <div class="chips">${chipRow(opts.chips)}</div>
    </div>
    <div class="art"><div class="stage">${opts.art}</div></div>
  </div>
</body>
</html>`;
}

function comparisonCss(p: Palette) {
  return `
    @font-face {
      font-family: "OmentirSans";
      src: url("file://${FONT}") format("woff2");
      font-weight: 400 700;
      font-style: normal;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden;
      background: ${p.paper}; color: ${p.ink};
      font-family: OmentirSans, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .frame {
      position: relative; width: 1280px; height: 720px;
      padding: 40px 56px 36px; overflow: hidden;
      display: flex; flex-direction: column; gap: 22px;
    }
    .blob { position: absolute; border-radius: 50%; pointer-events: none; }
    .blob-a { width: 520px; height: 520px; right: -140px; top: -180px; background: ${p.a}; opacity: 0.16; }
    .blob-b { width: 300px; height: 300px; left: -80px; bottom: -90px; background: ${p.b}; opacity: 0.75; }
    .blob-c { width: 180px; height: 180px; left: 46%; top: 40px; background: ${p.c}; opacity: 0.2; }
    .top { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 600; }
    .kicker {
      padding: 6px 12px; border-radius: 999px; background: ${p.b};
      font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    }
    h1 { position: relative; z-index: 1; margin: 0; font-size: 46px; letter-spacing: -0.03em; }
    .lede { position: relative; z-index: 1; margin: 0; font-size: 20px; color: #3f3c36; max-width: 40em; }
    .arena {
      position: relative; z-index: 1; flex: 1; min-height: 0;
      display: grid; grid-template-columns: 1fr auto 1fr; gap: 22px; align-items: stretch;
    }
    .brand-tile {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px;
      border-radius: 28px; padding: 28px 20px;
      box-shadow: 0 16px 36px rgba(22,22,22,0.08);
    }
    .brand-mark {
      width: 132px; height: 132px; border-radius: 28px; background: #fff;
      display: grid; place-items: center; overflow: hidden;
      box-shadow: 0 8px 20px rgba(22,22,22,0.08);
    }
    .brand-mark img { width: 88px; height: 88px; object-fit: contain; }
    .letter { font-size: 48px; font-weight: 800; color: ${p.a}; }
    .brand-name { font-size: 22px; font-weight: 700; }
    .mid {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
      min-width: 150px;
    }
    .vs-badge {
      width: 64px; height: 64px; border-radius: 50%; background: #fff;
      border: 1px solid #d8d4cb; display: grid; place-items: center;
      font-size: 16px; font-weight: 800; color: ${p.a};
    }
    .motif {
      display: flex; flex-direction: column; gap: 8px; width: 150px;
    }
    .motif .item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border-radius: 12px; background: ${p.card};
      font-size: 12px; font-weight: 700;
    }
    .ico {
      width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; background: ${p.b};
    }
  `;
}

function comparisonPoster(opts: {
  title: string;
  lede: string;
  kicker: string;
  palette: Palette;
  left: { name: string; src?: string };
  right: { name: string; src?: string };
  motifs: Array<[string, string]>;
}) {
  const p = opts.palette;
  const motif = opts.motifs
    .map(
      ([kind, label], i) =>
        `<div class="item"><div class="ico">${ico(kind, i === 1 ? p.a : p.ink)}</div>${esc(label)}</div>`
    )
    .join("");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${comparisonCss(p)}</style>
</head>
<body>
  <div class="frame">
    <div class="blob blob-a"></div>
    <div class="blob blob-b"></div>
    <div class="blob blob-c"></div>
    <div class="top">
      <div class="brand">${LOGO}<span>Omentir</span></div>
      <div class="kicker">${esc(opts.kicker)}</div>
    </div>
    <h1>${esc(opts.title)}</h1>
    <p class="lede">${esc(opts.lede)}</p>
    <div class="arena">
      ${brandTile(opts.left.name, opts.left.src, p.b)}
      <div class="mid">
        <div class="vs-badge">VS</div>
        <div class="motif">${motif}</div>
      </div>
      ${brandTile(opts.right.name, opts.right.src, "#ffffff")}
    </div>
  </div>
</body>
</html>`;
}

function artFor(slug: string, p: Palette): string {
  switch (slug) {
    case "outbound-for-founders":
      return `
        <div class="note-card">
          <div class="label">Founder notebook</div>
          <h3>Who feels this pain</h3>
          <div class="line"></div>
          <div class="line s"></div>
        </div>
        <div class="arrow">then a finder, then send</div>
        <div class="row">
          <div class="card solid" style="background:${p.a}">
            <div class="ico">${ico("person", p.a)}</div>
            <h3>Your profile</h3>
            <p>Not a sender pool</p>
          </div>
          <div class="card solid" style="background:${p.d}">
            <div class="ico">${ico("chat", p.d)}</div>
            <h3>Inbox</h3>
            <p>You still close</p>
          </div>
        </div>`;
    case "book-linkedin-demos":
      return `
        <div class="bubble">This is the pain we feel. Can we talk?</div>
        <div class="arrow">interest first, then the link</div>
        <div class="cal">
          ${["M","T","W","T","F","S","S","3","4","5","6","7","8","9"]
            .map((d, i) => {
              const cls = i === 11 ? "day on" : i === 4 || i === 10 ? "day mid" : "day";
              return `<div class="${cls}">${d}</div>`;
            })
            .join("")}
        </div>
        <div class="card solid" style="background:${p.a}">
          <h3>Calendly or Cal.com</h3>
          <p>You still take the meeting. Omentir does not host the call.</p>
        </div>`;
    case "replace-first-sdr":
      return `
        <div class="row">
          <div class="card">
            <div class="ico" style="background:${p.b}">${ico("person", p.a)}</div>
            <div class="label">Hire later</div>
            <h3>Empty chair</h3>
            <p>Delay the first SDR until replies exist</p>
          </div>
          <div class="card solid" style="background:${p.c}">
            <div class="ico">${ico("chat", p.c)}</div>
            <div class="label">Now</div>
            <h3>Workspace</h3>
            <p>Find, draft, you approve</p>
          </div>
        </div>
        <div class="card">
          <h3>Hire when the inbox is the bottleneck</h3>
          <p>Software that drafts is cheaper than a full-time SDR. Software you ignore is not.</p>
        </div>`;
    case "prospect-commenters":
      return `
        <div class="post">
          <div class="label" style="color:#fff">Competitor post</div>
          <h3>Buyers arguing in the comments</h3>
        </div>
        <div class="comments">
          <div class="pill"><span class="swatch" style="background:${p.a}"></span>Real comment text travels</div>
          <div class="pill"><span class="swatch" style="background:${p.c}"></span>Skip vendor-on-vendor piles</div>
          <div class="pill"><span class="swatch" style="background:${p.d}"></span>Cite the post in note one</div>
        </div>`;
    case "open-source-ai-sdr":
      return `
        <div class="row">
          <div class="card solid" style="background:${p.a}">
            <div class="ico">${ico("box", p.a)}</div>
            <h3>MIT source</h3>
            <p>Read the repo before you buy a black box</p>
          </div>
          <div class="card" style="background:${p.b}">
            <div class="ico">${ico("window", p.a)}</div>
            <h3>Hosted or Docker</h3>
            <p>Same app either way</p>
          </div>
        </div>
        <div class="card solid" style="background:${p.c}">
          <h3>MCP and REST included</h3>
          <p>Claude, Cursor, or a script. LinkedIn stays inside Omentir.</p>
        </div>`;
    case "grok-bot-outbound":
      return `
        <div class="row">
          <div class="card solid" style="background:${p.a}">
            <div class="ico">${ico("window", p.a)}</div>
            <h3>Grok Bot</h3>
            <p>Overnight research. Drafts only.</p>
          </div>
          <div class="card" style="background:${p.b}">
            <div class="ico">${ico("send", p.a)}</div>
            <h3>Omentir</h3>
            <p>LinkedIn, caps, inbox</p>
          </div>
        </div>
        <div class="card">
          <h3>Stop at the review list</h3>
          <p>The Bot does not sign into LinkedIn. You still take the meeting.</p>
        </div>`;
    case "grok-bot-cold-messaging":
      return `
        <div class="row">
          <div class="card solid" style="background:${p.a}">
            <div class="ico">${ico("chat", p.a)}</div>
            <h3>First DM</h3>
            <p>Two sentences. Real trigger.</p>
          </div>
          <div class="card" style="background:${p.b}">
            <div class="ico">${ico("send", p.a)}</div>
            <h3>Omentir send</h3>
            <p>Caps. You still read it.</p>
          </div>
        </div>
        <div class="card">
          <h3>Replies pause the sequence</h3>
          <p>The Bot drafts overnight. It does not argue in the inbox.</p>
        </div>`;
    case "grok-bot":
      return `
        <div class="row">
          <div class="card solid" style="background:${p.a}">
            <div class="ico">${ico("window", p.a)}</div>
            <h3>Grok Bot</h3>
            <p>Overnight, if you already pay</p>
          </div>
          <div class="card" style="background:${p.b}">
            <div class="ico">${ico("chat", p.a)}</div>
            <h3>ChatGPT / Claude</h3>
            <p>A session you sit with</p>
          </div>
        </div>
        <div class="card">
          <h3>Omentir Overview</h3>
          <p>The workspace if you did not need another operator.</p>
        </div>`;
    case "linkedin-automation":
      return `
        <div class="tiles">
          <div class="mini solid" style="background:${p.d}">Sender 1</div>
          <div class="mini solid" style="background:${p.a}">Sender 2</div>
          <div class="mini" style="background:${p.b}">Sender 3</div>
        </div>
        <div class="arrow">agency pool vs one workspace</div>
        <div class="card solid" style="background:${p.a}">
          <h3>Omentir</h3>
          <p>Find the list, send from the profile you connect, keep replies in one inbox.</p>
        </div>`;
    case "ai-sdr":
      return `
        <div class="row">
          <div class="card">
            <div class="ico" style="background:${p.b}">${ico("box", p.a)}</div>
            <h3>Named worker</h3>
            <p>Vendor-owned motion</p>
          </div>
          <div class="card solid" style="background:${p.a}">
            <div class="ico">${ico("window", p.a)}</div>
            <h3>Inspectable app</h3>
            <p>You can pause it</p>
          </div>
        </div>
        <div class="bubble draft">Draft until you approve. Not a silent agent.</div>`;
    case "b2b-databases":
      return `
        <div class="row">
          <div class="card" style="background:${p.b}">
            <div class="ico">${ico("book", p.a)}</div>
            <h3>Export</h3>
            <p>Credits, then a CSV</p>
          </div>
          <div class="vs">VS</div>
          <div class="card solid" style="background:${p.a}">
            <div class="ico">${ico("chat", p.a)}</div>
            <h3>Live list</h3>
            <p>Finders keep filling</p>
          </div>
        </div>
        <div class="card">
          <h3>Data is not a conversation</h3>
          <p>A stale row will not book the demo. Outreach still has to leave the spreadsheet.</p>
        </div>`;
    case "email-outreach":
      return `
        <div class="row">
          <div class="card" style="background:${p.b}">
            <div class="ico">${ico("envelope", p.a)}</div>
            <h3>Mailbox rotator</h3>
            <p>Warmup, domains, volume</p>
          </div>
          <div class="card solid" style="background:${p.d}">
            <div class="ico">${ico("chat", p.d)}</div>
            <h3>LinkedIn thread</h3>
            <p>Your profile, daily caps</p>
          </div>
        </div>
        <div class="bubble">Different aisle. Buy both if you need both.</div>`;
    case "sales-navigator":
      return `
        <div class="row">
          <div class="card" style="background:${p.b}">
            <div class="ico">${ico("funnel", p.a)}</div>
            <h3>Search</h3>
            <p>Filters you already live in</p>
          </div>
          <div class="card solid" style="background:${p.a}">
            <div class="ico">${ico("send", p.a)}</div>
            <h3>Send</h3>
            <p>Campaigns that actually go out</p>
          </div>
        </div>
        <div class="card">
          <h3>Keep Navigator if you write every note</h3>
          <p>Add a workspace when saved lists never leave the search page.</p>
        </div>`;
    case "reply-drafts":
      return `
        <div class="bubble">Interesting. We already burned a domain last year.</div>
        <div class="bubble draft">Draft: we send from your profile with daily caps. Approve or rewrite.</div>
        <div class="bubble you">Send after you read it.</div>
        <div class="row">
          <div class="mini solid" style="background:${p.a}">Handoff</div>
          <div class="mini" style="background:${p.b}">Until interest</div>
          <div class="mini solid" style="background:${p.c}">Until booked</div>
        </div>`;
    case "demo-booking":
      return `
        <div class="bubble">Yes, show me how the first week is paced.</div>
        <div class="arrow">then share the link</div>
        <div class="row">
          <div class="card solid" style="background:${p.a}">
            <div class="ico">${ico("calendar", p.a)}</div>
            <h3>Your calendar</h3>
            <p>Calendly or Cal.com only</p>
          </div>
          <div class="card" style="background:${p.b}">
            <div class="ico">${ico("check", p.a)}</div>
            <h3>Email you</h3>
            <p>When they confirm</p>
          </div>
        </div>`;
    case "linkedin-warmup":
      return `
        <div class="ramp">
          <div class="bar" style="height:28%;background:${p.b};color:${p.ink}">W1</div>
          <div class="bar" style="height:48%;background:${p.c}">W2</div>
          <div class="bar" style="height:70%;background:${p.a}">W3</div>
          <div class="bar" style="height:92%;background:${p.paper};color:${p.ink};border:2px dashed ${p.d}">Later</div>
        </div>
        <div class="card">
          <h3>Caps stay on. Warmth is still your job.</h3>
          <p>A quiet account that suddenly sends looks like a bot. Start low.</p>
        </div>`;
    default:
      return `<div class="card"><h3>${esc(slug)}</h3></div>`;
  }
}

function paletteFor(slug: string): Palette {
  const map: Record<string, Palette> = {
    "outbound-for-founders": PALETTES.teal,
    "book-linkedin-demos": PALETTES.gold,
    "replace-first-sdr": PALETTES.terracotta,
    "prospect-commenters": PALETTES.rose,
    "open-source-ai-sdr": PALETTES.navy,
    "grok-bot-outbound": PALETTES.navy,
    "grok-bot-cold-messaging": PALETTES.gold,
    "grok-bot": PALETTES.purple,
    "linkedin-automation": PALETTES.blue,
    "ai-sdr": PALETTES.purple,
    "b2b-databases": PALETTES.terracotta,
    "email-outreach": PALETTES.rose,
    "sales-navigator": PALETTES.navy,
    "reply-drafts": PALETTES.gold,
    "demo-booking": PALETTES.teal,
    "linkedin-warmup": PALETTES.gold,
    "heyreach-vs-expandi": PALETTES.blue,
    "lemlist-vs-instantly": PALETTES.rose,
    "sales-navigator-vs-apollo": PALETTES.navy,
    "amplemarket-vs-11x": PALETTES.purple,
    "phantombuster-vs-clay": PALETTES.terracotta,
    "omentir-vs-heyreach": PALETTES.blue,
    "omentir-vs-lemlist": PALETTES.rose,
    "omentir-vs-sales-navigator": PALETTES.navy,
    "omentir-vs-phantombuster": PALETTES.terracotta,
    "omentir-vs-amplemarket": PALETTES.purple,
    "omentir-vs-la-growth-machine": PALETTES.gold,
    "omentir-vs-warmly": PALETTES.gold,
    "omentir-vs-aisdr": PALETTES.teal,
  };
  return map[slug] ?? PALETTES.teal;
}

function kickerFor(family: SeoFamily) {
  if (family === "use-cases") return "Use case";
  if (family === "alternatives") return "Category roundup";
  if (family === "features") return "Feature";
  return "Comparison";
}

function lookupBrand(id: string): { name: string; src?: string } {
  if (id === "omentir") return { name: OMENTIR_BRAND.name, src: OMENTIR_BRAND.src };
  if (id === "sales-navigator") return { name: "Sales Navigator" };
  const brand: ComparisonBrand | undefined =
    COMPARISON_BRANDS[id as keyof typeof COMPARISON_BRANDS];
  if (!brand) {
    return { name: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
  }
  return { name: brand.name, src: brand.src };
}

function sidesFor(slug: string) {
  if (slug.startsWith("omentir-vs-")) {
    return {
      left: lookupBrand("omentir"),
      right: lookupBrand(slug.slice("omentir-vs-".length)),
    };
  }
  const at = slug.indexOf("-vs-");
  return {
    left: lookupBrand(slug.slice(0, at)),
    right: lookupBrand(slug.slice(at + 4)),
  };
}

function motifsFor(slug: string): [string, string, string] {
  const map: Record<string, [string, string, string]> = {
    "heyreach-vs-expandi": ["person", "send", "chat"],
    "lemlist-vs-instantly": ["envelope", "flame", "chat"],
    "sales-navigator-vs-apollo": ["search", "book", "send"],
    "amplemarket-vs-11x": ["window", "person", "box"],
    "phantombuster-vs-clay": ["puzzle", "book", "chat"],
    "omentir-vs-heyreach": ["person", "send", "search"],
    "omentir-vs-lemlist": ["chat", "envelope", "send"],
    "omentir-vs-sales-navigator": ["send", "funnel", "search"],
    "omentir-vs-phantombuster": ["window", "puzzle", "chat"],
    "omentir-vs-amplemarket": ["chat", "window", "box"],
    "omentir-vs-la-growth-machine": ["chat", "envelope", "send"],
    "omentir-vs-warmly": ["search", "flame", "send"],
    "omentir-vs-aisdr": ["window", "envelope", "chat"],
  };
  return map[slug] ?? ["chat", "send", "check"];
}

function motifLabels(slug: string): [string, string, string] {
  const map: Record<string, [string, string, string]> = {
    "heyreach-vs-expandi": ["Sender pools", "Cloud sequences", "You bring lists"],
    "lemlist-vs-instantly": ["Creative email", "Inbox rotation", "LinkedIn is other"],
    "sales-navigator-vs-apollo": ["Paid search", "Contact graph", "Still must send"],
    "amplemarket-vs-11x": ["GTM copilot", "Named worker", "Inspectable app"],
    "phantombuster-vs-clay": ["Extract", "Enrich", "Then converse"],
    "omentir-vs-heyreach": ["Your profile", "Not a seat pack", "Finds the list"],
    "omentir-vs-lemlist": ["LinkedIn first", "Not warmup", "Drafts you approve"],
    "omentir-vs-sales-navigator": ["Sends", "Not only search", "Ongoing lists"],
    "omentir-vs-phantombuster": ["Workspace", "Not a recipe", "Safety caps"],
    "omentir-vs-amplemarket": ["LinkedIn", "Open source", "MCP ready"],
    "omentir-vs-la-growth-machine": ["Hosted app", "Discovery", "One channel deep"],
    "omentir-vs-warmly": ["Outbound", "Not on-site ID", "Comment signals"],
    "omentir-vs-aisdr": ["LinkedIn", "Human pacing", "You can read it"],
  };
  return map[slug] ?? ["LinkedIn", "Honest split", "Omentir"];
}

type Job = {
  family: SeoFamily;
  slug: string;
  title: string;
  lede: string;
  chips: string[];
  width: number;
  height: number;
};

function jobs(): Job[] {
  const wide = { width: 1600, height: 600 };
  const og = { width: 1280, height: 720 };
  const useCases = ALL_USE_CASES.map((page) => ({
    family: "use-cases" as const,
    slug: page.slug,
    title: page.title,
    lede: page.summary,
    chips: page.highlights?.slice(0, 3) ?? [],
    ...wide,
  }));
  const alternatives = ALL_ALTERNATIVES.map((page) => ({
    family: "alternatives" as const,
    slug: page.slug,
    title: page.title,
    lede: page.summary,
    chips: (page.roundupItems ?? []).slice(0, 3).map((item) => item.name),
    ...wide,
  }));
  const features = ALL_FEATURES.filter((page) => NEW_FEATURE_SLUGS.has(page.slug)).map(
    (page) => ({
      family: "features" as const,
      slug: page.slug,
      title: page.title,
      lede: page.summary,
      chips: page.highlights?.slice(0, 3) ?? [],
      ...wide,
    })
  );
  const comparisons = ALL_COMPARISONS.filter((page) =>
    NEW_COMPARISON_SLUGS.has(page.slug)
  ).map((page) => ({
    family: "comparisons" as const,
    slug: page.slug,
    title: page.title,
    lede: page.summary,
    chips: [],
    ...og,
  }));
  return [...useCases, ...alternatives, ...features, ...comparisons];
}

function htmlFor(job: Job) {
  const palette = paletteFor(job.slug);
  if (job.family === "comparisons") {
    const sides = sidesFor(job.slug);
    const kinds = motifsFor(job.slug);
    const labels = motifLabels(job.slug);
    return comparisonPoster({
      title: job.title,
      lede: job.lede,
      kicker: kickerFor(job.family),
      palette,
      left: sides.left,
      right: sides.right,
      motifs: [
        [kinds[0], labels[0]],
        [kinds[1], labels[1]],
        [kinds[2], labels[2]],
      ],
    });
  }
  return widePoster({
    width: job.width,
    height: job.height,
    title: job.title,
    lede: job.lede,
    chips: job.chips,
    kicker: kickerFor(job.family),
    palette,
    art: artFor(job.slug, palette),
  });
}

function render(job: Job) {
  const htmlPath = join(TMP_DIR, `${job.family}-${job.slug}.html`);
  const tmpPng = join(TMP_DIR, `${job.family}-${job.slug}.png`);
  writeFileSync(htmlPath, htmlFor(job));
  const result = spawnSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${job.width},${job.height}`,
      `--screenshot=${tmpPng}`,
      "--virtual-time-budget=4000",
      `file://${htmlPath}`,
    ],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(
      `Chrome failed for ${job.family}/${job.slug}: ${result.stderr || result.stdout}`
    );
  }
  const dir = join(PUBLIC, "seo", job.family);
  mkdirSync(dir, { recursive: true });
  const pngPath = join(dir, `${job.slug}.png`);
  const avifPath = join(dir, `${job.slug}.avif`);
  const svgPath = join(dir, `${job.slug}.svg`);
  const avif = spawnSync("sips", ["-s", "format", "avif", tmpPng, "--out", avifPath], {
    encoding: "utf8",
  });
  if (avif.status !== 0) {
    throw new Error(`sips avif failed for ${avifPath}\n${avif.stderr}`);
  }
  if (existsSync(pngPath)) unlinkSync(pngPath);
  if (existsSync(svgPath)) unlinkSync(svgPath);
  console.log("wrote", `${job.family}/${job.slug}.avif`);
}

const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7);
const selected = jobs().filter(
  (job) => !only || job.slug === only || job.family === only
);
if (only && selected.length === 0) {
  throw new Error(`No banner job for ${only}`);
}

mkdirSync(TMP_DIR, { recursive: true });
for (const job of selected) {
  render(job);
}
rmSync(TMP_DIR, { recursive: true, force: true });
console.log(`composed ${selected.length} banners`);
