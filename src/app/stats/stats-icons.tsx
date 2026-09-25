"use client";

import { useState, type ReactNode } from "react";

// Row icons for stats.omentir.com: site favicons, country flags, and a few
// line glyphs for channels and devices.

const svg = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {path}
  </svg>
);

export const Glyph = {
  link: svg(<><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></>),
  search: svg(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>),
  social: svg(<><circle cx="8" cy="9" r="3" /><circle cx="16.5" cy="10" r="2.5" /><path d="M3 19c.6-3 2.7-4.5 5-4.5s4.4 1.5 5 4.5" /><path d="M14 15.2c.8-.5 1.6-.7 2.5-.7 1.9 0 3.6 1.2 4.1 3.8" /></>),
  referral: svg(<><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>),
  ai: svg(<><path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.3l-1.8-5.7L4.5 10.8 10.2 9z" /><path d="M19 3v3M17.5 4.5h3" /></>),
  mail: svg(<><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>),
  tag: svg(<><path d="M20 12.5 12.5 20a1.5 1.5 0 0 1-2.1 0L4 13.6V4h9.6l6.4 6.4a1.5 1.5 0 0 1 0 2.1Z" /><circle cx="8.5" cy="8.5" r="1.3" /></>),
  video: svg(<><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m10.5 9.5 4 2.5-4 2.5z" /></>),
  globe: svg(<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5Z" /></>),
  desktop: svg(<><rect x="3" y="4.5" width="18" height="12" rx="1.8" /><path d="M9 20h6M12 16.5V20" /></>),
  mobile: svg(<><rect x="7" y="3" width="10" height="18" rx="2.2" /><path d="M11 17.5h2" /></>),
  tablet: svg(<><rect x="4.5" y="3" width="15" height="18" rx="2.2" /><path d="M11 17.5h2" /></>),
  filter: svg(<path d="M4 5h16l-6.2 7.3V19l-3.6-1.8v-4.9z" />),
  sort: svg(<><path d="M8 4v16M4.5 7.5 8 4l3.5 3.5" /><path d="M16 20V4M12.5 16.5 16 20l3.5-3.5" /></>),
  expand: svg(<><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></>),
  refresh: svg(<><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" /><path d="M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" /><path d="M20 20v-4h-4" /></>),
  chevronLeft: svg(<path d="m14.5 6-6 6 6 6" />),
  chevronRight: svg(<path d="m9.5 6 6 6-6 6" />),
  caret: svg(<path d="m6 9 6 6 6-6" />),
  close: svg(<path d="M6 6l12 12M18 6 6 18" />),
  book: svg(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5Z" /></>),
};

export function Favicon({ domain, fallback = Glyph.globe }: { domain: string; fallback?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (!domain || failed) return <span className="stats-row-icon">{fallback}</span>;
  return (
    <span className="stats-row-icon">
      {/* eslint-disable-next-line @next/next/no-img-element -- remote favicons, sized 16px, not worth next/image */}
      <img src={`https://icons.duckduckgo.com/ip3/${domain}.ico`} alt="" loading="lazy" onError={() => setFailed(true)} />
    </span>
  );
}

export function Flag({ code }: { code: string }) {
  const cc = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return <span className="stats-row-icon">{Glyph.globe}</span>;
  const flag = String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  return <span className="stats-row-icon">{flag}</span>;
}

const CHANNEL_GLYPHS: Record<string, ReactNode> = {
  social: Glyph.social,
  direct: Glyph.link,
  "organic search": Glyph.search,
  "paid search": Glyph.tag,
  referral: Glyph.referral,
  ai: Glyph.ai,
  email: Glyph.mail,
  "organic video": Glyph.video,
  paid: Glyph.tag,
};

export function channelIcon(channel: string) {
  return <span className="stats-row-icon">{CHANNEL_GLYPHS[channel.toLowerCase()] ?? Glyph.globe}</span>;
}

// App referrers arrive as package names; map the common ones to their site.
const APP_REFERRERS: Record<string, string> = {
  "t.co": "x.com",
  "com.twitter.android": "x.com",
  "twitter.com": "x.com",
  "com.linkedin.android": "linkedin.com",
  "lnkd.in": "linkedin.com",
  "com.google.android.gm": "mail.google.com",
  "com.google.android.googlequicksearchbox": "google.com",
  "com.reddit.frontpage": "reddit.com",
  "com.slack": "slack.com",
};

export function referrerIcon(value: string) {
  if (value === "(direct)" || value === "$direct") return <span className="stats-row-icon">{Glyph.link}</span>;
  const domain = APP_REFERRERS[value] ?? value;
  return <Favicon domain={domain} />;
}

const BROWSER_DOMAINS: Record<string, string> = {
  chrome: "google.com",
  "chrome ios": "google.com",
  "mobile safari": "apple.com",
  safari: "apple.com",
  firefox: "firefox.com",
  "firefox ios": "firefox.com",
  brave: "brave.com",
  "microsoft edge": "microsoft.com",
  edge: "microsoft.com",
  opera: "opera.com",
  "samsung internet": "samsung.com",
  yandex: "yandex.com",
  "facebook mobile": "facebook.com",
  instagram: "instagram.com",
  linkedin: "linkedin.com",
  "android mobile": "android.com",
  duckduckgo: "duckduckgo.com",
};

const OS_DOMAINS: Record<string, string> = {
  ios: "apple.com",
  "mac os x": "apple.com",
  macos: "apple.com",
  ipados: "apple.com",
  windows: "microsoft.com",
  android: "android.com",
  linux: "kernel.org",
  "chrome os": "google.com",
  ubuntu: "ubuntu.com",
};

export function browserIcon(name: string) {
  return <Favicon domain={BROWSER_DOMAINS[name.toLowerCase()] ?? ""} />;
}

export function osIcon(name: string) {
  return <Favicon domain={OS_DOMAINS[name.toLowerCase()] ?? ""} />;
}

export function deviceIcon(name: string) {
  const key = name.toLowerCase();
  return <span className="stats-row-icon">{key === "mobile" ? Glyph.mobile : key === "tablet" ? Glyph.tablet : Glyph.desktop}</span>;
}

const AI_DOMAINS: Record<string, string> = {
  chatgpt: "openai.com",
  openai: "openai.com",
  gptbot: "openai.com",
  "chatgpt-user": "openai.com",
  "oai-searchbot": "openai.com",
  claude: "claude.ai",
  anthropic: "anthropic.com",
  claudebot: "claude.ai",
  perplexity: "perplexity.ai",
  gemini: "gemini.google.com",
  "google ai": "google.com",
  googlebot: "google.com",
  google: "google.com",
  "meta ai": "meta.com",
  meta: "meta.com",
  amazon: "amazon.com",
  amazonbot: "amazon.com",
  linkup: "linkup.so",
  "you.com": "you.com",
  exa: "exa.ai",
  bing: "bing.com",
  bingbot: "bing.com",
  copilot: "copilot.microsoft.com",
  duckduckgo: "duckduckgo.com",
  apple: "apple.com",
  applebot: "apple.com",
  bytedance: "bytedance.com",
  bytespider: "bytedance.com",
  "common crawl": "commoncrawl.org",
  ccbot: "commoncrawl.org",
  mistral: "mistral.ai",
  deepseek: "deepseek.com",
  grok: "x.ai",
  xai: "x.ai",
  cohere: "cohere.com",
  diffbot: "diffbot.com",
  petalbot: "huawei.com",
  yandex: "yandex.com",
  kagi: "kagi.com",
};

export function aiIcon(name: string) {
  return <Favicon domain={AI_DOMAINS[name.toLowerCase()] ?? ""} fallback={Glyph.ai} />;
}

export function urlDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
