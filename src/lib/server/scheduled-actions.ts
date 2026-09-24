import "server-only";

import { buildActionTimeline, type ActionTimelineItem } from "./action-timeline";
import { findNextScheduledStepIndex } from "./campaign-sequence";
import {
  canSendCampaignMessage,
  hasInviteResendBlockedError,
  renderTemplate,
} from "./outreach-rules";
import {
  isSourcedByLeadsOnlyAgent,
  listAgents,
  listCampaignEnrollments,
  listCampaigns,
  getLeadsByIds,
  getOutreachConversationFactsByLeadIds,
  listGroups,
  listLeadEnrollments,
} from "./data";
import {
  enrollmentIsTerminalForSequence,
  USER_STOPPED_OUTREACH_ERROR,
} from "./reply-automation-policy";
import {
  combinedOutreachStage,
  STAGE_CONTACTED,
  STAGE_MESSAGED,
  STAGE_REPLIED,
} from "@/lib/outreach-stage";

export type ScheduledAction = {
  id: string;
  at: string;
  kind: "connection" | "message";
  title: string;
  message: string;
  method: string;
  campaign?: string;
  agent?: string;
  group?: string;
  groupId?: string;
  canRunNow: boolean;
  isReply?: boolean;
  blockedReason?: string;
  // True when the step is a message the connection has not been accepted for.
  // `at` is meaningless then: the automation parks the enrollment on the
  // give-up date and the acceptance webhook is what actually wakes it.
  awaitingConnection: boolean;
  timeline: ActionTimelineItem[];
  lead?: {
    id: string;
    name: string;
    title: string;
    company: string;
    location: string;
    avatarUrl?: string;
    fitScore: number;
  };
};

