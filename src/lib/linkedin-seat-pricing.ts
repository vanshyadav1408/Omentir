export const EXTRA_LINKEDIN_SEAT_SMALL_PRICE_USD = 20;
export const EXTRA_LINKEDIN_SEAT_BULK_PRICE_USD = 10;
export const EXTRA_LINKEDIN_SEAT_BULK_AFTER = 10;
export const MAX_EXTRA_LINKEDIN_SEATS = 100;
export const LINKEDIN_SEAT_CHECKOUT_KIND = "linkedin_seats";
export const LINKEDIN_SEAT_PRODUCT_TITLE = "Omentir Extra Seats";
const LEGACY_LINKEDIN_SEAT_PRODUCT_TITLES = ["Omentir extra LinkedIn accounts"];

// Extra seats sit on top of the one LinkedIn account included in Pro. 1-10
// extra accounts are $20/month each. Buying more than 10 drops every extra
// seat to $10/month.
export function extraLinkedInSeatUnitPriceUsd(extraSeats: number) {
  if (extraSeats <= 0) return 0;
  return extraSeats <= EXTRA_LINKEDIN_SEAT_BULK_AFTER
    ? EXTRA_LINKEDIN_SEAT_SMALL_PRICE_USD
    : EXTRA_LINKEDIN_SEAT_BULK_PRICE_USD;
}

export function extraLinkedInSeatMonthlyTotalUsd(extraSeats: number) {
  const count = extraLinkedInSeatsCount(extraSeats);
  return count * extraLinkedInSeatUnitPriceUsd(count);
}

export function extraLinkedInSeatsCount(value: unknown) {
  const count = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.min(MAX_EXTRA_LINKEDIN_SEATS, Math.floor(count));
}

// Extra seats are extra LinkedIn accounts for the buyer. Checkout and Whop
// payloads may send one address or a comma-separated list; keep every email.
export function extraSeatBuyerEmails(emails: Array<string | null | undefined> = []) {
  const unique = new Set<string>();
  for (const value of emails) {
    if (!value) continue;
    for (const part of value.split(/[,;]+/)) {
      const email = part.trim().toLowerCase();
      if (email.includes("@")) unique.add(email);
    }
  }
  return [...unique];
}

type ExtraSeatBillingFields = {
  extraLinkedInSeats?: number;
  seatMembershipId?: string;
};

// Extra LinkedIn seats live on the original owner account. Other workspaces
// use that cap without storing a second copy of the add-on.
export function overlayOwnerExtraLinkedInSeats<
  T extends { id?: string; billing?: ExtraSeatBillingFields },
>(workspace: T, owner: T | null | undefined): T {
  if (!owner || owner === workspace) return workspace;
  if (owner.id && workspace.id && owner.id === workspace.id) return workspace;
  if (!workspace.billing) return workspace;
  const ownerSeats = extraLinkedInSeatsCount(owner.billing?.extraLinkedInSeats);
  const localSeats = extraLinkedInSeatsCount(workspace.billing.extraLinkedInSeats);
  if (ownerSeats < localSeats) return workspace;
  const extraLinkedInSeats = ownerSeats;
  const seatMembershipId = owner.billing?.seatMembershipId;
  if (
    extraLinkedInSeatsCount(workspace.billing.extraLinkedInSeats) === extraLinkedInSeats &&
    workspace.billing.seatMembershipId === seatMembershipId
  ) {
    return workspace;
  }
  return {
    ...workspace,
    billing: {
      ...workspace.billing,
      extraLinkedInSeats: extraLinkedInSeats || undefined,
      seatMembershipId,
    },
  };
}

export function parseExtraLinkedInSeatCount(value: unknown) {
  const count = extraLinkedInSeatsCount(value);
  return count >= 1 ? count : null;
}

// Whop rejects dynamic renewal plans whose title is over 30 characters.
export function extraLinkedInSeatPlanTitle(extraSeats: number) {
  const count = extraLinkedInSeatsCount(extraSeats);
  return `Extra Seats (${count})`;
}

export function isLinkedInSeatCheckoutMetadata(
  metadata: { [key: string]: unknown } | null | undefined,
) {
  return metadataString(metadata, "kind") === LINKEDIN_SEAT_CHECKOUT_KIND;
}

export function isLinkedInSeatProduct(product: {
  title?: string | null;
  metadata?: { [key: string]: unknown } | null;
}) {
  const title = product.title?.trim();
  return (
    isLinkedInSeatCheckoutMetadata(product.metadata) ||
    title === LINKEDIN_SEAT_PRODUCT_TITLE ||
    Boolean(title && LEGACY_LINKEDIN_SEAT_PRODUCT_TITLES.includes(title))
  );
}

