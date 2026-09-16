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
