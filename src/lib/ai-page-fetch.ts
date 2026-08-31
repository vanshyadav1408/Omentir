import type { NextRequest } from "next/server";
import { isPublicMarketingPath } from "@/lib/public-marketing-path";
import { isSanityStudioRequest } from "@/sanity/studio-host";

export type AiFetchKind = "assistant" | "search" | "crawler";

export type AiFetchMatch = {
  name: string;
  kind: AiFetchKind;
};

// More specific tokens first. ChatGPT-User must win over GPTBot.
const AI_USER_AGENTS: Array<{ token: string; name: string; kind: AiFetchKind }> = [
  { token: "chatgpt-user", name: "ChatGPT", kind: "assistant" },
  { token: "oai-searchbot", name: "ChatGPT", kind: "search" },
  { token: "gptbot", name: "ChatGPT", kind: "crawler" },
  { token: "claude-user", name: "Claude", kind: "assistant" },
  { token: "claude-searchbot", name: "Claude", kind: "search" },
  { token: "claudebot", name: "Claude", kind: "crawler" },
  { token: "anthropic-ai", name: "Claude", kind: "crawler" },
  { token: "perplexity-user", name: "Perplexity", kind: "assistant" },
  { token: "perplexitybot", name: "Perplexity", kind: "crawler" },
  { token: "google-extended", name: "Gemini", kind: "crawler" },
  { token: "applebot-extended", name: "Apple Intelligence", kind: "crawler" },
  { token: "ccbot", name: "Common Crawl", kind: "crawler" },
  { token: "bytespider", name: "Bytespider", kind: "crawler" },
  { token: "amazonbot", name: "Amazon", kind: "crawler" },
  { token: "meta-externalagent", name: "Meta AI", kind: "crawler" },
  { token: "mistralai-user", name: "Mistral", kind: "assistant" },
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
