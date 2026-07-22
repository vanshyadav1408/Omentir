import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import {
  createAgentAndDiscoverLeadsAction,
  createAgentForSetupAction,
  createCampaignAction,
  deleteAgentAction,
  draftAgentSetupAction,
  saveProductProfileAction,
  updateAgentAction,
  updateAgentForSetupAction,
} from "@/app/actions";
import {
  getAgent,
  getProductProfile,
  getWorkspace,
  listAgents,
  listCampaigns,
  listLinkedInAccounts,
} from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { formatPlanLimit, planLimits } from "@/lib/plan-limits";
import { isAtPlanLimit } from "@/lib/agent-limit";
import AgentSetup from "./agent-setup";
import { createPageMetadata } from "@/app/seo";
import Link from "next/link";

export const metadata = createPageMetadata({
  title: "New Agent - Omentir",
  description: "Create or edit an Omentir AI agent for customer discovery.",
  path: "/agents/new",
  noIndex: true,
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function createAgentFromSetup(formData: FormData) {
  "use server";

  const groupName = String(formData.get("groupName") || "").trim();
  const agentName = String(formData.get("name") || groupName || "LinkedIn agent").trim();

  const createdAgent = await createAgentForSetupAction(formData);
  formData.set("name", agentName);
  formData.set("groupId", createdAgent.groupId);
  formData.set("allowEmptyLeadGroup", "on");

  try {
    await createCampaignAction(formData);
  } catch (error) {
    // A failed final launch must not leave a newly-created agent consuming the
    // user's plan slot.
    const cleanup = new FormData();
    cleanup.set("agentId", createdAgent.agentId);
    try {
      await deleteAgentAction(cleanup);
    } catch (cleanupError) {
      console.error("Failed to clean up agent after launch error.", cleanupError);
    }
    throw error;
  }
  redirect("/agents");
}

async function launchExistingAgentFromSetup(formData: FormData) {
  "use server";

  const groupName = String(formData.get("groupName") || "").trim();
  const agentName = String(formData.get("name") || groupName || "LinkedIn agent").trim();
  formData.set("name", agentName);

  const updatedAgent = await updateAgentForSetupAction(formData);
  formData.set("groupId", updatedAgent.groupId);
  formData.set("allowEmptyLeadGroup", "on");

  await createCampaignAction(formData);
  redirect("/agents");
}

function AgentLimitReached({ limit }: { limit: number }) {
  return (
    <div className="app-x flex h-full min-h-0 min-w-0 flex-col">
      <div className="mx-auto flex w-full max-w-xl flex-1 items-center justify-center py-10">
        <section className="w-full rounded-md border border-zinc-200 bg-white px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-3">
            <span
              className="material-symbols-outlined text-xl font-light leading-none text-[#ba3871]"
              aria-hidden="true"
            >
              model_training
            </span>
            <div className="min-w-0">
              <h1
                style={{ fontFamily: "var(--font-varta)" }}
                className="text-xl font-semibold tracking-tight text-zinc-950"
              >
                You&apos;ve reached your agent limit
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Your current plan includes up to {formatPlanLimit(limit)} agent
                {limit === 1 ? "" : "s"}. Upgrade your plan or remove an existing agent before
                creating another one.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100 pt-4">
            <Link
              href="/agents"
              className="inline-flex h-9 items-center justify-center rounded-md px-3.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              Back to agents
            </Link>
            <Link
              href="/upgrade"
              style={{ fontFamily: "var(--font-varta)" }}
              className="inline-flex h-9 items-center justify-center rounded-md bg-[#ba3871] px-4 text-sm font-semibold text-white shadow-sm transition hover:brightness-[0.98]"
            >
              Upgrade plan
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default async function NewAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; mode?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }

  const workspace = await getWorkspace(userId);
  if (!hasActiveSubscription(workspace)) {
    redirect("/upgrade");
  }

  const params = await searchParams;
  const [linkedInAccounts, requestedAgent, profile] = await Promise.all([
    listLinkedInAccounts(workspace.id),
    params.id ? getAgent(workspace.id, params.id) : null,
    getProductProfile(workspace.id),
  ]);
  if (!linkedInAccounts.length) {
    redirect("/connect");
  }

  let agent = requestedAgent;
  let isResumingOutreach = false;

  // Enforce the plan's agent limit at the start of creation. If the only slot
  // is occupied by an agent without outreach, selecting the full-agent flow
  // resumes that agent instead of stranding the user behind the quota screen.
  if (!agent) {
    const existingAgents = await listAgents(workspace.id);
    const agentLimit = planLimits(workspace.billing?.plan).agents;
    if (isAtPlanLimit(existingAgents.length, agentLimit)) {
      if (params.mode !== "leads") {
        const campaigns = await listCampaigns(workspace.id);
        const campaignGroupIds = new Set(campaigns.map((campaign) => campaign.groupId));
        const resumableAgent = existingAgents.find(
          (existingAgent) => !campaignGroupIds.has(existingAgent.targetGroupId),
        );
        if (resumableAgent) {
          agent = resumableAgent;
          isResumingOutreach = true;
        }
      }

      if (!agent) return <AgentLimitReached limit={agentLimit} />;
    }
  }
  return (
    <AgentSetup
      key={agent?.id || "new-agent"}
      createAgent={
        isResumingOutreach
          ? launchExistingAgentFromSetup
          : agent
            ? updateAgentAction
            : createAgentFromSetup
      }
      prepareAgent={createAgentAndDiscoverLeadsAction}
      leadsOnly={!agent && params.mode === "leads"}
      draftSetup={draftAgentSetupAction}
      saveProductProfile={saveProductProfileAction}
      initialAgent={agent}
      linkedInAccounts={linkedInAccounts.map((account) => ({
        id: account.id,
        displayName: account.displayName,
        accountId: account.accountId,
        avatarUrl: account.avatarUrl,
      }))}
      profile={
        profile
          ? {
              companyName: profile.companyName || "",
              description: profile.description || "",
              industry: profile.industry || "",
              companySize: profile.companySize || "",
              painPointsText: profile.painPointsText || "",
              websiteUrl: profile.websiteUrl || "",
            }
          : null
      }
    />
  );
}
