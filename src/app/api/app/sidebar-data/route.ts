import { auth } from "@/lib/server/auth";
import { after, NextResponse } from "next/server";
import { httpsAvatarUrl, isExpiredLinkedInMediaUrl } from "@/lib/lead-avatar";
import { queueLeadAvatarPersist } from "@/lib/server/lead-avatar-cache";
import { syncLeadAvatarsFromInboxThreads } from "@/lib/server/lead-avatar-sync";
import {
  getLeadsByIds,
  listActivityDays,
  listAgents,
  listAgentApiKeys,
  listAutomationRuns,
  listCampaignEnrollmentPreviews,
  listCampaigns,
  listConversations,
  listConversationsForActivity,
  listGroups,
  listLeadAgentRefs,
  listLeadDashboardPreviews,
  listLeadPreviews,
  listLinkedInAccounts,
  reconcileActivityFromLive,
} from "@/lib/server/data";
import {
  getVerifiedLinkedInAccount,
  listVerifiedLinkedInAccounts,
} from "@/lib/server/linkedin-accounts";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { listLinkedInInbox } from "@/lib/server/unipile";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";

type SidebarFetchCache = {
  leadDashboardPreviews?: ReturnType<typeof listLeadDashboardPreviews>;
  enrollmentPreviews?: ReturnType<typeof listCampaignEnrollmentPreviews>;
};

const ACTIVITY_RECONCILE_MIN_MS = 30_000;
const lastActivityReconcileAt = new Map<string, number>();
const activityReconcileInflight = new Map<string, Promise<unknown>>();

function cachedLeadDashboardPreviews(workspaceId: string, cache: SidebarFetchCache) {
  cache.leadDashboardPreviews ||= listLeadDashboardPreviews(workspaceId);
  return cache.leadDashboardPreviews;
}

function cachedEnrollmentPreviews(workspaceId: string, cache: SidebarFetchCache) {
  cache.enrollmentPreviews ||= listCampaignEnrollmentPreviews(workspaceId);
  return cache.enrollmentPreviews;
}

async function reconcileActivityForSidebar(
  workspaceId: string,
  input: Parameters<typeof reconcileActivityFromLive>[1],
) {
  const inflight = activityReconcileInflight.get(workspaceId);
  if (inflight) return inflight;
  const last = lastActivityReconcileAt.get(workspaceId) || 0;
  if (Date.now() - last < ACTIVITY_RECONCILE_MIN_MS) return;

  const work = reconcileActivityFromLive(workspaceId, input)
    .then(() => {
      lastActivityReconcileAt.set(workspaceId, Date.now());
    })
    .catch((error) => {
      console.error(
        "[sidebar-data] activity reconcile failed:",
        error instanceof Error ? error.message : error,
      );
    })
    .finally(() => {
      activityReconcileInflight.delete(workspaceId);
    });
  activityReconcileInflight.set(workspaceId, work);
  return work;
}

