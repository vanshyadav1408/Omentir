/**
 * Lint marketing copy for common AI-writing tells.
 * Usage: bun scripts/lint-marketing-copy.ts
 *
 * Strict mode (full word list): SEO data files, guides, homepage, marketing shell.
 * Blog paths: hard rules only (dashes, curly quotes, chatbot phrases) until legacy posts are humanized.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..");

type Violation = {
  file: string;
  line: number;
  rule: string;
  excerpt: string;
};

const STRICT_ROOTS = [
  "src/app/comparisons",
  "src/app/features",
  "src/app/alternatives",
  "src/app/use-cases",
  "src/app/integrations",
  "src/app/guides",
  "src/app/surveys",
  "src/app/page.tsx",
  "src/lib/public-page-markdown.ts",
];

const STRICT_FILES = [
  "src/app/marketing-shell.tsx",
  "src/app/marketing-mobile-nav.tsx",
  "src/app/feature-menu.tsx",
];

const BLOG_ROOT = "src/app/blogs";

const BANNED_WORDS = [
  "additionally",
  "align with",
  "cutting-edge",
  "cutting edge",
  "comprehensive",
  "crucial",
  "delve",
  "empower",
  "enduring",
  "enhance",
  "fostering",
  "game-changer",
  "game changer",
  "garner",
  "intricate",
  "intricacies",
  "landscape",
  "leverage",
  "pivotal",
  "robust",
  "seamless",
  "showcase",
  "streamline",
  "supercharge",
  "testament",
  "underscore",
  "unlock",
  "vibrant",
];

const CHATBOT_PHRASES: Array<{ id: string; pattern: RegExp }> = [
  { id: "chatbot-hope", pattern: /\bI hope this helps\b/i },
  { id: "chatbot-dive", pattern: /\blet's dive in\b/i },
  { id: "chatbot-explore", pattern: /\blet's explore\b/i },
  { id: "chatbot-break-down", pattern: /\blet's break this down\b/i },
  { id: "chatbot-need-to-know", pattern: /\bhere's what you need to know\b/i },
  { id: "chatbot-without-ado", pattern: /\bwithout further ado\b/i },
  { id: "chatbot-of-course", pattern: /^Of course!/i },
  { id: "chatbot-certainly", pattern: /^Certainly!/i },
  { id: "chatbot-great-question", pattern: /\bGreat question!/i },
  { id: "chatbot-absolutely-right", pattern: /\bYou're absolutely right\b/i },
];

const EM_DASH = /[—–]/;
const CURLY_QUOTES = /[\u201C\u201D\u2018\u2019]/;

function walk(dir: string, out: string[]) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
}

function collectFiles(): Array<{ path: string; strict: boolean }> {
  const files: Array<{ path: string; strict: boolean }> = [];

  for (const root of STRICT_ROOTS) {
    const full = join(ROOT, root);
    if (!statSync(full, { throwIfNoEntry: false })?.isDirectory()) {
      if (statSync(full, { throwIfNoEntry: false })?.isFile()) {
        files.push({ path: full, strict: true });
      }
      continue;
    }
    const found: string[] = [];
    walk(full, found);
    for (const file of found) {
      if (file.endsWith("-data.ts") || root.includes("guides")) {
        files.push({ path: file, strict: true });
      }
    }
  }

  for (const rel of STRICT_FILES) {
    const full = join(ROOT, rel);
    if (statSync(full, { throwIfNoEntry: false })?.isFile()) {
      files.push({ path: full, strict: true });
    }
  }

  const blogDir = join(ROOT, BLOG_ROOT);
  if (statSync(blogDir, { throwIfNoEntry: false })?.isDirectory()) {
    const found: string[] = [];
    walk(blogDir, found);
    for (const file of found) {
      files.push({ path: file, strict: false });
    }
  }

  const seen = new Set<string>();
  return files.filter(({ path }) => {
    if (seen.has(path)) return false;
    seen.add(path);
    return true;
  });
}

function stripLineComment(line: string): string {
  const idx = line.indexOf("//");
  if (idx === -1) return line;
  return line.slice(0, idx);
}

function extractQuotedStrings(line: string): string[] {
  const strings: string[] = [];
  const patterns = [
    /"((?:\\.|[^"\\])*)"/g,
    /'((?:\\.|[^'\\])*)'/g,
    /`((?:\\.|[^`\\])*)`/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(line)) !== null) {
      strings.push(match[1] ?? "");
    }
  }
  return strings;
}

function isLikelyCopy(text: string, strict: boolean): boolean {
  if (!text.trim()) return false;
  if (strict) return true;
  if (text.includes(" ")) return true;
  return text.length >= 30;
}

function isSkippableCodeString(text: string): boolean {
  if (/^\/[a-z0-9./_-]*$/i.test(text)) return true;
  if (/^#[0-9a-f]{3,8}$/i.test(text)) return true;
  if (/^(text-|bg-|border-|hover:|flex|grid|px-|py-|mt-|mb-)/.test(text)) return true;
  if (/^[a-z0-9_-]+$/.test(text) && text.length < 40) return true;
  return false;
}

function wordPattern(word: string): RegExp {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (word.includes(" ")) {
    return new RegExp(escaped, "i");
  }
  return new RegExp(`\\b${escaped}\\b`, "i");
}

const bannedPatterns = BANNED_WORDS.map((word) => ({
  id: `ai-word:${word}`,
  pattern: wordPattern(word),
}));

function checkString(
  text: string,
  strict: boolean,
  file: string,
  line: number,
  violations: Violation[],
) {
  if (!isLikelyCopy(text, strict) || isSkippableCodeString(text)) return;

  const excerpt = text.length > 80 ? `${text.slice(0, 77)}...` : text;

  if (EM_DASH.test(text)) {
    violations.push({ file, line, rule: "em-dash", excerpt });
  }
  if (CURLY_QUOTES.test(text)) {
    violations.push({ file, line, rule: "curly-quotes", excerpt });
  }

  for (const { id, pattern } of CHATBOT_PHRASES) {
    if (pattern.test(text)) {
      violations.push({ file, line, rule: id, excerpt });
    }
  }

  if (!strict) return;

  for (const { id, pattern } of bannedPatterns) {
    if (pattern.test(text)) {
      violations.push({ file, line, rule: id, excerpt });
    }
  }
}

function lintFile(path: string, strict: boolean): Violation[] {
  const rel = relative(ROOT, path);
  const content = readFileSync(path, "utf8");
  const violations: Violation[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = stripLineComment(lines[i] ?? "");
    if (/^\s*import\s/.test(line)) continue;

    for (const text of extractQuotedStrings(line)) {
      checkString(text, strict, rel, lineNo, violations);
    }

    // JSX text nodes: >Some copy here<
    const jsxText = />\s*([^<{][^<]*?)\s*</g;
    let match: RegExpExecArray | null;
    while ((match = jsxText.exec(line)) !== null) {
      const text = (match[1] ?? "").trim();
      if (text) checkString(text, strict, rel, lineNo, violations);
    }
  }

  return violations;
}

function main() {
  const files = collectFiles();
  const violations = files.flatMap(({ path, strict }) => lintFile(path, strict));

  if (violations.length === 0) {
    console.log(`lint:copy OK (${files.length} files)`);
    return;
  }

  console.error(`lint:copy found ${violations.length} issue(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} [${v.rule}] ${v.excerpt}`);
  }
  process.exit(1);
}

main();
