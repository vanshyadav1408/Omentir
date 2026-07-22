import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import {
  createAgentAndDiscoverLeadsAction,
  createAgentForSetupAction,
  createCampaignAction,
  deleteAgentAction,
  draftAgentSetupAction,
  getSetupProductProfileAction,
  saveProductProfileAction,
} from "@/app/actions";
import { createPageMetadata } from "@/app/seo";
import {
  getLinkedInAccount,
  getWorkspace,
  listAgents,
  listCampaigns,
  listLinkedInAccounts,
} from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { isLocalMode } from "@/lib/runtime-mode";
import SetupClient from "./setup-client";

function isFirstLinkedInConnection(account: NonNullable<Awaited<ReturnType<typeof getLinkedInAccount>>>) {
  return account.createdAt === account.updatedAt;
}

export const metadata = createPageMetadata({
  title: "Setup - Omentir",
  description: "Learn Omentir and create your first AI agent.",
  path: "/setup",
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
  redirect("/dashboard");
}

export default async function SetupPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const workspace = await getWorkspace(userId);
  const [linkedInAccount, linkedInAccounts, agents, campaigns] = await Promise.all([
    getLinkedInAccount(workspace.id),
    listLinkedInAccounts(workspace.id),
    listAgents(workspace.id),
    listCampaigns(workspace.id),
  ]);

  if (!hasActiveSubscription(workspace) || !linkedInAccount) {
    redirect("/onboarding");
  }

  if (
    agents.length > 0 ||
    campaigns.length > 0 ||
    (!isLocalMode() && !isFirstLinkedInConnection(linkedInAccount))
  ) {
    redirect("/dashboard");
  }

  return (
    <SetupClient
      createAgent={createAgentFromSetup}
      prepareAgent={createAgentAndDiscoverLeadsAction}
      draftSetup={draftAgentSetupAction}
      getProfile={getSetupProductProfileAction}
      saveProductProfile={saveProductProfileAction}
      linkedInAccounts={linkedInAccounts.map((account) => ({
        id: account.id,
        displayName: account.displayName,
        accountId: account.accountId,
      }))}
    />
  );
}
