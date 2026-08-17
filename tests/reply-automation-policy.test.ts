import { describe, expect, test } from "bun:test";
import {
  enrollmentBlocksAiReply,
  shouldArmAiReply,
  shouldStopForReply,
} from "../src/lib/server/reply-automation-policy";

describe("shouldArmAiReply", () => {
  test("arms a reply that arrives before the invite-accepted webhook", () => {
    // LinkedIn often delivers accept-and-message as a DM while the enrollment
    // is still connection_sent. Dropping that inbound is how warm leads go
    // unanswered.
    expect(
      shouldArmAiReply({
        replyHandling: "ai_until_interest",
        enrollmentStatus: "connection_sent",
      }),
    ).toBe(true);
  });

  test("arms a late reply after the unanswered sequence stopped", () => {
    expect(
      shouldArmAiReply({
        replyHandling: "ai_until_interest",
        enrollmentStatus: "stopped",
      }),
    ).toBe(true);
  });

  test("re-arms the next turn even when the prior inbound was not classified", () => {
    expect(
      shouldArmAiReply({
        replyHandling: "ai_until_interest",
        enrollmentStatus: "replied",
      }),
    ).toBe(true);
  });

  test("does not revive a conversation after a terminal no", () => {
    expect(
      shouldArmAiReply({
        replyHandling: "ai_until_interest",
        enrollmentStatus: "replied",
        previousIntent: "negative",
        previousIntentConfidence: 0.9,
      }),
    ).toBe(false);
  });

  test("never arms handoff campaigns", () => {
    expect(
      shouldArmAiReply({
        replyHandling: "handoff",
        enrollmentStatus: "message_sent",
      }),
    ).toBe(false);
  });
});

describe("enrollmentBlocksAiReply", () => {
  test("keeps deleted-agent and leads-only stops dead", () => {
    expect(
      enrollmentBlocksAiReply({
        lastError: "The agent that sourced this lead was deleted; outreach stopped.",
      }),
    ).toBe(true);
    expect(
      enrollmentBlocksAiReply({
        lastError:
          "This lead was found by a leads-only agent and must not be messaged automatically.",
      }),
    ).toBe(true);
  });

  test("lets a sequence-exhausted lead be answered when they finally write back", () => {
    expect(
      enrollmentBlocksAiReply({
        lastError: "AI sequence finished after 3 messages with no reply; outreach stopped for this lead.",
      }),
    ).toBe(false);
  });
});

describe("shouldStopForReply", () => {
  test("ordinary replies still get an AI answer in until-interest mode", () => {
    expect(
      shouldStopForReply({
        replyHandling: "ai_until_interest",
        intent: "question",
        confidence: 0.8,
      }),
    ).toBe(false);
  });
});
