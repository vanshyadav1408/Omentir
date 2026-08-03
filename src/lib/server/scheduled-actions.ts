import "server-only";

import { buildActionTimeline, type ActionTimelineItem } from "./action-timeline";
import { findNextScheduledStepIndex } from "./campaign-sequence";
import { canSendCampaignMessage, renderTemplate } from "./outreach-rules";
import {
  isSourcedByLeadsOnlyAgent,
  listAgents,
  listCampaignEnrollments,
  listCampaigns,
  getLeadsByIds,
  getOutboundMessageTimesByLeadIds,
  listGroups,
} from "./data";

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
  filters: { campaignId?: string; agentId?: string } = {},
) {
  const [campaigns, enrollments, agents, groups] = await Promise.all([
    listCampaigns(workspaceId),
    listCampaignEnrollments(workspaceId),
    listAgents(workspaceId),
    listGroups(workspaceId),
  ]);
  // Only enrolled leads can produce an action, and there are at most as many of
  // them as there are enrollments. Scanning the whole leads collection here used
  // to pull 500 full documents and push this call past Firestore's 60s deadline.
  const leads = await getLeadsByIds(
    workspaceId,
    enrollments.map((enrollment) => enrollment.leadId),
  );
  const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const terminalStatuses = new Set(["stopped", "replied"]);

  // Only enrollments that already sent a message have a send time to look up,
  // and this page auto-refreshes every minute - reading a conversation for
  // every enrolled lead would double the page's Firestore reads for nothing.
  const messagedLeadIds = enrollments.flatMap((enrollment) => {
    const campaign = campaignsById.get(enrollment.campaignId);
    if (!campaign) return [];
    const stepIndex = findNextScheduledStepIndex(campaign.steps, enrollment.currentStepIndex);
    const doneSteps = stepIndex === -1 ? campaign.steps : campaign.steps.slice(0, stepIndex);
    return doneSteps.some((step) => step.type === "message") ? [enrollment.leadId] : [];
  });
  const outboundMessageTimes = await getOutboundMessageTimesByLeadIds(workspaceId, messagedLeadIds);

  const outreach = enrollments.flatMap((enrollment): ScheduledAction[] => {
    if (terminalStatuses.has(enrollment.status)) return [];
    if (filters.campaignId && enrollment.campaignId !== filters.campaignId) return [];
    const campaign = campaignsById.get(enrollment.campaignId);
    const lead = leadsById.get(enrollment.leadId);
    if (!campaign || campaign.status !== "active" || !lead) return [];
    if (filters.agentId && lead.sourceAgentId !== filters.agentId) return [];
    // Leads-only agents must not surface connect/message rows: automation will
    // stop those enrollments, and the Actions UI should match that contract.
    if (isSourcedByLeadsOnlyAgent(lead, agents)) return [];
    const stepIndex = findNextScheduledStepIndex(campaign.steps, enrollment.currentStepIndex);
    const step = stepIndex === -1 ? undefined : campaign.steps[stepIndex];
    if (!step || step.type === "wait") return [];
    const agent = lead.sourceAgentId ? agentsById.get(lead.sourceAgentId) : undefined;
    const group = groupsById.get(campaign.groupId);
    const isConnection = step.type === "connect";
    const connectionAccepted = canSendCampaignMessage(enrollment, lead);
    const awaitingConnection = !isConnection && !connectionAccepted;
    const canRunNow = !enrollment.pendingAction && (isConnection || connectionAccepted);
    const template = isConnection ? step.noteTemplate : step.messageTemplate;
    const rendered = template.trim() ? renderTemplate(template, lead) : null;
    // AI messages are pre-drafted the moment the connection is accepted (see
    // draftUpcomingMessagePreview in automation.ts) so the user can read the
    // exact outgoing text here before it is sent.
    const storedDraft =
      enrollment.nextMessageDraft && enrollment.nextMessageDraft.stepIndex === stepIndex
        ? enrollment.nextMessageDraft.body
        : undefined;
    // Connection requests never get AI-drafted notes: either the user's
    // template renders cleanly or the invite goes out bare.
    const message = isConnection
      ? step.includeNote && rendered?.natural && rendered.text
        ? rendered.text
        : "No note — LinkedIn connection request only."
      : rendered?.natural && rendered.text
        ? rendered.text
        : storedDraft || "AI-personalized message will be generated at send time.";

    return [{
      id: enrollment.id,
      at: enrollment.nextActionAt,
      kind: isConnection ? "connection" : "message",
      title: isConnection ? "Send connection request" : "Send LinkedIn message",
      message,
      method: isConnection ? "LinkedIn connection request" : "LinkedIn message",
      canRunNow,
      awaitingConnection,
      blockedReason: enrollment.pendingAction
        ? "This action is already being processed."
        : awaitingConnection
          ? "The connection must be accepted before this message can be sent."
          : enrollment.lastError?.includes("cannot_resend_yet")
            ? "LinkedIn rejected the last invite to this person — they were likely invited before (pending or withdrawn), or the account is at its invite limit. It will retry at the scheduled time; withdrawing old pending invites on LinkedIn lifts the limit sooner."
            : enrollment.lastError
              ? `The last attempt failed and will retry at the scheduled time: ${enrollment.lastError}`
              : undefined,
      timeline: buildActionTimeline({
        steps: campaign.steps,
        stepIndex,
        scheduledAt: enrollment.nextActionAt,
        connectionSentAt: enrollment.connectionSentAt,
        sentMessageAts: outboundMessageTimes.get(lead.id),
        connectionAccepted,
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
