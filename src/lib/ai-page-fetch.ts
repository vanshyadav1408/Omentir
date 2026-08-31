import type { NextRequest } from "next/server";
import { isPublicMarketingPath } from "@/lib/public-marketing-path";
import { isSanityStudioRequest } from "@/sanity/studio-host";

export type AiFetchKind = "assistant" | "search" | "crawler";

export type AiFetchMatch = {
  name: string;
  kind: AiFetchKind;
};

// More specific tokens first. ChatGPT-User must win over GPTBot.
// Googlebot, Bingbot, Applebot, Baiduspider, and facebookexternalhit stay out:
// those are search/preview crawlers and would drown the dashboard.
const AI_USER_AGENTS: Array<{ token: string; name: string; kind: AiFetchKind }> = [
  { token: "chatgpt-user", name: "ChatGPT", kind: "assistant" },
  { token: "chatgpt-agent", name: "ChatGPT", kind: "assistant" },
  { token: "chatgpt agent", name: "ChatGPT", kind: "assistant" },
  { token: "oai-searchbot", name: "ChatGPT", kind: "search" },
  { token: "gptbot", name: "ChatGPT", kind: "crawler" },
  { token: "claude-code", name: "Claude Code", kind: "assistant" },
  { token: "claudecode", name: "Claude Code", kind: "assistant" },
  { token: "claude-user", name: "Claude", kind: "assistant" },
  { token: "claude-searchbot", name: "Claude", kind: "search" },
  { token: "claude-web", name: "Claude", kind: "crawler" },
  { token: "claudebot", name: "Claude", kind: "crawler" },
  { token: "anthropic-ai", name: "Claude", kind: "crawler" },
  { token: "perplexity-user", name: "Perplexity", kind: "assistant" },
  { token: "perplexitybot", name: "Perplexity", kind: "crawler" },
  { token: "gemini-deep-research", name: "Gemini", kind: "assistant" },
  { token: "google-gemini-cli", name: "Gemini", kind: "assistant" },
  { token: "google-notebooklm", name: "NotebookLM", kind: "assistant" },
  { token: "googleagent-mariner", name: "Gemini", kind: "assistant" },
  { token: "googleagent-urlcontext", name: "Gemini", kind: "assistant" },
  { token: "google-cloudvertexbot", name: "Gemini", kind: "crawler" },
  { token: "google-extended", name: "Gemini", kind: "crawler" },
  { token: "google-agent", name: "Gemini", kind: "assistant" },
  { token: "cloudvertexbot", name: "Gemini", kind: "crawler" },
  { token: "notebooklm", name: "NotebookLM", kind: "assistant" },
  { token: "applebot-extended", name: "Apple Intelligence", kind: "crawler" },
  { token: "grok-deepsearch", name: "Grok", kind: "search" },
  { token: "grok-user", name: "Grok", kind: "assistant" },
  { token: "xai-grok", name: "Grok", kind: "crawler" },
  { token: "grokbot", name: "Grok", kind: "crawler" },
  { token: "grok", name: "Grok", kind: "crawler" },
  { token: "sarvam-user", name: "Sarvam", kind: "assistant" },
  { token: "sarvambot", name: "Sarvam", kind: "crawler" },
  { token: "sarvam-ai", name: "Sarvam", kind: "crawler" },
  { token: "sarvam", name: "Sarvam", kind: "crawler" },
  { token: "meta-externalfetcher", name: "Meta AI", kind: "assistant" },
  { token: "meta-externalagent", name: "Meta AI", kind: "crawler" },
  { token: "meta-webindexer", name: "Meta AI", kind: "search" },
  { token: "facebookbot", name: "Meta AI", kind: "crawler" },
  { token: "mistralai-user", name: "Mistral", kind: "assistant" },
  { token: "mistral", name: "Mistral", kind: "crawler" },
  { token: "amazon-qbusiness", name: "Amazon", kind: "assistant" },
  { token: "amzn-searchbot", name: "Amazon", kind: "search" },
  { token: "amzn-user", name: "Amazon", kind: "assistant" },
  { token: "amazon-kendra", name: "Amazon", kind: "search" },
  { token: "amazonbuyforme", name: "Amazon", kind: "assistant" },
  { token: "bedrockbot", name: "Amazon", kind: "crawler" },
  { token: "novaact", name: "Amazon", kind: "assistant" },
  { token: "amazonbot", name: "Amazon", kind: "crawler" },
  { token: "azureai-searchbot", name: "Copilot", kind: "search" },
  { token: "github-copilot", name: "Copilot", kind: "assistant" },
  { token: "copilot", name: "Copilot", kind: "assistant" },
  { token: "deepseekbot", name: "DeepSeek", kind: "crawler" },
  { token: "deepseek", name: "DeepSeek", kind: "crawler" },
  { token: "tongyibot", name: "Qwen", kind: "assistant" },
  { token: "qwenbot", name: "Qwen", kind: "crawler" },
  { token: "alibababot", name: "Qwen", kind: "crawler" },
  { token: "tongyi", name: "Qwen", kind: "crawler" },
  { token: "qwen", name: "Qwen", kind: "crawler" },
  { token: "kimi-user", name: "Kimi", kind: "assistant" },
  { token: "moonshot", name: "Kimi", kind: "crawler" },
  { token: "kimi", name: "Kimi", kind: "crawler" },
  { token: "doubaobot", name: "Doubao", kind: "crawler" },
  { token: "doubao", name: "Doubao", kind: "crawler" },
  { token: "bytespider", name: "Doubao", kind: "crawler" },
  { token: "tiktokspider", name: "Doubao", kind: "crawler" },
  { token: "chatglm-spider", name: "GLM", kind: "crawler" },
  { token: "chatglm", name: "GLM", kind: "crawler" },
  { token: "zhipuai", name: "GLM", kind: "crawler" },
  { token: "zhipu", name: "GLM", kind: "crawler" },
  { token: "yiyanbot", name: "Ernie", kind: "assistant" },
  { token: "hunyuanbot", name: "Hunyuan", kind: "crawler" },
  { token: "yuanbao", name: "Hunyuan", kind: "crawler" },
  { token: "hunyuan", name: "Hunyuan", kind: "crawler" },
  { token: "yibot", name: "Yi", kind: "crawler" },
  { token: "pangubot", name: "Pangu", kind: "crawler" },
  { token: "pangu", name: "Pangu", kind: "crawler" },
  { token: "minimaxbot", name: "MiniMax", kind: "crawler" },
  { token: "hailuo", name: "MiniMax", kind: "crawler" },
  { token: "minimax", name: "MiniMax", kind: "crawler" },
  { token: "sensebot", name: "SenseNova", kind: "crawler" },
  { token: "sensenova", name: "SenseNova", kind: "crawler" },
  { token: "baichuanbot", name: "Baichuan", kind: "crawler" },
  { token: "baichuan", name: "Baichuan", kind: "crawler" },
  { token: "sparkdesk", name: "iFlytek", kind: "crawler" },
  { token: "iflytek", name: "iFlytek", kind: "crawler" },
  { token: "internlm", name: "InternLM", kind: "crawler" },
  { token: "manus-user", name: "Manus", kind: "assistant" },
  { token: "manusbot", name: "Manus", kind: "crawler" },
  { token: "krutrimbot", name: "Krutrim", kind: "crawler" },
  { token: "krutrim", name: "Krutrim", kind: "crawler" },
  { token: "cohere-training-data-crawler", name: "Cohere", kind: "crawler" },
  { token: "cohere-ai", name: "Cohere", kind: "assistant" },
  { token: "youbot", name: "You.com", kind: "crawler" },
  { token: "phindbot", name: "Phind", kind: "crawler" },
  { token: "phind", name: "Phind", kind: "crawler" },
  { token: "duckassistbot", name: "DuckDuckGo", kind: "search" },
  { token: "bravebot", name: "Brave", kind: "search" },
  { token: "andibot", name: "Andi", kind: "search" },
  { token: "kagi-fetcher", name: "Kagi", kind: "assistant" },
  { token: "iaskbot", name: "iAsk", kind: "search" },
  { token: "iaskspider", name: "iAsk", kind: "crawler" },
  { token: "anysphere", name: "Cursor", kind: "assistant" },
  { token: "cursor/", name: "Cursor", kind: "assistant" },
  { token: "cursor", name: "Cursor", kind: "assistant" },
  { token: "devin", name: "Devin", kind: "assistant" },
  { token: "openclaw", name: "OpenClaw", kind: "assistant" },
  { token: "clawdbot", name: "OpenClaw", kind: "assistant" },
  { token: "moltbot", name: "OpenClaw", kind: "assistant" },
  { token: "hermes-agent", name: "Hermes", kind: "assistant" },
  { token: "hermesagent", name: "Hermes", kind: "assistant" },
  { token: "nous-hermes", name: "Hermes", kind: "assistant" },
  { token: "openai-codex", name: "Codex", kind: "assistant" },
  { token: "codex-cli", name: "Codex", kind: "assistant" },
  { token: "codex/", name: "Codex", kind: "assistant" },
  { token: "opencode", name: "OpenCode", kind: "assistant" },
  { token: "windsurf", name: "Windsurf", kind: "assistant" },
  { token: "openhands", name: "OpenHands", kind: "assistant" },
  { token: "swe-agent", name: "SWE-agent", kind: "assistant" },
  { token: "aider/", name: "Aider", kind: "assistant" },
  { token: "cline/", name: "Cline", kind: "assistant" },
  { token: "trae/", name: "Trae", kind: "assistant" },
  { token: "tavilybot", name: "Tavily", kind: "search" },
  { token: "exasearchbot", name: "Exa", kind: "search" },
  { token: "exabot", name: "Exa", kind: "search" },
  { token: "firecrawlagent", name: "Firecrawl", kind: "crawler" },
  { token: "quillbot", name: "QuillBot", kind: "crawler" },
  { token: "groqbot", name: "Groq", kind: "crawler" },
  { token: "huggingface", name: "Hugging Face", kind: "crawler" },
  { token: "ai2bot", name: "AI2", kind: "crawler" },
  { token: "atlassian-bot", name: "Rovo", kind: "search" },
  { token: "wrtnbot", name: "Wrtn", kind: "crawler" },
  { token: "cotoyogi", name: "Cotoyogi", kind: "crawler" },
  { token: "sbintuitionsbot", name: "SB Intuitions", kind: "crawler" },
  { token: "linerbot", name: "Liner", kind: "search" },
  { token: "linkupbot", name: "Linkup", kind: "search" },
  { token: "ccbot", name: "Common Crawl", kind: "crawler" },
];

