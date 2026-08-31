import {
  CHANNEL_LABELS,
  REFERRAL_CHANNELS,
  classifyVisit,
  type ClassifiedVisit,
  type ReferralChannel,
} from "@/lib/referral-channel";

export const ATTRIBUTION_COOKIE = "omentir_ft";

export type StoredAttribution = {
  initial_channel: ReferralChannel;
  initial_channel_name: string;
  initial_referring_domain: string;
  initial_landing_path: string;
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

function isChannel(value: unknown): value is ReferralChannel {
  return typeof value === "string" && (REFERRAL_CHANNELS as readonly string[]).includes(value);
}

function fromVisit(visit: ClassifiedVisit): StoredAttribution {
  return {
    initial_channel: visit.channel,
    initial_channel_name: visit.channel_name,
    initial_referring_domain: visit.referring_domain,
    initial_landing_path: visit.landing_path,
    channel: visit.channel,
    channel_name: visit.channel_name,
    referring_domain: visit.referring_domain,
    landing_path: visit.landing_path,
    utm_source: visit.utm_source,
    utm_medium: visit.utm_medium,
    utm_campaign: visit.utm_campaign,
    utm_content: visit.utm_content,
    utm_term: visit.utm_term,
  };
}

export function mergeAttribution(
  existing: StoredAttribution | null,
  current: ClassifiedVisit,
): StoredAttribution {
  if (!existing) return fromVisit(current);
  if (current.channel === "direct") return existing;
  return {
    ...existing,
    channel: current.channel,
    channel_name: current.channel_name,
    referring_domain: current.referring_domain,
    landing_path: current.landing_path,
    utm_source: current.utm_source,
    utm_medium: current.utm_medium,
    utm_campaign: current.utm_campaign,
    utm_content: current.utm_content,
    utm_term: current.utm_term,
  };
}

export function parseStoredAttribution(raw: string | null | undefined): StoredAttribution | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    if (!isChannel(parsed.channel) || !isChannel(parsed.initial_channel)) return null;
    return {
      initial_channel: parsed.initial_channel,
      initial_channel_name:
        typeof parsed.initial_channel_name === "string"
          ? parsed.initial_channel_name
          : CHANNEL_LABELS[parsed.initial_channel],
      initial_referring_domain:
        typeof parsed.initial_referring_domain === "string" ? parsed.initial_referring_domain : "(direct)",
      initial_landing_path:
        typeof parsed.initial_landing_path === "string" ? parsed.initial_landing_path : "/",
      channel: parsed.channel,
      channel_name:
        typeof parsed.channel_name === "string" ? parsed.channel_name : CHANNEL_LABELS[parsed.channel],
      referring_domain: typeof parsed.referring_domain === "string" ? parsed.referring_domain : "(direct)",
      landing_path: typeof parsed.landing_path === "string" ? parsed.landing_path : "/",
      utm_source: typeof parsed.utm_source === "string" ? parsed.utm_source : "",
      utm_medium: typeof parsed.utm_medium === "string" ? parsed.utm_medium : "",
      utm_campaign: typeof parsed.utm_campaign === "string" ? parsed.utm_campaign : "",
      utm_content: typeof parsed.utm_content === "string" ? parsed.utm_content : "",
      utm_term: typeof parsed.utm_term === "string" ? parsed.utm_term : "",
    };
  } catch {
    return null;
  }
}

export function serializeStoredAttribution(value: StoredAttribution): string {
  return encodeURIComponent(JSON.stringify(value));
}

export function attributionProperties(value: StoredAttribution): Record<string, string> {
  return {
    channel: value.channel,
    channel_name: value.channel_name,
    referring_domain: value.referring_domain,
    landing_path: value.landing_path,
    initial_channel: value.initial_channel,
    initial_channel_name: value.initial_channel_name,
    initial_referring_domain: value.initial_referring_domain,
    initial_landing_path: value.initial_landing_path,
    utm_source: value.utm_source,
    utm_medium: value.utm_medium,
    utm_campaign: value.utm_campaign,
    utm_content: value.utm_content,
    utm_term: value.utm_term,
  };
}

export function cookieHeaderValue(value: StoredAttribution): string {
  return `${ATTRIBUTION_COOKIE}=${serializeStoredAttribution(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function readCookie(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) return trimmed.slice(eq + 1);
  }
  return undefined;
}

export function attributionFromCookieHeader(header: string | null | undefined): StoredAttribution | null {
  return parseStoredAttribution(readCookie(header, ATTRIBUTION_COOKIE));
}

export function rememberVisit(pageUrl: string, referrer: string, existingRaw?: string | null): StoredAttribution {
  const current = classifyVisit(pageUrl, referrer);
  return mergeAttribution(parseStoredAttribution(existingRaw), current);
}

export function attributionMetadata(value: StoredAttribution | null): Record<string, string> {
  if (!value) return {};
  return {
    channel: value.channel,
    referring_domain: value.referring_domain,
    initial_channel: value.initial_channel,
    initial_referring_domain: value.initial_referring_domain,
    landing_path: value.landing_path,
    utm_source: value.utm_source,
    utm_medium: value.utm_medium,
    utm_campaign: value.utm_campaign,
  };
}
