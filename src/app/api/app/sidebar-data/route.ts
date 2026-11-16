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
  listLeadPreviews,
  listLinkedInAccounts,
  reconcileActivityFromLive,
} from "@/lib/server/data";
import {
  cachedEnrollmentPreviews,
  cachedLeadPreviews,
} from "@/lib/server/workspace-list-cache";
import { pageLeads, parseLeadPageQuery } from "@/lib/lead-page";
import { buildOverviewSummary } from "@/lib/overview-summary";
import { buildAgentMetrics } from "@/lib/agent-metrics";
import { resolveTimeZone } from "@/lib/time-zone";
import type { Workspace } from "@/lib/server/types";
import {
  getVerifiedLinkedInAccount,
  listVerifiedLinkedInAccounts,
} from "@/lib/server/linkedin-accounts";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { loadAgentStatusFacts } from "@/lib/server/agent-status";
import { loadLinkedInHealth } from "@/lib/server/linkedin-health";
import { listLinkedInInbox } from "@/lib/server/linkedin";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import { loadDurableActivityDays } from "@/lib/server/sidebar-activity-days";

// Small reads several resources in one request need (e.g. "agents,groups,
// agentMetrics"), made once per request.
type SidebarFetchCache = {
  agents?: ReturnType<typeof listAgents>;
  groups?: ReturnType<typeof listGroups>;
};

const ACTIVITY_RECONCILE_MIN_MS = 30_000;
const lastActivityReconcileAt = new Map<string, number>();
const activityReconcileInflight = new Map<string, Promise<unknown>>();
// Last successful inbox per LinkedIn account, served when a poll fails so a
// transient provider error does not blank the Messages list.
const LAST_GOOD_INBOX_MAX_AGE_MS = 30 * 60 * 1000;
const lastGoodInbox = new Map<
  string,
  { threads: Awaited<ReturnType<typeof listLinkedInInbox>>; at: number }
>();

function requestAgents(workspaceId: string, cache: SidebarFetchCache) {
  cache.agents ||= listAgents(workspaceId);
  return cache.agents;
}

function requestGroups(workspaceId: string, cache: SidebarFetchCache) {
  cache.groups ||= listGroups(workspaceId);
  return cache.groups;
}

