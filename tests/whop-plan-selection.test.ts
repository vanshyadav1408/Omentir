import { expect, test } from "bun:test";
import { chooseCheckoutPlan, type WhopPlanCandidate } from "../src/lib/whop-plan-selection";

function plan(overrides: Partial<WhopPlanCandidate> & Pick<WhopPlanCandidate, "id">): WhopPlanCandidate {
  return {
    created_at: "2026-07-06T09:43:24.152Z",
    member_count: 0,
    plan_type: "renewal",
    product: { title: "Pro" },
    release_method: "buy_now",
    visibility: "hidden",
    ...overrides,
  };
}

test("product-scoped checkout still sells a renamed Pro plan", () => {
  // WHOP_SOLO_PLAN_ID points at the Pro product. The dashboard title is "Pro",
  // not "Omentir", and the plan is hidden. If either check still runs here,
  // /checkout fails and new users cannot buy.
  const selected = chooseCheckoutPlan(
    [
      plan({
        id: "plan_Al7KtrEdgavDa",
        product: { id: "prod_Y5qOgZBCZfHJh", title: "Pro" },
      }),
    ],
    { includeHidden: true, requireOmentirTitle: false },
  );

  expect(selected?.id).toBe("plan_Al7KtrEdgavDa");
});

test("company-wide discovery still refuses a non-Omentir product", () => {
  // Without the title filter, member count would pick this retired $29 plan
  // over a newly created Pro plan and charge the wrong price.
  const selected = chooseCheckoutPlan(
    [
      plan({
        id: "plan_Al7KtrEdgavDa",
        member_count: 0,
        product: { title: "Pro" },
      }),
      plan({
        id: "plan_773vQoJFZjW2h",
        member_count: 2,
        product: { title: "Omentir Monthly" },
      }),
    ],
    { includeHidden: true },
  );

  expect(selected?.id).toBe("plan_773vQoJFZjW2h");
});
