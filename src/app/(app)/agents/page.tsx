import { auth } from "@/lib/server/auth";
import {
  listAgents,
  listLinkedInAccounts,
  getWorkspace,
} from "@/lib/server/data";
import { getWorkspaceSetup } from "@/lib/server/workspace-setup";
import { isAtPlanLimit } from "@/lib/agent-limit";
import { planLimits, serializablePlanLimit } from "@/lib/plan-limits";
import CompleteSetupPrompt from "@/app/(app)/complete-setup-prompt";
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

  const setup = await getWorkspaceSetup(userId);
  if (!setup.hasAgent) {
    return (
      <CompleteSetupPrompt
        emoji="🤖"
        message="Finish the 4 steps on Overview, then start an AI agent."
      />
    );
  }

  const [workspace, linkedInAccounts, agents] = await Promise.all([
    getWorkspace(userId),
    listLinkedInAccounts(userId),
    listAgents(userId),
  ]);
  const agentLimit = planLimits(workspace.billing?.plan).agents;

  return (
    <AgentsView
      agents={[]}
      groups={[]}
      leads={[]}
      enrollments={[]}
      linkedInConnected={linkedInAccounts.length > 0}
      agentLimit={serializablePlanLimit(agentLimit)}
      atAgentLimit={isAtPlanLimit(agents.length, agentLimit)}
    />
  );
}
