/**
 * Deprecated image-model path. New SEO posters are composed at the correct
 * aspect ratio by scripts/compose-new-seo-banners.ts.
 *
 * Usage: bun scripts/generate-new-seo-banners.ts
 * Optional: bun scripts/generate-new-seo-banners.ts --only=outbound-for-founders
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { ALL_ALTERNATIVES } from "../src/app/alternatives/alternative-data";
import { ALL_COMPARISONS } from "../src/app/comparisons/comparison-data";
import { ALL_FEATURES } from "../src/app/features/feature-data";
import { ALL_USE_CASES } from "../src/app/use-cases/use-case-data";
import type { SeoFamily } from "../src/app/seo-content/types";

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
const svgOnly = process.argv.includes("--svg-only");

type Job = {
  family: SeoFamily;
  slug: string;
  headline: string;
  idea: string;
};

const NEW_FEATURE_SLUGS = new Set(["reply-drafts", "demo-booking", "linkedin-warmup"]);

const jobs: Job[] = [
  ...ALL_USE_CASES.map((page) => ({
    family: "use-cases" as const,
    slug: page.slug,
    headline: page.title,
    idea: ideaFor(page.slug, page.title),
  })),
  ...ALL_ALTERNATIVES.map((page) => ({
    family: "alternatives" as const,
    slug: page.slug,
    headline: page.title,
    idea: ideaFor(page.slug, page.title),
  })),
  ...ALL_FEATURES.filter((page) => NEW_FEATURE_SLUGS.has(page.slug)).map((page) => ({
    family: "features" as const,
    slug: page.slug,
    headline: page.title,
    idea: ideaFor(page.slug, page.title),
  })),
  ...ALL_COMPARISONS.map((page) => ({
    family: "comparisons" as const,
    slug: page.slug,
    headline: page.title,
    idea: ideaFor(page.slug, page.title),
  })),
].filter((job) => !only || job.slug === only || job.family === only);

function ideaFor(slug: string, title: string): string {
  const ideas: Record<string, string> = {
    "outbound-for-founders":
      "A small founder notebook beside a single professional-network node. Title text exactly: Outbound for founders. Icons: one person mark, one message card. Sparse cream poster.",
    "book-linkedin-demos":
      "A calendar tile next to a short message bubble. Title text exactly: Book demos on LinkedIn. No people. One check mark.",
    "replace-first-sdr":
      "A hiring chair outline fading into a simple agent node. Title text exactly: Replace the first SDR. Two icons only.",
    "prospect-commenters":
      "A competitor post card with three comment dots, an arrow to a lead card. Title text exactly: Prospect competitor commenters.",
    "open-source-ai-sdr":
      "An open box with a small asterisk star. Title text exactly: Open source AI SDR. MIT as a tiny label if needed.",
    "linkedin-automation":
      "Three sender tiles versus one workspace node. Title text exactly: LinkedIn automation tools.",
    "ai-sdr":
      "A packaged robot-free agent tile beside an inspectable window. Title text exactly: AI SDR tools.",
    "b2b-databases":
      "A thick book versus a live conversation bubble. Title text exactly: B2B database tools.",
    "email-outreach":
      "An envelope stack versus a chat bubble. Title text exactly: Email outreach tools.",
    "sales-navigator":
      "A search filter funnel versus a send arrow. Title text exactly: Sales Navigator tools.",
    "reply-drafts":
      "Two chat bubbles, the second one dashed as a draft. Title text exactly: Reply drafts you approve.",
    "demo-booking":
      "A message bubble pointing at a calendar. Title text exactly: Turn replies into demos.",
    "linkedin-warmup":
      "A thermometer or ramp of four small bars, first two filled. Title text exactly: LinkedIn warmup and ramp.",
  };
  if (ideas[slug]) return ideas[slug];
  if (slug.includes("-vs-")) {
    return `Two simple tiles with a small VS mark between them. Title text exactly: ${title}. Flat icons only, no brand logos, no fake product UI.`;
  }
  return `Flat editorial poster. Title text exactly: ${title}. Simple icons that match the title. Lots of empty cream margin.`;
}

async function writeSvgFallback(job: Job, rasterizePng: boolean) {
  const dir = join("public", "seo", job.family);
  mkdirSync(dir, { recursive: true });
  const outSvg = join(dir, `${job.slug}.svg`);
  const outPng = join(dir, `${job.slug}.png`);
  const esc = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const palette =
    job.family === "comparisons"
      ? { bg: "#f4f2ec", accent: "#1a73e8" }
      : job.family === "use-cases"
        ? { bg: "#f4f2ec", accent: "#0f766e" }
        : job.family === "alternatives"
          ? { bg: "#f4efe6", accent: "#9a3412" }
          : { bg: "#f4f2ec", accent: "#6b4f2a" };
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="${palette.bg}"/>
  <circle cx="1080" cy="140" r="170" fill="${palette.accent}" opacity="0.12"/>
  <rect x="72" y="72" width="8" height="576" rx="4" fill="#161616"/>
  <text x="120" y="300" font-family="Georgia, serif" font-size="52" font-weight="700" fill="#161616">${esc(job.headline)}</text>
  <rect x="120" y="340" width="140" height="10" rx="5" fill="${palette.accent}"/>
  <text x="120" y="620" font-family="system-ui, sans-serif" font-size="22" font-weight="600" fill="#161616">Omentir</text>
</svg>`;
  writeFileSync(outSvg, svg);
  if (rasterizePng) {
    await sharp(Buffer.from(svg)).png().toFile(outPng);
  }
  console.log("svg fallback", outSvg);
}

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

const promptFor = (job: Job) =>
  [
    "Create ONE editorial website illustration, 16:9.",
    "Style: flat 2D vector poster, printed annual-report quality, not a photograph, not 3D, not clay, not cinematic lighting.",
    "Background: flat cream #f4f2ec. Ink #161616. One accent dusty rose #e8b4b8. Optional navy #243039.",
    "No people, no faces, no hands, no stock-photo desks, no laptops with readable screens, no watermarks, no third-party brand logos, no LinkedIn logo.",
    "No tiny paragraphs. No lorem ipsum. The title must be large, sharp, perfectly spelled.",
    "Simple icons and geometric illustrations only. Lots of empty margin. One idea.",
    job.idea,
  ].join(" ");

async function generateImagen(job: Job, out: string) {
  const res = await ai.models.generateImages({
    model: "imagen-3.0-generate-002",
    prompt: promptFor(job),
    config: {
      numberOfImages: 1,
      aspectRatio: "16:9",
    },
  });
  const bytes = res.generatedImages?.[0]?.image?.imageBytes;
  if (!bytes) throw new Error("Imagen returned no bytes");
  writeFileSync(out, Buffer.from(bytes, "base64"));
}

async function generateGeminiFlash(job: Job, out: string) {
  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: promptFor(job),
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });
  const parts = res.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
  if (!img?.inlineData?.data) throw new Error("Gemini returned no image");
  writeFileSync(out, Buffer.from(img.inlineData.data, "base64"));
}

async function generateOne(job: Job) {
  const dir = join("public", "seo", job.family);
  mkdirSync(dir, { recursive: true });
  const out = join(dir, `${job.slug}.png`);
  if (existsSync(out) && !force) {
    console.log("skip existing", out);
    return;
  }
  await writeSvgFallback(job, false);
  if (svgOnly || !sa.client_email) {
    await writeSvgFallback(job, true);
    console.warn(svgOnly ? "svg-only rasterized" : "no Vertex credentials, rasterized svg", job.slug);
    return;
  }
  console.log("generating", job.family, job.slug);
  try {
    await generateImagen(job, out);
    console.log("wrote imagen", out);
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("imagen failed", job.slug, message.slice(0, 180));
  }
  try {
    await generateGeminiFlash(job, out);
    console.log("wrote gemini", out);
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("gemini failed", job.slug, message.slice(0, 180));
  }
  await writeSvgFallback(job, true);
}

async function main() {
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
          console.error("FAILED", job.slug, message);
          await writeSvgFallback(job, true);
          break;
        }
        console.warn("retry", job.slug, attempt, message.slice(0, 160));
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    await new Promise((r) => setTimeout(r, 400));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
