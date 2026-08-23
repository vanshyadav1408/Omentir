/**
 * 3:2 editorial banners for the Grok Bot cluster.
 * Title-first, cream paper, flat logos, thin line illustrations.
 *
 * Usage: bun scripts/compose-grok-bot-editorial-banners.ts
 */
import { existsSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { spawnSync } from "node:child_process";

const WIDTH = 1536;
const HEIGHT = 1024;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FONT = join(process.cwd(), "src/app/fonts/google-sans-latin.woff2");
const TMP = join(process.cwd(), ".tmp-grok-bot-editorial-refresh");
const PUBLIC = join(process.cwd(), "public");

const PAPER = "#f7f3ee";
const INK = "#1c1917";
const CORAL = "#d9776b";
const ROSE = "#f3d0c9";
const MUTED = "#8a8178";
const CARD = "#fffdfa";
const LINE = "#e6ddd3";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dataUri(rel: string) {
  const abs = join(PUBLIC, rel.replace(/^\//, ""));
  const buf = readFileSync(abs);
  const ext = extname(abs).slice(1).toLowerCase();
  const mime =
    ext === "svg"
      ? "image/svg+xml"
      : ext === "png"
        ? "image/png"
        : "application/octet-stream";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

mkdirSync(TMP, { recursive: true });
const GROK_BOT = dataUri("/integration-logos/grok-bot.svg");
const LINKEDIN = dataUri("/linkedin-in-mark.svg");
const CHATGPT = dataUri("/integration-logos/chatgpt.svg");
const CLAUDE = dataUri("/integration-logos/claude.svg");
const CURSOR = dataUri("/integration-logos/cursor.svg");
const OMENTIR = dataUri("/omentir-logo.svg");

function ico(kind: string, color = INK, size = 28) {
  const icons: Record<string, string> = {
    chat: `<path d="M5 6h14v10H9l-4 3V6z" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 10h8M8 13h5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`,
    search: `<circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M15 15l4.5 4.5" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>`,
    draft: `<path d="M5 6h14v10H9l-4 3V6z" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 10h8M8 13h5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`,
    review: `<path d="M7 4h10v16H7z" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.5 9.5l1.5 1.5 3-3M9 15h6" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    check: `<circle cx="12" cy="12" r="8" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M8.5 12l2.2 2.2 4.8-5" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    target: `<circle cx="12" cy="12" r="8" fill="none" stroke="${color}" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="${color}" stroke-width="1.6"/><circle cx="12" cy="12" r="1.5" fill="${color}"/>`,
    browser: `<rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M4 9h16M8 7h.01M11 7h.01" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>`,
    moon: `<path d="M15 6.2A7.2 7.2 0 1018 16.5 6 6 0 0115 6.2z" fill="none" stroke="${color}" stroke-width="1.6"/>`,
    list: `<path d="M6 7h12M6 12h12M6 17h8" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/><circle cx="4" cy="7" r="1" fill="${color}"/><circle cx="4" cy="12" r="1" fill="${color}"/><circle cx="4" cy="17" r="1" fill="${color}"/>`,
    lock: `<rect x="7" y="11" width="10" height="8" rx="1.6" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M9 11V9a3 3 0 016 0v2" fill="none" stroke="${color}" stroke-width="1.6"/>`,
    send: `<path d="M4 12l16-7-6 16-3-7z" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/>`,
    users: `<circle cx="9" cy="9" r="2.4" fill="none" stroke="${color}" stroke-width="1.5"/><circle cx="16" cy="10" r="2" fill="none" stroke="${color}" stroke-width="1.5"/><path d="M5 18c.8-2.6 2.4-4 4.4-4s3.6 1.4 4.4 4M14 18c.4-1.6 1.4-2.6 2.6-2.6" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`,
    plug: `<path d="M8 8v4M16 8v4M7 12h10v3a5 5 0 01-10 0v-3zM12 20v2" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/>`,
    chart: `<path d="M5 18V6M5 18h14" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M8 14l3-4 3 2 4-6" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    envelope: `<rect x="4" y="7" width="16" height="11" rx="1.6" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M4 8l8 6 8-6" stroke="${color}" stroke-width="1.6"/>`,
    stop: `<circle cx="12" cy="12" r="8" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M9 9l6 6M15 9l-6 6" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>`,
    clock: `<circle cx="12" cy="12" r="8" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M12 8v5l3 2" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>`,
  };
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${icons[kind] || icons.list}</svg>`;
}

function logo(src: string, size: number, bleed = false) {
  return `<div class="logo${bleed ? " bleed" : ""}" style="width:${size}px;height:${size}px"><img src="${src}" alt="" /></div>`;
}

function ring(kind: string, size = 76) {
  return `<div class="ring" style="width:${size}px;height:${size}px">${ico(kind, CORAL, Math.round(size * 0.42))}</div>`;
}

function curveArrow() {
  return `<svg class="curve" viewBox="0 0 220 120" width="220" height="120" aria-hidden="true">
    <path d="M12 28C72 28 96 88 208 88" fill="none" stroke="${CORAL}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="5 8"/>
    <path d="M190 74l18 14-22 2" fill="none" stroke="${CORAL}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function bubbles() {
  return `<svg class="bubbles" viewBox="0 0 200 160" width="200" height="160" aria-hidden="true">
    <rect x="8" y="10" width="150" height="62" rx="20" fill="${ROSE}"/>
    <path d="M28 36h86M28 50h54" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.35"/>
    <rect x="42" y="86" width="150" height="58" rx="20" fill="none" stroke="${INK}" stroke-width="2.4"/>
    <circle cx="78" cy="115" r="4" fill="${CORAL}"/>
    <circle cx="98" cy="115" r="4" fill="${CORAL}"/>
    <circle cx="118" cy="115" r="4" fill="${CORAL}"/>
  </svg>`;
}

function moon() {
  return `<svg class="moon" viewBox="0 0 140 140" width="156" height="156" aria-hidden="true">
    <circle cx="70" cy="70" r="58" fill="${ROSE}"/>
    <path d="M84 28a50 50 0 1 0 16 82 58 58 0 0 1-16-82z" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
  </svg>`;
}

function stop() {
  return `<svg class="stop" viewBox="0 0 120 120" width="124" height="124" aria-hidden="true">
    <circle cx="60" cy="60" r="50" fill="${ROSE}"/>
    <circle cx="60" cy="60" r="38" fill="none" stroke="${INK}" stroke-width="3"/>
    <path d="M42 42l36 36M78 42L42 78" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
  </svg>`;
}

function art(kind: string) {
  switch (kind) {
    case "linkedin":
      return `
        <div class="scene">
          <div class="soft s1"></div>
          <div class="pos grok">${logo(GROK_BOT, 152, true)}</div>
          <div class="pos curve-wrap">${curveArrow()}</div>
          <div class="pos li">${logo(LINKEDIN, 108)}</div>
          <div class="pos r1">${ring("lock", 88)}</div>
          <div class="pos r2">${ring("list", 80)}</div>
        </div>`;
    case "sales":
      return `
        <div class="scene sales">
          <div class="soft s1"></div>
          <div class="pos grok">${logo(GROK_BOT, 152, true)}</div>
          <div class="pos curve-wrap">${curveArrow()}</div>
          <div class="pos li">${logo(LINKEDIN, 104)}</div>
          <div class="pos r1">${ring("chart", 88)}</div>
          <div class="pos r2">${ring("users", 80)}</div>
        </div>`;
    case "cold":
      return `
        <div class="scene cold">
          <div class="soft s1"></div>
          <div class="pos grok">${logo(GROK_BOT, 144, true)}</div>
          <div class="pos bubbles-wrap">${bubbles()}</div>
          <div class="pos li">${logo(LINKEDIN, 104)}</div>
          <div class="pos r1">${ring("envelope", 88)}</div>
        </div>`;
    case "vs":
      return `
        <div class="scene vs">
          <div class="soft s1"></div>
          <div class="pos grok">${logo(GROK_BOT, 140, true)}</div>
          <div class="pos vs-badge">vs</div>
          <div class="pos gpt">${logo(CHATGPT, 132)}</div>
          <div class="pos r1">${ring("moon", 80)}</div>
          <div class="pos r2">${ring("chat", 80)}</div>
        </div>`;
    case "outbound":
      return `
        <div class="scene outbound">
          <div class="soft s1"></div>
          <div class="pos moon-wrap">${moon()}</div>
          <div class="pos grok">${logo(GROK_BOT, 140, true)}</div>
          <div class="pos li">${logo(LINKEDIN, 100)}</div>
          <div class="pos r1">${ring("list", 80)}</div>
        </div>`;
    case "alternatives":
      return `
        <div class="scene alts">
          <div class="soft s1"></div>
          <div class="pos a1">${logo(GROK_BOT, 112, true)}</div>
          <div class="pos a2">${logo(CHATGPT, 104)}</div>
          <div class="pos a3">${logo(CLAUDE, 104)}</div>
          <div class="pos a4">${logo(CURSOR, 104)}</div>
          <div class="pos r1">${ring("plug", 76)}</div>
        </div>`;
    case "integration":
      return `
        <div class="scene integration">
          <div class="soft s1"></div>
          <div class="pos grok">${logo(GROK_BOT, 152, true)}</div>
          <div class="pos curve-wrap">${curveArrow()}</div>
          <div class="pos li">${logo(LINKEDIN, 104)}</div>
          <div class="pos r1">${ring("plug", 88)}</div>
          <div class="pos r2">${ring("lock", 80)}</div>
        </div>`;
    case "overnight":
      return `
        <div class="scene overnight">
          <div class="soft s1"></div>
          <div class="pos moon-wrap">${moon()}</div>
          <div class="pos grok">${logo(GROK_BOT, 152, true)}</div>
          <div class="pos r1">${ring("clock", 88)}</div>
          <div class="pos r2">${ring("send", 80)}</div>
        </div>`;
    case "automation":
      return `
        <div class="scene automation">
          <div class="soft s1"></div>
          <div class="pos grok">${logo(GROK_BOT, 140, true)}</div>
          <div class="pos stop-wrap">${stop()}</div>
          <div class="pos li">${logo(LINKEDIN, 104)}</div>
          <div class="pos r1">${ring("lock", 80)}</div>
        </div>`;
    default:
      return art("sales");
  }
}

type Job = {
  out: string;
  kicker: string;
  titleHtml: string;
  kind: string;
};

const jobs: Job[] = [
  {
    out: "automate-cold-messaging-with-grok-bot-v2.avif",
    kicker: "Practical guide",
    titleHtml: "Automate cold messaging<br>with Grok Bot",
    kind: "cold",
  },
  {
    out: "grok-bot-for-sales.avif",
    kicker: "Sales guide",
    titleHtml: "Grok Bot<br>for sales",
    kind: "sales",
  },
  {
    out: "grok-bot-vs-chatgpt-for-outbound.avif",
    kicker: "Comparison",
    titleHtml: "Grok Bot vs ChatGPT<br>for outbound",
    kind: "vs",
  },
  {
    out: "grok-bot-linkedin-sales.avif",
    kicker: "Practical guide",
    titleHtml: "Grok Bot for<br>LinkedIn outreach",
    kind: "linkedin",
  },
  {
    out: "seo/use-cases/grok-bot-cold-messaging.avif",
    kicker: "Use case",
    titleHtml: "Automate cold LinkedIn<br>messages with Grok Bot",
    kind: "cold",
  },
  {
    out: "seo/use-cases/grok-bot-outbound.avif",
    kicker: "Use case",
    titleHtml: "Get LinkedIn sales<br>with Grok Bot",
    kind: "outbound",
  },
  {
    out: "seo/alternatives/grok-bot.avif",
    kicker: "Category roundup",
    titleHtml: "Grok Bot alternatives<br>for LinkedIn sales",
    kind: "alternatives",
  },
  {
    out: "seo/integrations/grok-bot.avif",
    kicker: "Integration",
    titleHtml: "Grok Bot<br>integration",
    kind: "integration",
  },
  {
    out: "seo/guides/grok-bot-sales-outreach.avif",
    kicker: "Sales",
    titleHtml: "Using Grok Bot<br>for sales outreach",
    kind: "sales",
  },
  {
    out: "seo/guides/grok-bot-cold-messages.avif",
    kicker: "Cold messages",
    titleHtml: "Cold messaging<br>with Grok Bot",
    kind: "cold",
  },
  {
    out: "seo/guides/grok-bot-linkedin-automation.avif",
    kicker: "Account risk",
    titleHtml: "Grok Bot and<br>LinkedIn automation",
    kind: "automation",
  },
  {
    out: "seo/guides/overnight-outbound-with-grok-bot.avif",
    kicker: "Overnight work",
    titleHtml: "Overnight outbound<br>with Grok Bot",
    kind: "overnight",
  },
];

function htmlFor(job: Job) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
@font-face {
  font-family: "OmentirSans";
  src: url("file://${FONT}") format("woff2");
  font-weight: 400 700;
  font-style: normal;
}
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  width: ${WIDTH}px; height: ${HEIGHT}px;
  overflow: hidden;
  background: ${PAPER};
  color: ${INK};
  font-family: OmentirSans, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.frame {
  position: relative;
  width: ${WIDTH}px; height: ${HEIGHT}px;
  padding: 88px 96px 88px 100px;
  display: grid;
  grid-template-columns: 1.22fr 0.78fr;
  gap: 40px;
  align-items: center;
  overflow: hidden;
}
.dots {
  position: absolute;
  right: 72px; top: 56px;
  width: 220px; height: 140px;
  background-image: radial-gradient(${CORAL} 1.4px, transparent 1.5px);
  background-size: 16px 16px;
  opacity: 0.28;
}
.arc {
  position: absolute;
  left: -120px; bottom: -160px;
  width: 420px; height: 420px;
  border: 1.5px solid ${ROSE};
  border-radius: 50%;
  opacity: 0.7;
}
.copy { position: relative; z-index: 2; max-width: 720px; }
.kicker {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${CORAL};
}
h1 {
  margin: 18px 0 0;
  font-size: 62px;
  line-height: 1.06;
  letter-spacing: -0.038em;
  font-weight: 700;
}
.rule {
  margin-top: 28px;
  width: 72px;
  height: 4px;
  border-radius: 99px;
  background: ${CORAL};
}
.art { position: relative; z-index: 1; height: 100%; }
.scene { position: relative; width: 100%; height: 100%; }
.soft {
  position: absolute;
  border-radius: 50%;
  background: ${ROSE};
  opacity: 0.55;
}
.s1 { width: 340px; height: 340px; right: 8px; top: 70px; }
.logo {
  display: grid; place-items: center;
  background: #fffdf9;
  border: 1.4px solid #eadfd6;
  border-radius: 28px;
  padding: 14px;
}
.logo.bleed {
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 34px;
  overflow: hidden;
}
.logo img { width: 100%; height: 100%; object-fit: contain; display: block; }
.ring {
  display: grid; place-items: center;
  background: #fffdf9;
  border: 1.4px solid ${ROSE};
  border-radius: 50%;
}
.pos { position: absolute; }
.pos.grok { left: 24px; top: 130px; }
.pos.curve-wrap { left: 168px; top: 200px; }
.pos.li { right: 28px; top: 300px; }
.pos.r1 { left: 16px; bottom: 128px; }
.pos.r2 { left: 120px; bottom: 72px; }
.pos.bubbles-wrap { right: 28px; top: 88px; }
.scene.cold .pos.grok { left: 20px; top: 200px; }
.scene.cold .pos.li { right: 56px; bottom: 168px; top: auto; }
.scene.cold .pos.r1 { left: 48px; bottom: 96px; }
.pos.vs-badge {
  left: 196px; top: 248px;
  width: 56px; height: 56px; border-radius: 50%;
  display: grid; place-items: center;
  background: #fffdf9; border: 1.4px solid #eadfd6;
  font-size: 14px; font-weight: 700; color: ${MUTED};
  letter-spacing: 0.04em;
}
.scene.vs .pos.grok { left: 8px; top: 168px; }
.scene.vs .pos.gpt { right: 36px; top: 168px; }
.scene.vs .pos.r1 { left: 36px; bottom: 140px; }
.scene.vs .pos.r2 { right: 64px; bottom: 140px; }
.pos.moon-wrap { right: 40px; top: 72px; }
.scene.outbound .pos.grok { left: 16px; top: 188px; }
.scene.outbound .pos.li { right: 56px; bottom: 180px; top: auto; }
.scene.outbound .pos.r1 { left: 48px; bottom: 100px; }
.scene.alts .pos.a1 { left: 48px; top: 140px; }
.scene.alts .pos.a2 { right: 64px; top: 168px; }
.scene.alts .pos.a3 { left: 72px; bottom: 200px; }
.scene.alts .pos.a4 { right: 80px; bottom: 168px; }
.scene.alts .pos.r1 { left: 220px; top: 300px; }
.scene.overnight .pos.grok { left: 28px; top: 200px; }
.scene.overnight .pos.r1 { right: 72px; bottom: 200px; }
.scene.overnight .pos.r2 { right: 160px; bottom: 112px; }
.pos.stop-wrap { right: 48px; top: 120px; }
.scene.automation .pos.grok { left: 16px; top: 168px; }
.scene.automation .pos.li { right: 64px; bottom: 168px; top: auto; }
.scene.automation .pos.r1 { left: 40px; bottom: 112px; }
</style>
</head>
<body>
<div class="frame">
  <div class="dots"></div>
  <div class="arc"></div>
  <div class="copy">
    <div class="kicker">${esc(job.kicker)}</div>
    <h1>${job.titleHtml}</h1>
    <div class="rule"></div>
  </div>
  <div class="art">${art(job.kind)}</div>
</div>
</body>
</html>`;
}

type RichJob = {
  out: string;
  kicker: string;
  title: string;
  summary: string;
  chips: string[];
  chipIcons: string[];
  kind: string;
  boardLabel: string;
  boardTitle: string;
  status: string;
  note: string;
  accent: string;
  tint: string;
  accentInk: string;
};

const richJobs: RichJob[] = [
  {
    out: "automate-cold-messaging-with-grok-bot-v2.avif",
    kicker: "Practical guide",
    title: "Automate cold messaging with Grok Bot",
    summary: "Grok Bot researches and drafts overnight. Omentir sends with caps.",
    chips: ["Research overnight", "Draft first touches", "Review before send", "Paced LinkedIn"],
    chipIcons: ["search", "draft", "review", "send"],
    kind: "cold",
    boardLabel: "Cold message workflow",
    boardTitle: "Morning edit, then send",
    status: "DRAFTS ONLY",
    note: "Edit the list before the first send.",
    accent: "#d9776b",
    tint: "#f3d0c9",
    accentInk: "#9c4e45",
  },
  {
    out: "grok-bot-for-sales.avif",
    kicker: "Sales guide",
    title: "Grok Bot for sales",
    summary: "Research, scoring, and first-touch drafts overnight. LinkedIn stays in Omentir.",
    chips: ["Research accounts", "Score contacts", "Draft in your voice", "Take the meeting"],
    chipIcons: ["search", "chart", "draft", "users"],
    kind: "sales",
    boardLabel: "Sales outreach loop",
    boardTitle: "Research, score, draft",
    status: "REVIEW FIRST",
    note: "Stop at the review list. Do not send or enroll.",
    accent: "#8eafc0",
    tint: "#dce9ee",
    accentInk: "#456777",
  },
  {
    out: "grok-bot-vs-chatgpt-for-outbound.avif",
    kicker: "Comparison",
    title: "Grok Bot vs ChatGPT for outbound",
    summary: "A persistent computer versus a session you watch. The send path stays the same.",
    chips: ["Persistent computer", "Watched session", "MCP connector", "Same send path"],
    chipIcons: ["clock", "chat", "plug", "send"],
    kind: "comparison",
    boardLabel: "Operator comparison",
    boardTitle: "Pick the work mode you will read",
    status: "TWO WORK MODES",
    note: "LinkedIn stays in Omentir either way.",
    accent: "#9b83ad",
    tint: "#e8dff0",
    accentInk: "#70547e",
  },
  {
    out: "grok-bot-linkedin-sales.avif",
    kicker: "Practical guide",
    title: "Grok Bot for LinkedIn outreach",
    summary: "Grok Bot researches accounts and drafts notes. Omentir handles LinkedIn.",
    chips: ["Account research", "Draft LinkedIn notes", "Omentir send path", "Human replies"],
    chipIcons: ["search", "draft", "send", "users"],
    kind: "linkedin",
    boardLabel: "LinkedIn outreach stack",
    boardTitle: "Research here. Send here.",
    status: "SAFE HANDOFF",
    note: "Keep the cloud browser off the account.",
    accent: "#8fae96",
    tint: "#dfeae1",
    accentInk: "#4f7057",
  },
  {
    out: "seo/use-cases/grok-bot-cold-messaging.avif",
    kicker: "Use case",
    title: "Automate cold LinkedIn messages with Grok Bot",
    summary: "Draft the first LinkedIn notes overnight. Edit the list before sending.",
    chips: ["Connection note", "After-accept DM", "Morning edit", "Send with caps"],
    chipIcons: ["send", "draft", "review", "lock"],
    kind: "cold",
    boardLabel: "Cold LinkedIn messages",
    boardTitle: "A short note with a human stop",
    status: "EDIT BEFORE SEND",
    note: "The after-accept DM waits for your read.",
    accent: "#c18c79",
    tint: "#f1ddd4",
    accentInk: "#925b49",
  },
  {
    out: "seo/use-cases/grok-bot-outbound.avif",
    kicker: "Use case",
    title: "Get LinkedIn sales with Grok Bot",
    summary: "Use Grok Bot for research and drafts. Let Omentir pace the send.",
    chips: ["One ICP", "Review list", "Paced campaigns", "Human replies"],
    chipIcons: ["target", "review", "send", "users"],
    kind: "outbound",
    boardLabel: "Outbound handoff",
    boardTitle: "Overnight work to a real conversation",
    status: "HUMAN IN THE LOOP",
    note: "You still take the meeting.",
    accent: "#b08d55",
    tint: "#efe3c6",
    accentInk: "#806126",
  },
  {
    out: "seo/alternatives/grok-bot.avif",
    kicker: "Category roundup",
    title: "Grok Bot alternatives for LinkedIn sales",
    summary: "Compare overnight work, watched sessions, and the LinkedIn workspace.",
    chips: ["Choose one operator", "Compare the job", "Watch the output", "Keep send paced"],
    chipIcons: ["users", "chart", "review", "send"],
    kind: "alternatives",
    boardLabel: "Alternatives by job",
    boardTitle: "Different tools, different work",
    status: "COMPARE THE FIT",
    note: "Omentir remains the LinkedIn workspace.",
    accent: "#8da9b9",
    tint: "#dce7ed",
    accentInk: "#4f6978",
  },
  {
    out: "seo/integrations/grok-bot.avif",
    kicker: "Integration guide",
    title: "Grok Bot integration",
    summary: "Connect Grok Bot to Omentir over MCP. Keep LinkedIn in Omentir.",
    chips: ["Settings", "Plugins", "MCP URL", "Workspace approval"],
    chipIcons: ["browser", "plug", "plug", "check"],
    kind: "integration",
    boardLabel: "Plugin connection",
    boardTitle: "Grok Bot calls Omentir over MCP",
    status: "CONNECTED BY YOU",
    note: "Approve the workspace, then keep LinkedIn here.",
    accent: "#d18b82",
    tint: "#f3d9d4",
    accentInk: "#975148",
  },
  {
    out: "seo/guides/grok-bot-sales-outreach.avif",
    kicker: "Sales guide",
    title: "Using Grok Bot for sales outreach",
    summary: "Give the Bot a sales job: research, score, draft, then stop.",
    chips: ["Research", "Score", "Draft", "Review list"],
    chipIcons: ["search", "chart", "draft", "review"],
    kind: "sales",
    boardLabel: "Sales job spec",
    boardTitle: "A useful job ends at review",
    status: "NO AUTO-SEND",
    note: "A person owns the reply and the demo.",
    accent: "#83a6af",
    tint: "#dbe8eb",
    accentInk: "#456b73",
  },
  {
    out: "seo/guides/grok-bot-cold-messages.avif",
    kicker: "Messaging guide",
    title: "Cold messaging with Grok Bot",
    summary: "A cold note workflow with research, drafting, review, and paced send.",
    chips: ["Connection note", "First DM", "Follow-up", "Read before send"],
    chipIcons: ["send", "draft", "clock", "review"],
    kind: "cold",
    boardLabel: "Message sequence",
    boardTitle: "Context before copy",
    status: "READ THE DRAFT",
    note: "A fluent note still needs your judgment.",
    accent: "#b99363",
    tint: "#efe2cc",
    accentInk: "#7b5d2e",
  },
  {
    out: "seo/guides/grok-bot-linkedin-automation.avif",
    kicker: "Account safety",
    title: "Grok Bot and LinkedIn automation",
    summary: "The cloud browser can click sites. Keep it away from LinkedIn.",
    chips: ["No LinkedIn login", "Shared cloud computer", "MCP path", "Safe pacing"],
    chipIcons: ["lock", "browser", "plug", "send"],
    kind: "automation",
    boardLabel: "Account safety",
    boardTitle: "Keep the cloud browser away",
    status: "NO LINKEDIN LOGIN",
    note: "Put LinkedIn in Omentir, not on the Bot computer.",
    accent: "#a883a8",
    tint: "#e9dfee",
    accentInk: "#765477",
  },
  {
    out: "seo/guides/overnight-outbound-with-grok-bot.avif",
    kicker: "Overnight guide",
    title: "Overnight outbound with Grok Bot",
    summary: "Set one ICP and a stop rule. Wake up to a review list.",
    chips: ["One ICP", "Stop rule", "Overnight research", "Morning review"],
    chipIcons: ["target", "stop", "moon", "review"],
    kind: "overnight",
    boardLabel: "Overnight operating loop",
    boardTitle: "Sleep, then review",
    status: "MORNING QUEUE",
    note: "Do not let the Bot enroll anyone while you sleep.",
    accent: "#829eaf",
    tint: "#dce7ee",
    accentInk: "#4b6676",
  },
];

function richMark(src: string, size = 46, className = "") {
  return `<div class="rich-mark ${className}" style="width:${size}px;height:${size}px"><img src="${src}" alt="" /></div>`;
}

function richBrand(
  src: string,
  label: string,
  detail: string,
  tone = "",
  size = 46,
  markClass = ""
) {
  return `<div class="rich-brand ${tone}">
    ${richMark(src, size, markClass)}
    <div class="rich-brand-copy"><strong>${esc(label)}</strong><span>${esc(detail)}</span></div>
  </div>`;
}

function richStep(number: string, kind: string, title: string, detail: string, tone = "") {
  return `<div class="rich-step ${tone}">
    <div class="rich-step-top"><span class="rich-step-number">${esc(number)}</span>${ico(kind, "var(--accent)", 24)}</div>
    <strong>${esc(title)}</strong>
    <span>${esc(detail)}</span>
  </div>`;
}

function richCompareCard(src: string, label: string, tone: string, rows: string[]) {
  return `<div class="rich-compare-card ${tone}">
    <div class="rich-compare-brand">${richMark(src, 48, label === "Grok Bot" ? "grok-mark" : "")}<strong>${esc(label)}</strong></div>
    <div class="rich-compare-list">${rows
      .map((row) => `<span>${ico("check", "var(--accent)", 18)}${esc(row)}</span>`)
      .join("")}</div>
  </div>`;
}

function richFooter(job: RichJob) {
  return `<div class="rich-footer">
    <span class="rich-footer-note">${ico("lock", "var(--accent)", 18)}${esc(job.note)}</span>
    <span class="rich-footer-meta">Omentir / ${esc(job.kicker)}</span>
  </div>`;
}

function richArt(job: RichJob) {
  const header = `<div class="rich-header">
    <div><span class="rich-board-label">${esc(job.boardLabel)}</span><strong>${esc(job.boardTitle)}</strong></div>
    <span class="rich-status">${esc(job.status)}</span>
  </div>`;
  const shell = (body: string) => `<div class="rich-scene ${job.kind}" style="--accent:${job.accent};--tint:${job.tint};--accent-ink:${job.accentInk}">
    <div class="rich-orb"></div><div class="rich-dots"></div>${header}<div class="rich-body">${body}</div>${richFooter(job)}
  </div>`;

  switch (job.kind) {
    case "cold":
      return shell(`
        <div class="rich-brand-row">${richBrand(GROK_BOT, "Grok Bot", "research + drafts", "featured", 56, "grok-mark")}<span class="rich-tag">overnight work</span></div>
        <div class="rich-flow-label"><span>Cold message path</span><span>review first</span></div>
        <div class="rich-step-grid">
          ${richStep("01", "search", "Find context", "company, role, signal")}
          ${richStep("02", "draft", "Draft the note", "short and specific")}
          ${richStep("03", "review", "Read the list", "edit before send")}
        </div>
        <div class="rich-draft-card">
          <div class="rich-draft-meta"><strong>After-accept DM</strong><span>context-led draft</span></div>
          <div class="rich-lines"><i></i><i></i><i class="short"></i></div>
          <div class="rich-draft-foot">${ico("review", "var(--accent)", 18)}Read before send<span>Omentir queue</span></div>
        </div>
        <div class="rich-send-bar">${richMark(LINKEDIN, 42, "linkedin-mark")}<div><strong>Send from Omentir</strong><span>caps + windows + inbox</span></div><span class="rich-tag">paced</span></div>
      `);
    case "sales":
      return shell(`
        <div class="rich-route">${richBrand(GROK_BOT, "Grok Bot", "overnight operator", "featured", 52, "grok-mark")}<span class="rich-route-arrow">&rarr;</span>${richBrand(OMENTIR, "Omentir", "LinkedIn workspace", "", 52, "omentir-mark")}</div>
        <div class="rich-step-grid">
          ${richStep("01", "search", "Research", "accounts and signals")}
          ${richStep("02", "chart", "Score", "fit before drafting")}
          ${richStep("03", "draft", "Draft", "in your voice")}
        </div>
        <div class="rich-queue"><div class="rich-flow-label"><span>Review queue</span><span class="rich-tag">drafts</span></div><div class="rich-queue-row"><span>Account context</span><b></b></div><div class="rich-queue-row"><span>Fit and evidence</span><b></b></div><div class="rich-queue-row"><span>First-touch note</span><b></b></div></div>
        <div class="rich-human">${ico("users", "var(--accent)", 24)}<div><strong>Your part</strong><span>Read the list. Take the meeting.</span></div></div>
      `);
    case "comparison":
      return shell(`
        <div class="rich-compare-grid">
          ${richCompareCard(GROK_BOT, "Grok Bot", "featured", ["persistent cloud computer", "keeps working after close", "overnight research"])}
          <div class="rich-vs">vs</div>
          ${richCompareCard(CHATGPT, "ChatGPT", "", ["session you watch", "prompt and reply", "works while open"])}
        </div>
        <div class="rich-compare-lane"><div><span>Work time</span><strong>Overnight</strong></div><i>&rarr;</i><div><span>Output</span><strong>Review list</strong></div><i>&rarr;</i><div><span>Send</span><strong>Omentir + LinkedIn</strong></div></div>
        <div class="rich-shared">${richMark(OMENTIR, 42, "omentir-mark")}<div><strong>Same send path</strong><span>Both can call Omentir over MCP. LinkedIn stays here.</span></div>${richMark(LINKEDIN, 38, "linkedin-mark")}</div>
      `);
    case "linkedin":
      return shell(`
        <div class="rich-stack">
          ${richBrand(GROK_BOT, "Grok Bot", "research + draft", "featured", 50, "grok-mark")}
          <span class="rich-stack-arrow">&darr;</span>
          ${richBrand(OMENTIR, "Omentir", "pacing + inbox", "", 50)}
          <span class="rich-stack-arrow">&darr;</span>
          ${richBrand(LINKEDIN, "LinkedIn", "your account", "", 50)}
        </div>
        <div class="rich-step-grid rich-step-grid-two">
          ${richStep("01", "search", "Find signals", "account context")}
          ${richStep("02", "draft", "Write notes", "seller voice")}
          ${richStep("03", "send", "Pace send", "daily limits")}
          ${richStep("04", "users", "Handle replies", "person in the loop")}
        </div>
      `);
    case "outbound":
      return shell(`
        <div class="rich-route">${richBrand(GROK_BOT, "Grok Bot", "research + drafts", "featured", 52, "grok-mark")}<span class="rich-route-arrow">&rarr;</span>${richBrand(OMENTIR, "Omentir", "paced LinkedIn send", "", 52, "omentir-mark")}</div>
        <div class="rich-step-grid rich-step-grid-two">
          ${richStep("01", "target", "Choose one ICP", "write the job")}
          ${richStep("02", "search", "Find accounts", "use real signals")}
          ${richStep("03", "review", "Read the queue", "keep the good fits")}
          ${richStep("04", "users", "Take the meeting", "reply as yourself")}
        </div>
        <div class="rich-human">${ico("send", "var(--accent)", 24)}<div><strong>Handoff point</strong><span>Grok Bot stops. Omentir sends under your limits.</span></div></div>
      `);
    case "alternatives":
      return shell(`
        <div class="rich-option-grid">
          ${richBrand(GROK_BOT, "Grok Bot", "overnight operator", "featured", 44, "grok-mark")}
          ${richBrand(CHATGPT, "ChatGPT", "session you watch", "", 44)}
          ${richBrand(CLAUDE, "Claude", "session operator", "", 44)}
          ${richBrand(CURSOR, "Cursor", "coding agent", "", 44)}
        </div>
        <div class="rich-fit-row"><div><span>Want overnight work?</span><strong>Choose an operator</strong></div><div><span>Need the send path?</span><strong>Use Omentir</strong></div></div>
        <div class="rich-shared">${richMark(OMENTIR, 42, "omentir-mark")}<div><strong>Omentir</strong><span>LinkedIn discovery, drafts, campaigns, and inbox</span></div>${richMark(LINKEDIN, 38, "linkedin-mark")}</div>
        <div class="rich-human">${ico("chart", "var(--accent)", 24)}<div><strong>Compare the job</strong><span>Overnight work is different from a session you watch.</span></div></div>
      `);
    case "integration":
      return shell(`
        <div class="rich-connection">${richBrand(GROK_BOT, "Grok Bot", "Settings + Plugins", "featured", 54, "grok-mark")}<div class="rich-connection-node">${ico("plug", "var(--accent)", 26)}<strong>MCP</strong></div>${richBrand(OMENTIR, "Omentir", "workspace approval", "", 54, "omentir-mark")}</div>
        <div class="rich-setup-grid">
          ${richStep("01", "browser", "Open Settings", "in Grok Bot")}
          ${richStep("02", "plug", "Add the URL", "under Plugins")}
          ${richStep("03", "check", "Approve", "Connect workspace")}
        </div>
        <div class="rich-mcp-summary"><span>${ico("search", "var(--accent)", 21)}Research</span><span>${ico("review", "var(--accent)", 21)}Review list</span><span>${ico("send", "var(--accent)", 21)}Send in Omentir</span></div>
        <div class="rich-send-bar">${richMark(LINKEDIN, 42, "linkedin-mark")}<div><strong>LinkedIn stays in Omentir</strong><span>The Bot calls tools. It does not become a second LinkedIn client.</span></div></div>
      `);
    case "automation":
      return shell(`
        <div class="rich-guard-hero">${richBrand(GROK_BOT, "Grok Bot", "cloud computer", "featured", 54, "grok-mark")}<div class="rich-stop">${ico("stop", "var(--accent)", 38)}<span>stop here</span></div>${richBrand(LINKEDIN, "LinkedIn", "keep it out", "", 54)}</div>
        <div class="rich-step-grid rich-step-grid-two">
          ${richStep("01", "browser", "Cloud browser", "not the account client")}
          ${richStep("02", "plug", "Use MCP", "call Omentir tools")}
          ${richStep("03", "lock", "Keep login private", "no shared VM session")}
          ${richStep("04", "send", "Pace the campaign", "limits and windows")}
        </div>
        <div class="rich-warning">${ico("lock", "var(--accent)", 22)}<strong>Never sign into LinkedIn on the Bot computer.</strong></div>
      `);
    case "overnight":
      return shell(`
        <div class="rich-night-top"><div class="rich-moon">${moon()}</div><div><span class="rich-board-label">overnight run</span><strong>One job. One stop rule.</strong><span class="rich-muted">The list waits for you.</span></div>${richBrand(GROK_BOT, "Grok Bot", "working after close", "featured", 48, "grok-mark")}</div>
        <div class="rich-step-grid rich-step-grid-three">
          ${richStep("01", "target", "Before sleep", "one ICP + rule")}
          ${richStep("02", "clock", "While you sleep", "research + drafts")}
          ${richStep("03", "review", "In the morning", "review in Omentir")}
        </div>
        <div class="rich-overnight-strip"><span><b>01</b> Set the job</span><span><b>02</b> Let it run</span><span><b>03</b> Read the queue</span></div>
        <div class="rich-send-bar">${richMark(OMENTIR, 42, "omentir-mark")}<div><strong>Morning review list</strong><span>Send later, with caps and a human reply.</span></div>${richMark(LINKEDIN, 38, "linkedin-mark")}</div>
      `);
    default:
      return shell(`<div class="rich-human">${ico("check", "var(--accent)", 24)}<div><strong>Review before send</strong><span>Keep the operator and the account separate.</span></div></div>`);
  }
}

function richHtmlFor(job: RichJob) {
  const chips = job.chips
    .map(
      (chip, index) =>
        `<div class="chip">${ico(job.chipIcons[index] || "check", job.accentInk, 21)}<span>${esc(chip)}</span></div>`
    )
    .join("");
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
@font-face { font-family: "OmentirSans"; src: url("file://${FONT}") format("woff2"); font-weight: 400 700; }
* { box-sizing: border-box; }
html, body { margin:0; padding:0; width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden; background:${PAPER}; color:${INK}; font-family:OmentirSans, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing:antialiased; }
.frame { position:relative; width:${WIDTH}px; height:${HEIGHT}px; padding:68px 72px; display:grid; grid-template-columns:minmax(0, .94fr) minmax(0, 1.06fr); gap:46px; overflow:hidden; }
.frame:before { content:""; position:absolute; left:-160px; bottom:-230px; width:510px; height:510px; border:1px solid ${ROSE}; border-radius:50%; opacity:.72; }
.frame:after { content:""; position:absolute; right:44px; top:32px; width:170px; height:110px; background-image:radial-gradient(${CORAL} 1.3px, transparent 1.5px); background-size:15px 15px; opacity:.2; }
.copy { position:relative; z-index:2; min-width:0; display:flex; flex-direction:column; justify-content:center; align-items:flex-start; padding-left:10px; }
.brandline { display:flex; align-items:center; gap:10px; color:${MUTED}; font-size:16px; font-weight:700; letter-spacing:.02em; }
.brandline .tiny-mark { display:grid; place-items:center; width:30px; height:30px; padding:7px; border:1px solid ${LINE}; border-radius:10px; background:${CARD}; }
.brandline img { width:100%; height:100%; object-fit:contain; }
.kicker { margin-top:30px; color:${CORAL}; font-size:13px; font-weight:700; letter-spacing:.17em; line-height:1; text-transform:uppercase; }
h1 { max-width:650px; margin:18px 0 0; font-size:58px; line-height:1.045; letter-spacing:-.045em; font-weight:700; }
.lede { max-width:580px; margin:24px 0 0; color:${MUTED}; font-size:21px; line-height:1.4; }
.rule { width:78px; height:5px; margin-top:27px; border-radius:99px; background:${job.accent}; }
.chip-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; width:min(580px, 100%); margin-top:28px; }
.chip { display:flex; align-items:center; gap:9px; min-height:48px; padding:10px 12px; border:1px solid ${LINE}; border-radius:13px; background:rgba(255,253,250,.78); color:${INK}; font-size:13px; font-weight:650; line-height:1.2; }
.chip svg { flex:0 0 auto; }
.copy-foot { display:flex; align-items:center; gap:12px; margin-top:31px; color:${MUTED}; font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.copy-foot i { width:5px; height:5px; border-radius:50%; background:${job.accent}; }
.art { position:relative; z-index:2; min-width:0; min-height:0; height:100%; }
.rich-scene { --card:${CARD}; position:relative; isolation:isolate; display:flex; flex-direction:column; width:100%; height:100%; min-height:0; overflow:hidden; padding:28px; border:1.5px solid ${LINE}; border-radius:30px; background:var(--card); box-shadow:0 18px 45px rgba(55,43,35,.08); }
.rich-orb { position:absolute; z-index:-1; right:-118px; top:-126px; width:400px; height:400px; border-radius:50%; background:var(--tint); opacity:.78; }
.rich-dots { position:absolute; z-index:-1; right:24px; bottom:28px; width:130px; height:88px; background-image:radial-gradient(var(--accent) 1.2px, transparent 1.5px); background-size:14px 14px; opacity:.22; }
.rich-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding-bottom:18px; border-bottom:1px solid ${LINE}; }
.rich-board-label { display:block; color:var(--accent-ink); font-size:11px; font-weight:700; letter-spacing:.14em; line-height:1.2; text-transform:uppercase; }
.rich-header strong { display:block; margin-top:6px; color:${INK}; font-size:19px; line-height:1.15; letter-spacing:-.02em; }
.rich-status, .rich-tag { display:inline-flex; align-items:center; white-space:nowrap; border:1px solid color-mix(in srgb, var(--accent) 40%, ${LINE}); border-radius:999px; background:var(--tint); color:var(--accent-ink); font-size:10px; font-weight:700; letter-spacing:.1em; line-height:1; text-transform:uppercase; }
.rich-status { padding:9px 11px; }
.rich-tag { padding:7px 9px; letter-spacing:.07em; }
.rich-body { position:relative; z-index:1; display:flex; flex:1; min-height:0; flex-direction:column; justify-content:space-between; gap:16px; padding-top:22px; }
.rich-brand-row, .rich-route, .rich-connection, .rich-guard-hero, .rich-night-top { display:flex; align-items:center; gap:12px; }
.rich-brand-row { justify-content:space-between; }
.rich-brand { display:flex; min-width:0; flex:1; align-items:center; gap:12px; padding:13px 14px; border:1px solid ${LINE}; border-radius:16px; background:rgba(255,253,250,.82); }
.rich-brand.featured { border-color:color-mix(in srgb, var(--accent) 42%, ${LINE}); background:var(--tint); }
.rich-mark { display:grid; flex:0 0 auto; place-items:center; overflow:hidden; padding:9px; border:1px solid ${LINE}; border-radius:12px; background:${CARD}; }
.rich-mark img { width:100%; height:100%; object-fit:contain; display:block; }
.rich-mark.grok-mark { padding:0; border-color:#050505; background:#050505; }
.rich-mark.omentir-mark, .rich-mark.linkedin-mark { padding:6px; }
.rich-brand-copy { min-width:0; }
.rich-brand-copy strong, .rich-brand-copy span { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.rich-brand-copy strong { color:${INK}; font-size:15px; line-height:1.2; }
.rich-brand-copy span { margin-top:4px; color:${MUTED}; font-size:12px; line-height:1.2; }
.rich-flow-label { display:flex; align-items:center; justify-content:space-between; color:${MUTED}; font-size:12px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; }
.rich-step-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px; }
.rich-step-grid-two { grid-template-columns:repeat(2, minmax(0, 1fr)); }
.rich-step-grid-three { grid-template-columns:repeat(3, minmax(0, 1fr)); }
.rich-step { display:flex; min-width:0; min-height:112px; flex-direction:column; justify-content:space-between; gap:7px; padding:13px; border:1px solid ${LINE}; border-radius:15px; background:rgba(250,248,244,.86); }
.rich-step-top { display:flex; align-items:center; justify-content:space-between; }
.rich-step-number { color:var(--accent-ink); font-size:11px; font-weight:700; letter-spacing:.1em; }
.rich-step strong { color:${INK}; font-size:14px; line-height:1.2; }
.rich-step > span:last-child { color:${MUTED}; font-size:12px; line-height:1.3; }
.rich-draft-card, .rich-queue, .rich-shared, .rich-human, .rich-warning, .rich-send-bar { border:1px solid ${LINE}; border-radius:16px; background:rgba(250,248,244,.82); }
.rich-draft-card { padding:15px 16px; }
.rich-draft-meta, .rich-draft-foot { display:flex; align-items:center; justify-content:space-between; gap:10px; color:${MUTED}; font-size:11px; }
.rich-draft-meta strong { color:${INK}; font-size:13px; }
.rich-lines { display:flex; flex-direction:column; gap:7px; margin:16px 0 14px; }
.rich-lines i { display:block; width:92%; height:6px; border-radius:99px; background:var(--tint); }
.rich-lines i:nth-child(2) { width:76%; }
.rich-lines i.short { width:45%; }
.rich-draft-foot { justify-content:flex-start; }
.rich-draft-foot span { margin-left:auto; }
.rich-send-bar { display:flex; align-items:center; gap:12px; padding:12px 14px; }
.rich-send-bar > div:not(.rich-mark) { min-width:0; flex:1; }
.rich-send-bar strong, .rich-send-bar span { display:block; }
.rich-send-bar strong { color:${INK}; font-size:14px; line-height:1.2; }
.rich-send-bar span { margin-top:4px; color:${MUTED}; font-size:11px; line-height:1.2; }
.rich-route { align-items:stretch; }
.rich-route-arrow { flex:0 0 auto; align-self:center; color:var(--accent); font-size:28px; font-weight:400; }
.rich-queue { padding:14px 16px; }
.rich-queue-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 0; border-top:1px solid ${LINE}; color:${MUTED}; font-size:12px; }
.rich-queue-row b { width:36%; height:7px; border-radius:99px; background:var(--tint); }
.rich-human, .rich-warning { display:flex; align-items:center; gap:12px; padding:13px 15px; }
.rich-human > div, .rich-warning > div { min-width:0; }
.rich-human strong, .rich-human span, .rich-warning strong { display:block; }
.rich-human strong { color:${INK}; font-size:13px; }
.rich-human span { margin-top:4px; color:${MUTED}; font-size:12px; line-height:1.25; }
.rich-compare-grid { display:grid; grid-template-columns:1fr 34px 1fr; align-items:stretch; gap:10px; }
.rich-compare-card { min-width:0; min-height:300px; padding:15px; border:1px solid ${LINE}; border-radius:17px; background:rgba(250,248,244,.84); }
.rich-compare-card.featured { border-color:color-mix(in srgb, var(--accent) 42%, ${LINE}); background:var(--tint); }
.rich-compare-brand { display:flex; align-items:center; gap:10px; padding-bottom:13px; border-bottom:1px solid ${LINE}; }
.rich-compare-brand strong { font-size:15px; }
.rich-vs { align-self:center; color:${MUTED}; font-size:12px; font-weight:700; text-align:center; }
.rich-compare-list { display:flex; flex-direction:column; gap:12px; padding-top:15px; }
.rich-compare-list span { display:flex; align-items:flex-start; gap:7px; color:${MUTED}; font-size:12px; line-height:1.25; }
.rich-compare-lane { display:grid; grid-template-columns:1fr 28px 1fr 28px 1fr; align-items:center; gap:8px; min-height:108px; padding:14px; border:1px solid ${LINE}; border-radius:16px; background:rgba(250,248,244,.82); }
.rich-compare-lane div { display:flex; flex-direction:column; gap:5px; }
.rich-compare-lane span, .rich-fit-row span { color:${MUTED}; font-size:11px; }
.rich-compare-lane strong, .rich-fit-row strong { color:${INK}; font-size:13px; line-height:1.2; }
.rich-compare-lane i { color:var(--accent); font-size:20px; font-style:normal; text-align:center; }
.rich-shared { display:flex; align-items:center; gap:12px; padding:13px 15px; }
.rich-shared > div:not(.rich-mark) { min-width:0; flex:1; }
.rich-shared strong, .rich-shared span { display:block; }
.rich-shared strong { color:${INK}; font-size:13px; }
.rich-shared span { margin-top:4px; color:${MUTED}; font-size:11px; line-height:1.3; }
.rich-stack { display:flex; flex-direction:column; align-items:stretch; gap:7px; }
.rich-stack .rich-brand { flex:0 0 auto; }
.rich-stack-arrow { align-self:center; color:var(--accent); font-size:20px; line-height:1; }
.rich-option-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; }
.rich-option-grid .rich-brand { min-height:118px; }
.rich-fit-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.rich-fit-row > div { display:flex; flex-direction:column; gap:6px; min-height:92px; justify-content:center; padding:13px 15px; border:1px solid ${LINE}; border-radius:16px; background:rgba(250,248,244,.82); }
.rich-connection { align-items:stretch; }
.rich-connection { min-height:136px; }
.rich-connection .rich-brand { flex:1; }
.rich-connection-node { display:flex; flex:0 0 64px; flex-direction:column; align-items:center; justify-content:center; gap:5px; border:1px dashed var(--accent); border-radius:15px; color:var(--accent-ink); font-size:11px; letter-spacing:.08em; text-transform:uppercase; }
.rich-setup-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px; }
.rich-setup-grid .rich-step { min-height:142px; }
.rich-mcp-summary, .rich-overnight-strip { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; min-height:78px; padding:12px 14px; border:1px solid ${LINE}; border-radius:16px; background:rgba(250,248,244,.82); }
.rich-mcp-summary span, .rich-overnight-strip span { display:flex; align-items:center; gap:7px; color:${MUTED}; font-size:11px; font-weight:700; line-height:1.2; }
.rich-overnight-strip b { display:inline-grid; width:23px; height:23px; place-items:center; border-radius:50%; background:var(--tint); color:var(--accent-ink); font-size:10px; }
.rich-guard-hero { align-items:stretch; }
.rich-guard-hero .rich-brand { flex:1; }
.rich-stop { display:flex; flex:0 0 78px; flex-direction:column; align-items:center; justify-content:center; gap:5px; color:var(--accent-ink); font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.rich-warning { border-color:color-mix(in srgb, var(--accent) 45%, ${LINE}); background:var(--tint); color:var(--accent-ink); font-size:12px; }
.rich-night-top { align-items:center; min-height:168px; }
.rich-night-top > div:nth-child(2) { display:flex; min-width:0; flex:1; flex-direction:column; gap:5px; }
.rich-night-top strong { color:${INK}; font-size:18px; line-height:1.2; }
.rich-muted { color:${MUTED}; font-size:12px; }
.rich-moon { display:grid; flex:0 0 112px; place-items:center; width:112px; height:112px; overflow:hidden; border-radius:50%; background:var(--tint); }
.rich-moon .moon { width:112px; height:112px; }
.rich-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:18px; padding-top:16px; border-top:1px solid ${LINE}; color:${MUTED}; font-size:11px; }
.rich-footer-note { display:flex; min-width:0; align-items:center; gap:7px; line-height:1.25; }
.rich-footer-meta { white-space:nowrap; font-weight:700; letter-spacing:.04em; }
</style>
</head>
<body>
<div class="frame">
  <div class="copy">
    <div class="brandline"><span class="tiny-mark"><img src="${OMENTIR}" alt="" /></span><span>Omentir</span></div>
    <div class="kicker">${esc(job.kicker)}</div>
    <h1>${esc(job.title)}</h1>
    <p class="lede">${esc(job.summary)}</p>
    <div class="rule"></div>
    <div class="chip-grid">${chips}</div>
    <div class="copy-foot"><i></i><span>Research</span><i></i><span>Draft</span><i></i><span>Review</span><i></i><span>Send</span></div>
  </div>
  <div class="art">${richArt(job)}</div>
</div>
</body>
</html>`;
}

function render(job: RichJob) {
  console.log("composing", job.out);
  const slug = job.out.replace(/\//g, "__").replace(/\.avif$/, "");
  const htmlPath = join(TMP, `${slug}.html`);
  const tmpPng = join(TMP, `${slug}.png`);
  writeFileSync(htmlPath, richHtmlFor(job));
  const result = spawnSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${join(TMP, "chrome-profile")}`,
      "--force-device-scale-factor=1",
      `--window-size=${WIDTH},${HEIGHT}`,
      `--screenshot=${tmpPng}`,
      "--virtual-time-budget=4000",
      `file://${htmlPath}`,
    ],
    { encoding: "utf8", timeout: 20000 }
  );
  if (result.status !== 0) {
    throw new Error(
      `Chrome failed for ${job.out} (status ${result.status}): ${result.stderr || result.stdout || result.error}`
    );
  }
  if (!existsSync(tmpPng)) {
    throw new Error(`Chrome wrote no screenshot for ${job.out}`);
  }
  const avifPath = join(PUBLIC, job.out);
  mkdirSync(dirname(avifPath), { recursive: true });
  const avif = spawnSync("sips", ["-s", "format", "avif", tmpPng, "--out", avifPath], {
    encoding: "utf8",
  });
  if (avif.status !== 0) {
    throw new Error(`sips avif failed for ${avifPath}\n${avif.stderr}`);
  }
  const pngPath = avifPath.replace(/\.avif$/, ".png");
  if (existsSync(pngPath)) unlinkSync(pngPath);
  console.log("wrote", job.out);
}

const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7);
const selected = only ? richJobs.filter((job) => job.out.includes(only)) : richJobs;
if (only && selected.length === 0) {
  throw new Error(`No banner matched --only=${only}`);
}

mkdirSync(TMP, { recursive: true });
for (const job of selected) render(job);
if (!only) rmSync(TMP, { recursive: true, force: true });
console.log(`composed ${selected.length} editorial banners`);
