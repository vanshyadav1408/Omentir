// A/B results for one campaign: of the leads who were sent version A (or B)
// of a tested message, how many replied. Only enrollments that actually
// received a tested step carry abVariant, so leads still waiting on their
// first tested message do not dilute either side.

export type AbSide = { sent: number; replied: number; replyRate: number | null };
export type AbResults = { A: AbSide; B: AbSide };

export function buildAbResults(
  enrollments: Array<{ campaignId: string; leadId: string; abVariant?: "A" | "B" }>,
  campaignId: string,
  repliedLeadIds: Set<string>,
): AbResults {
  const leads = { A: new Set<string>(), B: new Set<string>() };
  for (const enrollment of enrollments) {
    if (enrollment.campaignId !== campaignId || !enrollment.abVariant) continue;
    leads[enrollment.abVariant].add(enrollment.leadId);
  }
  const side = (ids: Set<string>): AbSide => {
    const replied = [...ids].filter((id) => repliedLeadIds.has(id)).length;
    return {
      sent: ids.size,
      replied,
      replyRate: ids.size ? Math.round((replied / ids.size) * 100) : null,
    };
  };
  return { A: side(leads.A), B: side(leads.B) };
}
