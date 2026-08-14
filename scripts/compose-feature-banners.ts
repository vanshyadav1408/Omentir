/**
 * Compose feature hero banners as flat, text-forward posters.
 * Exact copy is rendered in HTML, then Chrome rasterizes to PNG.
 *
 * Usage: bun scripts/compose-feature-banners.ts
 * Optional: bun scripts/compose-feature-banners.ts --only=campaigns-and-send-windows
 */
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const WIDTH = 1600;
const HEIGHT = 600;
const OUT_DIR = join(process.cwd(), "public", "seo", "features");
const TMP_DIR = join(process.cwd(), ".tmp-feature-banners");
const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FONT = join(
  process.cwd(),
  "src/app/fonts/google-sans-latin.woff2"
);

type Banner = {
  slug: string;
  title: string;
  lede: string;
  facts: [string, string, string];
  steps: [string, string, string, string];
};

const BANNERS: Banner[] = [
  {
    slug: "steal-customers",
    title: "Steal Customers",
    lede:
      "Find buyers already commenting on competitor posts. Keep the post and comment so outreach can name a real signal.",
    facts: [
      "Competitor post commenters become leads",
      "Post and comment context travels with each lead",
      "Same daily safety limits as other agents",
    ],
    steps: [
      "Add competitor company or employee pages",
      "Scan public posts and comments",
      "Score commenters into a lead group",
      "Draft outreach that cites the real post",
    ],
  },
  {
    slug: "ai-linkedin-outreach",
    title: "AI LinkedIn outreach",
    lede:
      "Connection requests, messages, and follow-ups send from your own profile. Campaigns stop when someone replies.",
    facts: [
      "Sends from your LinkedIn account",
      "Follow-ups run until a reply",
      "Daily invite and message limits stay on",
    ],
    steps: [
      "Pick a lead group and one promise",
      "Review the first drafts",
      "Send inside local-time windows",
      "Collect replies in the inbox",
    ],
  },
  {
    slug: "lead-finders",
    title: "Lead finders",
    lede:
      "Write the buyer in plain language, then turn titles, industries, locations, and keywords into an ongoing LinkedIn list.",
    facts: [
      "ICP titles and industries",
      "Ongoing discovery, not a one-time export",
      "Campaign-ready groups",
    ],
    steps: [
      "Describe who feels the pain",
      "Set titles, industries, and locations",
      "Review the first fifty leads",
      "Tighten filters, then let it run",
    ],
  },
  {
    slug: "unified-inbox",
    title: "Unified inbox",
    lede:
      "Every campaign reply lands in one place. Sort by intent and answer the last thing the buyer said.",
    facts: [
      "Replies sit next to the campaign",
      "Intent before volume",
      "Drafts you can approve before send",
    ],
    steps: [
      "Replies arrive from live campaigns",
      "Sort interested, later, and not a fit",
      "Read the thread before you answer",
      "Keep booked deals in your CRM",
    ],
  },
  {
    slug: "agent-api-and-mcp",
    title: "Agent API and MCP",
    lede:
      "Chat apps and coding agents operate the workspace. LinkedIn credentials stay inside Omentir.",
    facts: [
      "MCP for Claude, ChatGPT, and Grok",
      "REST and keys for Cursor and scripts",
      "Workspace safety limits stay on",
    ],
    steps: [
      "Connect a chat app or create a key",
      "Read context and stats first",
      "List agents before create",
      "Approve targeting before anything sends",
    ],
  },
  {
    slug: "my-product",
    title: "My Product",
    lede:
      "One offer profile grounds every finder, Steal Customers agent, and outreach draft. Prospects never see this page. Your agents do.",
    facts: [
      "Grounds every draft",
      "Required before agents help",
      "One place to update the offer",
    ],
    steps: [
      "Write who it is for",
      "Name the result they get",
      "Say what you do not do",
      "Update it when the product changes",
    ],
  },
  {
    slug: "campaigns-and-send-windows",
    title: "Campaigns and send windows",
    lede:
      "One lead group, one promise, and a send window that matches when those buyers are awake. Daily caps keep a mistake small.",
    facts: [
      "Local-time send windows",
      "Daily invite and message caps",
      "One campaign, one promise",
    ],
    steps: [
      "Choose the group and the offer",
      "Set the local-time window",
      "Cap invites below the maximum",
      "Stop on reply, book, or a hard count",
    ],
  },
  {
    slug: "linkedin-account-safety",
    title: "LinkedIn account safety",
    lede:
      "Human pacing, ramp-ups for new profiles, and workspace-level caps. Safety features protect volume. They do not replace judgment.",
    facts: [
      "Human pacing on every send",
      "Ramp-ups for new or restricted profiles",
      "Workspace-level daily caps",
    ],
    steps: [
      "Warm the profile with real use",
      "Start below the default cap",
      "Raise limits after a clean week",
      "Keep the account yours to use",
    ],
  },
  {
    slug: "lead-groups-and-scoring",
    title: "Lead groups and scoring",
    lede:
      "Keep each motion in its own group. Use scores as a review order, not as a send trigger.",
    facts: [
      "Groups per motion",
      "Scores you can explain",
      "Review before send",
    ],
    steps: [
      "Name the group after the buyer",
      "Keep one ICP or one source set",
      "Score as a review order",
      "Prune the pile you will not message",
    ],
  },
  {
    slug: "open-source-self-hosting",
    title: "Open source and self-hosting",
    lede:
      "The public repository is the same application. Hosted Omentir is faster to test. Self-host when you already need the code on your machines.",
    facts: [
      "MIT licensed app",
      "Docker-based setup",
      "You bring the providers",
    ],
    steps: [
      "Read the public repository",
      "Use hosted to test the offer",
      "Self-host with Docker when ready",
      "Keep your own name and logo on forks",
    ],
  },
];

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

