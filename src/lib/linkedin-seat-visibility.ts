import { extraLinkedInSeatsCount } from "./linkedin-seat-pricing";
import { commercialPlanLimits, type PlanId } from "./plan-limits";

function hostedFiniteLinkedInCap(input: { localMode: boolean; plan: PlanId | undefined }) {
  if (input.localMode) return false;
  return Number.isFinite(commercialPlanLimits(input.plan).linkedInAccounts);
}

/** Connected Accounts merchandising: buy extra LinkedIn accounts on hosted Pro. */
export function extraLinkedInSeatMerchandisingVisible(input: {
  localMode: boolean;
  plan: PlanId | undefined;
}) {
  return hostedFiniteLinkedInCap(input);
}

/**
 * Subscriptions Extra Seats card when the add-on is already paid, so extras
 * can be managed or cancelled without cancelling Pro.
 */
export function extraSeatsSubscriptionManageVisible(input: {
  localMode: boolean;
  plan: PlanId | undefined;
  extraSeats: unknown;
}) {
  return hostedFiniteLinkedInCap(input) && extraLinkedInSeatsCount(input.extraSeats) > 0;
}

/**
 * Subscriptions Extra Seats buy UI when the workspace still has only the
 * included LinkedIn account. Visibility must not wait on extraLinkedInSeats > 0.
 */
export function extraSeatsSubscriptionBuyVisible(input: {
  localMode: boolean;
  plan: PlanId | undefined;
  extraSeats: unknown;
}) {
  return hostedFiniteLinkedInCap(input) && extraLinkedInSeatsCount(input.extraSeats) === 0;
}

/** Settings load may copy a paid Extra Seats membership onto Firestore. */
export function shouldRecoverLinkedInSeatsFromWhop(input: {
  localMode: boolean;
  subscriptionActive: boolean;
  plan: PlanId | undefined;
}) {
  return hostedFiniteLinkedInCap(input) && input.subscriptionActive;
}
