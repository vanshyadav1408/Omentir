// LinkedIn restricts accounts that pile up unanswered invitations. Vansh's own
// account was restricted in July 2026 with 342 stale pending invites, and any
// customer running outreach for a few months drifts toward the same pool. The
// meter warns before LinkedIn does; auto-withdraw keeps the pool small. It is on
// for every workspace unless the owner turns it off.

const DAY_MS = 24 * 60 * 60 * 1000;

// Offered in Settings. The shortest is four weeks on purpose: it is past the
// 21-day point where a campaign stops waiting on an invite, so withdrawing never
// cuts off a live sequence.
export const INVITE_WITHDRAW_AFTER_DAYS_OPTIONS = [28, 42, 56] as const;

export const DEFAULT_INVITE_WITHDRAW_AFTER_DAYS = 28;

// Unset (every workspace that never touched the setting) means the default, so
// the protection reaches existing customers without a backfill. Only an
// explicit 0 turns it off.
export function normalizeInviteWithdrawAfterDays(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_INVITE_WITHDRAW_AFTER_DAYS;
  }
  const days = Number(value);
  if (days === 0) return 0;
  return (INVITE_WITHDRAW_AFTER_DAYS_OPTIONS as readonly number[]).includes(days)
    ? days
    : DEFAULT_INVITE_WITHDRAW_AFTER_DAYS;
}

// Most withdrawals one account makes per day. Clearing a backlog of hundreds in
// one burst is its own unusual pattern; a few days of 50 is not.
export const MAX_DAILY_INVITE_WITHDRAWALS = 50;

// Oldest first, so a backlog clears from the invites least likely to be accepted.
export function staleInvitationIds(
  invitations: Array<{ id: string; sentAt?: string }>,
  input: { nowMs: number; afterDays: number; max: number },
) {
  if (input.afterDays <= 0) return [];
  const cutoff = input.nowMs - input.afterDays * DAY_MS;
  return invitations
    .filter((invite) => {
      const sent = invite.sentAt ? Date.parse(invite.sentAt) : NaN;
      // An undated invite is never withdrawn: guessing its age wrong cancels
      // an invite the user just sent.
      return Number.isFinite(sent) && sent <= cutoff;
    })
    .sort((a, b) => Date.parse(a.sentAt!) - Date.parse(b.sentAt!))
    .slice(0, input.max)
    .map((invite) => invite.id);
}

// Invites need about a week to be answered, so the rate covers 30 days of
// invites ending a week ago. Counting this week's would read every new invite
// as a rejection.
export const ACCEPTANCE_WINDOW_DAYS = 30;
export const ACCEPTANCE_GRACE_DAYS = 7;
// Below this many invites the rate is noise.
export const MIN_INVITES_FOR_RATE = 15;

// Built from Omentir's own records (when the invite went out, and whether the
// lead got to "accepted"), not from LinkedIn's pending list: Unipile only
// knows pending invites by labels like "1 week ago" or "1 month ago", which are
// too coarse to window, and one LinkedIn account can be shared by several
// workspaces. A withdrawn or ignored invite never reaches accepted, so both
// count against the rate, as they do on LinkedIn.
export function acceptanceSample(
  invites: Array<{ sentAt?: string; accepted: boolean }>,
  nowMs: number,
) {
  const end = nowMs - ACCEPTANCE_GRACE_DAYS * DAY_MS;
  const start = end - ACCEPTANCE_WINDOW_DAYS * DAY_MS;
  let sent = 0;
  let accepted = 0;
  for (const invite of invites) {
    const at = invite.sentAt ? Date.parse(invite.sentAt) : NaN;
    if (!Number.isFinite(at) || at < start || at > end) continue;
    sent += 1;
    if (invite.accepted) accepted += 1;
  }
  return { sent, accepted };
}

export function acceptanceRate(sent: number, accepted: number) {
  if (sent < MIN_INVITES_FOR_RATE) return null;
  return accepted / sent;
}

export type HealthLevel = "ok" | "warn" | "danger";

export const PENDING_INVITES_WARN = 200;
export const PENDING_INVITES_DANGER = 300;

export function pendingInvitesLevel(pending: number): HealthLevel {
  if (pending >= PENDING_INVITES_DANGER) return "danger";
  if (pending >= PENDING_INVITES_WARN) return "warn";
  return "ok";
}

export function acceptanceRateLevel(rate: number | null): HealthLevel {
  if (rate === null) return "ok";
  if (rate < 0.2) return "danger";
  if (rate < 0.3) return "warn";
  return "ok";
}

export type LinkedInAccountHealth = {
  linkedInAccountId: string;
  pendingInvites: number;
  // False when the pending list could not be read in full; the count is then
  // a floor and the UI says so.
  pendingComplete: boolean;
  invitesSentInWindow: number;
  acceptedInWindow: number;
  profileViewsToday: number;
  profileViewLimit: number;
  withdrawAfterDays: number;
};
