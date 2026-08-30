import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CHATGPT_FIRST_JOB_PROMPT } from "@/app/chatgpt-setup";
import {
  DEEPSEEK_DRAFT_PROMPT,
  GEMINI_DRAFT_PROMPT,
  HERMES_DRAFT_PROMPT,
  KIMI_DRAFT_PROMPT,
  MISTRAL_DRAFT_PROMPT,
  QWEN_DRAFT_PROMPT,
  SARVAM_DRAFT_PROMPT,
} from "@/app/chat-only-setup";
import { CLAUDE_CHAT_FIRST_JOB_PROMPT } from "@/app/claude-chat-setup";
import { CLAUDE_CODE_FIRST_JOB_PROMPT } from "@/app/claude-code-setup";
import { CODEX_CONFIG_TOML, CODEX_FIRST_JOB_PROMPT } from "@/app/codex-setup";
import { CURSOR_FIRST_JOB_PROMPT } from "@/app/cursor-setup";
import { GROK_CHAT_FIRST_JOB_PROMPT } from "@/app/grok-chat-setup";
import { OPENCLAW_FIRST_JOB_PROMPT } from "@/app/openclaw-setup";
import {
  GROK_BOT_COLD_DM_PROMPT,
  GROK_BOT_FIRST_JOB_PROMPT,
  GROK_BOT_FOLLOW_UP_PROMPT,
  GROK_BOT_LEAD_GEN_PROMPT,
  GROK_BOT_SALES_NAV_PROMPT,
} from "@/app/grok-bot-setup";
import { extractTsxScope, sourceFileToMarkdown } from "@/lib/tsx-to-markdown";
import { markdownToPortableText } from "./markdown-to-portable-text";
import type { CmsBlogPost } from "./types";

const PROMPT_BLOCKS: Array<[string, string]> = [
  ["GROK_BOT_LEAD_GEN_PROMPT", GROK_BOT_LEAD_GEN_PROMPT],
  ["GROK_BOT_FOLLOW_UP_PROMPT", GROK_BOT_FOLLOW_UP_PROMPT],
  ["GROK_BOT_SALES_NAV_PROMPT", GROK_BOT_SALES_NAV_PROMPT],
  ["GROK_BOT_COLD_DM_PROMPT", GROK_BOT_COLD_DM_PROMPT],
  ["GROK_BOT_FIRST_JOB_PROMPT", GROK_BOT_FIRST_JOB_PROMPT],
  ["CLAUDE_CODE_FIRST_JOB_PROMPT", CLAUDE_CODE_FIRST_JOB_PROMPT],
  ["CURSOR_FIRST_JOB_PROMPT", CURSOR_FIRST_JOB_PROMPT],
  ["CODEX_FIRST_JOB_PROMPT", CODEX_FIRST_JOB_PROMPT],
  ["CODEX_CONFIG_TOML", CODEX_CONFIG_TOML],
  ["CHATGPT_FIRST_JOB_PROMPT", CHATGPT_FIRST_JOB_PROMPT],
  ["CLAUDE_CHAT_FIRST_JOB_PROMPT", CLAUDE_CHAT_FIRST_JOB_PROMPT],
  ["GROK_CHAT_FIRST_JOB_PROMPT", GROK_CHAT_FIRST_JOB_PROMPT],
  ["OPENCLAW_FIRST_JOB_PROMPT", OPENCLAW_FIRST_JOB_PROMPT],
  ["KIMI_DRAFT_PROMPT", KIMI_DRAFT_PROMPT],
  ["GEMINI_DRAFT_PROMPT", GEMINI_DRAFT_PROMPT],
  ["DEEPSEEK_DRAFT_PROMPT", DEEPSEEK_DRAFT_PROMPT],
  ["QWEN_DRAFT_PROMPT", QWEN_DRAFT_PROMPT],
  ["MISTRAL_DRAFT_PROMPT", MISTRAL_DRAFT_PROMPT],
  ["SARVAM_DRAFT_PROMPT", SARVAM_DRAFT_PROMPT],
  ["HERMES_DRAFT_PROMPT", HERMES_DRAFT_PROMPT],
];

export function blogSourcePath(slug: string) {
  const content = join(process.cwd(), "src", "content", "blogs", `${slug}.tsx`);
  const app = join(process.cwd(), "src", "app", "blogs", slug, "page.tsx");
  if (existsSync(content)) return content;
  if (existsSync(app)) return app;
  return null;
}

export function readBlogSource(slug: string) {
  const file = blogSourcePath(slug);
  if (!file) return "";
  return readFileSync(file, "utf8");
}

function blogKeywords(source: string): string[] {
  const match = source.match(/keywords:\s*\[([\s\S]*?)\]/);
  if (!match) return [];
  return [...match[1]!.matchAll(/"([^"]+)"/g)].map((item) => item[1]!);
}

function blogFaqs(source: string): Array<{ question: string; answer: string }> {
  const scope = extractTsxScope(source);
  const raw = scope.get("faqItems");
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const question = typeof item.question === "string" ? item.question : "";
      const answer = typeof item.answer === "string" ? item.answer : "";
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is { question: string; answer: string } => Boolean(item));
}

export function blogMarkdownBody(slug: string) {
  const source = readBlogSource(slug);
  if (!source) return "";
  const body = sourceFileToMarkdown(source, (href) => href, "BlogPostTemplate");
  const prompts = PROMPT_BLOCKS.filter(([name, prompt]) => source.includes(name) && !body.includes(prompt)).map(
    ([, prompt]) => `\`\`\`\n${prompt}\n\`\`\``
  );
  return [body, ...prompts].filter(Boolean).join("\n\n");
}

export function blogFromSource(slug: string): Pick<CmsBlogPost, "body" | "faqItems" | "keywords"> | null {
  const source = readBlogSource(slug);
  if (!source) return null;
  const markdown = blogMarkdownBody(slug);
  const body = markdownToPortableText(markdown);
  if (!body.length) return null;
  return {
    body,
    faqItems: blogFaqs(source),
    keywords: blogKeywords(source),
  };
}
