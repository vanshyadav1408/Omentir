// Per-agent Contacted / Accepted / Messaged / Replied counts for the Agents
// page. Computed on the server so the page no longer downloads every lead and
// enrollment in the workspace to count them.

import {
  STAGE_ACCEPTED,
  STAGE_CONTACTED,
  STAGE_MESSAGED,
  STAGE_REPLIED,
  enrollmentProgressStage,
  leadStage,
} from "@/lib/outreach-stage";

export type AgentMetrics = {
  target: number;
  contacted: number;
  accepted: number;
  messaged: number;
  replied: number;
  acceptRate: number | null;
  replyRate: number | null;
};

export const NO_AGENT_METRICS: AgentMetrics = {
  target: 0,
  contacted: 0,
  accepted: 0,
  messaged: 0,
  replied: 0,
  acceptRate: null,
  replyRate: null,
};

export function buildAgentMetrics(
  agents: Array<{ id: string; leadsOnly?: boolean }>,
  leads: Array<{ id: string; sourceAgentId?: string; outreachStatus?: string }>,
  enrollments: Array<{ leadId: string; status?: string; connectionSentAt?: string }>,
): Record<string, AgentMetrics> {
  const leadsByAgent = new Map<string, Array<(typeof leads)[number]>>();
  for (const lead of leads) {
    const agentId = lead.sourceAgentId;
    if (!agentId) continue;
    const list = leadsByAgent.get(agentId) ?? [];
    list.push(lead);
    leadsByAgent.set(agentId, list);
  }

  // A lead can be enrolled more than once (re-run, second campaign); the
  // furthest of those enrollments is the one that describes the lead.
  const enrollmentStageByLead = new Map<string, number>();
  for (const enrollment of enrollments) {
    enrollmentStageByLead.set(
      enrollment.leadId,
      Math.max(
        enrollmentStageByLead.get(enrollment.leadId) ?? 0,
        enrollmentProgressStage(enrollment.status, enrollment.connectionSentAt),
      ),
    );
  }

  return Object.fromEntries(
    agents.map((agent) => {
      // The agent's own leads, not its group's: groups are shared, so the
      // group count mixed in leads this agent never sourced and made the
      // "x% contacted" denominator bigger than the population it counts.
      const agentLeads = leadsByAgent.get(agent.id) ?? [];
      const target = agentLeads.length;

      // Leads-only agents never send: outreach stats must stay zero even if a
      // shared-group bug left enrollments pointing at their sourced leads.
      if (agent.leadsOnly) {
        return [agent.id, { ...NO_AGENT_METRICS, target }];
      }

      const stages = agentLeads.map((lead) =>
        Math.max(leadStage(lead.outreachStatus), enrollmentStageByLead.get(lead.id) ?? 0),
      );
      const countAtLeast = (stage: number) => stages.filter((value) => value >= stage).length;
      const contacted = countAtLeast(STAGE_CONTACTED);
      const accepted = countAtLeast(STAGE_ACCEPTED);
      const messaged = countAtLeast(STAGE_MESSAGED);
      const replied = countAtLeast(STAGE_REPLIED);

      const acceptRate = contacted > 0 ? Math.round((accepted / contacted) * 100) : null;
      // Only messaged leads can reply, so they are the reply-rate denominator.
      const replyRate = messaged > 0 ? Math.round((replied / messaged) * 100) : null;

      return [
        agent.id,
        { target, contacted, accepted, messaged, replied, acceptRate, replyRate },
      ];
    }),
  );
}