function htmlStealCustomers(banner: Banner) {
  const chips = banner.facts
    .map((fact) => `<span class="chip">${fact}</span>`)
    .join("");
  const steps = banner.steps
    .map(
      (step, index) => `
        <div class="step">
          <span class="num">${index + 1}</span>
          <span>${step}</span>
        </div>`
    )
    .join("");

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
    html, body {
      margin: 0;
      padding: 0;
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      overflow: hidden;
      background: #f4f2ec;
      color: #161616;
      font-family: OmentirSans, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .frame {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 18px;
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      padding: 28px 40px 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    h1 {
      margin: 12px 0 8px;
      font-size: 46px;
      line-height: 1.05;
      letter-spacing: -0.03em;
      font-weight: 700;
    }
    .lede {
      margin: 0;
      max-width: 34em;
      font-size: 20px;
      line-height: 1.4;
      color: #3f3c36;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
    }
    .chip {
      padding: 8px 14px;
      border: 1px solid #d8d4cb;
      border-radius: 999px;
      background: #fffdf8;
      font-size: 15px;
      line-height: 1.2;
      color: #2a2722;
    }
    .boards {
      display: grid;
      grid-template-columns: 1.15fr 1.05fr 1fr;
      gap: 16px;
      flex: 1;
      min-height: 0;
    }
    .board {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 20px 22px 18px;
      border: 1px solid #d8d4cb;
      border-radius: 20px;
      background: #fffdf8;
    }
    .board h2 {
      margin: 0 0 14px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #6b665c;
    }
    .step {
      display: grid;
      grid-template-columns: 32px 1fr;
      align-items: start;
      gap: 12px;
      padding: 10px 0;
      border-top: 1px solid #e6e1d6;
      font-size: 18px;
      line-height: 1.3;
    }
    .step:first-of-type { border-top: 0; padding-top: 0; }
    .num {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      border: 1px solid #161616;
      font-size: 14px;
      font-weight: 700;
    }
    .path {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .node {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border: 1px solid #e6e1d6;
      border-radius: 12px;
      background: #f4f2ec;
      font-size: 16px;
      line-height: 1.25;
    }
    .node b {
      flex-shrink: 0;
      width: 22px;
      font-weight: 700;
    }
    .arrow {
      padding: 0 0 0 18px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6b665c;
    }
    .ctx {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .ctx-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-top: 1px solid #e6e1d6;
      font-size: 16px;
      line-height: 1.3;
    }
    .ctx-row:first-of-type { border-top: 0; padding-top: 0; }
    .ctx-row b { font-weight: 700; }
    .ctx-row span { color: #3f3c36; text-align: right; }
    .note {
      margin-top: auto;
      padding-top: 12px;
      font-size: 14px;
      line-height: 1.35;
      color: #6b665c;
    }
  </style>
</head>
<body>
  <div class="frame">
    <div>
      <div class="brand">${LOGO}<span>Omentir</span></div>
      <h1>${banner.title}</h1>
      <p class="lede">${banner.lede}</p>
      <div class="chips">${chips}</div>
    </div>
    <div class="boards">
      <aside class="board">
        <h2>How it works</h2>
        ${steps}
      </aside>
      <aside class="board">
        <h2>Signal path</h2>
        <div class="path">
          <div class="node"><b>1</b>Competitor company page</div>
          <div class="arrow">then</div>
          <div class="node"><b>2</b>Employee and founder posts</div>
          <div class="arrow">then</div>
          <div class="node"><b>3</b>Comments from the last 7 days</div>
          <div class="arrow">then</div>
          <div class="node"><b>4</b>Commenters scored as leads</div>
        </div>
        <p class="note">Employees are sources. The leads are the people commenting.</p>
      </aside>
      <aside class="board">
        <h2>What the lead carries</h2>
        <div class="ctx">
          <div class="ctx-row"><b>Post</b><span>full post text</span></div>
          <div class="ctx-row"><b>Post URL</b><span>the thread they joined</span></div>
          <div class="ctx-row"><b>Comment</b><span>what they actually said</span></div>
          <div class="ctx-row"><b>Score</b><span>fit against My Product</span></div>
        </div>
        <p class="note">Outreach can cite the real post. Same send windows and daily limits as other agents.</p>
      </aside>
    </div>
  </div>
</body>
</html>`;
}

function htmlCampaigns(banner: Banner) {
  const chips = banner.facts
    .map((fact) => `<span class="chip">${fact}</span>`)
    .join("");
  const steps = banner.steps
    .map(
      (step, index) => `
        <div class="step">
          <span class="num">${index + 1}</span>
          <span>${step}</span>
        </div>`
    )
    .join("");

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
    html, body {
      margin: 0;
      padding: 0;
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      overflow: hidden;
      background: #f4f2ec;
      color: #161616;
      font-family: OmentirSans, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .frame {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 22px;
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      padding: 32px 40px 28px;
    }
    .top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 36px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    h1 {
      margin: 14px 0 10px;
      font-size: 46px;
      line-height: 1.05;
      letter-spacing: -0.03em;
      font-weight: 700;
    }
    .lede {
      margin: 0;
      max-width: 34em;
      font-size: 20px;
      line-height: 1.4;
      color: #3f3c36;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
    }
    .chip {
      padding: 8px 14px;
      border: 1px solid #d8d4cb;
      border-radius: 999px;
      background: #fffdf8;
      font-size: 15px;
      line-height: 1.2;
      color: #2a2722;
    }
    .boards {
      display: grid;
      grid-template-columns: 1.15fr 1.15fr 0.9fr;
      gap: 16px;
      flex: 1;
      min-height: 0;
    }
    .board {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 20px 22px 18px;
      border: 1px solid #d8d4cb;
      border-radius: 20px;
      background: #fffdf8;
    }
    .board h2 {
      margin: 0 0 14px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #6b665c;
    }
    .step {
      display: grid;
      grid-template-columns: 32px 1fr;
      align-items: start;
      gap: 12px;
      padding: 10px 0;
      border-top: 1px solid #e6e1d6;
      font-size: 18px;
      line-height: 1.3;
    }
    .step:first-of-type { border-top: 0; padding-top: 0; }
    .num {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      border: 1px solid #161616;
      font-size: 14px;
      font-weight: 700;
    }
    .window-scale {
      display: grid;
      grid-template-columns: 56px 1fr 56px;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      font-size: 13px;
      font-weight: 600;
      color: #6b665c;
    }
    .bar {
      position: relative;
      height: 18px;
      border-radius: 999px;
      background: #ece8df;
    }
    .bar span {
      position: absolute;
      left: 22%;
      right: 18%;
      top: 0;
      bottom: 0;
      border-radius: 999px;
      background: #161616;
    }
    .zones {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .zone {
      display: grid;
      grid-template-columns: 92px 1fr 72px;
      align-items: center;
      gap: 10px;
      font-size: 16px;
    }
    .zone b { font-weight: 700; }
    .zone .track {
      height: 10px;
      border-radius: 999px;
      background: #ece8df;
      position: relative;
    }
    .zone .track i {
      position: absolute;
      top: 0;
      bottom: 0;
      border-radius: 999px;
      background: #161616;
    }
    .zone .hours { color: #3f3c36; font-size: 14px; }
    .cap {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .cap-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .cap-row .label {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
    }
    .cap-row .label b { font-weight: 700; }
    .cap-row .label span { color: #6b665c; font-size: 14px; }
    .meter {
      height: 10px;
      border-radius: 999px;
      background: #ece8df;
      overflow: hidden;
    }
    .meter i {
      display: block;
      height: 100%;
      background: #161616;
    }
    .modes {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 14px;
    }
    .mode {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 15px;
      line-height: 1.3;
    }
    .mode b { font-weight: 700; }
    .mode span { color: #3f3c36; }
    .note {
      margin-top: auto;
      padding-top: 12px;
      font-size: 14px;
      line-height: 1.35;
      color: #6b665c;
    }
  </style>
</head>
<body>
  <div class="frame">
    <div class="top">
      <div>
        <div class="brand">${LOGO}<span>Omentir</span></div>
        <h1>${banner.title}</h1>
        <p class="lede">${banner.lede}</p>
        <div class="chips">${chips}</div>
      </div>
    </div>
    <div class="boards">
      <aside class="board">
        <h2>How it works</h2>
        ${steps}
      </aside>
      <aside class="board">
        <h2>Send window</h2>
        <div class="window-scale">
          <span>09:00</span>
          <div class="bar"><span></span></div>
          <span>18:00</span>
        </div>
        <div class="zones">
          <div class="zone">
            <b>New York</b>
            <div class="track"><i style="left:22%;right:18%"></i></div>
            <span class="hours">local 9-6</span>
          </div>
          <div class="zone">
            <b>London</b>
            <div class="track"><i style="left:22%;right:18%"></i></div>
            <span class="hours">local 9-6</span>
          </div>
          <div class="zone">
            <b>Sydney</b>
            <div class="track"><i style="left:22%;right:18%"></i></div>
            <span class="hours">local 9-6</span>
          </div>
        </div>
        <div class="modes">
          <div class="mode"><b>Business</b><span>Mon-Fri 09:00-18:00</span></div>
          <div class="mode"><b>Extended</b><span>Daily 07:00-22:00</span></div>
          <div class="mode"><b>Always</b><span>24/7 if you choose it</span></div>
        </div>
        <p class="note">Hours are measured in each lead's own time zone, not the workspace clock.</p>
      </aside>
      <aside class="board">
        <h2>Daily cap</h2>
        <div class="cap">
          <div class="cap-row">
            <div class="label"><b>Invites</b><span>12 / 25</span></div>
            <div class="meter"><i style="width:48%"></i></div>
          </div>
          <div class="cap-row">
            <div class="label"><b>Messages</b><span>8 / 40</span></div>
            <div class="meter"><i style="width:20%"></i></div>
          </div>
          <div class="cap-row">
            <div class="label"><b>Next slot</b><span>5 min apart</span></div>
            <div class="meter"><i style="width:12%"></i></div>
          </div>
        </div>
        <p class="note">Workspace caps reset at local midnight. A pause keeps the leads.</p>
      </aside>
    </div>
  </div>
</body>
</html>`;
}

function html(banner: Banner) {
  if (banner.slug === "steal-customers") {
    return htmlStealCustomers(banner);
  }
  if (banner.slug === "campaigns-and-send-windows") {
    return htmlCampaigns(banner);
  }
  const facts = banner.facts
    .map((fact) => `<li><span class="dot"></span><span>${fact}</span></li>`)
    .join("");
  const steps = banner.steps
    .map(
      (step, index) => `
        <div class="step">
          <span class="num">${index + 1}</span>
          <span>${step}</span>
        </div>`
    )
    .join("");

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
    html, body {
      margin: 0;
      padding: 0;
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      overflow: hidden;
      background: #f4f2ec;
      color: #161616;
      font-family: OmentirSans, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .frame {
      box-sizing: border-box;
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      align-items: center;
      gap: 48px;
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      padding: 40px 52px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    h1 {
      margin: 28px 0 16px;
      font-size: 58px;
      line-height: 1.05;
      letter-spacing: -0.03em;
      font-weight: 700;
    }
    .lede {
      margin: 0;
      max-width: 22em;
      font-size: 22px;
      line-height: 1.45;
      color: #3f3c36;
    }
    ul {
      margin: 32px 0 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
      gap: 12px;
      margin: 12px 0;
      font-size: 20px;
      line-height: 1.35;
      color: #2a2722;
    }
    .dot {
      width: 7px;
      height: 7px;
      margin-top: 9px;
      border-radius: 50%;
      background: #161616;
      flex-shrink: 0;
    }
    .panel {
      box-sizing: border-box;
      width: 100%;
      padding: 36px 36px 28px;
      border: 1px solid #d8d4cb;
      border-radius: 24px;
      background: #fffdf8;
    }
    .panel h2 {
      margin: 0 0 20px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #6b665c;
    }
    .step {
      display: grid;
      grid-template-columns: 36px 1fr;
      align-items: start;
      gap: 14px;
      padding: 14px 0;
      border-top: 1px solid #e6e1d6;
      font-size: 20px;
      line-height: 1.35;
    }
    .step:first-of-type { border-top: 0; padding-top: 0; }
    .num {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 999px;
      border: 1px solid #161616;
      font-size: 15px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="frame">
    <div>
      <div class="brand">${LOGO}<span>Omentir</span></div>
      <h1>${banner.title}</h1>
      <p class="lede">${banner.lede}</p>
      <ul>${facts}</ul>
    </div>
    <aside class="panel">
      <h2>How it works</h2>
      ${steps}
    </aside>
  </div>
</body>
</html>`;
}

function render(banner: Banner) {
  const htmlPath = join(TMP_DIR, `${banner.slug}.html`);
  const tmpPng = join(TMP_DIR, `${banner.slug}.png`);
  writeFileSync(htmlPath, html(banner));

  const result = spawnSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${WIDTH},${HEIGHT}`,
      `--screenshot=${tmpPng}`,
      "--virtual-time-budget=4000",
      `file://${htmlPath}`,
    ],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(
      `Chrome failed for ${banner.slug}: ${result.stderr || result.stdout}`
    );
  }

  const article = join(OUT_DIR, `${banner.slug}-article.png`);
  const og = join(OUT_DIR, `${banner.slug}.png`);
  spawnSync("cp", [tmpPng, article]);
  spawnSync("cp", [tmpPng, og]);
  console.log("wrote", banner.slug);
}

const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7);
const banners = only
  ? BANNERS.filter((banner) => banner.slug === only)
  : BANNERS;
if (only && banners.length === 0) {
  throw new Error(`No feature banner for ${only}`);
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });
for (const banner of banners) {
  render(banner);
}
rmSync(TMP_DIR, { recursive: true, force: true });
