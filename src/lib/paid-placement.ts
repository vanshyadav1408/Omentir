function isPaidPlacementHost(href: string): boolean {
  try {
    const hostname = new URL(href).hostname;
    return hostname === "joinvalley.co" || hostname === "www.joinvalley.co";
  } catch {
    // Relative links are not paid placements.
    return false;
  }
}

/** The anchor text agreed for the Valley paid placement. */
const PAID_ANCHOR_TEXT = "ai-powered linkedin outreach platform";

/** The contracted anchor itself, as opposed to a plain mention of the brand. */
export function isPaidAnchor(href: string, text: string): boolean {
  return isPaidPlacementHost(href) && text.trim().toLowerCase() === PAID_ANCHOR_TEXT;
}
