import { describe, expect, test } from "bun:test";
import { combinedOutreachStage, enrollmentProgressStage, STAGE_ACCEPTED, STAGE_CONTACTED, STAGE_MESSAGED, STAGE_REPLIED } from "../src/lib/outreach-stage";
import { buildActivityTotalsFromLive } from "../src/lib/activity-overview";
import { shouldKeepStealComment } from "../src/lib/competitor-engagement";

describe("combinedOutreachStage", () => {
  test("keeps the higher of enrollment and lead status so accepted invites still count after the sequence stops", () => {
    expect(combinedOutreachStage("stopped", "invited")).toBe(STAGE_CONTACTED);
    expect(combinedOutreachStage("connected", "replied")).toBe(STAGE_REPLIED);
    expect(combinedOutreachStage("message_sent", "connected")).toBe(STAGE_MESSAGED);
    expect(combinedOutreachStage("queued", "connected")).toBe(STAGE_ACCEPTED);
  });
});

describe("enrollmentProgressStage", () => {
  test("a stopped enrollment still counts as contacted when the invite was sent", () => {
    expect(enrollmentProgressStage("stopped", "2026-08-02T12:00:00.000Z")).toBe(STAGE_CONTACTED);
    expect(enrollmentProgressStage("error", "2026-08-02T12:00:00.000Z")).toBe(STAGE_CONTACTED);
    expect(enrollmentProgressStage("stopped")).toBe(0);
    expect(enrollmentProgressStage("message_sent", "2026-08-02T12:00:00.000Z")).toBe(STAGE_MESSAGED);
  });
});

describe("buildActivityTotalsFromLive", () => {
  test("attributes contacted people to the invite send day, not a later enrollment update", () => {
    const points = buildActivityTotalsFromLive({
      leads: [{ id: "lead-1", createdAt: "2026-08-01T00:00:00.000Z" }],
      enrollments: [
        {
          leadId: "lead-1",
          status: "connected",
          createdAt: "2026-08-01T00:00:00.000Z",
          updatedAt: "2026-08-10T00:00:00.000Z",
          connectionSentAt: "2026-08-02T12:00:00.000Z",
        },
      ],
      conversations: [],
    });
    const contacted = points.filter((point) => point.contacted > 0);
    expect(contacted).toHaveLength(1);
    expect(contacted[0]?.dateKey).toBe("2026-08-02");
    expect(contacted[0]?.contacted).toBe(1);
  });

  test("still counts a finished sequence as contacted when the invite was sent", () => {
    const points = buildActivityTotalsFromLive({
      leads: [{ id: "lead-1", outreachStatus: "invited" }],
      enrollments: [
        {
          leadId: "lead-1",
          status: "stopped",
          connectionSentAt: "2026-08-03T08:00:00.000Z",
        },
      ],
      conversations: [],
    });
    expect(points.find((point) => point.dateKey === "2026-08-03")?.contacted).toBe(1);
  });

  test("does not count a low-confidence meeting_booked label as a booked meeting", () => {
    const points = buildActivityTotalsFromLive({
      leads: [],
      enrollments: [],
      conversations: [
        {
          replyIntent: "meeting_booked",
          replyIntentConfidence: 0.2,
          replyIntentAt: "2026-08-04T00:00:00.000Z",
        },
      ],
    });
    expect(points.find((point) => point.dateKey === "2026-08-04")?.meetingsBooked || 0).toBe(0);
  });
});

describe("shouldKeepStealComment", () => {
  const comment =
    "How are you handling outbound follow-up after a demo no-show? We keep losing the thread.";

  test("keeps a substantive undated comment instead of emptying Steal Customers", () => {
    expect(
      shouldKeepStealComment({
        commentText: comment,
        productKeywords: ["outbound"],
      }),
    ).toBe(true);
  });
});