// Warm the persisted avatar for leads about to be shown, so their pictures
// survive LinkedIn's expiring media URLs.
function warmLeadAvatars(workspaceId: string, leads: Array<{ id: string; avatarUrl?: string }>) {
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
  item: string,
  workspace: Workspace,
  cache: SidebarFetchCache,
) {
  const workspaceId = workspace.id;
  // A resource can carry its own query after "?" (e.g. one Leads page).
  const queryAt = item.indexOf("?");
  const resource = queryAt === -1 ? item : item.slice(0, queryAt);
  const query = queryAt === -1 ? "" : item.slice(queryAt + 1);

  if (resource === "agents") return { agents: await requestAgents(workspaceId, cache) };
  if (resource === "agentStatus") return { agentStatus: await loadAgentStatusFacts(workspaceId) };
  if (resource === "agentApiKeys") return { agentApiKeys: await listAgentApiKeys(workspaceId) };
  if (resource === "groups") return { groups: await requestGroups(workspaceId, cache) };
  if (resource === "leadPreviews") {
    // Messages still matches threads against every lead.
    const leads = await cachedLeadPreviews(workspaceId);
    warmLeadAvatars(workspaceId, leads);
    return { leads };
  }
  if (resource === "leadPage") {
    const [leads, groups] = await Promise.all([
      cachedLeadPreviews(workspaceId),
      requestGroups(workspaceId, cache),
    ]);
    const leadPage = pageLeads(leads, groups, parseLeadPageQuery(query));
    warmLeadAvatars(workspaceId, leadPage.leads);
    return { leadPage };
  }
  if (resource === "overviewSummary") {
    const [agents, groups, leads, enrollments, conversations] = await Promise.all([
      requestAgents(workspaceId, cache),
      requestGroups(workspaceId, cache),
      cachedLeadPreviews(workspaceId),
      cachedEnrollmentPreviews(workspaceId),
      listConversations(workspaceId),
    ]);
    return {
      overviewSummary: buildOverviewSummary({
        agents,
        groups,
        leads,
        enrollments,
        conversations,
        timeZone: resolveTimeZone(workspace.timezone),
      }),
    };
  }
  if (resource === "agentMetrics") {
    const [agents, leads, enrollments] = await Promise.all([
      requestAgents(workspaceId, cache),
      cachedLeadPreviews(workspaceId),
      cachedEnrollmentPreviews(workspaceId),
    ]);
    return { agentMetrics: buildAgentMetrics(agents, leads, enrollments) };
  }
  if (resource === "campaigns") return { campaigns: await listCampaigns(workspaceId) };
  if (resource === "conversations") return { conversations: await listConversations(workspaceId) };
  if (resource === "automationRuns") return { runs: await listAutomationRuns(workspaceId) };
  if (resource === "activityDays") {
    // Durable days are enough for first paint. Live CRM paging and persist
    // run after the response; max-merge never shrinks days frozen by deletes.
    return loadDurableActivityDays({
      listDays: () => listActivityDays(workspaceId),
      scheduleAfter: (work) => {
        after(work);
      },
      reconcileLive: async () => {
        const [leads, enrollments, conversations] = await Promise.all([
          cachedLeadPreviews(workspaceId),
          cachedEnrollmentPreviews(workspaceId),
          listConversationsForActivity(workspaceId),
        ]);
        await reconcileActivityForSidebar(workspaceId, {
          leads,
          enrollments,
          conversations,
        });
      },
    });
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
      requestedResources.map((item) => loadFirestoreResource(item, workspace, cache)),
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
          description: lead.leadReason || "Added to a lead group.",
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
  if (resource === "linkedinHealth") {
    const workspace = await workspacePromise;
    if (!(await subscribedPromise)) return subscriptionRequired();
    return NextResponse.json({ health: await loadLinkedInHealth(workspace) });
  }
  if (resource === "linkedinAccounts") {
    const workspace = await workspacePromise;
    if (!(await subscribedPromise)) return subscriptionRequired();
    const { accounts } = await listVerifiedLinkedInAccounts(workspace.id);
    return NextResponse.json({ accounts });
  }
  if (resource === "linkedinInbox") {
    // Use the workspace's connected accounts straight from Firestore - the
    // account verification is not needed to load the inbox and keeps
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
          const threads = await listLinkedInInbox({
            accountId: account.accountId,
            limit: 30,
            messageLimit: 50,
            includeMessageHistory: false,
          });
          lastGoodInbox.set(account.accountId, { threads, at: Date.now() });
          return threads;
        } catch (error) {
          const message = error instanceof Error ? error.message : "LinkedIn inbox could not be loaded.";
          errors.push(message);
          console.error(`[sidebar-data] inbox load failed for ${account.accountId}:`, message);
          // Serve the last good inbox for this account. Returning [] here made
          // every chat vanish from Messages until the next successful poll.
          const cached = lastGoodInbox.get(account.accountId);
          return cached && Date.now() - cached.at < LAST_GOOD_INBOX_MAX_AGE_MS
            ? cached.threads
            : [];
        }
      }),
    );
    if (uniqueAccounts.length && errors.length === uniqueAccounts.length && !inboxes.flat().length) {
      // Nothing to serve. A non-2xx keeps the client on the inbox it already
      // has instead of replacing it with an empty one.
      return NextResponse.json(
        { error: "LinkedIn messages could not be loaded." },
        { status: 502 },
      );
    }
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
      error: errors.length ? "LinkedIn messages could not be loaded." : undefined,
    });
  }

  return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
}
