import "server-only";

import { Whop } from "@whop/sdk";
import { chooseCheckoutPlan } from "@/lib/whop-plan-selection";
import {
  extraLinkedInSeatMonthlyTotalUsd,
  extraLinkedInSeatPlanTitle,
  extraLinkedInSeatsFromWhopFields,
  extraSeatBuyerEmails,
  extraSeatMonthlyUsdFromWhopMoney,
  extraSeatMonthlyUsdFromWhopSources,
  extraSeatWhopMembershipMatchesBuyer,
  isAlreadyTerminatedWhopMembershipError,
  isLinkedInSeatCheckoutMetadata,
  isLinkedInSeatProduct,
  LINKEDIN_SEAT_CHECKOUT_KIND,
  LINKEDIN_SEAT_PRODUCT_TITLE,
  parseExtraLinkedInSeatCount,
  selectExtraSeatMembership,
} from "@/lib/linkedin-seat-pricing";

let client: Whop | null = null;
const checkoutPlanIds = new Map<string, string>();
let linkedInSeatProductId: string | null = null;
// "startup" is a retired product. It stays here so existing subscribers keep
// resolving and renewing; it is no longer purchasable.
export type BillingPlan = "solo" | "lifetime" | "startup";

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
    lifetime: process.env.WHOP_LIFETIME_PLAN_ID?.trim(),
    startup: process.env.WHOP_STARTUP_PLAN_ID?.trim() || process.env.WHOP_PLAN_ID?.trim(),
  } satisfies Record<BillingPlan, string | undefined>;
}

export function planFromWhopPayload(payload: unknown): BillingPlan | null {
  const configured = getConfiguredWhopPlanIds();
  if (configured.solo && payloadContainsString(payload, configured.solo)) return "solo";
  if (configured.lifetime && payloadContainsString(payload, configured.lifetime)) return "lifetime";
  if (configured.startup && payloadContainsString(payload, configured.startup)) return "startup";
  return null;
}

/** One-time purchase rather than a renewing subscription. */
export function isLifetimePlan(plan: BillingPlan | string | undefined) {
  return plan === "lifetime";
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

  // Lifetime is a one-time purchase, and every discovery path below resolves
  // through chooseCheckoutPlan, which only accepts plan_type "renewal". A
  // prod_ id would therefore find nothing here; demand the exact plan_ id so a
  // misconfigured deploy fails at checkout instead of billing the wrong price.
  if (billingPlan === "lifetime") {
    throw new Error(
      "WHOP_LIFETIME_PLAN_ID must be the one-time plan's plan_... id; cannot start a lifetime checkout.",
    );
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
      account_id: companyId,
      product_ids: [configuredPlanId],
      first: 20,
      order: "created_at",
      direction: "desc",
    });
    const productPlan = chooseCheckoutPlan(productPlans.data, {
      includeHidden: true,
      requireOmentirTitle: false,
    });
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
    account_id: companyId,
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
    // "completed" covers the lifetime plan: a one-time purchase finishes its
    // payment schedule immediately and still carries access, so recovery would
    // miss those buyers if we only looked at renewing memberships.
    statuses: ["active", "trialing", "completed"],
    first: 10,
  });

  const membership = memberships.data.find(
    (item) => item.user?.id === member.user?.id || item.member?.id === member.id,
  );
  if (!membership) return null;
  // Never default to a higher tier: an unmatched membership must not grant
  // Startup limits (unlimited agents) to a Basic buyer.
  const matchedPlan = planIds.find((item) => item?.id && payloadContainsString(membership, item.id));
  if (!matchedPlan) return null;

  return {
    memberId: member.id,
    membershipId: membership.id,
    manageUrl: membership.manage_url || undefined,
    plan: matchedPlan.plan,
    payerEmail: membership.user?.email?.trim().toLowerCase() || normalizedEmail,
    currentPeriodEnd: unixToIso(membership.renewal_period_end),
  } satisfies WhopActiveMembership;
}