export async function listScheduledActions(
  workspaceId: string,
  filters: { campaignId?: string; agentId?: string; leadId?: string } = {},
) {
  // One lead (the /leads panel) reads only its own docs, all in parallel. The
  // workspace-wide path reads every enrolled lead and took 14-60s on big
  // workspaces, which is what left /leads stuck on "Loading outreach".
  const leadId = filters.leadId;
  const [campaigns, enrollments, agents, groups, leadOnly, leadFacts] = await Promise.all([
    listCampaigns(workspaceId),
    leadId ? listLeadEnrollments(workspaceId, leadId) : listCampaignEnrollments(workspaceId),
    listAgents(workspaceId),
    listGroups(workspaceId),
    leadId ? getLeadsByIds(workspaceId, [leadId]) : undefined,
    leadId ? getOutreachConversationFactsByLeadIds(workspaceId, [leadId]) : undefined,
  ]);
  // Only enrolled leads can produce an action, and there are at most as many of
  // them as there are enrollments. Scanning the whole leads collection here used
  // to pull 500 full documents and push this call past Firestore's 60s deadline.
  const leads = leadOnly ?? await getLeadsByIds(
    workspaceId,
    enrollments.map((enrollment) => enrollment.leadId),
  );
  const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const groupsById = new Map(groups.map((group) => [group.id, group]));

  // Only enrollments that already sent a message have a send time to look up,
  // and this page auto-refreshes every minute - reading a conversation for
  // every enrolled lead would double the page's Firestore reads for nothing.
  const conversationLeadIds = enrollments.flatMap((enrollment) => {
    const campaign = campaignsById.get(enrollment.campaignId);
    if (!campaign) return [];
    if (enrollment.status === "reply_received") return [enrollment.leadId];
    const stepIndex = findNextScheduledStepIndex(campaign.steps, enrollment.currentStepIndex);
    const doneSteps = stepIndex === -1 ? campaign.steps : campaign.steps.slice(0, stepIndex);
    return doneSteps.some((step) => step.type === "message") ? [enrollment.leadId] : [];
  });
  const conversationFacts = leadFacts ?? await getOutreachConversationFactsByLeadIds(
    workspaceId,
    conversationLeadIds,
  );

  const outreach = enrollments.flatMap((enrollment): ScheduledAction[] => {
    if (enrollmentIsTerminalForSequence(enrollment.status)) return [];
    if (filters.campaignId && enrollment.campaignId !== filters.campaignId) return [];
    const campaign = campaignsById.get(enrollment.campaignId);
    const lead = leadsById.get(enrollment.leadId);
    if (!campaign || campaign.status !== "active" || !lead) return [];
    // A stored reply must hide the next canned step even if the enrollment
    // has not been armed yet. Showing that step is how /leads stayed stale.
    if (lead.outreachStatus === "replied" && enrollment.status !== "reply_received") return [];
    if (filters.agentId && lead.sourceAgentId !== filters.agentId) return [];
    // Leads-only agents must not surface connect/message rows: automation will
    // stop those enrollments, and the Actions UI should match that contract.
    if (isSourcedByLeadsOnlyAgent(lead, agents)) return [];
    const facts = conversationFacts.get(lead.id);
    const isReply = enrollment.status === "reply_received";
    const stepIndex = findNextScheduledStepIndex(campaign.steps, enrollment.currentStepIndex);
    const step = stepIndex === -1 ? undefined : campaign.steps[stepIndex];
    if (!isReply && (!step || step.type === "wait")) return [];
    const agent = lead.sourceAgentId ? agentsById.get(lead.sourceAgentId) : undefined;
    const group = groupsById.get(campaign.groupId);
    const isConnection = !isReply && step?.type === "connect";
    const connectionAccepted = canSendCampaignMessage(enrollment, lead);
    const awaitingConnection = !isReply && !isConnection && !connectionAccepted;
    const canRunNow = !enrollment.pendingAction;
    const template =
      step?.type === "connect"
        ? step.noteTemplate
        : step?.type === "message"
          ? step.messageTemplate
          : undefined;
    const rendered = template?.trim() ? renderTemplate(template, lead) : null;
    // AI messages are pre-drafted the moment the connection is accepted (see
    // draftUpcomingMessagePreview in automation.ts) so the user can read the
    // exact outgoing text here before it is sent.
    const storedDraft =
      enrollment.nextMessageDraft && enrollment.nextMessageDraft.stepIndex === stepIndex
        ? enrollment.nextMessageDraft.body
        : undefined;
    // Connection requests never get AI-drafted notes: either the user's
    // template renders cleanly or the invite goes out bare.
    const message = isReply
      ? facts?.lastInboundBody ||
        storedDraft ||
        "AI-personalized reply will be generated at send time."
      : isConnection
        ? step?.type === "connect" && step.includeNote && rendered?.natural && rendered.text
          ? rendered.text
          : "No note. LinkedIn connection request only."
        : rendered?.natural && rendered.text
          ? rendered.text
          : storedDraft || "AI-personalized message will be generated at send time.";

    return [{
      id: enrollment.id,
      at: enrollment.nextActionAt,
      kind: isConnection ? "connection" : "message",
      title: isReply
        ? "Reply to their message"
        : isConnection
          ? "Send connection request"
          : "Send LinkedIn message",
      message,
      method: isConnection ? "LinkedIn connection request" : "LinkedIn message",
      canRunNow,
      isReply,
      awaitingConnection,
      blockedReason: enrollment.pendingAction
        ? "This action is already being processed."
        : awaitingConnection
          ? "The connection must be accepted before this message can be sent."
          : isConnection && enrollment.inviteCooldownParkedAt
            ? "LinkedIn turned down several recent connection requests from this account, so Omentir paused invites to protect it. Sending resumes at the scheduled time."
          : hasInviteResendBlockedError(enrollment.lastError)
            ? "LinkedIn says this person was invited recently. Omentir will wait through LinkedIn's cooldown before trying again."
            : enrollment.lastError
              ? `The last attempt failed and will retry at the scheduled time: ${enrollment.lastError}`
              : undefined,
      timeline: buildActionTimeline({
        steps: campaign.steps,
        stepIndex: stepIndex === -1 ? campaign.steps.length : stepIndex,
        scheduledAt: enrollment.nextActionAt,
        connectionSentAt: enrollment.connectionSentAt,
        sentMessageAts: facts?.sequenceOutboundAts,
        connectionAccepted,
        sequenceStopped: isReply,
        repliedAt: facts?.lastInboundAt,
      }),
      campaign: campaign.name,
      agent: agent?.name,
      group: group?.name,
      groupId: campaign.groupId,
      lead: {
        id: lead.id,
        name: lead.name,
        title: lead.title,
        company: lead.company,
        location: lead.location,
        avatarUrl: lead.avatarUrl,
        fitScore: lead.fitScore || 0,
      },
    }];
  });

  return outreach.sort((a, b) => a.at.localeCompare(b.at));
}

// What /leads shows for a lead with nothing queued: how far outreach got, why
// it is not moving, and the steps that did or did not go out.
export type LeadOutreachSummary = {
  detail: string;
  // 0 not contacted, 1 invited, 2 accepted, 3 messaged, 4 replied.
  stage: number;
  timeline: ActionTimelineItem[];
};

