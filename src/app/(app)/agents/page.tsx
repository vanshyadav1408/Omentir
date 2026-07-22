import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import {
  listLinkedInAccounts,
  getWorkspace,
} from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { planLimits } from "@/lib/plan-limits";
import type { WorkspaceBilling } from "@/lib/server/types";
import AgentsView from "./agents-view";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "AI Agents - Omentir",
  description: "Manage Omentir AI agents for lead discovery and personalized outreach.",
  path: "/agents",
  noIndex: true,
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function AgentsContent({
  plan,
}: {
  plan: WorkspaceBilling["plan"] | undefined;
}) {
  const agentLimit = planLimits(plan).agents;

  return (
    <AgentsView
      agents={[]}
      groups={[]}
      leads={[]}
      enrollments={[]}
      linkedInConnected={true}
      agentLimit={agentLimit}
      atAgentLimit={false}
    />
  );
}

export default async function AgentsPage() {
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }

  // Workspace docs are keyed by owner userId, so both reads run in parallel.
  const [workspace, linkedInAccounts] = await Promise.all([
    getWorkspace(userId),
    listLinkedInAccounts(userId),
  ]);
  if (!hasActiveSubscription(workspace)) {
    redirect("/upgrade");
  }
  if (!linkedInAccounts.length) {
    redirect("/connect");
  }

  return <AgentsContent plan={workspace.billing?.plan} />;
}
