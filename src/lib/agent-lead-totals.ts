// Sum of the per-agent lead totals shown on the Agents page: each existing
// (active/paused) agent's target group leadCount, deduped when several agents
// feed the same group, falling back to counting leads by sourceAgentId when
// the group count is missing. Deleted agents are removed from Firestore and
// their groups cascade-delete, so their leads never enter this sum. Shared by
// the dashboard and the stats API so the two never disagree.
export function sumAgentLeadTotals(
  agents: Array<{ id: string; targetGroupId: string }>,
  groups: Array<{ id: string; leadCount?: number }>,
  leads: Array<{ sourceAgentId?: string }>,
): number {
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const sourcedByAgent = new Map<string, number>();
  for (const lead of leads) {
    if (!lead.sourceAgentId) continue;
    sourcedByAgent.set(lead.sourceAgentId, (sourcedByAgent.get(lead.sourceAgentId) ?? 0) + 1);
  }

  const sourcedByGroup = new Map<string, number>();
  for (const agent of agents) {
    sourcedByGroup.set(
      agent.targetGroupId,
      (sourcedByGroup.get(agent.targetGroupId) ?? 0) + (sourcedByAgent.get(agent.id) ?? 0),
    );
  }

  let total = 0;
  for (const [groupId, sourced] of sourcedByGroup) {
    const groupLeadCount = Math.max(0, Number(groupById.get(groupId)?.leadCount) || 0);
    total += groupLeadCount || sourced;
  }
  return total;
}
