import { auth } from "@/lib/server/auth";
import { listAgents } from "@/lib/server/data";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import { isAtPlanLimit } from "@/lib/agent-limit";
import { planLimits, serializablePlanLimit } from "@/lib/plan-limits";
import CompleteSetupPrompt from "@/app/(app)/complete-setup-prompt";
import AgentsView from "../agents-view";
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

  const workspace = await resolveActiveWorkspace(userId);
  // One read answers both the setup gate and the plan-limit count.
  const agents = await listAgents(workspace.id);
  if (!agents.length) {
    return (
      <CompleteSetupPrompt
        icon="smart_toy"
        message="Finish the 4 steps on Overview, then start an AI agent."
      />
    );
  }

  const agentLimit = planLimits(workspace.billing?.plan).agents;

  return (
    <AgentsView
      agents={[]}
      groups={[]}
      leads={[]}
      enrollments={[]}
      agentLimit={serializablePlanLimit(agentLimit)}
      atAgentLimit={isAtPlanLimit(agents.length, agentLimit)}
    />
  );
}
