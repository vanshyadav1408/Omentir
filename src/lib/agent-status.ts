// One sentence per agent card saying what the agent is doing right now and, if
// nothing is moving, why. Both customers who cancelled in July had agents that
// had stopped sending days earlier with nothing on screen to say so; every
// silent path the automation has (lapsed plan, paused campaign, invite breaker,
// disconnected account, empty queue) must land on a line here.
//
// The server gathers the facts (src/lib/server/agent-status.ts); the sentence is
// built on the client so times render in the workspace's zone.

export type AgentSendKind = "invite" | "message" | "reply";

export type AgentStatusFacts = {
  agentStatus: "active" | "paused" | "running" | "error";
  leadsOnly: boolean;
  // False for outreach-only agents, which never run a lead search.
  findsLeads: boolean;
  nextRunAt?: string;
  // The LinkedIn account the agent's outreach would send from is connected.
  accountConnected: boolean;
  // Omentir-side kill switch for the workspace (AUTOMATION_PAUSED_WORKSPACE_IDS).
  automationPaused: boolean;
  // The campaign on the agent's lead group, if any. Groups are shared, so this
  // is the sequence that contacts the agent's leads.
  campaignStatus?: "draft" | "active" | "paused";
  // Active LinkedIn invite breaker on the sending account.
  inviteLimitUntil?: string;
  nextSend?: { kind: AgentSendKind; at: string };
  // Invites sent and not yet accepted. Their follow-ups wait on LinkedIn, not
  // on a clock, so they never show up as a next send.
  awaitingAcceptance: number;
};

export type AgentStatusTone = "active" | "waiting" | "paused" | "stopped";

export type AgentStatusLine = {
  tone: AgentStatusTone;
  label: string;
  text: string;
};

const SEND_NOUN: Record<AgentSendKind, string> = {
  invite: "invite",
  message: "message",
  reply: "reply",
};

// Anything due within this window reads as "going out now": the tick runs every
// few minutes, so an exact minute would be false precision.
const DUE_NOW_MS = 5 * 60 * 1000;

export function describeAgentStatus(
  facts: AgentStatusFacts,
  options: {
    subscriptionActive: boolean;
    nowMs: number;
    formatAt: (iso: string) => string;
  },
): AgentStatusLine {
  const { formatAt, nowMs } = options;
  const nextSearch = () =>
    facts.findsLeads && facts.nextRunAt ? ` Next lead search ${formatAt(facts.nextRunAt)}.` : "";

  if (!options.subscriptionActive) {
    return {
      tone: "stopped",
      label: "Stopped",
      text: "Your subscription ended, so this agent is not finding or contacting anyone.",
    };
  }
  if (facts.automationPaused) {
    return {
      tone: "paused",
      label: "Paused",
      text: "Omentir paused automation on this workspace. Nothing sends until support turns it back on.",
    };
  }
  if (facts.agentStatus === "paused") {
    return {
      tone: "paused",
      label: "Paused",
      text: "You paused this agent. Nothing sends until you turn it back on.",
    };
  }
  if (facts.agentStatus === "error") {
    return {
      tone: "stopped",
      label: "Stopped",
      text: "The last lead search failed. Turn the agent off and on to retry.",
    };
  }
  if (!facts.accountConnected) {
    return {
      tone: "stopped",
      label: "Stopped",
      text: "Your LinkedIn account is disconnected. Reconnect it in Settings to keep going.",
    };
  }
  if (facts.agentStatus === "running") {
    return { tone: "active", label: "Searching", text: "Looking for new leads right now." };
  }
  if (facts.leadsOnly) {
    return {
      tone: "active",
      label: "Finding leads",
      text: `This agent only finds leads and never contacts them.${nextSearch()}`,
    };
  }
  if (!facts.campaignStatus || facts.campaignStatus === "draft") {
    return facts.findsLeads
      ? {
          tone: "waiting",
          label: "Finding leads",
          text: `No outreach is set up, so nobody gets contacted.${nextSearch()}`,
        }
      : {
          tone: "stopped",
          label: "Stopped",
          text: "No outreach sequence is attached to this agent.",
        };
  }
  if (facts.campaignStatus === "paused") {
    return {
      tone: "paused",
      label: "Paused",
      text: "Outreach is paused, so nobody is being contacted.",
    };
  }

  const next = facts.nextSend;
  const limit = facts.inviteLimitUntil;
  if (next) {
    const noun = SEND_NOUN[next.kind];
    // Parked invites sleep until the breaker ends, so their time is the
    // breaker's end. Saying "LinkedIn limit" is the part the user needs.
    if (next.kind === "invite" && limit) {
      return {
        tone: "paused",
        label: "Paused",
        text: `LinkedIn limited invites from this account. Invites resume ${formatAt(limit)}.`,
      };
    }
    const when =
      Date.parse(next.at) - nowMs <= DUE_NOW_MS ? "is going out now" : formatAt(next.at);
    const limitNote = limit ? ` Invites are paused by LinkedIn until ${formatAt(limit)}.` : "";
    return { tone: "active", label: "Sending", text: `Next ${noun} ${when}.${limitNote}` };
  }

  if (facts.awaitingAcceptance > 0) {
    const count = facts.awaitingAcceptance;
    return {
      tone: "waiting",
      label: "Waiting",
      text: `${count} ${count === 1 ? "invite is" : "invites are"} waiting to be accepted. Follow-ups go out when people accept.${nextSearch()}`,
    };
  }
  return facts.findsLeads
    ? {
        tone: "waiting",
        label: "Waiting",
        text: `Everyone found so far has been contacted.${nextSearch()}`,
      }
    : {
        tone: "waiting",
        label: "Idle",
        text: "Everyone in this lead group has been contacted. Add leads to keep sending.",
      };
}
