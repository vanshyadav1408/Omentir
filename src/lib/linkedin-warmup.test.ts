import { describe, expect, test } from "bun:test";
import {
  DEFAULT_DAILY_INVITE_LIMIT,
  DEFAULT_DAILY_MESSAGE_LIMIT,
  GRADUATED_DAILY_DISCOVERY_ATTEMPTS,
  GRADUATED_MAX_ENRICHMENTS_PER_RUN,
  LINKEDIN_WARMUP_DAYS,
  WARMUP_DAILY_DISCOVERY_ATTEMPTS,
  WARMUP_DAILY_INVITE_LIMIT,
  WARMUP_DAILY_MESSAGE_LIMIT,
  WARMUP_MAX_ENRICHMENTS_PER_RUN,
  dailyDiscoveryAttemptsForAccount,
  effectiveDailyInviteLimit,
  effectiveDailyMessageLimit,
  effectiveSendLimits,
  isLinkedInAccountInWarmup,
  linkedInWarmupStartedAt,
  maxEnrichmentsPerDiscoveryRun,
  shouldRestartLinkedInWarmup,
} from "./linkedin-warmup";

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.parse("2026-08-29T12:00:00.000Z");

function account(startedAt: string, createdAt = "2026-01-01T00:00:00.000Z") {
  return { warmupStartedAt: startedAt, createdAt };
}

describe("LinkedIn account warmup", () => {
  test("a brand-new account is in warmup so day-one volume cannot match a seasoned seat", () => {
    const fresh = account(new Date(now).toISOString());
    expect(isLinkedInAccountInWarmup(fresh, now)).toBe(true);
    expect(effectiveSendLimits(
      { dailyInviteLimit: DEFAULT_DAILY_INVITE_LIMIT, dailyMessageLimit: DEFAULT_DAILY_MESSAGE_LIMIT },
      fresh,
      now,
    )).toEqual({
      dailyInviteLimit: WARMUP_DAILY_INVITE_LIMIT,
      dailyMessageLimit: WARMUP_DAILY_MESSAGE_LIMIT,
    });
    expect(dailyDiscoveryAttemptsForAccount(fresh, now)).toBe(WARMUP_DAILY_DISCOVERY_ATTEMPTS);
    expect(maxEnrichmentsPerDiscoveryRun(fresh, now)).toBe(WARMUP_MAX_ENRICHMENTS_PER_RUN);
  });

  test("warmup lasts 14 days and graduates at the 14-day mark, not before", () => {
    const started = new Date(now - (LINKEDIN_WARMUP_DAYS * DAY_MS - 1)).toISOString();
    const graduatedAt = new Date(now - LINKEDIN_WARMUP_DAYS * DAY_MS).toISOString();
    expect(isLinkedInAccountInWarmup(account(started), now)).toBe(true);
    expect(isLinkedInAccountInWarmup(account(graduatedAt), now)).toBe(false);
  });

  test("accounts older than 14 days keep graduated 10/20/4/500 even when Settings still hold the workspace defaults", () => {
    const old = { createdAt: new Date(now - 30 * DAY_MS).toISOString() };
    expect(linkedInWarmupStartedAt(old)).toBe(old.createdAt);
    expect(isLinkedInAccountInWarmup(old, now)).toBe(false);
    expect(effectiveDailyInviteLimit(DEFAULT_DAILY_INVITE_LIMIT, old, now)).toBe(10);
    expect(effectiveDailyMessageLimit(DEFAULT_DAILY_MESSAGE_LIMIT, old, now)).toBe(20);
    expect(dailyDiscoveryAttemptsForAccount(old, now)).toBe(GRADUATED_DAILY_DISCOVERY_ATTEMPTS);
    expect(maxEnrichmentsPerDiscoveryRun(old, now)).toBe(GRADUATED_MAX_ENRICHMENTS_PER_RUN);
  });

  test("warmup is a per-account ceiling, so a new seat does not require rewriting workspace Settings down to 5/10", () => {
    const warming = account(new Date(now).toISOString());
    const seasoned = { createdAt: new Date(now - 60 * DAY_MS).toISOString() };
    const settings = {
      dailyInviteLimit: DEFAULT_DAILY_INVITE_LIMIT,
      dailyMessageLimit: DEFAULT_DAILY_MESSAGE_LIMIT,
    };
    expect(effectiveSendLimits(settings, warming, now).dailyInviteLimit).toBe(5);
    expect(effectiveSendLimits(settings, seasoned, now).dailyInviteLimit).toBe(10);
  });

  test("Settings stays writable during warmup: lowering below 5/10 is honored, raising is stored for after graduation", () => {
    const warming = account(new Date(now).toISOString());
    expect(effectiveDailyInviteLimit(3, warming, now)).toBe(3);
    expect(effectiveDailyMessageLimit(8, warming, now)).toBe(8);
    expect(effectiveDailyInviteLimit(50, warming, now)).toBe(WARMUP_DAILY_INVITE_LIMIT);
    expect(effectiveDailyInviteLimit(50, { createdAt: new Date(now - 20 * DAY_MS).toISOString() }, now)).toBe(50);
  });

  test("reconnect after a restriction restarts the clock even if createdAt is old", () => {
    const reconnected = account(
      new Date(now).toISOString(),
      new Date(now - 90 * DAY_MS).toISOString(),
    );
    expect(shouldRestartLinkedInWarmup("disconnected")).toBe(true);
    expect(shouldRestartLinkedInWarmup("error")).toBe(true);
    expect(shouldRestartLinkedInWarmup("connected")).toBe(false);
    expect(shouldRestartLinkedInWarmup(undefined)).toBe(true);
    expect(isLinkedInAccountInWarmup(reconnected, now)).toBe(true);
    expect(effectiveDailyInviteLimit(DEFAULT_DAILY_INVITE_LIMIT, reconnected, now)).toBe(5);
  });

  test("a connected-account profile refresh must not look like a reconnect", () => {
    expect(shouldRestartLinkedInWarmup("connected")).toBe(false);
  });

  test("qualified-lead daily cap is not part of warmup (75 stays elsewhere)", () => {
    expect(WARMUP_MAX_ENRICHMENTS_PER_RUN).toBe(100);
    expect(GRADUATED_MAX_ENRICHMENTS_PER_RUN).toBe(500);
    expect(WARMUP_DAILY_DISCOVERY_ATTEMPTS).toBe(1);
    expect(GRADUATED_DAILY_DISCOVERY_ATTEMPTS).toBe(4);
  });
});
