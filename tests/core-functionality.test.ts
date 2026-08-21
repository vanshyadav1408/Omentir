import { describe, expect, test } from "bun:test";
import { combinedOutreachStage, countAcceptedConnections, enrollmentProgressStage, STAGE_ACCEPTED, STAGE_CONTACTED, STAGE_MESSAGED, STAGE_REPLIED } from "../src/lib/outreach-stage";
import { buildActivityTotalsFromLive, toActivityChartPoints } from "../src/lib/activity-overview";
import { shouldKeepStealComment } from "../src/lib/competitor-engagement";
import { conversationCategory } from "../src/lib/conversation-category";
import { classifyReplyIntent } from "../src/lib/server/gemini";
import type { Lead } from "../src/lib/server/types";

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

describe("countAcceptedConnections", () => {
  test("counts unique people whose outreach reached accepted, including repeat enrollments", () => {
    expect(
      countAcceptedConnections(
        [
          { id: "lead-1", outreachStatus: "invited" },
          { id: "lead-2", outreachStatus: "connected" },
          { id: "lead-3", outreachStatus: "invited" },
        ],
        [
          { leadId: "lead-1", status: "connected" },
          { leadId: "lead-1", status: "stopped" },
          { leadId: "lead-3", status: "connection_sent" },
        ],
      ),
    ).toBe(2);
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

  test("counts a calendar event link after an inbound booking request", () => {
    const points = buildActivityTotalsFromLive({
      leads: [],
      enrollments: [],
      conversations: [
        {
          replyIntent: "hot",
          messages: [
            {
              direction: "inbound",
              body: "bro just book meeting my calander",
              createdAt: "2026-08-21T02:45:53.994Z",
            },
            {
              direction: "inbound",
              body: "https://calendar.app.google/PdMuZPkN1jjutn9eA",
              createdAt: "2026-08-21T02:46:36.871Z",
            },
          ],
        },
      ],
    });
    expect(points.find((point) => point.dateKey === "2026-08-21")?.meetingsBooked).toBe(1);
  });

});

describe("reply intent classification", () => {
  test("recognizes a calendar confirmation without depending on the model", async () => {
    const classification = await classifyReplyIntent({
      lead: { name: "Alex" } as Lead,
      productProfile: null,
      conversation: [],
      latestInbound: "I added the demo to my calendar for Thursday.",
    });
    expect(classification.intent).toBe("meeting_booked");
    expect(classification.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test("recognizes a calendar event link after a booking request", async () => {
    const classification = await classifyReplyIntent({
      lead: { name: "Alex" } as Lead,
      productProfile: null,
      conversation: [
        {
          id: "message-1",
          direction: "inbound",
          senderName: "Alex",
          body: "Please book a meeting on my calendar.",
          createdAt: "2026-08-21T02:45:53.994Z",
        },
      ],
      latestInbound: "https://calendar.app.google/PdMuZPkN1jjutn9eA",
    });
    expect(classification.intent).toBe("meeting_booked");
    expect(classification.confidence).toBeGreaterThanOrEqual(0.9);
  });
});

describe("activity chart range", () => {
  test("uses the selected date range and includes zero-activity days through its end", () => {
    const points = toActivityChartPoints(
      [
        {
          dateKey: "2026-08-01",
          found: 4,
          contacted: 0,
          replies: 0,
          meetingsBooked: 0,
        },
        {
          dateKey: "2026-08-10",
          found: 0,
          contacted: 0,
          replies: 0,
          meetingsBooked: 1,
        },
      ],
      {
        maxDays: 3,
        startDateKey: "2026-08-08",
        endDateKey: "2026-08-10",
      },
    );

    expect(points.map((point) => point.dateKey)).toEqual([
      "2026-08-08",
      "2026-08-09",
      "2026-08-10",
    ]);
    expect(points[2]?.meetingsBooked).toBe(1);
  });
});

describe("conversationCategory", () => {
  test("does not promote a low-confidence booking into successful", () => {
    expect(
      conversationCategory({
        replyIntent: "meeting_booked",
        replyIntentConfidence: 0.2,
        replyIntentAt: "2026-08-04T00:00:00.000Z",
      }),
    ).toBe("follow");
  });

  test("keeps a confirmed booking successful after later replies", () => {
    expect(
      conversationCategory({
        replyIntent: "neutral",
        replyIntentConfidence: 0.4,
        replyIntentAt: "2026-08-05T00:00:00.000Z",
        meetingBookedAt: "2026-08-04T00:00:00.000Z",
      }),
    ).toBe("successful");
  });

  test("treats a calendar event link after a booking request as successful", () => {
    expect(
      conversationCategory({
        replyIntent: "neutral",
        messages: [
          {
            direction: "inbound",
            body: "Please book a meeting on my calendar.",
          },
          {
            direction: "inbound",
            body: "https://calendar.app.google/PdMuZPkN1jjutn9eA",
          },
        ],
      }),
    ).toBe("successful");
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
