export const WHOP_MEMBERSHIPS_URL = "https://whop.com/@me/settings/memberships";
const WHOP_ORDERS_CALLBACK = "/@me/settings/orders/";

export function whopManageDestination(manageUrl?: string | null, memberId?: string | null) {
  const destination =
    manageUrl || (/^mber_[A-Za-z0-9]+$/.test(memberId || "")
      ? `https://whop.com/billing/manage/${memberId}/`
      : null);
  if (!destination) return WHOP_MEMBERSHIPS_URL;

  try {
    const url = new URL(destination);
    if (url.protocol !== "https:" || url.hostname !== "whop.com") {
      return WHOP_MEMBERSHIPS_URL;
    }
    url.searchParams.set("callback", WHOP_ORDERS_CALLBACK);
    return url.toString();
  } catch {
    return WHOP_MEMBERSHIPS_URL;
  }
}
