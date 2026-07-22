import "server-only";

import { Whop } from "@whop/sdk";
import { chooseCheckoutPlan } from "@/lib/whop-plan-selection";

let client: Whop | null = null;
const checkoutPlanIds = new Map<string, string>();
export type BillingPlan = "solo" | "startup";

// Lazily constructs the Whop client so a missing env var surfaces as a handled
// error inside a request rather than a module-load crash. Reads WHOP_API_KEY
// (used to look up a buyer's email) from the environment.
//
// WHOP_WEBHOOK_SECRET is base64-encoded before the SDK receives it: the SDK
// verifies signatures via `standardwebhooks`, which base64-decodes the key it
// is given. Whop's dashboard secret is a plain string, so encoding it makes
// the decoded key match the bytes Whop signed with. Matches Whop's own guide.
export function getWhopClient() {
  if (!client) {
    client = new Whop({
      apiKey: process.env.WHOP_API_KEY,
      webhookKey: Buffer.from(process.env.WHOP_WEBHOOK_SECRET ?? "", "utf8").toString("base64"),
    });
  }
  return client;
}

export type WhopActiveMembership = {
  memberId: string;
  membershipId: string;
  manageUrl?: string;
  plan: BillingPlan;
  payerEmail: string;
  currentPeriodEnd?: string;
};

function unixToIso(value?: string | null) {
  if (!value) return undefined;
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Date(timestamp * 1000).toISOString();
}

export function getConfiguredWhopPlanIds() {
  return {
    solo: process.env.WHOP_SOLO_PLAN_ID?.trim(),
    startup: process.env.WHOP_STARTUP_PLAN_ID?.trim() || process.env.WHOP_PLAN_ID?.trim(),
  } satisfies Record<BillingPlan, string | undefined>;
}

export function planFromWhopPayload(payload: unknown): BillingPlan | null {
  const configured = getConfiguredWhopPlanIds();
  if (configured.solo && payloadContainsString(payload, configured.solo)) return "solo";
  if (configured.startup && payloadContainsString(payload, configured.startup)) return "startup";
  return null;
}

function payloadContainsString(value: unknown, expected: string): boolean {
  if (typeof value === "string") return value === expected;
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => payloadContainsString(item, expected));
  return Object.values(value).some((item) => payloadContainsString(item, expected));
}

export async function getWhopCheckoutPlanId(billingPlan: BillingPlan = "solo") {
  const cached = checkoutPlanIds.get(billingPlan);
  if (cached) return cached;

  const configuredPlanId = getConfiguredWhopPlanIds()[billingPlan];
  if (configuredPlanId?.startsWith("plan_")) {
    checkoutPlanIds.set(billingPlan, configuredPlanId);
    return configuredPlanId;
  }

  // Company-wide auto-discovery below cannot tell plans apart, so it only
  // backs the legacy single-plan (startup) setup. Checking out any other plan
  // without a plan_/prod_ id configured would silently charge the wrong
  // price - fail loud instead.
  if (billingPlan !== "startup" && !configuredPlanId?.startsWith("prod_")) {
    throw new Error(
      `WHOP_${billingPlan.toUpperCase()}_PLAN_ID is not configured; cannot start a ${billingPlan} checkout.`,
    );
  }

  const companyId = process.env.WHOP_COMPANY_ID;
  if (!companyId) {
    throw new Error("WHOP_COMPANY_ID is required to resolve the Whop checkout plan.");
  }

  const whop = getWhopClient();

  if (configuredPlanId?.startsWith("prod_")) {
    const productPlans = await whop.plans.list({
      company_id: companyId,
      product_ids: [configuredPlanId],
      first: 20,
      order: "created_at",
      direction: "desc",
    });
    const productPlan = chooseCheckoutPlan(productPlans.data, { includeHidden: true });
    if (productPlan) {
      checkoutPlanIds.set(billingPlan, productPlan.id);
      return productPlan.id;
    }
  }

  if (billingPlan !== "startup") {
    throw new Error(
      `No purchasable Whop plan found for the ${billingPlan} product; check WHOP_${billingPlan.toUpperCase()}_PLAN_ID.`,
    );
  }

  const plans = await whop.plans.list({
    company_id: companyId,
    plan_types: ["renewal"],
    release_methods: ["buy_now"],
    visibilities: ["visible"],
    first: 20,
    order: "created_at",
    direction: "desc",
  });
  const checkoutPlan = chooseCheckoutPlan(plans.data);
  if (!checkoutPlan) {
    throw new Error("No visible Whop renewal plan found for checkout.");
  }

  checkoutPlanIds.set(billingPlan, checkoutPlan.id);
  return checkoutPlan.id;
}

export async function findActiveWhopMembershipByEmail(email: string) {
  const companyId = process.env.WHOP_COMPANY_ID;
  if (!companyId) return null;

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const whop = getWhopClient();
  const configuredPlans = getConfiguredWhopPlanIds();
  const planIds = await Promise.all(
    (Object.keys(configuredPlans) as BillingPlan[]).map(async (plan) => {
      const configured = configuredPlans[plan];
      if (!configured) return null;
      // A misconfigured plan id must not break recovery for the other plans.
      const id = await getWhopCheckoutPlanId(plan).catch(() => null);
      return id ? { plan, id } : null;
    }),
  );
  const members = await whop.members.list({
    company_id: companyId,
    query: normalizedEmail,
    access_level: "customer",
    statuses: ["joined"],
    first: 10,
  });

  const member = members.data.find(
    (item) => item.user?.email?.trim().toLowerCase() === normalizedEmail,
  );

  if (!member) return null;
  if (!member.user?.id) return null;

  const memberships = await whop.memberships.list({
    company_id: companyId,
    user_ids: member.user ? [member.user.id] : undefined,
    plan_ids: planIds.some(Boolean)
      ? planIds.map((item) => item?.id).filter((id): id is string => Boolean(id))
      : undefined,
    statuses: ["active", "trialing"],
    first: 10,
  });

  const membership = memberships.data.find(
    (item) => item.user?.id === member.user?.id || item.member?.id === member.id,
  );
  if (!membership) return null;
  const matchedPlan = planIds.find((item) => item?.id && payloadContainsString(membership, item.id));

  return {
    memberId: member.id,
    membershipId: membership.id,
    manageUrl: membership.manage_url || undefined,
    plan: matchedPlan?.plan || "startup",
    payerEmail: membership.user?.email?.trim().toLowerCase() || normalizedEmail,
    currentPeriodEnd: unixToIso(membership.renewal_period_end),
  } satisfies WhopActiveMembership;
}
