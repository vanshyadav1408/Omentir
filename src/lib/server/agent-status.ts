import "server-only";

import type { AgentSendKind, AgentStatusFacts } from "@/lib/agent-status";
import { getAutomationSafetyMode, isWorkspaceAutomationPaused } from "./automation-safety";
import { findNextScheduledStepIndex } from "./campaign-sequence";
import { findWorkspace, getInviteCooldown, getLinkedInAccountForWorkspace, listAgents, listCampaigns, listLinkedInAccounts } from "./data";
import { getDb } from "./firebase";
import type { Campaign, CampaignEnrollment, LinkedInAccount } from "./types";

// Enrollments overdue by more than this are left out of "next send". They are
// either stuck or parked with a stale time, and an old timestamp would read as
// "going out now" forever.
const OVERDUE_LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000;
// Terminal enrollments keep their last nextActionAt, so the page has to be deep
// enough to get past a run of recently stopped ones.
const NEXT_SEND_PAGE = 60;

async function nextCampaignSend(
  workspaceId: string,
  campaign: Campaign,
): Promise<AgentStatusFacts["nextSend"]> {
  const cutoff = new Date(Date.now() - OVERDUE_LOOKBACK_MS).toISOString();
  // Served by the (workspaceId, campaignId, nextActionAt) index.
  const snap = await getDb()
    .collection("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .where("campaignId", "==", campaign.id)
    .where("nextActionAt", ">=", cutoff)
    .orderBy("nextActionAt")
    .limit(NEXT_SEND_PAGE)
    .get();
  for (const doc of snap.docs) {
    const enrollment = doc.data() as CampaignEnrollment;
    const kind = sendKind(enrollment, campaign);
    if (kind) return { kind, at: enrollment.nextActionAt };
  }
  return undefined;
}

// What the enrollment will send when its time comes, or null when its time is
// not a send: a finished sequence, or a follow-up still waiting on LinkedIn to
// accept the invite (its nextActionAt is the give-up date, not a send).
function sendKind(enrollment: CampaignEnrollment, campaign: Campaign): AgentSendKind | null {
  if (enrollment.status === "reply_received") return "reply";
  if (
    enrollment.status === "stopped" ||
    enrollment.status === "replied" ||
    enrollment.status === "connection_sent"
  ) {
    return null;
  }
  const stepIndex = findNextScheduledStepIndex(campaign.steps, enrollment.currentStepIndex);
  const step = stepIndex === -1 ? undefined : campaign.steps[stepIndex];
  if (step?.type === "connect") return "invite";
  if (step?.type === "message") return "message";
  return null;
}

async function countAwaitingAcceptance(workspaceId: string, campaignId: string) {
  const snap = await getDb()
    .collection("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .where("campaignId", "==", campaignId)
    .where("status", "==", "connection_sent")
    .count()
    .get();
  return snap.data().count;
}

// Same answer as getLinkedInAccountForWorkspace(..., { fallbackToDefault: true }).
// A connected campaign account is answered from the list already read; only a
// disconnected one needs the lookup, which decides whether another connected
// row is the same person or the campaign waits for its own seat.
async function sendingAccount(workspaceId: string, connected: LinkedInAccount[], linkedInAccountId?: string) {
  if (!linkedInAccountId) return connected[0] ?? null;
  return (
    connected.find((account) => account.id === linkedInAccountId) ??
    (await getLinkedInAccountForWorkspace(workspaceId, linkedInAccountId, { fallbackToDefault: true }))
  );
}

async function campaignFacts(
  workspaceId: string,
  campaign: Campaign,
  connected: LinkedInAccount[],
) {
  const account = await sendingAccount(workspaceId, connected, campaign.linkedInAccountId);
  const [inviteLimitUntil, nextSend, awaitingAcceptance] = await Promise.all([
    account ? getInviteCooldown(workspaceId, account.id) : null,
    campaign.status === "active" ? nextCampaignSend(workspaceId, campaign) : undefined,
    campaign.status === "active" ? countAwaitingAcceptance(workspaceId, campaign.id) : 0,
  ]);
  return {
    accountConnected: Boolean(account),
    inviteLimitUntil: inviteLimitUntil || undefined,
    nextSend,
    awaitingAcceptance,
  };
}

// agentId narrows the read to one agent (its page), so only that agent's
// campaign queue is queried.
export async function loadAgentStatusFacts(
  workspaceId: string,
  agentId?: string,
): Promise<Record<string, AgentStatusFacts>> {
  const [allAgents, campaigns, connected, workspace] = await Promise.all([
    listAgents(workspaceId),
    listCampaigns(workspaceId),
    listLinkedInAccounts(workspaceId),
    findWorkspace(workspaceId),
  ]);
  const agents = agentId ? allAgents.filter((agent) => agent.id === agentId) : allAgents;
  const automationPaused = isWorkspaceAutomationPaused(getAutomationSafetyMode(), workspaceId);

  // Several agents can share a group, so each campaign is read once.
  const campaignForGroup = new Map<string, Campaign>();
  for (const campaign of campaigns) {
    const current = campaignForGroup.get(campaign.groupId);
    // Prefer the campaign that is actually sending when a group has several.
    if (!current || (current.status !== "active" && campaign.status === "active")) {
      campaignForGroup.set(campaign.groupId, campaign);
    }
  }
  const usedCampaigns = [
    ...new Set(
      agents
        .map((agent) => campaignForGroup.get(agent.targetGroupId))
        .filter((campaign): campaign is Campaign => Boolean(campaign)),
    ),
  ];
  const factsByCampaign = new Map(
    await Promise.all(
      usedCampaigns.map(
        async (campaign) =>
          [campaign.id, await campaignFacts(workspaceId, campaign, connected)] as const,
      ),
    ),
  );

  // Agents with no campaign still need an account: discovery refuses to run
  // without a connected LinkedIn account.
  const agentAccountConnected = new Map(
    await Promise.all(
      agents
        .filter((agent) => {
          const campaign = campaignForGroup.get(agent.targetGroupId);
          return !campaign || !factsByCampaign.has(campaign.id);
        })
        .map(async (agent) =>
          [agent.id, Boolean(await sendingAccount(workspaceId, connected, agent.linkedInAccountId))] as const,
        ),
    ),
  );

  return Object.fromEntries(
    agents.map((agent) => {
      const campaign = campaignForGroup.get(agent.targetGroupId);
      const facts = campaign ? factsByCampaign.get(campaign.id) : undefined;
      const status: AgentStatusFacts = {
        agentStatus: agent.status,
        leadsOnly: Boolean(agent.leadsOnly),
        findsLeads: agent.mode !== "outreach",
        nextRunAt: agent.nextRunAt,
        accountConnected: facts?.accountConnected ?? agentAccountConnected.get(agent.id) ?? false,
        automationPaused,
        outreachOff: workspace?.settings.outreachPaused === true,
        campaignStatus: campaign?.status,
        inviteLimitUntil: facts?.inviteLimitUntil,
        nextSend: facts?.nextSend,
        awaitingAcceptance: facts?.awaitingAcceptance ?? 0,
      };
      return [agent.id, status];
    }),
  );
}
