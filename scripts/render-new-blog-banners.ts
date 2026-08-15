/**
 * Render light-mode, 2D flat minimal blog banner covers with exact typography and vector illustrations.
 * Usage: bun scripts/render-new-blog-banners.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const font = `file://${join(process.cwd(), "src/app/fonts/google-sans-latin.woff2")}`;
const tmp = join(process.cwd(), "scripts/blog-topic-images/.tmp");

mkdirSync(tmp, { recursive: true });

const base = `
  @font-face {
    font-family: GS;
    src: url("${font}") format("woff2");
    font-weight: 400 700;
    font-display: block;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: GS, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    background: #f6f4ef;
    color: #1a1a1a;
  }
`;

function page(width: number, height: number, css: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${base}
    html, body, .frame { width: ${width}px; height: ${height}px; overflow: hidden; }
    ${css}
  </style></head><body><div class="frame">${body}</div></body></html>`;
}

const jobs = [
  {
    out: "public/blogs/skills-for-ai-agents/cover.jpg",
    width: 1600,
    height: 800,
    html: page(
      1600,
      800,
      `
      .frame {
        background: #f6f4ef;
        padding: 64px 72px;
        display: flex;
        align-items: center;
        gap: 60px;
      }
      .left {
        flex: 1.1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .badge-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }
      .kicker {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #1a1a1a;
        background: #e8e4dc;
        padding: 6px 14px;
        border-radius: 6px;
        border: 1px solid #dcd7cd;
      }
      h1 {
        font-size: 54px;
        line-height: 1.08;
        font-weight: 700;
        letter-spacing: -0.03em;
        color: #111111;
        margin-bottom: 20px;
      }
      .rule {
        width: 48px;
        height: 4px;
        background: #111111;
        margin-bottom: 20px;
      }
      .sub {
        font-size: 20px;
        line-height: 1.5;
        color: #4a4a4a;
        margin-bottom: 28px;
        max-width: 580px;
      }
      .pill-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #ffffff;
        border: 1px solid #dcd7cd;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 14px;
        font-weight: 600;
        color: #222222;
      }
      .pill svg {
        width: 16px;
        height: 16px;
        fill: #111111;
      }

      /* Right Side Diagram Card */
      .right {
        flex: 1;
        background: #ffffff;
        border: 1.5px solid #dcd7cd;
        border-radius: 20px;
        padding: 32px 28px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .diagram-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eae6de;
        padding-bottom: 14px;
      }
      .diagram-title {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #666666;
      }
      .diagram-hub {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #f6f4ef;
        border: 1px solid #dcd7cd;
        border-radius: 12px;
        padding: 12px 16px;
      }
      .hub-avatar {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: #111111;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 16px;
      }
      .hub-info h4 {
        font-size: 15px;
        font-weight: 700;
        color: #111111;
      }
      .hub-info p {
        font-size: 12px;
        color: #666666;
      }
      .skills-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .skill-item {
        background: #faf9f6;
        border: 1px solid #e5e0d7;
        border-radius: 10px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .skill-tag {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: #2b5c8f;
      }
      .skill-name {
        font-size: 14px;
        font-weight: 700;
        color: #111111;
      }
      .skill-desc {
        font-size: 12px;
        color: #666666;
        line-height: 1.35;
      }
      .diagram-footer {
        margin-top: 4px;
        padding-top: 12px;
        border-top: 1px solid #eae6de;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: #555555;
      }
      .source-badge {
        background: #eef4fb;
        color: #1a4f8b;
        border: 1px solid #c9def5;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
      }
      `,
      `
      <div class="left">
        <div class="badge-row">
          <span class="kicker">Guides · AI Architecture</span>
        </div>
        <h1>Skills for AI Agents</h1>
        <div class="rule"></div>
        <p class="sub">
          Modular capability packages, tool schemas, and MCP protocols that transform language models into autonomous operators.
        </p>
        <div class="pill-container">
          <div class="pill">
            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            ReAct Reasoning Loop
          </div>
          <div class="pill">
            <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            Zod & JSON Schemas
          </div>
          <div class="pill">
            <svg viewBox="0 0 24 24"><path d="M4 6h16v12H4z M12 2v4 M12 18v4"/></svg>
            Model Context Protocol
          </div>
        </div>
      </div>

      <div class="right">
        <div class="diagram-header">
          <span class="diagram-title">Agent Skill Registry Architecture</span>
          <span class="source-badge">Agentic Kit Ready</span>
        </div>

        <div class="diagram-hub">
          <div class="hub-avatar">AI</div>
          <div class="hub-info">
            <h4>Autonomous Agent Core</h4>
            <p>Reasoning loop + Dynamic skill execution runtime</p>
          </div>
        </div>

        <div class="skills-list">
          <div class="skill-item">
            <span class="skill-tag">Prospecting</span>
            <div class="skill-name">Lead Enrichment</div>
            <div class="skill-desc">Scrapes domains, identifies VPs, verifies emails.</div>
          </div>
          <div class="skill-item">
            <span class="skill-tag">Outbound</span>
            <div class="skill-name">Sales Outreach</div>
            <div class="skill-desc">Generates contextual notes, books meetings.</div>
          </div>
          <div class="skill-item">
            <span class="skill-tag">Engineering</span>
            <div class="skill-name">Code Maintenance</div>
            <div class="skill-desc">AST parsing, unit test creation, lint fixes.</div>
          </div>
          <div class="skill-item">
            <span class="skill-tag">Research</span>
            <div class="skill-name">Deep Extraction</div>
            <div class="skill-desc">Crawls multiple pages, builds JSON tables.</div>
          </div>
        </div>

        <div class="diagram-footer">
          <span>Standardized JSON-RPC & Function Calling</span>
          <span style="font-weight:600; color:#111111;">agentickit.co</span>
        </div>
      </div>
      `
    ),
  },
  {
    out: "public/blogs/reddit-marketing-tools-for-saas/cover.jpg",
    width: 1600,
    height: 800,
    html: page(
      1600,
      800,
      `
      .frame {
        background: #f6f4ef;
        padding: 64px 72px;
        display: flex;
        align-items: center;
        gap: 60px;
      }
      .left {
        flex: 1.1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .badge-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }
      .kicker {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #1a1a1a;
        background: #e8e4dc;
        padding: 6px 14px;
        border-radius: 6px;
        border: 1px solid #dcd7cd;
      }
      h1 {
        font-size: 52px;
        line-height: 1.08;
        font-weight: 700;
        letter-spacing: -0.03em;
        color: #111111;
        margin-bottom: 20px;
      }
      .rule {
        width: 48px;
        height: 4px;
        background: #d9480f;
        margin-bottom: 20px;
      }
      .sub {
        font-size: 20px;
        line-height: 1.5;
        color: #4a4a4a;
        margin-bottom: 28px;
        max-width: 580px;
      }
      .pill-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #ffffff;
        border: 1px solid #dcd7cd;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 14px;
        font-weight: 600;
        color: #222222;
      }
      .pill svg {
        width: 16px;
        height: 16px;
        fill: #d9480f;
      }

      /* Right Side Thread & Tool Card */
      .right {
        flex: 1;
        background: #ffffff;
        border: 1.5px solid #dcd7cd;
        border-radius: 20px;
        padding: 28px 28px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .thread-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        color: #666666;
        border-bottom: 1px solid #eae6de;
        padding-bottom: 12px;
      }
      .subreddit-badge {
        background: #ffe8cc;
        color: #d9480f;
        border: 1px solid #ffd8a8;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 12px;
      }
      .thread-post {
        background: #fbf9f5;
        border: 1px solid #e5e0d7;
        border-radius: 12px;
        padding: 16px 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .thread-title {
        font-size: 16px;
        font-weight: 700;
        color: #111111;
        line-height: 1.35;
      }
      .thread-intent {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #ebfbee;
        border: 1px solid #d3f9d8;
        color: #2b8a3e;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        align-self: flex-start;
      }
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      .tool-badge {
        background: #f6f4ef;
        border: 1px solid #dcd7cd;
        border-radius: 8px;
        padding: 10px 8px;
        text-align: center;
      }
      .tool-name {
        font-size: 13px;
        font-weight: 700;
        color: #111111;
      }
      .tool-role {
        font-size: 11px;
        color: #777777;
        margin-top: 2px;
      }
      .featured-tool {
        background: #fff4e6;
        border-color: #ffd8a8;
      }
      .featured-tool .tool-name {
        color: #d9480f;
      }
      .playbook-callout {
        background: #f6f4ef;
        border-left: 3px solid #111111;
        padding: 10px 14px;
        border-radius: 0 8px 8px 0;
        font-size: 12px;
        color: #444444;
        line-height: 1.4;
      }
      .playbook-callout strong {
        color: #111111;
      }
      `,
      `
      <div class="left">
        <div class="badge-row">
          <span class="kicker">Growth Playbook · SaaS Marketing</span>
        </div>
        <h1>Reddit Marketing Tools for SaaS</h1>
        <div class="rule"></div>
        <p class="sub">
          How to track high-intent buyer discussions, reply with value-first advice, and acquire customers without getting banned.
        </p>
        <div class="pill-container">
          <div class="pill">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            Intent Listening Alerts
          </div>
          <div class="pill">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            80/20 Value Framework
          </div>
          <div class="pill">
            <svg viewBox="0 0 24 24"><path d="M16 11V3H8v6H2v12h20V11h-6zm-6-6h4v14h-4V5zm-6 8h4v6H4v-6zm16 6h-4v-6h4v6z"/></svg>
            6-Tool Comparison Matrix
          </div>
        </div>
      </div>

      <div class="right">
        <div class="thread-meta">
          <span class="subreddit-badge">r/SaaS · Active Thread</span>
          <span>Alert latency: &lt; 3 mins</span>
        </div>

        <div class="thread-post">
          <span class="thread-intent">● High Buyer Intent Trigger</span>
          <div class="thread-title">&ldquo;What cold outreach software works best in 2026? Looking for alternatives to traditional email sequencers.&rdquo;</div>
        </div>

        <div class="tools-grid">
          <div class="tool-badge featured-tool">
            <div class="tool-name">Sneaky Guy</div>
            <div class="tool-role">Reddit AI Alerts</div>
          </div>
          <div class="tool-badge">
            <div class="tool-name">Syften</div>
            <div class="tool-role">Multi-Community</div>
          </div>
          <div class="tool-badge">
            <div class="tool-name">Buska</div>
            <div class="tool-role">Brand Listening</div>
          </div>
          <div class="tool-badge">
            <div class="tool-name">ReplyHunter</div>
            <div class="tool-role">Comment Flow</div>
          </div>
          <div class="tool-badge">
            <div class="tool-name">Howitzer</div>
            <div class="tool-role">Targeted DMs</div>
          </div>
          <div class="tool-badge">
            <div class="tool-name">GigaBrain</div>
            <div class="tool-role">Discussion Search</div>
          </div>
        </div>

        <div class="playbook-callout">
          <strong>The Conversion Rule:</strong> 80% actionable solution breakdown + 20% transparent founder tool disclosure.
        </div>
      </div>
      `
    ),
  },
];

function render(job: (typeof jobs)[number]) {
  const htmlPath = join(tmp, `${job.out.split("/").slice(-2).join("-")}.html`);
  writeFileSync(htmlPath, job.html);
  const shot = join(tmp, "shot.png");
  const result = spawnSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      `--window-size=${job.width},${job.height}`,
      `--screenshot=${shot}`,
      `file://${htmlPath}`,
    ],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(`Chrome failed for ${job.out}\n${result.stderr}\n${result.stdout}`);
  }
  const outPath = join(process.cwd(), job.out);
  mkdirSync(join(outPath, ".."), { recursive: true });
  const convert = spawnSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "92", shot, "--out", outPath], {
    encoding: "utf8",
  });
  if (convert.status !== 0) {
    throw new Error(`sips failed for ${job.out}\n${convert.stderr}`);
  }
  const avifPath = outPath.replace(/\.jpg$/, ".avif");
  const convertAvif = spawnSync("sips", ["-s", "format", "avif", shot, "--out", avifPath], {
    encoding: "utf8",
  });
  if (convertAvif.status !== 0) {
    throw new Error(`sips avif failed for ${avifPath}\n${convertAvif.stderr}`);
  }
  console.log("Rendered minimal light-mode banner:", job.out, "and", avifPath);
}

for (const job of jobs) {
  render(job);
}