export function extraLinkedInSeatsFromMetadata(
  metadata: { [key: string]: unknown } | null | undefined,
) {
  if (!isLinkedInSeatCheckoutMetadata(metadata)) return null;
  return parseExtraLinkedInSeatCount(metadata?.extraSeats);
}

export function extraLinkedInSeatsFromPlanTitle(title: unknown) {
  if (typeof title !== "string") return null;
  const match = title.trim().match(/^Extra Seats \((\d+)\)$/i);
  return match ? parseExtraLinkedInSeatCount(match[1]) : null;
}

// Checkout configuration metadata often never appears on the payment. Seat
// count then has to come from the Extra Seats product, plan metadata, or title.
export function extraLinkedInSeatsFromWhopFields(input: {
  metadata?: { [key: string]: unknown } | null;
  planMetadata?: { [key: string]: unknown } | null;
  planTitle?: string | null;
  product?: { title?: string | null; metadata?: { [key: string]: unknown } | null } | null;
}) {
  const fromKind =
    extraLinkedInSeatsFromMetadata(input.metadata) ||
    extraLinkedInSeatsFromMetadata(input.planMetadata);
  if (fromKind) return fromKind;
  const fromTitle = extraLinkedInSeatsFromPlanTitle(input.planTitle);
  if (fromTitle) return fromTitle;
  if (!isLinkedInSeatProduct(input.product || {})) return null;
  return (
    parseExtraLinkedInSeatCount(input.metadata?.extraSeats) ||
    parseExtraLinkedInSeatCount(input.planMetadata?.extraSeats)
  );
}

export function isLinkedInSeatWhopObject(input: {
  metadata?: { [key: string]: unknown } | null;
  product?: { title?: string | null; metadata?: { [key: string]: unknown } | null } | null;
}) {
  return (
    isLinkedInSeatCheckoutMetadata(input.metadata) || isLinkedInSeatProduct(input.product || {})
  );
}

// Extra-seat checkout can land on the Whop company owner (admin) instead of a
// customer member. Match checkout metadata and either Whop user email, because
// listing only `access_level: customer` misses that purchase.
export function extraSeatWhopMembershipMatchesBuyer(
  membership: {
    metadata?: { [key: string]: unknown } | null;
    userEmail?: string | null;
  },
  buyer: {
    workspaceId?: string | null;
    workspaceIds?: Array<string | null | undefined>;
    emails?: Array<string | null | undefined>;
  },
) {
  const workspaceIds = new Set(
    [buyer.workspaceId, ...(buyer.workspaceIds || [])]
      .map((id) => id?.trim())
      .filter((id): id is string => Boolean(id)),
  );
  const metaWorkspace =
    metadataString(membership.metadata, "workspaceId") ||
    metadataString(membership.metadata, "clerkUserId");
  if (metaWorkspace && workspaceIds.has(metaWorkspace)) return true;

  const buyerEmails = new Set(extraSeatBuyerEmails(buyer.emails));
  if (!buyerEmails.size) return false;
  const membershipEmails = extraSeatBuyerEmails([
    membership.userEmail,
    metadataString(membership.metadata, "email"),
    metadataString(membership.metadata, "emails"),
  ]);
  return membershipEmails.some((email) => buyerEmails.has(email));
}

// One workspace should have one Extra Seats add-on. If a later checkout failed
// to cancel the previous membership, keep the larger paid count.
export function selectExtraSeatMembership<T extends { extraSeats: number; membershipId: string }>(
  candidates: T[],
) {
  if (!candidates.length) return null;
  const winner = candidates.reduce((best, item) =>
    item.extraSeats > best.extraSeats ? item : best,
  );
  return {
    winner,
    duplicates: candidates.filter((item) => item.membershipId !== winner.membershipId),
  };
}

// Whop returns 400 when we cancel a leftover Extra Seats membership that it
// already dropped. That is the desired end state, not a cancel failure.
export function isAlreadyTerminatedWhopMembershipError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /already been terminated/i.test(message);
}

// Firestore `set({ billing }, { merge: true })` replaces the whole billing map.
// Pro renewals omit these fields, so copy them forward unless the caller sets them.
export function mergeLinkedInSeatFields(
  existing: { extraLinkedInSeats?: number; seatMembershipId?: string } | undefined,
  patch: { extraLinkedInSeats?: number; seatMembershipId?: string },
) {
  return {
    extraLinkedInSeats: patch.extraLinkedInSeats ?? existing?.extraLinkedInSeats,
    seatMembershipId:
      patch.seatMembershipId !== undefined ? patch.seatMembershipId : existing?.seatMembershipId,
  };
}

function metadataString(
  metadata: { [key: string]: unknown } | null | undefined,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
