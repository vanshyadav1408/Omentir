export const LINKEDIN_ACTIVITY_WINDOW_DAYS = 30;

const FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1000;

export type LinkedInActivitySource = "post" | "comment" | "reaction";

export type LinkedInActivityEvidence = {
  observedAt: string;
  source: LinkedInActivitySource;
};

type ActivitySignal = {
  signalType: string;
  signalSource: string;
  activityObservedAt?: string;
};

type ActivityPost = {
  createdAt: string;
};

function parseRecentTimestamp(value: string | undefined, nowMs: number, windowDays: number) {
  const timestamp = Date.parse(value || "");
  if (!Number.isFinite(timestamp)) return null;
  if (timestamp > nowMs + FUTURE_CLOCK_SKEW_MS) return null;
  if (timestamp < nowMs - windowDays * 24 * 60 * 60 * 1000) return null;
  return timestamp;
}

function signalActivitySource(signal: ActivitySignal): LinkedInActivitySource | null {
  if (signal.signalType === "post_comment") return "comment";
  if (signal.signalType === "post_reaction") return "reaction";
  if (/\b(?:post author|authored post)\b/i.test(signal.signalSource)) return "post";
  return null;
}

export function recentLinkedInActivityFromSignals(
  signals: ActivitySignal[],
  nowMs = Date.now(),
  windowDays = LINKEDIN_ACTIVITY_WINDOW_DAYS,
): LinkedInActivityEvidence | null {
  let newest: (LinkedInActivityEvidence & { timestamp: number }) | null = null;

  for (const signal of signals) {
    const source = signalActivitySource(signal);
    if (!source) continue;
    const timestamp = parseRecentTimestamp(signal.activityObservedAt, nowMs, windowDays);
    if (timestamp === null || (newest && timestamp <= newest.timestamp)) continue;
    newest = {
      observedAt: new Date(timestamp).toISOString(),
      source,
      timestamp,
    };
  }

  return newest ? { observedAt: newest.observedAt, source: newest.source } : null;
}

export function recentLinkedInActivityFromPosts(
  posts: ActivityPost[],
  nowMs = Date.now(),
  windowDays = LINKEDIN_ACTIVITY_WINDOW_DAYS,
): LinkedInActivityEvidence | null {
  let newestTimestamp: number | null = null;

  for (const post of posts) {
    const timestamp = parseRecentTimestamp(post.createdAt, nowMs, windowDays);
    if (timestamp === null || (newestTimestamp !== null && timestamp <= newestTimestamp)) continue;
    newestTimestamp = timestamp;
  }

  return newestTimestamp === null
    ? null
    : { observedAt: new Date(newestTimestamp).toISOString(), source: "post" };
}
