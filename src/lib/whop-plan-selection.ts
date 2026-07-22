export type WhopPlanCandidate = {
  id: string;
  created_at: string;
  member_count: number | null;
  plan_type: string;
  // @whop/sdk 0.0.42 types the plan's product as `unknown`, so the title is
  // narrowed at runtime instead of trusted from the type.
  product?: unknown;
  release_method: string;
  visibility: string;
};

function productTitle(product: unknown): string | undefined {
  if (product && typeof product === "object" && "title" in product) {
    const title = (product as { title?: unknown }).title;
    if (typeof title === "string") return title;
  }
  return undefined;
}

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
        (productTitle(plan.product)?.toLowerCase().includes("omentir") ?? true),
    )
    .sort((a, b) => {
      const memberDelta = (b.member_count ?? 0) - (a.member_count ?? 0);
      if (memberDelta !== 0) return memberDelta;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0];
}
