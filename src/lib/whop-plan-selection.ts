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
  options: { includeHidden?: boolean; requireOmentirTitle?: boolean } = {},
) {
  // Company-wide discovery must keep the title filter so a non-Omentir
  // product on the same Whop account cannot become checkout. Product-scoped
  // lookups already selected the product via WHOP_*_PLAN_ID, so a dashboard
  // rename (for example "Omentir Monthly" -> "Pro") must not block purchase.
  const requireOmentirTitle = options.requireOmentirTitle !== false;

  return plans
    .filter(
      (plan) =>
        plan.plan_type === "renewal" &&
        plan.release_method === "buy_now" &&
        (options.includeHidden || plan.visibility === "visible") &&
        (!requireOmentirTitle ||
          (productTitle(plan.product)?.toLowerCase().includes("omentir") ?? true)),
    )
    .sort((a, b) => {
      const memberDelta = (b.member_count ?? 0) - (a.member_count ?? 0);
      if (memberDelta !== 0) return memberDelta;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0];
}
