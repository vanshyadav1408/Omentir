import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import {
  listAgents,
  listLinkedInAccounts,
  getWorkspace,
} from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { isAtPlanLimit } from "@/lib/agent-limit";
import { planLimits, serializablePlanLimit } from "@/lib/plan-limits";
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

export default async function AgentsPage() {
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }

  // Workspace docs are keyed by owner userId, so both reads run in parallel.
  const [workspace, linkedInAccounts, agents] = await Promise.all([
    getWorkspace(userId),
    listLinkedInAccounts(userId),
    listAgents(userId),
  ]);
  if (!hasActiveSubscription(workspace)) {
    redirect("/upgrade");
  }
  if (!linkedInAccounts.length) {
    redirect("/connect");
  }

  const agentLimit = planLimits(workspace.billing?.plan).agents;

  return (
    <AgentsView
      agents={[]}
      groups={[]}
      leads={[]}
      enrollments={[]}
      linkedInConnected={true}
      agentLimit={serializablePlanLimit(agentLimit)}
      atAgentLimit={isAtPlanLimit(agents.length, agentLimit)}
    />
  );
}
