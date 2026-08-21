/**
 * Body illustrations for features/integrations/comparisons/blogs via Gemini
 * (Vertex: gemini-2.5-flash-image). Flat editorial, no photographs.
 *
 * Usage: bun scripts/generate-body-art.ts
 * Optional: bun scripts/generate-body-art.ts --only=claude
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { GoogleGenAI } from "@google/genai";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m || process.env[m[1]]) continue;
  let v = m[2];
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  process.env[m[1]] = v;
}

const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const force = process.argv.includes("--force");

type Job = {
  out: string;
  idea: string;
};

const jobs: Job[] = [
  {
    out: "public/seo/integrations/claude-body.png",
    idea: "A chat panel of three simple bubbles on the left, a thin line to a central rounded node, then a thin line to a LinkedIn-like hexagon. Labels if any: Chat, Omentir, LinkedIn. Exactly those three words.",
  },
  {
    out: "public/seo/integrations/chatgpt-body.png",
    idea: "A simple conversation window icon connected by a straight line to a workspace node, then to a professional-network node. Labels if any: Chat, Workspace, Network.",
  },
  {
    out: "public/seo/integrations/cursor-body.png",
    idea: "A code-editor window drawn as a rounded rectangle with three empty lines, an arrow into a small server node, then an arrow into a network node. No fake code text.",
  },
  {
    out: "public/seo/integrations/mcp-body.png",
    idea: "Two sockets clicking together in the center. Left labeled Operator. Right labeled Omentir. One short cable. No brand marks.",
  },
  {
    out: "public/seo/integrations/grok-body.png",
    idea: "A night-blue accent circle for a chat client, a cream workspace node, a navy network node, connected in a straight row.",
  },
  {
    out: "public/seo/integrations/grok-bot-body.png",
    idea: "A persistent computer rectangle on the left, a workspace node in the middle, a professional-network node on the right. Labels if any: Bot, Omentir, LinkedIn. The computer does not touch the network node directly.",
  },
  {
    out: "public/seo/integrations/openclaw-body.png",
    idea: "Three small nodes feeding into one conductor node, then one line out to a network node. Orchestrator, not a mascot.",
  },
  {
    out: "public/seo/integrations/rest-api-body.png",
    idea: "A key beside a simple request arrow into a rounded box, then a response arrow out. Labels if any: Key, Request, Reply.",
  },
  {
    out: "public/seo/integrations/claude-code-body.png",
    idea: "A terminal rectangle with a single cursor block, a line to a workspace node, a line to a network node. No fake commands.",
  },
  {
    out: "public/seo/comparisons/choose-body.png",
    idea: "Three equal columns: a book for database, an envelope for email, a speech bubble for LinkedIn conversation. One short word under each: Data, Email, LinkedIn.",
  },
  {
    out: "public/seo/indexes/integrations.png",
    idea: "A row of four simple tool tiles connecting into one Omentir asterisk-like 8-point star, then one line to a network node.",
  },
  {
    out: "public/seo/indexes/comparisons.png",
    idea: "A fork in a single line: left path a database book, right path a conversation bubble. Clean and sparse.",
  },
  {
    out: "public/seo/indexes/blogs.png",
    idea: "A stack of three cream notebooks with a short pencil. No readable writing. Quiet library, not a photo.",
  },
  {
    out: "public/blogs/scenes/guides.png",
    idea: "A simple folded map with one dotted path and three dots. Field notes, not a textbook.",
  },
  {
    out: "public/blogs/scenes/outreach.png",
    idea: "One short message card with three lines of empty bars, a 200 mark in the corner. No fake sentences.",
  },
  {
    out: "public/blogs/scenes/copywriting.png",
    idea: "A long grey paragraph block with a red strike, next to a short two-line card. Cut the pitch.",
  },
  {
    out: "public/blogs/scenes/playbooks.png",
    idea: "A weekly grid of seven squares, two afternoon squares filled dusty rose. A calendar, not a slogan.",
  },
  {
    out: "public/blogs/scenes/automation.png",
    idea: "A simple timer beside a pause bar. Pacing, not a robot.",
  },
  {
    out: "public/blogs/scenes/comparisons.png",
    idea: "Two tiles side by side, a small vs mark between them. No product logos.",
  },
  {
    out: "public/blogs/scenes/case-studies.png",
    idea: "Three vertical bars of different heights and a small meeting-calendar icon. Numbers as bars only, no digits.",
  },
  {
    out: "public/blogs/scenes/updates.png",
    idea: "A small shipping tag on a cream card. Product note, not a launch explosion.",
  },
].filter((job) => !only || job.out.includes(only));

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}");
const project = process.env.FIREBASE_PROJECT_ID || sa.project_id;
const ai = new GoogleGenAI({
  vertexai: true,
  project,
  location: "us-central1",
  googleAuthOptions: {
    credentials: sa,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  },
});

async function generateOne(job: Job) {
  mkdirSync(dirname(job.out), { recursive: true });
  if (existsSync(job.out) && !force) {
    console.log("skip existing", job.out);
    return;
  }

  const prompt = [
    "Create ONE editorial website illustration.",
    "Style: flat vector poster, printed annual-report quality, not a photograph, not 3D, not clay, not cinematic lighting.",
    "Background: flat cream #f4f2ec. Ink #161616. One accent dusty rose #e8b4b8. Optional navy #243039.",
    "No people, no faces, no hands, no stock-photo desks, no laptops with readable screens, no watermarks, no brand logos, no LinkedIn logo.",
    "No tiny paragraphs. No lorem ipsum. At most three short labels, large and perfectly spelled.",
    "Lots of empty margin. One idea only.",
    job.idea,
    "Wide 16:9 composition.",
  ].join(" ");

  console.log("generating", job.out);
  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });
  const parts = res.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
  if (!img?.inlineData?.data) {
    throw new Error(`No image returned for ${job.out}`);
  }
  writeFileSync(job.out, Buffer.from(img.inlineData.data, "base64"));
  console.log("wrote", job.out);
}

async function main() {
  if (!sa.client_email) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY missing or invalid");
  }
  console.log(`Jobs: ${jobs.length}`);
  for (const job of jobs) {
    let attempt = 0;
    for (;;) {
      try {
        await generateOne(job);
        break;
      } catch (error) {
        attempt += 1;
        const message = error instanceof Error ? error.message : String(error);
        if (attempt >= 3) {
          console.error("FAILED", job.out, message);
          break;
        }
        console.warn("retry", job.out, attempt, message.slice(0, 160));
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
