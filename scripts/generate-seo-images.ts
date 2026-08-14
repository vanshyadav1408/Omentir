/**
 * Generate simple text-forward hero images for SEO pages via Gemini
 * (Vertex: gemini-2.5-flash-image).
 *
 * Usage: bun scripts/generate-seo-images.ts
 * Optional: bun scripts/generate-seo-images.ts --only=steal-customers
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { GoogleGenAI } from "@google/genai";
import { ALL_INTEGRATIONS } from "../src/app/integrations/integration-data";

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
  family: "features" | "comparisons" | "integrations";
  slug: string;
  headline: string;
  subline: string;
  styleHint: string;
};

function shortHeadline(title: string, max = 42) {
  if (title.length <= max) return title;
  return `${title.slice(0, max - 1).trim()}…`;
}

const jobs: Job[] = [
  // Feature banners are composed with exact copy in
  // scripts/compose-feature-banners.ts. Do not generate them here.
  // Comparison OG images are composed from official brand marks in
  // scripts/compose-comparison-og.ts. Do not generate fake logos here.
  ...ALL_INTEGRATIONS.map((p) => ({
    family: "integrations" as const,
    slug: p.slug,
    headline: shortHeadline(p.title, 36),
    subline: shortHeadline(p.summary, 56),
    styleHint:
      "Integration setup poster. Cream background, bold black headline, simple connector/node diagram (chat bubble to tools to LinkedIn abstract). No third-party brand logos.",
  })),
].filter((j) => !only || j.slug === only || j.family === only);

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
  const dir = join("public", "seo", job.family);
  mkdirSync(dir, { recursive: true });
  const out = join(dir, `${job.slug}.png`);
  if (existsSync(out) && !force) {
    console.log("skip existing", out);
    return;
  }

  const prompt = [
    "Create ONE simple marketing illustration for a website hero.",
    job.styleHint,
    `Primary text (must be large, sharp, readable, exact spelling): "${job.headline}"`,
    `Smaller supporting text: "${job.subline}"`,
    "Wide 16:9 composition. Flat vector style. No photorealism, no watermarks, no people faces, no tiny unreadable paragraphs, no fake UI screenshots with lorem ipsum.",
    "Leave breathing room. High contrast black text on cream.",
  ].join(" ");

  console.log("generating", job.family, job.slug);
  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });
  const parts = res.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
  if (!img?.inlineData?.data) {
    throw new Error(`No image returned for ${job.slug}`);
  }
  writeFileSync(out, Buffer.from(img.inlineData.data, "base64"));
  console.log("wrote", out);
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
          console.error("FAILED", job.slug, message);
          break;
        }
        console.warn("retry", job.slug, attempt, message.slice(0, 120));
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    await new Promise((r) => setTimeout(r, 400));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
