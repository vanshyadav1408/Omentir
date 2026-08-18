import { describe, expect, test } from "bun:test";
import {
  canEnrollLeadForOutreach,
  enrollmentBlocksAiReply,
  enrollmentIsTerminalForSequence,
  shouldArmAiReply,
  shouldHaltOutreachSend,
  shouldStopForReply,
  USER_STOPPED_OUTREACH_ERROR,
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

  test("keeps a user-stopped lead silent even if they write back", () => {
    // The Actions-page stop is a hard opt-out: AI must not resume the thread.
    expect(enrollmentBlocksAiReply({ lastError: USER_STOPPED_OUTREACH_ERROR })).toBe(true);
  });
});

describe("Actions-page Stop outreach", () => {
  // What stopLeadOutreach writes for a lead who had already been invited.
  const invitedStopped = {
    enrollmentStatus: "stopped",
    lastError: USER_STOPPED_OUTREACH_ERROR,
    outreachStatus: "invited",
  };
  // Uncontacted lead: enrollment stop plus outreachStatus flip so they cannot
  // be picked up again by enrollNewLeadsInCampaign.
  const newStopped = {
    enrollmentStatus: "stopped",
    lastError: USER_STOPPED_OUTREACH_ERROR,
    outreachStatus: "stopped",
  };

  test("does not send a sequence message, a manual Run now, or an AI reply after the user stops an invited lead", () => {
    for (const kind of ["sequence", "manual", "ai_reply"] as const) {
      expect(shouldHaltOutreachSend({ ...invitedStopped, kind })).toBe(true);
    }
    expect(shouldArmAiReply({
      replyHandling: "ai_until_interest",
      enrollmentStatus: "stopped",
      lastError: USER_STOPPED_OUTREACH_ERROR,
    })).toBe(false);
    expect(enrollmentIsTerminalForSequence(invitedStopped.enrollmentStatus)).toBe(true);
  });

  test("does not re-enroll a lead who was stopped before the first send", () => {
    expect(canEnrollLeadForOutreach(newStopped.outreachStatus)).toBe(false);
    for (const kind of ["sequence", "manual", "ai_reply"] as const) {
      expect(shouldHaltOutreachSend({ ...newStopped, kind })).toBe(true);
    }
  });

  test("a live queued lead can still send until the user stops them", () => {
    expect(
      shouldHaltOutreachSend({
        enrollmentStatus: "queued",
        outreachStatus: "new",
        kind: "sequence",
      }),
    ).toBe(false);
    expect(canEnrollLeadForOutreach("new")).toBe(true);
  });

  test("connected and messaged leads stay halted after a user stop even though outreachStatus is not rewritten", () => {
    for (const outreachStatus of ["connected", "messaged"] as const) {
      expect(
        shouldHaltOutreachSend({
          enrollmentStatus: "stopped",
          lastError: USER_STOPPED_OUTREACH_ERROR,
          outreachStatus,
          kind: "sequence",
        }),
      ).toBe(true);
      expect(canEnrollLeadForOutreach(outreachStatus)).toBe(false);
    }
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
