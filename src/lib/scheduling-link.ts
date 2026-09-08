// Overview, My Product, and agent setup ask for any meeting scheduler URL.
// People paste Calendly, Cal.com, HubSpot, Google Calendar, custom book
// pages, and often omit https://. There is no host allowlist. Rejecting
// those used to throw from saveProductProfileAction, which sent new users
// to the Oops page and blocked the overview checklist.

export const INVALID_SCHEDULING_LINK_MESSAGE =
  "Paste a valid meeting scheduler URL.";

export function normalizeSchedulingLink(value: string) {
  let raw = value.trim().replace(/^<|>$/g, "").trim();
  if (!raw) return "";

  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) {
    raw = `https://${raw}`;
  }

  try {
    const url = new URL(raw);
    if (url.protocol === "http:") url.protocol = "https:";
    if (url.protocol !== "https:") return null;
    const hostname = url.hostname.toLowerCase();
    if (!hostname.includes(".")) return null;
    url.hostname = hostname;
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return null;
  }
}

// Overview setup marks "Add a booking link" from this. Keep it in lockstep
// with normalizeSchedulingLink so a saved HubSpot or scheme-less Calendly
// paste actually clears the checklist.
export function hasUsableBookingLink(value: string | undefined | null) {
  return Boolean(normalizeSchedulingLink(value || ""));
}

// Prefer an explicit campaign override, then the My Product demo booking link.
export function resolveBookingLink(
  ...candidates: Array<string | undefined | null>
) {
  for (const candidate of candidates) {
    const normalized = normalizeSchedulingLink(candidate || "");
    if (normalized) return normalized;
  }
  return "";
}

// My Product used to copy its link onto until-booked campaigns only when those
// campaigns had no link. Changing the Calendly/Cal field later left agents on
// the old URL, which looked like the page save did nothing.
export function shouldSyncCampaignBookingLink(input: {
  replyHandling?: string | null;
  campaignBookingLink?: string | null;
  previousWorkspaceLink?: string | null;
  nextWorkspaceLink: string;
}) {
  if (input.replyHandling !== "ai_until_booked") return false;
  if (!input.nextWorkspaceLink) return false;
  const campaign = normalizeSchedulingLink(input.campaignBookingLink || "");
  if (!campaign) return true;
  const previous = normalizeSchedulingLink(input.previousWorkspaceLink || "");
  return Boolean(previous && campaign === previous);
}
