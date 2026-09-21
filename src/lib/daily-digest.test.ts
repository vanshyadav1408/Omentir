import { describe, expect, test } from "bun:test";
import {
  billingAllowsDailyDigestEmail,
  dailyDigestBarRows,
  DEFAULT_DAILY_DIGEST_EMAIL_ENABLED,
  isDailyDigestSendHour,
  shouldSendDailyDigest,
} from "./daily-digest";

describe("daily digest outreach graph", () => {
  test("scales bars against the day's biggest metric so smaller counts still show as shorter white bars", () => {
    const rows = dailyDigestBarRows({
      newLeads: 10,
      invitesSent: 5,
      connectionsAccepted: 0,
      messagesSent: 2,
      repliesReceived: 1,
    });
    expect(rows.find((row) => row.key === "newLeads")).toEqual({
      key: "newLeads",
      label: "New leads discovered",
      value: 10,
      percent: 100,
    });
    expect(rows.find((row) => row.key === "invitesSent")?.percent).toBe(50);
    expect(rows.find((row) => row.key === "connectionsAccepted")?.percent).toBe(0);
    expect(rows.find((row) => row.key === "messagesSent")?.percent).toBe(20);
  });

  test("gives a non-zero sliver to a count of 1 so it does not vanish next to a large day", () => {
    const rows = dailyDigestBarRows({
      newLeads: 100,
      invitesSent: 1,
      connectionsAccepted: 0,
      messagesSent: 0,
      repliesReceived: 0,
    });
    expect(rows.find((row) => row.key === "invitesSent")?.percent).toBe(4);
  });
});

describe("daily digest send window", () => {
  test("stays off for new workspaces until they opt in, so coming users are not emailed automatically", () => {
    expect(DEFAULT_DAILY_DIGEST_EMAIL_ENABLED).toBe(false);
    expect(
      shouldSendDailyDigest({
        enabled: DEFAULT_DAILY_DIGEST_EMAIL_ENABLED,
        subscriptionActive: true,
        localHour: 9,
        digestHour: 9,
      }),
    ).toBe(false);
  });

  test("stays off unless the workspace has turned the summary on", () => {
    expect(
      shouldSendDailyDigest({
        enabled: undefined,
        subscriptionActive: true,
        localHour: 9,
        digestHour: 9,
      }),
    ).toBe(false);
    expect(
      shouldSendDailyDigest({
        enabled: false,
        subscriptionActive: true,
        localHour: 9,
        digestHour: 9,
      }),
    ).toBe(false);
    expect(
      shouldSendDailyDigest({
        enabled: true,
        subscriptionActive: true,
        localHour: 9,
        digestHour: 9,
      }),
    ).toBe(true);
  });

  test("does not send after the subscription ends even if the opt-in flag was left on", () => {
    expect(
      shouldSendDailyDigest({
        enabled: true,
        subscriptionActive: false,
        localHour: 9,
        digestHour: 9,
      }),
    ).toBe(false);
    expect(
      shouldSendDailyDigest({
        enabled: true,
        subscriptionActive: undefined,
        localHour: 9,
        digestHour: 9,
      }),
    ).toBe(false);
  });

  test("sends at the chosen local hour and the next two hours the same day so a missed 9am tick still goes out", () => {
    expect(isDailyDigestSendHour(8, 9)).toBe(false);
    expect(isDailyDigestSendHour(9, 9)).toBe(true);
    expect(isDailyDigestSendHour(11, 9)).toBe(true);
    expect(isDailyDigestSendHour(12, 9)).toBe(false);
  });

  test("uses the workspace's chosen hour, not a hardcoded 9am, so a 5pm send does not fire at 9am", () => {
    expect(isDailyDigestSendHour(9, 17)).toBe(false);
    expect(isDailyDigestSendHour(17, 17)).toBe(true);
    expect(isDailyDigestSendHour(19, 17)).toBe(true);
    expect(isDailyDigestSendHour(20, 17)).toBe(false);
    expect(
      shouldSendDailyDigest({
        enabled: true,
        subscriptionActive: true,
        localHour: 17,
        digestHour: 17,
      }),
    ).toBe(true);
    expect(
      shouldSendDailyDigest({
        enabled: true,
        subscriptionActive: true,
        localHour: 9,
        digestHour: 17,
      }),
    ).toBe(false);
  });

  test("does not wrap midnight so an 11pm digest cannot also send as tomorrow's 12am mail", () => {
    expect(isDailyDigestSendHour(23, 23)).toBe(true);
    expect(isDailyDigestSendHour(0, 23)).toBe(false);
    expect(isDailyDigestSendHour(22, 22)).toBe(true);
    expect(isDailyDigestSendHour(23, 22)).toBe(true);
    expect(isDailyDigestSendHour(0, 22)).toBe(false);
  });

  test("treats Intl midnight hour 24 as 0 so a 12am digest is not skipped", () => {
    expect(isDailyDigestSendHour(24, 0)).toBe(true);
    expect(isDailyDigestSendHour(24, 9)).toBe(false);
  });

  test("only active or bypassed billing can keep the digest on so expiry and cancel turn it off", () => {
    expect(billingAllowsDailyDigestEmail("active")).toBe(true);
    expect(billingAllowsDailyDigestEmail("bypassed")).toBe(true);
    expect(billingAllowsDailyDigestEmail("expired")).toBe(false);
    expect(billingAllowsDailyDigestEmail("cancelled")).toBe(false);
    expect(billingAllowsDailyDigestEmail("suspended")).toBe(false);
    expect(billingAllowsDailyDigestEmail(undefined)).toBe(false);
  });
});
