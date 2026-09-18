import { describe, expect, test } from "bun:test";
import {
  buildActionTimeline,
  lastInboundMessage,
  sequenceOutboundMessageTimes,
} from "./action-timeline";
import type { CampaignStep } from "./types";

const steps: CampaignStep[] = [
  { id: "connect", type: "connect", includeNote: false, noteTemplate: "" },
  { id: "wait-1", type: "wait", delayMinutes: 15 },
  { id: "first-message", type: "message", messageTemplate: "" },
  { id: "wait-2", type: "wait", delayMinutes: 60 },
  { id: "second-message", type: "message", messageTemplate: "" },
];

describe("sequenceOutboundMessageTimes", () => {
  test("stops at the first inbound so an AI reply cannot mark the next sequence step done", () => {
    expect(
      sequenceOutboundMessageTimes([
        { direction: "outbound", createdAt: "2026-09-18T10:00:00.000Z" },
        { direction: "inbound", createdAt: "2026-09-18T10:20:00.000Z" },
        { direction: "outbound", createdAt: "2026-09-18T10:25:00.000Z" },
      ]),
    ).toEqual(["2026-09-18T10:00:00.000Z"]);
  });
});

describe("lastInboundMessage", () => {
  test("returns the latest inbound so the schedule can show the reply they just sent", () => {
    expect(
      lastInboundMessage([
        { direction: "outbound", createdAt: "2026-09-18T10:00:00.000Z", body: "Hi" },
        { direction: "inbound", createdAt: "2026-09-18T10:20:00.000Z", body: "Interested" },
        { direction: "inbound", createdAt: "2026-09-18T10:22:00.000Z", body: "When can we talk?" },
      ])?.body,
    ).toBe("When can we talk?");
  });
});

describe("buildActionTimeline", () => {
  test("cancels leftover sequence steps after a reply so /leads cannot still promise a follow-up", () => {
    const timeline = buildActionTimeline({
      steps,
      stepIndex: 4,
      scheduledAt: "2026-09-18T11:00:00.000Z",
      connectionSentAt: "2026-09-18T09:00:00.000Z",
      sentMessageAts: ["2026-09-18T10:00:00.000Z"],
      connectionAccepted: true,
      sequenceStopped: true,
      repliedAt: "2026-09-18T10:20:00.000Z",
    });

    expect(timeline.map((item) => [item.id, item.status])).toEqual([
      ["connect", "completed"],
      ["first-message", "completed"],
      ["lead-replied", "completed"],
      ["second-message", "cancelled"],
    ]);
    expect(timeline.find((item) => item.id === "lead-replied")?.at).toBe(
      "2026-09-18T10:20:00.000Z",
    );
  });
});
