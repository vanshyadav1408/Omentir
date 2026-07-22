export type WhopPlanCandidate = {
  id: string;
  created_at: string;
  member_count: number | null;
  plan_type: string;
  product?: { title?: string | null } | null;
  release_method: string;
  visibility: string;
};

export function chooseCheckoutPlan(
  plans: WhopPlanCandidate[],
  options: { includeHidden?: boolean } = {},
) {
  return plans
    .filter(
      (plan) =>
        plan.plan_type === "renewal" &&
        plan.release_method === "buy_now" &&
        (options.includeHidden || plan.visibility === "visible") &&
        (plan.product?.title?.toLowerCase().includes("omentir") ?? true),
    )
    .sort((a, b) => {
      const memberDelta = (b.member_count ?? 0) - (a.member_count ?? 0);
      if (memberDelta !== 0) return memberDelta;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0];
}