export function matchAiUserAgent(userAgent: string): AiFetchMatch | null {
  const lower = userAgent.toLowerCase();
  for (const entry of AI_USER_AGENTS) {
    if (lower.includes(entry.token)) return { name: entry.name, kind: entry.kind };
  }
  return null;
}

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const firstHop = forwarded?.split(",")[0]?.trim();
  return firstHop || request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "";
}

function requestUrl(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.replace(/:$/, "") ||
    "https";
  return `${proto}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`;
}

function shouldCapture(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const host = request.headers.get("host") || request.nextUrl.hostname;
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) return false;
  if (isSanityStudioRequest(request.headers, request.nextUrl.hostname)) return false;
  const path = request.nextUrl.pathname;
  if (path === "/studio" || path.startsWith("/studio/")) return false;
  if (path.startsWith("/page-markdown")) return false;
  return isPublicMarketingPath(path);
}

async function distinctId(ip: string, userAgent: string) {
  const payload = new TextEncoder().encode(`${ip}|${userAgent}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `ai_${hex.slice(0, 32)}`;
}

export async function captureAiPageFetch(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;
  if (!shouldCapture(request)) return;

  const userAgent = request.headers.get("user-agent") || "";
  const match = matchAiUserAgent(userAgent);
  if (!match) return;

  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "") || "https://us.i.posthog.com";
  const ip = clientIp(request);
  const currentUrl = requestUrl(request);

  try {
    await fetch(`${host}/i/v0/e/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event: "$http_log",
        distinct_id: await distinctId(ip, userAgent),
        properties: {
          $process_person_profile: false,
          $raw_user_agent: userAgent,
          $current_url: currentUrl,
          $pathname: request.nextUrl.pathname,
          $host: request.nextUrl.host,
          $ip: ip || undefined,
          method: request.method,
          ai_name: match.name,
          ai_kind: match.kind,
        },
      }),
      signal: AbortSignal.timeout(2500),
    });
  } catch {
    // Request latency matters more than a missed crawler hit.
  }
}
