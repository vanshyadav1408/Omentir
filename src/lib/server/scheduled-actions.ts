import "server-only";

import { findNextScheduledStepIndex } from "./campaign-sequence";
import { canSendCampaignMessage, renderTemplate } from "./outreach-rules";
import {
  listAgents,
  listCampaignEnrollments,
  listCampaigns,
  getLeadsByIds,
  listGroups,
  listLeads,
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
  canRunNow: boolean;
  blockedReason?: string;
  lead?: {
    id: string;
    name: string;
    title: string;
    company: string;
    location: string;
    avatarUrl?: string;
  };
};

export async function listScheduledActions(
  workspaceId: string,
  filters: { campaignId?: string; agentId?: string } = {},
) {
  const [campaigns, enrollments, leads, agents, groups] = await Promise.all([
    listCampaigns(workspaceId),
    listCampaignEnrollments(workspaceId),
    listLeads(workspaceId),
    listAgents(workspaceId),
    listGroups(workspaceId),
  ]);
  const knownLeadIds = new Set(leads.map((lead) => lead.id));
  const missingLeadIds = Array.from(new Set(
    enrollments.map((enrollment) => enrollment.leadId).filter((id) => !knownLeadIds.has(id)),
  ));
  const extraLeads = missingLeadIds.length
    ? await getLeadsByIds(workspaceId, missingLeadIds)
    : [];
  const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  const leadsById = new Map([...leads, ...extraLeads].map((lead) => [lead.id, lead]));
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const terminalStatuses = new Set(["stopped", "replied"]);

  const outreach = enrollments.flatMap((enrollment): ScheduledAction[] => {
    if (terminalStatuses.has(enrollment.status)) return [];
    if (filters.campaignId && enrollment.campaignId !== filters.campaignId) return [];
    const campaign = campaignsById.get(enrollment.campaignId);
    const lead = leadsById.get(enrollment.leadId);
    if (!campaign || campaign.status !== "active" || !lead) return [];
    if (filters.agentId && lead.sourceAgentId !== filters.agentId) return [];
    const stepIndex = findNextScheduledStepIndex(campaign.steps, enrollment.currentStepIndex);
    const step = stepIndex === -1 ? undefined : campaign.steps[stepIndex];
    if (!step || step.type === "wait") return [];
    const agent = lead.sourceAgentId ? agentsById.get(lead.sourceAgentId) : undefined;
    const group = groupsById.get(campaign.groupId);
    const isConnection = step.type === "connect";
    const canRunNow = !enrollment.pendingAction && (
      isConnection || canSendCampaignMessage(enrollment, lead)
    );
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
      blockedReason: enrollment.pendingAction
        ? "This action is already being processed."
        : !isConnection && !canRunNow
          ? "The connection must be accepted before this message can be sent."
          : enrollment.lastError?.includes("cannot_resend_yet")
            ? "LinkedIn rejected the last invite to this person — they were likely invited before (pending or withdrawn), or the account is at its invite limit. It will retry at the scheduled time; withdrawing old pending invites on LinkedIn lifts the limit sooner."
            : enrollment.lastError
              ? `The last attempt failed and will retry at the scheduled time: ${enrollment.lastError}`
              : undefined,
      campaign: campaign.name,
      agent: agent?.name,
      group: group?.name,
      lead: {
        id: lead.id,
        name: lead.name,
        title: lead.title,
        company: lead.company,
        location: lead.location,
        avatarUrl: lead.avatarUrl,
      },
    }];
  });

  return outreach.sort((a, b) => a.at.localeCompare(b.at));
}
