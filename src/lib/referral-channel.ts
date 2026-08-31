export const REFERRAL_CHANNELS = [
  "paid",
  "email",
  "affiliate",
  "ai",
  "organic_search",
  "social",
  "referral",
  "direct",
] as const;

export type ReferralChannel = (typeof REFERRAL_CHANNELS)[number];

export const CHANNEL_LABELS: Record<ReferralChannel, string> = {
  paid: "Paid",
  email: "Email",
  affiliate: "Affiliate",
  ai: "AI",
  organic_search: "Organic Search",
  social: "Social",
  referral: "Referral",
  direct: "Direct",
};

export type ClassifiedVisit = {
  channel: ReferralChannel;
  channel_name: string;
  referring_domain: string;
  landing_path: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
};

const DIRECT_DOMAIN = "(direct)";

const PAID_MEDIUMS = new Set([
  "cpc",
  "ppc",
  "paid",
  "paidsocial",
  "paid-social",
  "paid_social",
  "cpm",
  "display",
  "retargeting",
  "ads",
]);

const EMAIL_MEDIUMS = new Set(["email", "e-mail", "newsletter"]);
const AFFILIATE_MEDIUMS = new Set(["affiliate", "aff"]);
const AI_MEDIUMS = new Set(["ai", "ai_search", "ai-search"]);

const GOOGLE_APP_HOST = "com.google.android.googlequicksearchbox";

const AI_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "perplexity.ai",
  "perplexity.com",
  "claude.ai",
  "gemini.google.com",
  "bard.google.com",
  "notebooklm.google.com",
  "aistudio.google.com",
  "copilot.microsoft.com",
  "copilot.cloud.microsoft",
  "grok.com",
  "grok.x.ai",
  "you.com",
  "phind.com",
  "poe.com",
  "deepseek.com",
  "chat.deepseek.com",
  "mistral.ai",
  "chat.mistral.ai",
  "meta.ai",
  "character.ai",
  "kimi.com",
  "kimi.ai",
  "kimi.moonshot.cn",
  "tongyi.aliyun.com",
  "qianwen.aliyun.com",
  "qwen.ai",
  "chat.qwen.ai",
  "chat.qwenlm.ai",
  "yuanbao.tencent.com",
  "yiyan.baidu.com",
  "groq.com",
  "huggingface.co",
];

const SEARCH_HOSTS = [
  "google.com",
  "google.co.uk",
  "google.ca",
  "google.com.au",
  "google.co.in",
  "bing.com",
  "duckduckgo.com",
  "search.yahoo.com",
  "yahoo.com",
  "baidu.com",
  "yandex.com",
  "yandex.ru",
  "search.brave.com",
  "ecosia.org",
  "startpage.com",
];

const SOCIAL_HOSTS = [
  "twitter.com",
  "x.com",
  "t.co",
  "linkedin.com",
  "lnkd.in",
  "facebook.com",
  "fb.com",
  "instagram.com",
  "reddit.com",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "producthunt.com",
  "news.ycombinator.com",
  "threads.net",
  "pinterest.com",
  "discord.com",
  "whatsapp.com",
  "telegram.org",
  "medium.com",
];

const AFFILIATE_HOSTS = ["appsumo.com"];

const EMAIL_HOSTS = ["mail.google.com", "outlook.live.com", "mail.yahoo.com"];

