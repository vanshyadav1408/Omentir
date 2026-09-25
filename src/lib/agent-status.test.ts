import { describe, expect, test } from "bun:test";
import { describeAgentStatus, type AgentStatusFacts } from "./agent-status";

const NOW = Date.parse("2026-09-25T10:00:00.000Z");
const formatAt = (iso: string) => `<${iso}>`;
const options = { subscriptionActive: true, nowMs: NOW, formatAt };

const sending: AgentStatusFacts = {
  agentStatus: "active",
  leadsOnly: false,
  findsLeads: true,
  nextRunAt: "2026-09-26T08:00:00.000Z",
  accountConnected: true,
  automationPaused: false,
  campaignStatus: "active",
  nextSend: { kind: "invite", at: "2026-09-25T14:40:00.000Z" },
  awaitingAcceptance: 0,
};

describe("describeAgentStatus", () => {
  test("a lapsed subscription says so, because the tick skips these agents without logging anything", () => {
    // This is how both July customers went quiet: the agent looked active and
    // simply stopped. The plan check has to beat every other state.
    const line = describeAgentStatus(sending, { ...options, subscriptionActive: false });
    expect(line.tone).toBe("stopped");
    expect(line.text).toContain("subscription ended");
  });

  test("a healthy agent names its next send and when, so the user can see it is working", () => {
    const line = describeAgentStatus(sending, options);
    expect(line).toEqual({
      tone: "active",
      label: "Sending",
      text: "Next invite <2026-09-25T14:40:00.000Z>.",
    });
  });

  test("a send already due reads as going out now, not a timestamp in the past", () => {
    const line = describeAgentStatus(
      { ...sending, nextSend: { kind: "message", at: "2026-09-25T09:58:00.000Z" } },
      options,
    );
    expect(line.text).toBe("Next message is going out now.");
  });

  test("invites parked by the LinkedIn breaker read as a LinkedIn limit with its end time", () => {
    // Parked invites carry the breaker's end as their time. Showing only that
    // time made a 2-day pause look like a normal schedule.
    const line = describeAgentStatus(
      {
        ...sending,
        inviteLimitUntil: "2026-09-27T08:00:00.000Z",
        nextSend: { kind: "invite", at: "2026-09-27T08:00:00.000Z" },
      },
      options,
    );
    expect(line.tone).toBe("paused");
    expect(line.text).toBe(
      "LinkedIn limited invites from this account. Invites resume <2026-09-27T08:00:00.000Z>.",
    );
  });

  test("messages still flowing under an invite breaker keep the agent active but mention the limit", () => {
    const line = describeAgentStatus(
      {
        ...sending,
        inviteLimitUntil: "2026-09-27T08:00:00.000Z",
        nextSend: { kind: "reply", at: "2026-09-25T11:00:00.000Z" },
      },
      options,
    );
    expect(line.tone).toBe("active");
    expect(line.text).toContain("Next reply <2026-09-25T11:00:00.000Z>.");
    expect(line.text).toContain("paused by LinkedIn");
  });

  test("a paused campaign under an active agent is called out, since it never reaches the Actions page", () => {
    const line = describeAgentStatus({ ...sending, campaignStatus: "paused" }, options);
    expect(line.tone).toBe("paused");
    expect(line.text).toContain("Outreach is paused");
  });

  test("a disconnected LinkedIn account stops the agent and points to Settings", () => {
    const line = describeAgentStatus({ ...sending, accountConnected: false }, options);
    expect(line.tone).toBe("stopped");
    expect(line.text).toContain("Reconnect it in Settings");
  });

  test("the user's own pause wins over a disconnected account so the reason shown is the one they can undo first", () => {
    const line = describeAgentStatus(
      { ...sending, agentStatus: "paused", accountConnected: false },
      options,
    );
    expect(line.text).toContain("You paused this agent");
  });

  test("invites waiting on acceptance explain why nothing is scheduled instead of looking idle", () => {
    const line = describeAgentStatus(
      { ...sending, nextSend: undefined, awaitingAcceptance: 1 },
      options,
    );
    expect(line.tone).toBe("waiting");
    expect(line.text).toContain("1 invite is waiting to be accepted");
    expect(line.text).toContain("Next lead search <2026-09-26T08:00:00.000Z>.");
  });

  test("a leads-only agent never claims it will contact anyone", () => {
    const line = describeAgentStatus(
      { ...sending, leadsOnly: true, nextSend: { kind: "invite", at: sending.nextSend!.at } },
      options,
    );
    expect(line.text).toContain("never contacts them");
    expect(line.text).not.toContain("invite");
  });

  test("an outreach-only agent with an empty queue asks for more leads rather than promising a search", () => {
    const line = describeAgentStatus(
      { ...sending, findsLeads: false, nextSend: undefined },
      options,
    );
    expect(line.label).toBe("Idle");
    expect(line.text).not.toContain("lead search");
  });
});