export async function getLeadOutreachSummary(
  workspaceId: string,
  leadId: string,
): Promise<LeadOutreachSummary | null> {
  const [[lead], enrollments, campaigns, agents, conversationFacts] = await Promise.all([
    getLeadsByIds(workspaceId, [leadId]),
    listLeadEnrollments(workspaceId, leadId),
    listCampaigns(workspaceId),
    listAgents(workspaceId),
    getOutreachConversationFactsByLeadIds(workspaceId, [leadId]),
  ]);
  if (!lead) return null;
  const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  const enrollment = enrollments
    .filter((item) => campaignsById.has(item.campaignId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const campaign = enrollment ? campaignsById.get(enrollment.campaignId) : undefined;
  const facts = conversationFacts.get(leadId);

  // Both stored statuses get written back down, so the steps that provably went
  // out set the floor: a sent invite is contact, a sent message is messaged.
  const doneSteps = campaign && enrollment
    ? campaign.steps.slice(0, Math.min(enrollment.currentStepIndex, campaign.steps.length))
    : [];
  const stage = Math.max(
    combinedOutreachStage(undefined, lead.outreachStatus),
    ...enrollments.map((item) => combinedOutreachStage(item.status)),
    enrollments.some((item) => item.connectionSentAt) ? STAGE_CONTACTED : 0,
    facts?.sequenceOutboundAts.length && doneSteps.some((step) => step.type === "message")
      ? STAGE_MESSAGED
      : 0,
  );
  const paused = Boolean(
    enrollment &&
      !enrollmentIsTerminalForSequence(enrollment.status) &&
      (campaign?.status !== "active" || enrollment.pausedDeferredAt),
  );
  const replied = stage >= STAGE_REPLIED;

  const summary = ((): Pick<LeadOutreachSummary, "detail"> => {
    if (replied) {
      return { detail: "They replied. Continue the conversation in Messages." };
    }
    if (lead.outreachStatus === "declined") {
      return { detail: "They declined the connection request." };
    }
    if (enrollment?.lastError === USER_STOPPED_OUTREACH_ERROR || lead.outreachStatus === "stopped") {
      return { detail: "You stopped outreach for this person." };
    }
    if (isSourcedByLeadsOnlyAgent(lead, agents)) {
      return { detail: "A leads-only agent found this person, so Omentir will not contact them." };
    }
    if (!enrollment) {
      return {
        detail: stage === 0 ? "Not in an outreach sequence yet." : "Nothing is scheduled for this person.",
      };
    }
    if (paused) {
      return { detail: "The agent is paused. Outreach continues when you resume it." };
    }
    if (enrollment.status === "error") {
      return { detail: enrollment.lastError || "The last attempt failed." };
    }
    if (enrollment.lastError) {
      return { detail: enrollment.lastError };
    }
    if (stage === 1) {
      return { detail: "They have not accepted the connection request, so no follow-up will go out." };
    }
    return { detail: "The sequence ended with no reply yet. Nothing else is scheduled." };
  })();

  if (!enrollment || !campaign) return { ...summary, stage, timeline: [] };

  const timeline = buildActionTimeline({
    steps: campaign.steps,
    stepIndex: Math.min(enrollment.currentStepIndex, campaign.steps.length),
    scheduledAt: enrollment.nextActionAt,
    connectionSentAt: enrollment.connectionSentAt,
    sentMessageAts: facts?.sequenceOutboundAts,
    connectionAccepted: canSendCampaignMessage(enrollment, lead),
    sequenceStopped: replied,
    repliedAt: facts?.lastInboundAt,
  }).map((item) =>
    replied || item.status === "completed"
      ? item
      : {
          ...item,
          status: paused ? ("upcoming" as const) : ("cancelled" as const),
          at: undefined,
          estimated: undefined,
          note: paused ? "Waits for the agent to resume" : "Not sent",
        },
  );

  return { ...summary, stage, timeline };
}

// Everything the /leads panel needs for one lead: its queued actions, and the
// status summary it falls back to when nothing is queued.
export async function getLeadOutreach(workspaceId: string, leadId: string) {
  const [actions, summary] = await Promise.all([
    listScheduledActions(workspaceId, { leadId }),
    getLeadOutreachSummary(workspaceId, leadId),
  ]);
  return { actions, summary };
}
