import { describe, expect, test } from "bun:test";
import { inviteCooldownPark } from "./send-schedule";

describe("inviteCooldownPark", () => {
  const nowMs = Date.parse("2026-09-24T08:30:00.000Z");

  test("parks until the breaker ends so thousands of blocked invites stop re-entering the due queue every 30 minutes", () => {
    // The breaker ends tomorrow; any earlier wake is a guaranteed no-op that
    // takes a due-page slot away from a follow-up a real person is waiting on.
    expect(inviteCooldownPark("2026-09-25T08:01:13.102Z", nowMs)).toEqual({
      nextActionAt: "2026-09-25T08:01:13.102Z",
      inviteCooldownParkedAt: "2026-09-24T08:30:00.000Z",
    });
  });

  test("a breaker that already ended never schedules the invite in the past", () => {
    const park = inviteCooldownPark("2026-09-24T08:00:00.000Z", nowMs);
    expect(park.nextActionAt).toBe("2026-09-24T08:30:00.000Z");
  });

  test("marks the enrollment so an early lift can wake it", () => {
    expect(inviteCooldownPark("2026-09-25T08:00:00.000Z", nowMs).inviteCooldownParkedAt).toBeTruthy();
  });
});
