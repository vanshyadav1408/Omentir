export type DailyDigestStats = {
  newLeads: number;
  invitesSent: number;
  connectionsAccepted: number;
  messagesSent: number;
  repliesReceived: number;
};

export const DAILY_DIGEST_METRICS = [
  { key: "newLeads", label: "New leads discovered" },
  { key: "invitesSent", label: "Connection invitations sent" },
  { key: "connectionsAccepted", label: "Connections accepted" },
  { key: "messagesSent", label: "Messages sent" },
  { key: "repliesReceived", label: "Replies received" },
] as const;

export type DailyDigestBarRow = {
  key: (typeof DAILY_DIGEST_METRICS)[number]["key"];
  label: string;
  value: number;
  percent: number;
};

// Scale each metric against the day's biggest count so the digest reads as a
// graph. A 1 next to a 100 still gets a sliver; a zero stays empty.
export function dailyDigestBarRows(stats: DailyDigestStats): DailyDigestBarRow[] {
  const values = DAILY_DIGEST_METRICS.map((metric) => Math.max(0, stats[metric.key] || 0));
  const max = Math.max(0, ...values);
  return DAILY_DIGEST_METRICS.map((metric, index) => {
    const value = values[index];
    const percent =
      max <= 0 ? 0 : Math.min(100, Math.max(value > 0 ? 4 : 0, Math.round((value / max) * 100)));
    return { key: metric.key, label: metric.label, value, percent };
  });
}

export const DEFAULT_DAILY_DIGEST_HOUR = 9;
export const DEFAULT_DAILY_DIGEST_EMAIL_ENABLED = false;
export const DAILY_DIGEST_CATCH_UP_SPAN = 2;

export function normalizeDailyDigestHour(value: unknown) {
  const hour = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return DEFAULT_DAILY_DIGEST_HOUR;
  return hour;
}

export const DAILY_DIGEST_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
  const suffix = hour < 12 ? "AM" : "PM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return { value: String(hour), label: `${twelve}:00 ${suffix}` };
});

// Same local calendar day only, so a 11pm send does not also fire at 12am as
// tomorrow's digest. Catch-up covers the chosen hour plus the next two hours
// that still fall on that day, matching the old 9am-11am window.
export function isDailyDigestSendHour(localHour: number, digestHour: unknown) {
  const start = normalizeDailyDigestHour(digestHour);
  const hour = ((Number(localHour) % 24) + 24) % 24;
  if (!Number.isInteger(hour) || hour < start) return false;
  return hour - start <= DAILY_DIGEST_CATCH_UP_SPAN;
}

// Same statuses entitlements treat as paid access. Cancelled, expired, and
// never-subscribed workspaces cannot keep the digest on.
export function billingAllowsDailyDigestEmail(status: unknown) {
  return status === "active" || status === "bypassed";
}

export function shouldSendDailyDigest(input: {
  enabled?: boolean;
  subscriptionActive?: boolean;
  localHour: number;
  digestHour?: unknown;
}) {
  if (input.subscriptionActive !== true) return false;
  if (input.enabled !== true) return false;
  return isDailyDigestSendHour(input.localHour, input.digestHour);
}
