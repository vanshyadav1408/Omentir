/**
 * Render topic-specific blog graphics with Chrome so labels and copy stay exact.
 * Usage: bun scripts/blog-topic-images/render.ts
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
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: GS, "Helvetica Neue", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
`;

function page(width: number, height: number, css: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${base}
    html, body, .frame { width: ${width}px; height: ${height}px; overflow: hidden; }
    ${css}
  </style></head><body><div class="frame">${body}</div></body></html>`;
}

const jobs: Array<{ out: string; width: number; height: number; html: string }> = [
  {
    out: "public/blogs/how-to-write-a-linkedin-connection-request-that-gets-accepted/cover.jpg",
    width: 1600,
    height: 800,
    html: page(
      1600,
      800,
      `
      .frame { display: flex; align-items: center; gap: 72px; padding: 72px 80px; background: #0e0e0e; color: #f4f2ec; }
      .left { flex: 1; min-width: 0; }
      .kicker { font-size: 14px; letter-spacing: 0.16em; text-transform: uppercase; color: #c9c4bb; }
      h1 { margin: 18px 0 18px; font-size: 62px; line-height: 1.04; font-weight: 600; letter-spacing: -0.03em; }
      .rule { width: 56px; height: 4px; background: #e8b4b8; margin: 0 0 20px; }
      .sub { margin: 0; font-size: 22px; line-height: 1.45; color: #c9c4bb; max-width: 540px; }
      .card { width: 520px; flex: 0 0 520px; background: #f4f2ec; color: #161616; border-radius: 22px; padding: 28px 28px 24px; }
      .who { display: flex; gap: 14px; align-items: center; margin-bottom: 18px; }
      .ava { width: 48px; height: 48px; border-radius: 50%; background: #1b3a4b; color: #f4f2ec; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; }
      .name { font-size: 18px; font-weight: 600; }
      .role { font-size: 14px; color: #5c574e; margin-top: 2px; }
      .label { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #6b665e; margin-bottom: 8px; }
      .note { font-size: 18px; line-height: 1.45; margin: 0 0 18px; }
      .bar { display: flex; justify-content: space-between; align-items: center; }
      .chars { font-size: 14px; color: #5c574e; }
      .btn { background: #161616; color: #f4f2ec; border-radius: 8px; padding: 10px 16px; font-size: 14px; font-weight: 600; }
      `,
      `
      <div class="left">
        <div class="kicker">LinkedIn connection note</div>
        <h1>200 characters.<br>One reason.</h1>
        <div class="rule"></div>
        <p class="sub">Free accounts get three personalized notes a month. Spend each one on a fact only that person would recognize.</p>
      </div>
      <div class="card">
        <div class="who">
          <div class="ava">MC</div>
          <div>
            <div class="name">Maya Chen</div>
            <div class="role">VP Sales · Northlane</div>
          </div>
        </div>
        <div class="label">Your invitation note</div>
        <p class="note">Hi Maya. Your post on demo no-shows was specific and useful. I work on the same problem. Thought I would connect here.</p>
        <div class="bar">
          <span class="chars">118 / 200 characters</span>
          <span class="btn">Send invitation</span>
        </div>
      </div>
      `
    ),
  },
  {
    out: "public/blogs/how-to-write-a-linkedin-connection-request-that-gets-accepted/cut-the-pitch.jpg",
    width: 1600,
    height: 720,
    html: page(
      1600,
      900,
      `
      .frame { background: #f4f2ec; padding: 48px 56px; }
      .title { font-size: 28px; font-weight: 600; margin: 0 0 8px; color: #161616; }
      .sub { margin: 0 0 24px; color: #5c574e; font-size: 18px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
      .card { background: #fff; border-radius: 20px; padding: 26px 28px 24px; border: 1px solid #d8d4cb; }
      .tag { display: inline-block; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; padding: 6px 10px; border-radius: 6px; margin-bottom: 16px; }
      .skip .tag { background: #f3d6d6; color: #7a1f1f; }
      .use .tag { background: #d7ead8; color: #1e5a28; }
      .who { font-size: 16px; font-weight: 600; color: #161616; }
      .role { font-size: 14px; color: #5c574e; margin: 4px 0 18px; }
      .note { font-size: 20px; line-height: 1.45; color: #161616; margin: 0 0 24px; }
      .meta { font-size: 14px; color: #5c574e; }
      .why { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e6e1d8; font-size: 16px; line-height: 1.45; color: #3a3732; }
      `,
      `
      <p class="title">Same person. Two connection notes.</p>
      <p class="sub">A connection request is not a compressed sales email.</p>
      <div class="grid">
        <div class="card skip">
          <div class="tag">Skip this</div>
          <div class="who">To Sarah Kim</div>
          <div class="role">Head of Outbound · Series B SaaS</div>
          <p class="note">Hi Sarah. We help B2B teams automate LinkedIn outreach and book more demos. Open to a 15 minute call this week?</p>
          <div class="meta">111 / 200 characters</div>
          <div class="why">This is a pitch. She has not agreed to a conversation yet. Policy treats promotional invitations to strangers as spam.</div>
        </div>
        <div class="card use">
          <div class="tag">Send this</div>
          <div class="who">To Sarah Kim</div>
          <div class="role">Head of Outbound · Series B SaaS</div>
          <p class="note">Hi Sarah. Noticed you just posted about rebuilding outbound after two SDRs left. I work with teams in that spot.</p>
          <div class="meta">112 / 200 characters</div>
          <div class="why">This names a fact from her world and stops. No calendar. No product. The meeting ask waits until after she accepts.</div>
        </div>
      </div>
      `
    ),
  },
  {
    out: "public/blogs/how-to-write-a-linkedin-connection-request-that-gets-accepted/after-they-accept.jpg",
    width: 1600,
    height: 760,
    html: page(
      1600,
      760,
      `
      .frame { background: #0e0e0e; padding: 48px 72px; color: #f4f2ec; display: flex; flex-direction: column; }
      .kicker { font-size: 14px; letter-spacing: 0.16em; text-transform: uppercase; color: #c9c4bb; }
      h2 { margin: 10px 0 8px; font-size: 36px; font-weight: 600; letter-spacing: -0.02em; }
      .sub { margin: 0 0 22px; color: #c9c4bb; font-size: 18px; }
      .thread { background: #171717; border-radius: 20px; padding: 24px 28px 28px; display: flex; flex-direction: column; gap: 16px; }
      .sys { text-align: center; font-size: 14px; color: #9a958c; padding: 8px 0 12px; }
      .msg { max-width: 780px; border-radius: 16px; padding: 16px 18px; font-size: 18px; line-height: 1.45; }
      .them { background: #243039; align-self: flex-start; }
      .you { background: #f4f2ec; color: #161616; align-self: flex-end; }
      .who { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; opacity: 0.7; }
      `,
      `
      <div class="kicker">After they accept</div>
      <h2>Continue the sentence. Do not start a pitch.</h2>
      <p class="sub">Maya accepted because of a post about demo no-shows. The first message stays on that post.</p>
      <div class="thread">
        <div class="sys">Maya Chen accepted your invitation · now you can message</div>
        <div class="msg you">
          <div class="who">You</div>
          Thanks for connecting. In that post you said inbound demos were showing up unprepared. Is that still the leak, or has outbound started to do the same thing?
        </div>
        <div class="msg them">
          <div class="who">Maya</div>
          Still inbound. We booked 19 last week and 6 never had a problem worth solving. Exhausting.
        </div>
      </div>
      `
    ),
  },
  {
    out: "public/blogs/how-to-warm-up-linkedin-account/cover.jpg",
    width: 1600,
    height: 800,
    html: page(
      1600,
      800,
      `
      .frame { background: #0e0e0e; color: #f4f2ec; padding: 64px 72px; display: flex; flex-direction: column; justify-content: center; }
      .top { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; gap: 40px; }
      .kicker { font-size: 14px; letter-spacing: 0.16em; text-transform: uppercase; color: #c9c4bb; }
      h1 { margin: 12px 0 0; font-size: 52px; line-height: 1.05; font-weight: 600; letter-spacing: -0.03em; }
      .sub { max-width: 420px; color: #c9c4bb; font-size: 18px; line-height: 1.4; margin: 0 0 8px; }
      .weeks { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
      .w { background: #171717; border-radius: 18px; padding: 22px 20px 20px; }
      .wn { font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: #e8b4b8; }
      .num { font-size: 32px; font-weight: 600; margin: 10px 0 8px; letter-spacing: -0.03em; }
      .who { font-size: 16px; line-height: 1.35; color: #f4f2ec; min-height: 44px; }
      .rest { margin-top: 16px; padding-top: 14px; border-top: 1px solid #2a2a2a; font-size: 14px; color: #9a958c; line-height: 1.35; }
      `,
      `
      <div class="top">
        <div>
          <div class="kicker">LinkedIn account warmup</div>
          <h1>Week 1 is not<br>for strangers.</h1>
        </div>
        <p class="sub">A conservative four-week plan. Daily numbers are ceilings, not targets. LinkedIn does not publish a safe daily quota.</p>
      </div>
      <div class="weeks">
        <div class="w"><div class="wn">Week 1</div><div class="num">0 to 5 / day</div><div class="who">People who already know you</div><div class="rest">Finish the profile. Comment for real. No sending tools.</div></div>
        <div class="w"><div class="wn">Week 2</div><div class="num">5 to 8 / day</div><div class="who">Warm names: met, commented, same group</div><div class="rest">Reply to every message yourself.</div></div>
        <div class="w"><div class="wn">Week 3</div><div class="num">8 to 12 / day</div><div class="who">One narrow segment, not a whole industry</div><div class="rest">One message family. Read every ignore.</div></div>
        <div class="w"><div class="wn">Week 4</div><div class="num">10 to 15 / day</div><div class="who">Same segment, only if week 3 stayed clean</div><div class="rest">Space sends through the day. Do not dump them at 9:01.</div></div>
      </div>
      `
    ),
  },
  {
    out: "public/blogs/how-to-warm-up-linkedin-account/wait-it-out.jpg",
    width: 1600,
    height: 720,
    html: page(
      1600,
      720,
      `
      .frame { background: #f4f2ec; padding: 64px 80px; display: flex; align-items: center; gap: 56px; }
      .notice { flex: 0 0 620px; background: #161616; color: #f4f2ec; border-radius: 22px; padding: 36px 36px 32px; }
      .badge { display: inline-block; background: #7a1f1f; color: #fff; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; padding: 6px 10px; border-radius: 6px; }
      h2 { margin: 18px 0 12px; font-size: 36px; line-height: 1.15; font-weight: 600; }
      .lede { color: #c9c4bb; font-size: 18px; line-height: 1.45; margin: 0 0 24px; }
      .row { display: flex; gap: 12px; padding: 12px 0; border-top: 1px solid #2c2c2c; font-size: 17px; line-height: 1.4; }
      .x { color: #e8b4b8; font-weight: 600; width: 22px; }
      .copy h3 { margin: 0 0 14px; font-size: 32px; line-height: 1.15; color: #161616; }
      .copy p { margin: 0 0 16px; font-size: 20px; line-height: 1.45; color: #3a3732; }
      `,
      `
      <div class="notice">
        <div class="badge">LinkedIn Help</div>
        <h2>Invitation limit reached</h2>
        <p class="lede">A temporary restriction typically lasts one week. This is what the help page says happens next.</p>
        <div class="row"><div class="x">×</div><div>You cannot send invitations until it lifts</div></div>
        <div class="row"><div class="x">×</div><div>Withdrawing pending invites does not lift it</div></div>
        <div class="row"><div class="x">×</div><div>You cannot buy more invitations while restricted</div></div>
        <div class="row"><div class="x">×</div><div>Support will not shorten the wait</div></div>
      </div>
      <div class="copy">
        <h3>If you are already locked, the work is to wait.</h3>
        <p>Do not test another browser. Do not empty 400 pending invites in one sitting. Restart below the volume that triggered the lock, not at the same number.</p>
        <p>A one-week cooldown costs less than another lock next month.</p>
      </div>
      `
    ),
  },
  {
    out: "public/blogs/linkedin-weekly-connection-limits/cover.jpg",
    width: 1600,
    height: 800,
    html: page(
      1600,
      800,
      `
      .frame { background: #0e0e0e; color: #f4f2ec; padding: 72px 80px; display: flex; flex-direction: column; }
      .kicker { font-size: 14px; letter-spacing: 0.16em; text-transform: uppercase; color: #c9c4bb; }
      h1 { margin: 12px 0 8px; font-size: 56px; line-height: 1.05; font-weight: 600; letter-spacing: -0.03em; }
      .sub { margin: 0 0 36px; color: #c9c4bb; font-size: 20px; max-width: 760px; }
      .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; flex: 1; }
      .col { border-radius: 18px; padding: 28px 28px 24px; }
      .rumor { background: #1c1714; }
      .pub { background: #171c18; }
      .hl { font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 10px; }
      .rumor .hl { color: #e8b4b8; }
      .pub .hl { color: #b7d4b8; }
      .big { font-size: 34px; font-weight: 600; margin: 0 0 16px; letter-spacing: -0.03em; }
      li { margin: 0 0 10px; font-size: 18px; line-height: 1.35; color: #d6d1c8; }
      ul { margin: 0; padding-left: 20px; }
      `,
      `
      <div class="kicker">Weekly connection limits</div>
      <h1>There is no official 100.</h1>
      <p class="sub">LinkedIn publishes that invitation limits exist. It does not publish a weekly quota. The 100-a-week figure is a cluster of operator rumors.</p>
      <div class="cols">
        <div class="col rumor">
          <div class="hl">What tool blogs repeat</div>
          <p class="big">“100 invites a week”</p>
          <ul>
            <li>Treated as a quota to hit</li>
            <li>Copied onto new accounts</li>
            <li>Used to justify extra profiles</li>
          </ul>
        </div>
        <div class="col pub">
          <div class="hl">What LinkedIn Help publishes</div>
          <p class="big">Limits exist. Wait one week.</p>
          <ul>
            <li>Basic and Premium are both limited</li>
            <li>Withdraw does not lift a restriction</li>
            <li>You cannot buy extra invites while locked</li>
          </ul>
        </div>
      </div>
      `
    ),
  },
  {
    out: "public/blogs/linkedin-weekly-connection-limits/pending.jpg",
    width: 1600,
    height: 720,
    html: page(
      1600,
      720,
      `
      .frame { background: #f4f2ec; padding: 48px 64px; }
      .head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
      h2 { margin: 0; font-size: 34px; color: #161616; }
      .count { font-size: 18px; color: #7a1f1f; font-weight: 600; }
      .list { background: #fff; border: 1px solid #d8d4cb; border-radius: 20px; overflow: hidden; }
      .row { display: grid; grid-template-columns: 56px 1fr 220px 180px; gap: 16px; align-items: center; padding: 18px 24px; border-top: 1px solid #ece8e0; }
      .row:first-child { border-top: 0; background: #faf8f4; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #6b665e; }
      .ava { width: 40px; height: 40px; border-radius: 50%; background: #243039; color: #f4f2ec; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; }
      .name { font-weight: 600; font-size: 17px; color: #161616; }
      .role { font-size: 14px; color: #5c574e; }
      .when, .st { font-size: 15px; color: #5c574e; }
      .st { color: #7a1f1f; }
      .foot { margin-top: 22px; font-size: 18px; color: #3a3732; line-height: 1.45; }
      `,
      `
      <div class="head">
        <h2>Pending invitations</h2>
        <div class="count">214 waiting · most ignored</div>
      </div>
      <div class="list">
        <div class="row"><div></div><div>Person</div><div>Sent</div><div>Status</div></div>
        <div class="row"><div class="ava">JR</div><div><div class="name">Jordan Reyes</div><div class="role">VP Marketing · title-only list</div></div><div class="when">6 weeks ago</div><div class="st">No response</div></div>
        <div class="row"><div class="ava">AL</div><div><div class="name">Amina Lal</div><div class="role">Founder · cold note with calendar link</div></div><div class="when">5 weeks ago</div><div class="st">No response</div></div>
        <div class="row"><div class="ava">PS</div><div><div class="name">Priya Shah</div><div class="role">CRO · generic “impressed by your background”</div></div><div class="when">4 weeks ago</div><div class="st">No response</div></div>
        <div class="row"><div class="ava">DK</div><div><div class="name">Dev Khanna</div><div class="role">AE · same note as Priya</div></div><div class="when">4 weeks ago</div><div class="st">No response</div></div>
      </div>
      <p class="foot">A pending pile is a second limit. Withdraw stale invites in small batches over several days. A mass withdraw is another spike, and it will not unlock a restriction that has already started.</p>
      `
    ),
  },
  {
    out: "public/blogs/linkedin-spam-filters-how-they-work/cover.jpg",
    width: 1600,
    height: 800,
    html: page(
      1600,
      800,
      `
      .frame { background: #0e0e0e; color: #f4f2ec; padding: 72px 80px; display: flex; align-items: center; gap: 64px; }
      .left { flex: 1; }
      .kicker { font-size: 14px; letter-spacing: 0.16em; text-transform: uppercase; color: #c9c4bb; }
      h1 { margin: 14px 0 18px; font-size: 54px; line-height: 1.05; font-weight: 600; letter-spacing: -0.03em; }
      .rule { width: 56px; height: 4px; background: #e8b4b8; margin-bottom: 20px; }
      .sub { margin: 0; font-size: 22px; line-height: 1.45; color: #c9c4bb; max-width: 560px; }
      .quote { flex: 0 0 540px; background: #171717; border-radius: 20px; padding: 32px; }
      q { display: block; font-size: 24px; line-height: 1.4; font-style: normal; }
      .src { margin-top: 20px; font-size: 14px; color: #9a958c; }
      .stat { margin-top: 28px; padding-top: 20px; border-top: 1px solid #2c2c2c; }
      .n { font-size: 40px; font-weight: 600; letter-spacing: -0.03em; }
      .l { font-size: 16px; color: #c9c4bb; margin-top: 4px; }
      `,
      `
      <div class="left">
        <div class="kicker">LinkedIn spam filters</div>
        <h1>Do not use invitations as ads.</h1>
        <div class="rule"></div>
        <p class="sub">That is not a growth opinion. It is the line in LinkedIn’s Professional Community Policies.</p>
      </div>
      <div class="quote">
        <q>Do not use our invitation feature to send promotional messages to people you don’t know or to otherwise spam people.</q>
        <div class="src">Professional Community Policies · LinkedIn</div>
        <div class="stat">
          <div class="n">98.6%</div>
          <div class="l">of spam and scam removals in H2 2025 were stopped by automated defenses, not a person reading every note.</div>
        </div>
      </div>
      `
    ),
  },
  {
    out: "public/blogs/linkedin-spam-filters-how-they-work/same-letter.jpg",
    width: 1600,
    height: 640,
    html: page(
      1600,
      640,
      `
      .frame { background: #f4f2ec; padding: 48px 64px; }
      h2 { margin: 0 0 8px; font-size: 32px; color: #161616; }
      .sub { margin: 0 0 22px; color: #5c574e; font-size: 18px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
      .card { background: #fff; border: 1px solid #d8d4cb; border-radius: 18px; padding: 24px; }
      .to { font-size: 14px; color: #5c574e; margin-bottom: 10px; }
      .note { font-size: 20px; line-height: 1.45; color: #161616; margin: 0; }
      .same { margin-top: 28px; background: #161616; color: #f4f2ec; border-radius: 16px; padding: 22px 24px; font-size: 20px; line-height: 1.4; }
      .same strong { color: #e8b4b8; }
      `,
      `
      <h2>Identical copy is the easy tell</h2>
      <p class="sub">Gratuitously repetitive messages are named in the policy. Different first names do not make two notes.</p>
      <div class="grid">
        <div class="card">
          <div class="to">To Sarah Kim · Head of Outbound</div>
          <p class="note">Hi Sarah, I came across your profile and was highly impressed by your background. Let us connect!</p>
        </div>
        <div class="card">
          <div class="to">To Priya Shah · CRO</div>
          <p class="note">Hi Priya, I came across your profile and was highly impressed by your background. Let us connect!</p>
        </div>
      </div>
      <div class="same">Same letter. Different first name. <strong>Both the filter and the recipient can tell.</strong></div>
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
  const convert = spawnSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "90", shot, "--out", outPath], {
    encoding: "utf8",
  });
  if (convert.status !== 0) {
    throw new Error(`sips failed for ${job.out}\n${convert.stderr}`);
  }
  console.log("wrote", job.out);
}

for (const job of jobs) render(job);