export async function cancelWhopSeatMembership(membershipId: string | undefined | null) {
  const id = membershipId?.trim();
  if (!id) return;
  try {
    await getWhopClient().memberships.cancel(id, { cancellation_mode: "immediate" });
  } catch (error) {
    if (isAlreadyTerminatedWhopMembershipError(error)) return;
    console.error(
      "[whop] failed to cancel extra LinkedIn seat membership",
      id,
      error instanceof Error ? error.message : error,
    );
  }
}

export type WhopActiveLinkedInSeatMembership = {
  extraSeats: number;
  membershipId: string;
  payerEmail: string;
  monthlyUsd?: number;
};

function objectMetadata(
  value: unknown,
): { [key: string]: unknown } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as { [key: string]: unknown };
}

export async function extraLinkedInSeatsFromWhopSource(source: {
  metadata?: { [key: string]: unknown } | null;
  plan?: { id?: string | null; metadata?: { [key: string]: unknown } | null; title?: string | null } | null;
  plan_id?: string | null;
  product?: { title?: string | null; metadata?: { [key: string]: unknown } | null } | null;
}) {
  const direct = extraLinkedInSeatsFromWhopFields({
    metadata: source.metadata,
    planMetadata: source.plan?.metadata,
    planTitle: source.plan?.title,
    product: source.product,
  });
  if (direct) return direct;

  const looksLikeSeats =
    isLinkedInSeatProduct(source.product || {}) || isLinkedInSeatCheckoutMetadata(source.metadata);
  const planId = source.plan?.id?.trim() || source.plan_id?.trim();
  if (!looksLikeSeats || !planId) return null;

  const plan = await getWhopClient().plans.retrieve(planId);
  return extraLinkedInSeatsFromWhopFields({
    metadata: source.metadata,
    planMetadata: objectMetadata(plan.metadata),
    planTitle: plan.title,
    product: source.product,
  });
}

export type WhopMatchedLinkedInSeatMembership = WhopActiveLinkedInSeatMembership & {
  duplicateMembershipIds: string[];
};

const EXTRA_SEAT_MEMBERSHIP_CACHE_MS = 45_000;
const extraSeatMembershipCache = new Map<
  string,
  { at: number; value: WhopMatchedLinkedInSeatMembership | null }
>();
const extraSeatMembershipInflight = new Map<
  string,
  Promise<WhopMatchedLinkedInSeatMembership | null>
>();