async function loadFirestoreResource(
  resource: string,
  workspaceId: string,
  cache: SidebarFetchCache,
) {
  if (resource === "agents") return { agents: await listAgents(workspaceId) };
  if (resource === "agentApiKeys") return { agentApiKeys: await listAgentApiKeys(workspaceId) };
  if (resource === "groups") return { groups: await listGroups(workspaceId) };
  if (resource === "leadPreviews") {
    const leads = await listLeadPreviews(workspaceId);
    after(() => {
      let warmed = 0;
      for (const lead of leads) {
        if (warmed >= 100) break;
        const url = httpsAvatarUrl(lead.avatarUrl);
        if (!url || isExpiredLinkedInMediaUrl(url)) continue;
        queueLeadAvatarPersist(lead.id, workspaceId, url);
        warmed += 1;
      }
    });
    return { leads };
  }
  if (resource === "leadDashboardPreviews") {
    return { leads: await cachedLeadDashboardPreviews(workspaceId, cache) };
  }
  if (resource === "leadAgentRefs") return { leads: await listLeadAgentRefs(workspaceId) };
  if (resource === "enrollmentPreviews") {
    return { enrollments: await cachedEnrollmentPreviews(workspaceId, cache) };
  }
  if (resource === "campaigns") return { campaigns: await listCampaigns(workspaceId) };
  if (resource === "conversations") return { conversations: await listConversations(workspaceId) };
  if (resource === "automationRuns") return { runs: await listAutomationRuns(workspaceId) };
  if (resource === "activityDays") {
    // Refresh durable history from whatever CRM rows still exist, then return
    // the full series. max-merge never shrinks days already frozen by deletes.
    const [leads, enrollments, conversations] = await Promise.all([
      cachedLeadDashboardPreviews(workspaceId, cache),
      cachedEnrollmentPreviews(workspaceId, cache),
      listConversationsForActivity(workspaceId),
    ]);
    await reconcileActivityForSidebar(workspaceId, {
      leads,
      enrollments,
      conversations,
    });
    return { activityDays: await listActivityDays(workspaceId) };
  }
  if (resource === "linkedinConnected") {
    return { connected: Boolean(await getVerifiedLinkedInAccount(workspaceId)) };
  }
  return null;
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Subscription and workspace-scoped reads use the active workspace cookie.
  const workspacePromise = resolveActiveWorkspace(userId);
  const subscribedPromise = workspacePromise.then(hasActiveSubscription);
  // Branches that return without awaiting the gate (e.g. unknown resource)
  // must not turn a failed workspace read into an unhandled rejection.
  subscribedPromise.catch(() => {});
  workspacePromise.catch(() => {});
  const subscriptionRequired = () =>
    NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") || "";

  const requestedResources = resource.split(",").filter(Boolean);
  if (requestedResources.length) {
    const [workspace, subscribed] = await Promise.all([workspacePromise, subscribedPromise]);
    if (!subscribed) return subscriptionRequired();
    const cache: SidebarFetchCache = {};
    const results = await Promise.all(
      requestedResources.map((item) => loadFirestoreResource(item, workspace.id, cache)),
    );
    if (results.every((result) => result !== null)) {
      return NextResponse.json(Object.assign({}, ...results));
    }
  }
  if (resource === "activityItems") {
    const workspace = await workspacePromise;
    const [subscribed, runs, agents, leads, campaigns, enrollments, conversations] =
      await Promise.all([
        subscribedPromise,
        listAutomationRuns(workspace.id),
        listAgents(workspace.id),
        listLeadPreviews(workspace.id),
        listCampaigns(workspace.id),
        listCampaignEnrollmentPreviews(workspace.id),
        listConversations(workspace.id),
      ]);
    if (!subscribed) return subscriptionRequired();
    const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
    // The lead list is capped, so resolve any lead referenced by an
    // enrollment/conversation that fell outside that page - otherwise those
    // outreach rows lose the person's name/details in larger workspaces.
    const knownLeadIds = new Set(leads.map((lead) => lead.id));
    const referencedLeadIds = [
      ...enrollments.map((enrollment) => enrollment.leadId),
      ...conversations.map((conversation) => conversation.leadId),
    ].filter((leadId) => leadId && !knownLeadIds.has(leadId));
    const extraLeads = referencedLeadIds.length
      ? await getLeadsByIds(workspace.id, referencedLeadIds)
      : [];
    const leadsById = new Map(
      [...leads, ...extraLeads].map((lead) => [lead.id, lead]),
    );
    const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign.name]));
    const items = [
      ...runs.map((run) => ({
        id: `automation-${run.id}`,
        at: run.createdAt,
        type:
          run.status === "error"
            ? "error"
            : run.kind === "agent" || run.kind === "people_engine"
              ? "agent"
              : "system",
        title: run.kind === "agent" || run.kind === "people_engine" ? "Agent run" : "Automation",
        description: run.message,
        tag: run.kind === "people_engine" ? "People Engine" : run.kind,
        status: run.status === "error" ? "error" : run.status === "started" ? "pending" : "success",
      })),
      ...agents.flatMap((agent) =>
        [
          {
            id: `agent-created-${agent.id}`,
            at: agent.createdAt,
            type: "system",
            title: "Agent created",
            description: agent.targetGroupName
              ? `Target group: ${agent.targetGroupName}.`
              : "Agent setup saved.",
            tag: agent.name || agent.targetGroupName || undefined,
            status: "success",
            agent,
          },
          agent.lastRunAt
            ? {
                id: `agent-ran-${agent.id}`,
                at: agent.lastRunAt,
                type: agent.status === "error" ? "error" : "agent",
                title: agent.status === "error" ? "Agent run failed" : "Agent run completed",
                description:
                  agent.status === "error"
                    ? "The latest agent run could not complete."
                    : "Agent finished its discovery run.",
                tag: agent.name || agent.targetGroupName || undefined,
                status: agent.status === "error" ? "error" : "success",
                agent,
              }
            : null,
        ].filter(Boolean),
      ),
      ...leads.map((lead) => {
        const agent = lead.sourceAgentId ? agentsById.get(lead.sourceAgentId) : undefined;
        return {
          id: `lead-${lead.id}`,
          at: lead.createdAt,
          type: "lead",
          title: agent ? "Lead discovered" : "Lead added",
          description: lead.scoreReasons?.[0] || "Added to a lead group.",
          tag: agent?.name || agent?.targetGroupName || undefined,
          status: "success",
          agent,
          lead,
        };
      }),
      ...enrollments.flatMap((enrollment) => {
        const campaignName = campaignsById.get(enrollment.campaignId) || "Campaign";
        const lead = leadsById.get(enrollment.leadId);
        return [
          {
            id: `enrollment-${enrollment.id}`,
            at: enrollment.createdAt,
            type: "system",
            title: "Lead queued",
            description: "Entered the campaign queue.",
            tag: campaignName,
            status: "success",
            lead,
          },
          enrollment.connectionSentAt
            ? {
                id: `connection-${enrollment.id}`,
                at: enrollment.connectionSentAt,
                type: "invite",
                title: "Connection request",
                description: lead ? `Sent to ${lead.name}.` : "Connection request sent.",
                tag: campaignName,
                status: "success",
                lead,
              }
            : null,
          enrollment.status === "error"
            ? {
                id: `error-${enrollment.id}`,
                at: enrollment.updatedAt,
                type: "error",
                title: "Automation error",
                description: enrollment.lastError || `Omentir could not continue ${campaignName}.`,
                tag: campaignName,
                status: "error",
                lead,
              }
            : null,
        ].filter(Boolean);
      }),
      ...conversations.flatMap((conversation) => {
        const lead = leadsById.get(conversation.leadId);
        return conversation.messages
          .filter((message) => message.direction === "outbound")
          .map((message) => ({
            id: `conversation-${conversation.id}-${message.id}`,
            at: message.createdAt,
            type: "message",
            title: "Message sent",
            description: message.body || "Outbound message recorded.",
            status: "success",
            lead,
          }));
      }),
    ].filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return NextResponse.json({ items });
  }
  if (resource === "linkedinAccounts") {
    const workspace = await workspacePromise;
    if (!(await subscribedPromise)) return subscriptionRequired();
    const { accounts } = await listVerifiedLinkedInAccounts(workspace.id);
    return NextResponse.json({ accounts });
  }
  if (resource === "linkedinInbox") {
    // Use the workspace's connected accounts straight from Firestore - the
    // Unipile /accounts verification is not needed to load the inbox and keeps
    // it off the critical path (it still runs for the connected/accounts
    // resources). If an account is stale, its inbox call simply returns empty.
    const workspace = await workspacePromise;
    const [subscribed, accounts] = await Promise.all([
      subscribedPromise,
      listLinkedInAccounts(workspace.id),
    ]);
    if (!subscribed) return subscriptionRequired();
    const seenAccountIds = new Set<string>();
    const uniqueAccounts = accounts.filter((account) => {
      if (seenAccountIds.has(account.accountId)) return false;
      seenAccountIds.add(account.accountId);
      return true;
    });
    const errors: string[] = [];
    const inboxes = await Promise.all(
      uniqueAccounts.map(async (account) => {
        try {
          return await listLinkedInInbox({
            accountId: account.accountId,
            limit: 30,
            messageLimit: 50,
            includeMessageHistory: false,
          });
        } catch (error) {
          errors.push(error instanceof Error ? error.message : "LinkedIn inbox could not be loaded.");
          return [];
        }
      }),
    );
    const threads = inboxes
      .flat()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    after(() =>
      syncLeadAvatarsFromInboxThreads(workspace.id, threads).catch((error) => {
        console.error(
          "[sidebar-data] lead avatar sync failed:",
          error instanceof Error ? error.message : error,
        );
      }),
    );
    return NextResponse.json({
      threads,
      senderAccounts: uniqueAccounts.map((account) => ({
        accountId: account.accountId,
        displayName: account.displayName,
        avatarUrl: account.avatarUrl,
      })),
      error: errors.length ? "LinkedIn messages could not be loaded from Unipile." : undefined,
    });
  }

  return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
}
