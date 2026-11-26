import { describe, expect, test } from "bun:test";
import { IDLE_ACCOUNT_AFTER_MS, isIdleLinkedInAccount } from "./linkedin-poll-cadence";

const now = Date.parse("2026-11-21T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

describe("isIdleLinkedInAccount", () => {
  test("an account with outreach in the last two weeks stays on the fast cadence, because replies to live outreach must reach the owner within minutes", () => {
    expect(isIdleLinkedInAccount(now - 60 * 1000, now)).toBe(false);
    expect(isIdleLinkedInAccount(now - 13 * DAY, now)).toBe(false);
    expect(isIdleLinkedInAccount(now - IDLE_ACCOUNT_AFTER_MS + 1, now)).toBe(false);
  });

  test("an account that sent nothing for two weeks is idle, so a connected but unused seat stops costing a proxy request every five minutes", () => {
    expect(isIdleLinkedInAccount(now - IDLE_ACCOUNT_AFTER_MS, now)).toBe(true);
    expect(isIdleLinkedInAccount(now - 90 * DAY, now)).toBe(true);
  });

  test("an account that never sent through Omentir is idle: nobody has been written to, so there is no reply to wait for", () => {
    expect(isIdleLinkedInAccount(undefined, now)).toBe(true);
    expect(isIdleLinkedInAccount(0, now)).toBe(true);
  });
});