function extraSeatMembershipCacheKey(input: {
  emails?: Array<string | null | undefined>;
  workspaceId?: string | null;
  workspaceIds?: Array<string | null | undefined>;
}) {
  const workspaceIds = [
    ...new Set(
      [input.workspaceId, ...(input.workspaceIds || [])]
        .map((id) => id?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  ].sort();
  return JSON.stringify({
    emails: extraSeatBuyerEmails(input.emails || []),
    workspaceIds,
  });
}

async function extraSeatMonthlyUsdFromMembership(input: {
  id: string;
  planId?: string | null;
  promo?: unknown;
  payment?: unknown;
}) {
  const payment = input.payment ?? (await latestPaidPaymentForMembership(input.id));
  let planId = input.planId?.trim() || "";
  let promo = input.promo;
  if (!planId) {
    try {
      const membership = await getWhopClient().memberships.retrieve(input.id);
      planId = membership.plan?.id || "";
      promo = promo ?? membership.promo_code;
    } catch {
      // Payment total still works when a promo is on the receipt.
    }
  }
  let planRenewal = extraSeatMonthlyUsdFromWhopMoney(
    payment && typeof payment === "object" && "plan" in payment
      ? (payment as { plan?: { renewal_price?: unknown } }).plan?.renewal_price
      : undefined,
  );
  if (planRenewal == null && planId) {
    const plan = await getWhopClient().plans.retrieve(planId);
    planRenewal = extraSeatMonthlyUsdFromWhopMoney(plan.renewal_price);
  }
  return extraSeatMonthlyUsdFromWhopSources({
    payment,
    planRenewalPrice: planRenewal,
    membershipPromo: promo,
  });
}

export async function extraSeatMonthlyUsdForMembership(input: {
  id: string;
  planId?: string | null;
  promo?: unknown;
  payment?: unknown;
}) {
  return extraSeatMonthlyUsdFromMembership(input);
}

async function latestPaidPaymentForMembership(membershipId: string) {
  const companyId = process.env.WHOP_COMPANY_ID?.trim();
  if (!companyId) return null;
  try {
    const payments = await getWhopClient().payments.list({
      company_id: companyId,
      query: membershipId,
      include_free: true,
      first: 5,
      order: "created_at",
      direction: "desc",
    });
    return (
      payments.data.find((payment) => payment.membership?.id === membershipId) ||
      payments.data[0] ||
      null
    );
  } catch (error) {
    console.error(
      "[whop] failed to load Extra Seats payment total",
      membershipId,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

async function lookupActiveLinkedInSeatMembership(input: {
  emails?: Array<string | null | undefined>;
  workspaceId?: string | null;
  workspaceIds?: Array<string | null | undefined>;
}): Promise<WhopMatchedLinkedInSeatMembership | null> {
  const companyId = process.env.WHOP_COMPANY_ID?.trim();
  if (!companyId) return null;

  const productId = await getLinkedInSeatProductId().catch(() => null);
  if (!productId) return null;

  const matches: WhopActiveLinkedInSeatMembership[] = [];
  const membershipBilling = new Map<string, { planId?: string; promo?: unknown }>();
  const memberships = await getWhopClient().memberships.list({
    company_id: companyId,
    product_ids: [productId],
    statuses: ["active", "trialing"],
    first: 50,
    order: "created_at",
    direction: "desc",
  });

  for (const membership of memberships.data) {
    if (
      !extraSeatWhopMembershipMatchesBuyer(
        {
          metadata: membership.metadata,
          userEmail: membership.user?.email,
        },
        { workspaceId: input.workspaceId, workspaceIds: input.workspaceIds, emails: input.emails },
      )
    ) {
      continue;
    }
    const extraSeats = await extraLinkedInSeatsFromWhopSource(membership);
    if (!extraSeats) continue;
    membershipBilling.set(membership.id, {
      planId: membership.plan?.id,
      promo: membership.promo_code,
    });
    matches.push({
      extraSeats,
      membershipId: membership.id,
      payerEmail:
        membership.user?.email?.trim().toLowerCase() ||
        input.emails?.map((email) => email?.trim().toLowerCase()).find(Boolean) ||
        "",
    });
  }

  const selected = selectExtraSeatMembership(matches);
  if (!selected) return null;
  const billing = membershipBilling.get(selected.winner.membershipId);
  const monthlyUsd = await extraSeatMonthlyUsdFromMembership({
    id: selected.winner.membershipId,
    planId: billing?.planId,
    promo: billing?.promo,
  }).catch(() => null);
  return {
    ...selected.winner,
    monthlyUsd: monthlyUsd ?? undefined,
    duplicateMembershipIds: selected.duplicates.map((item) => item.membershipId),
  };
}

export async function findActiveLinkedInSeatMembership(input: {
  emails?: Array<string | null | undefined>;
  workspaceId?: string | null;
  workspaceIds?: Array<string | null | undefined>;
}) {
  const key = extraSeatMembershipCacheKey(input);
  const cached = extraSeatMembershipCache.get(key);
  if (cached && Date.now() - cached.at < EXTRA_SEAT_MEMBERSHIP_CACHE_MS) {
    return cached.value;
  }
  const pending = extraSeatMembershipInflight.get(key);
  if (pending) return pending;

  const lookup = lookupActiveLinkedInSeatMembership(input)
    .then((value) => {
      extraSeatMembershipCache.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => {
      extraSeatMembershipInflight.delete(key);
    });
  extraSeatMembershipInflight.set(key, lookup);
  return lookup;
}

export async function findActiveLinkedInSeatMembershipByEmail(email: string) {
  return findActiveLinkedInSeatMembership({ emails: [email] });
}

async function getLinkedInSeatProductId() {
  if (linkedInSeatProductId) return linkedInSeatProductId;

  const configured = process.env.WHOP_LINKEDIN_SEATS_PRODUCT_ID?.trim();
  if (configured) {
    if (!configured.startsWith("prod_")) {
      throw new Error("WHOP_LINKEDIN_SEATS_PRODUCT_ID must be the extra-seats prod_ id.");
    }
    linkedInSeatProductId = configured;
    return configured;
  }

  const companyId = process.env.WHOP_COMPANY_ID?.trim();
  if (!companyId) {
    throw new Error("WHOP_COMPANY_ID is required to start extra LinkedIn seat checkout.");
  }

  const whop = getWhopClient();
  const products = await whop.products.list({
    account_id: companyId,
    visibilities: ["hidden", "visible", "quick_link"],
    first: 50,
    order: "created_at",
    direction: "desc",
  });
  const existing = products.data.find((product) => isLinkedInSeatProduct(product));
  if (existing?.id.startsWith("prod_")) {
    if (existing.title.trim() !== LINKEDIN_SEAT_PRODUCT_TITLE) {
      await whop.products.update(existing.id, { title: LINKEDIN_SEAT_PRODUCT_TITLE });
    }
    linkedInSeatProductId = existing.id;
    return existing.id;
  }

  // Whop refuses a renewal checkout without a product. Keep this add-on on its
  // own hidden product so cancelling seats cannot match the Pro plan id.
  const created = await whop.products.create({
    account_id: companyId,
    title: LINKEDIN_SEAT_PRODUCT_TITLE,
    description: "Extra LinkedIn accounts billed on top of the included Pro account.",
    visibility: "hidden",
    send_welcome_message: false,
    metadata: { kind: LINKEDIN_SEAT_CHECKOUT_KIND },
    "Idempotency-Key": "omentir-linkedin-seats-product",
  });
  if (!created.id.startsWith("prod_")) {
    throw new Error("Whop did not return a product id for extra LinkedIn seats.");
  }
  linkedInSeatProductId = created.id;
  return created.id;
}

export async function createLinkedInSeatCheckout(input: {
  extraSeats: number;
  workspaceId: string;
  email?: string;
  emails?: Array<string | null | undefined>;
  redirectUrl: string;
  metadata?: Record<string, string>;
}) {
  const extraSeats = parseExtraLinkedInSeatCount(input.extraSeats);
  if (!extraSeats) {
    throw new Error("Choose at least one extra LinkedIn account.");
  }

  const monthlyTotal = extraLinkedInSeatMonthlyTotalUsd(extraSeats);
  const companyId = process.env.WHOP_COMPANY_ID?.trim();
  if (!companyId) {
    throw new Error("WHOP_COMPANY_ID is required to start extra LinkedIn seat checkout.");
  }
  const productId = await getLinkedInSeatProductId();
  const buyerEmails = extraSeatBuyerEmails([input.email, ...(input.emails || [])]);
  const checkout = await getWhopClient().checkoutConfigurations.create({
    account_id: companyId,
    redirect_url: input.redirectUrl,
    metadata: {
      workspaceId: input.workspaceId,
      clerkUserId: input.workspaceId,
      email: buyerEmails[0] || input.email,
      kind: LINKEDIN_SEAT_CHECKOUT_KIND,
      extraSeats: String(extraSeats),
      ...input.metadata,
      ...(buyerEmails.length ? { emails: buyerEmails.join(",") } : {}),
    },
    plan: {
      account_id: companyId,
      product_id: productId,
      title: extraLinkedInSeatPlanTitle(extraSeats),
      description: `${extraSeats} extra LinkedIn account${extraSeats === 1 ? "" : "s"} on top of the included account.`,
      metadata: {
        kind: LINKEDIN_SEAT_CHECKOUT_KIND,
        extraSeats: String(extraSeats),
        workspaceId: input.workspaceId,
      },
      plan_type: "renewal",
      release_method: "buy_now",
      visibility: "hidden",
      currency: "usd",
      billing_period: 30,
      // Charged on top of renewal_price on the first invoice, so this stays 0
      // or the first month would be billed twice.
      initial_price: 0,
      renewal_price: monthlyTotal,
      unlimited_stock: true,
    },
  });

  if (!checkout.purchase_url) {
    throw new Error("Whop checkout configuration returned no purchase_url.");
  }

  return { purchaseUrl: checkout.purchase_url, checkoutId: checkout.id, extraSeats, monthlyTotal };
}
