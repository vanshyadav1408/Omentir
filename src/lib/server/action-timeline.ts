import type { CampaignStep, ConversationMessage } from "./types";

// One row of a lead's outreach schedule: every non-wait step of the campaign,
// past and future. "completed" carries the instant it actually went out,
// "scheduled" the instant the automation will fire, "waiting" the steps that
// have no time yet because LinkedIn will not let us message before the
// connection is accepted, "upcoming" the later steps we can only project
// from the campaign's wait delays, and "cancelled" the leftover sequence
// steps that must not still look scheduled after they replied.
export type ActionTimelineItem = {
  id: string;
  title: string;
  kind: "connection" | "message";
  status: "completed" | "scheduled" | "waiting" | "upcoming" | "cancelled";
  at?: string;
  estimated?: boolean;
  note?: string;
};

const AWAITING_ACCEPTANCE_NOTE =
  "Unlocks once they accept the connection request";
const SEQUENCE_STOPPED_NOTE = "Stopped because they replied";

// Only outbound messages before the first inbound are sequence sends. An AI
// or manual reply after they write back must not mark later sequence steps
// complete, or /leads looks like the canned follow-up already went out.
export function sequenceOutboundMessageTimes(
  messages: Array<Pick<ConversationMessage, "direction" | "createdAt">>,
) {
  const times: string[] = [];
  for (const message of [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (message.direction === "inbound") break;
    if (message.direction === "outbound") times.push(message.createdAt);
  }
  return times;
}

export function lastInboundMessage(
  messages: Array<Pick<ConversationMessage, "direction" | "createdAt" | "body">>,
) {
  return [...messages]
    .reverse()
    .find((message) => message.direction === "inbound");
}

function stepTitle(step: CampaignStep) {
  return step.type === "connect" ? "Send connection request" : "Send LinkedIn message";
}

export function buildActionTimeline(input: {
  steps: CampaignStep[];
  // Index of the step the enrollment will run next, as resolved by
  // findNextScheduledStepIndex (never a wait step).
  stepIndex: number;
  // enrollment.nextActionAt for that step.
  scheduledAt: string;
  connectionSentAt?: string;
  // Outbound message timestamps, oldest first. Mapped positionally onto the
  // message steps that already ran.
  sentMessageAts?: string[];
  // canSendCampaignMessage: false means every message step is still gated on
  // the invite being accepted, so none of them has a real time yet.
  connectionAccepted: boolean;
  // When they have already written back, leftover sequence steps are cancelled
  // so the schedule cannot still promise a canned follow-up.
  sequenceStopped?: boolean;
  repliedAt?: string;
}): ActionTimelineItem[] {
  const { steps, stepIndex, scheduledAt, connectionSentAt, connectionAccepted } = input;
  const sentMessageAts = [...(input.sentMessageAts || [])];
  const items: ActionTimelineItem[] = [];
  // Wait steps carry the delay that precedes the next outreach step, so they
  // accumulate here rather than becoming rows of their own.
  let pendingWaitMinutes = 0;
  let projectedMs: number | undefined;

  for (const [index, step] of steps.entries()) {
    if (step.type === "wait") {
      pendingWaitMinutes += step.delayMinutes;
      continue;
    }

    const kind = step.type === "connect" ? ("connection" as const) : ("message" as const);
    const base = { id: step.id, title: stepTitle(step), kind };
    const waitMinutes = pendingWaitMinutes;
    pendingWaitMinutes = 0;

    if (index < stepIndex) {
      const at = kind === "connection" ? connectionSentAt : sentMessageAts.shift();
      items.push({ ...base, status: "completed", at });
      continue;
    }

    if (index === stepIndex) {
      if (kind === "message" && !connectionAccepted) {
        items.push({ ...base, status: "waiting", note: AWAITING_ACCEPTANCE_NOTE });
        continue;
      }
      projectedMs = Date.parse(scheduledAt);
      items.push({ ...base, status: "scheduled", at: scheduledAt });
      continue;
    }

    // Later steps. Once a step is gated on acceptance, everything after it is
    // too: the automation parks the enrollment until the webhook wakes it, so
    // any projected date would be fiction.
    if (!connectionAccepted || projectedMs === undefined || !Number.isFinite(projectedMs)) {
      items.push({ ...base, status: "upcoming", note: AWAITING_ACCEPTANCE_NOTE });
      continue;
    }

    projectedMs += waitMinutes * 60_000;
    items.push({
      ...base,
      status: "upcoming",
      at: new Date(projectedMs).toISOString(),
      estimated: true,
    });
  }

  if (!input.sequenceStopped && !input.repliedAt) return items;

  const completedCount = items.filter((item) => item.status === "completed").length;
  const next = input.sequenceStopped
    ? items.map((item) =>
        item.status === "completed"
          ? item
          : {
              ...item,
              status: "cancelled" as const,
              at: undefined,
              estimated: undefined,
              note: SEQUENCE_STOPPED_NOTE,
            },
      )
    : items;
  next.splice(completedCount, 0, {
    id: "lead-replied",
    title: "They replied",
    kind: "message",
    status: "completed",
    at: input.repliedAt,
  });
  return next;
}
