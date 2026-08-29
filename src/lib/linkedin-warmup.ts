// Per-LinkedIn-account warmup. LinkedIn restrictions attach to the connected
// seat, so this clock is account-scoped, never workspace-scoped. Workspace
// Settings stay at the graduated defaults (10 invites / 20 messages) and stay
// editable; warmup is a runtime ceiling on that one account.

export const LINKEDIN_WARMUP_DAYS = 14;

export const DEFAULT_DAILY_INVITE_LIMIT = 10;
export const DEFAULT_DAILY_MESSAGE_LIMIT = 20;

export const WARMUP_DAILY_INVITE_LIMIT = 5;
export const WARMUP_DAILY_MESSAGE_LIMIT = 10;
export const WARMUP_DAILY_DISCOVERY_ATTEMPTS = 1;
export const WARMUP_MAX_ENRICHMENTS_PER_RUN = 100;

export const GRADUATED_DAILY_DISCOVERY_ATTEMPTS = 4;
export const GRADUATED_MAX_ENRICHMENTS_PER_RUN = 500;

const WARMUP_MS = LINKEDIN_WARMUP_DAYS * 24 * 60 * 60 * 1000;

export type LinkedInWarmupAccount = {
  warmupStartedAt?: string;
  createdAt: string;
};

export function linkedInWarmupStartedAt(account: LinkedInWarmupAccount) {
  return account.warmupStartedAt || account.createdAt;
}

export function isLinkedInAccountInWarmup(
  account: LinkedInWarmupAccount | null | undefined,
  nowMs = Date.now(),
) {
  if (!account) return false;
  const startedAt = Date.parse(linkedInWarmupStartedAt(account));
  if (!Number.isFinite(startedAt)) return false;
  return nowMs - startedAt < WARMUP_MS;
}

// First connect, or reconnect after disconnect/error. Profile refreshes of an
// already-connected account must not move the clock. Missing status is a new
// doc: start warmup.
export function shouldRestartLinkedInWarmup(existingStatus?: string | null) {
  return existingStatus !== "connected";
}

export function effectiveDailyInviteLimit(
  workspaceLimit: number,
  account: LinkedInWarmupAccount | null | undefined,
  nowMs = Date.now(),
) {
  if (!isLinkedInAccountInWarmup(account, nowMs)) return workspaceLimit;
  return Math.min(workspaceLimit, WARMUP_DAILY_INVITE_LIMIT);
}

export function effectiveDailyMessageLimit(
  workspaceLimit: number,
  account: LinkedInWarmupAccount | null | undefined,
  nowMs = Date.now(),
) {
  if (!isLinkedInAccountInWarmup(account, nowMs)) return workspaceLimit;
  return Math.min(workspaceLimit, WARMUP_DAILY_MESSAGE_LIMIT);
}

export function effectiveSendLimits(
  settings: { dailyInviteLimit: number; dailyMessageLimit: number },
  account: LinkedInWarmupAccount | null | undefined,
  nowMs = Date.now(),
) {
  return {
    dailyInviteLimit: effectiveDailyInviteLimit(settings.dailyInviteLimit, account, nowMs),
    dailyMessageLimit: effectiveDailyMessageLimit(settings.dailyMessageLimit, account, nowMs),
  };
}

export function dailyDiscoveryAttemptsForAccount(
  account: LinkedInWarmupAccount | null | undefined,
  nowMs = Date.now(),
) {
  return isLinkedInAccountInWarmup(account, nowMs)
    ? WARMUP_DAILY_DISCOVERY_ATTEMPTS
    : GRADUATED_DAILY_DISCOVERY_ATTEMPTS;
}

export function maxEnrichmentsPerDiscoveryRun(
  account: LinkedInWarmupAccount | null | undefined,
  nowMs = Date.now(),
) {
  return isLinkedInAccountInWarmup(account, nowMs)
    ? WARMUP_MAX_ENRICHMENTS_PER_RUN
    : GRADUATED_MAX_ENRICHMENTS_PER_RUN;
}