export function hostnameOf(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  try {
    const url = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function pathOf(value: string): string {
  try {
    const url = new URL(value);
    return url.pathname || "/";
  } catch {
    return "/";
  }
}

function queryParam(url: URL, key: string): string {
  return url.searchParams.get(key)?.trim() || "";
}

function hostMatches(hostname: string, hosts: string[]): boolean {
  return hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

export function isOwnHostname(hostname: string): boolean {
  if (!hostname) return false;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  return hostname === "omentir.com" || hostname.endsWith(".omentir.com");
}

function utmChannel(medium: string): ReferralChannel | null {
  const lower = medium.toLowerCase();
  if (PAID_MEDIUMS.has(lower)) return "paid";
  if (EMAIL_MEDIUMS.has(lower)) return "email";
  if (AFFILIATE_MEDIUMS.has(lower)) return "affiliate";
  if (AI_MEDIUMS.has(lower)) return "ai";
  return null;
}

export function isGoogleSearchHost(hostname: string): boolean {
  if (!hostname) return false;
  if (hostname === GOOGLE_APP_HOST) return true;
  if (hostname === "accounts.google.com") return false;
  if (hostname === "gemini.google.com" || hostname === "bard.google.com") return false;
  if (hostname === "notebooklm.google.com" || hostname === "aistudio.google.com") return false;
  if (hostname === "google.com" || hostname.endsWith(".google.com")) return true;
  return hostname.startsWith("google.") && hostMatches(hostname, SEARCH_HOSTS);
}

function hostChannel(hostname: string, referrerUrl: string): ReferralChannel | null {
  if (!hostname || isOwnHostname(hostname)) return null;
  if (hostMatches(hostname, AI_HOSTS)) return "ai";
  if (hostname === "bing.com" && referrerUrl.toLowerCase().includes("/chat")) return "ai";
  if (hostname === GOOGLE_APP_HOST || hostMatches(hostname, SEARCH_HOSTS)) return "organic_search";
  if (hostMatches(hostname, SOCIAL_HOSTS)) return "social";
  if (hostMatches(hostname, EMAIL_HOSTS)) return "email";
  if (hostMatches(hostname, AFFILIATE_HOSTS)) return "affiliate";
  return "referral";
}

const AI_HOST_LABELS: Record<string, string> = {
  "chatgpt.com": "ChatGPT",
  "chat.openai.com": "ChatGPT",
  "perplexity.ai": "Perplexity",
  "perplexity.com": "Perplexity",
  "claude.ai": "Claude",
  "gemini.google.com": "Gemini",
  "bard.google.com": "Gemini",
  "notebooklm.google.com": "NotebookLM",
  "aistudio.google.com": "Gemini",
  "copilot.microsoft.com": "Copilot",
  "copilot.cloud.microsoft": "Copilot",
  "grok.com": "Grok",
  "grok.x.ai": "Grok",
  "you.com": "You.com",
  "phind.com": "Phind",
  "poe.com": "Poe",
  "deepseek.com": "DeepSeek",
  "chat.deepseek.com": "DeepSeek",
  "mistral.ai": "Mistral",
  "chat.mistral.ai": "Mistral",
  "meta.ai": "Meta AI",
  "kimi.com": "Kimi",
  "kimi.ai": "Kimi",
  "kimi.moonshot.cn": "Kimi",
  "tongyi.aliyun.com": "Qwen",
  "qianwen.aliyun.com": "Qwen",
  "qwen.ai": "Qwen",
  "chat.qwen.ai": "Qwen",
  "chat.qwenlm.ai": "Qwen",
  "yuanbao.tencent.com": "Hunyuan",
  "yiyan.baidu.com": "Ernie",
  "groq.com": "Groq",
  "huggingface.co": "Hugging Face",
};

export function aiNameFromReferrer(referrer: string): string | null {
  const hostname = hostnameOf(referrer);
  if (!hostname) return null;
  if (hostname === "bing.com" && referrer.toLowerCase().includes("/chat")) return "Copilot";
  for (const host of AI_HOSTS) {
    if (hostname === host || hostname.endsWith(`.${host}`)) return AI_HOST_LABELS[host] || host;
  }
  return null;
}

const TEXT_FRAGMENT_PREFIX = "#:~:text=";

export function googleClickSignals(pageUrl: string, referrer: string): Record<string, string> {
  if (!isGoogleSearchHost(hostnameOf(referrer))) return {};
  const properties: Record<string, string> = { google_click: "true" };
  try {
    const hash = new URL(pageUrl).hash;
    if (!hash.startsWith(TEXT_FRAGMENT_PREFIX)) return properties;
    const raw = decodeURIComponent(hash.slice(TEXT_FRAGMENT_PREFIX.length)).replace(/\+/g, " ").trim();
    if (raw) properties.google_text_fragment = raw.slice(0, 200);
  } catch {
    // Keep the google_click flag even if the landing URL cannot be parsed.
  }
  return properties;
}

export function classifyVisit(pageUrl: string, referrer: string): ClassifiedVisit {
  let landingPath = "/";
  let utmSource = "";
  let utmMedium = "";
  let utmCampaign = "";
  let utmContent = "";
  let utmTerm = "";

  try {
    const page = new URL(pageUrl);
    landingPath = page.pathname || "/";
    utmSource = queryParam(page, "utm_source");
    utmMedium = queryParam(page, "utm_medium");
    utmCampaign = queryParam(page, "utm_campaign");
    utmContent = queryParam(page, "utm_content");
    utmTerm = queryParam(page, "utm_term");
  } catch {
    landingPath = pathOf(pageUrl);
  }

  const referringDomain = hostnameOf(referrer);
  const fromUtm = utmChannel(utmMedium);
  const fromHost = hostChannel(referringDomain, referrer);
  const channel = fromUtm || fromHost || "direct";
  const domain =
    channel === "direct"
      ? DIRECT_DOMAIN
      : referringDomain === GOOGLE_APP_HOST
        ? "google.com"
        : referringDomain || DIRECT_DOMAIN;

  return {
    channel,
    channel_name: CHANNEL_LABELS[channel],
    referring_domain: domain,
    landing_path: landingPath,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
  };
}
