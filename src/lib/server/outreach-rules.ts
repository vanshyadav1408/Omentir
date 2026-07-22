import type { CampaignEnrollment, Lead } from "./types";

// Renders a message template against a lead. `natural: false` means the text
// is not fit to send as-is - a token had no value (e.g. empty company), or it
// used {{leadReason}}/{{signalSource}}, which hold internal provenance tags
// ('Matched LinkedIn keyword "..."'), never prose. Degraded renders must be
// drafted by AI instead of sent verbatim.
export function renderTemplate(
  text: string,
  lead: Pick<Lead, "name" | "company" | "title">,
) {
  let natural = true;
  const rendered = text.replace(
    /\{\{(firstName|name|company|title|leadReason|signalSource)\}\}/g,
    (_match, token: string) => {
      if (token === "leadReason" || token === "signalSource") {
        natural = false;
        return "";
      }
      const value =
        token === "firstName"
          ? lead.name.split(" ")[0] || lead.name
          : token === "name"
            ? lead.name
            : token === "company"
              ? lead.company
              : lead.title;
      if (!value?.trim()) natural = false;
      return value || "";
    },
  );
  return { text: rendered.trim(), natural };
}

// LinkedIn anonymizes out-of-network/private profiles as "LinkedIn Member"
// (deleted accounts show as "LinkedIn User"). These carry no usable identity
// and can never be contacted, so they must not become leads or receive
// outreach attempts.
export function isAnonymousLinkedInProfile(lead: Pick<Partial<Lead>, "name">) {
  const name = (lead.name || "").trim().toLowerCase();
  return name === "linkedin member" || name === "linkedin user";
}

// Free LinkedIn accounts reject invitation notes over ~200 characters
// (errors/too_many_characters). unipile.ts hard-caps outbound text at the same
// limit as a transport backstop, but a mid-word chop reads as obviously botched.
const MAX_CONNECTION_NOTE_CHARS = 200;

// The AI note prompt asks for a short note, but nothing guarantees the model
// obeys - and an over-limit note hard-fails the whole invite. Cut at the last
// complete sentence that fits; a bare invite beats a note that trails off
// mid-sentence.
export function fitConnectionNote(note: string | undefined) {
  if (!note || note.length <= MAX_CONNECTION_NOTE_CHARS) return note;
  const clipped = note.slice(0, MAX_CONNECTION_NOTE_CHARS);
  const sentenceEnd = Math.max(
    clipped.lastIndexOf("."),
    clipped.lastIndexOf("!"),
    clipped.lastIndexOf("?"),
  );
  // Ignore a terminator inside the greeting ("Hi J. Smith,") by requiring the
  // cut to land past the greeting's comma.
  const greetingEnd = clipped.indexOf(",");
  if (sentenceEnd > greetingEnd + 1) return clipped.slice(0, sentenceEnd + 1);
  return undefined;
}

// Unipile reports errors/cannot_resend_yet with one generic "temporary
// provider limit" detail for two very different situations: a recipient who
// can't be re-invited yet (a previous invite is pending/withdrawn - LinkedIn
// blocks re-invites for weeks) and the account's weekly invitation limit. A
// single rejection is indistinguishable and is usually the recipient case
// (2026-07-13: one such rejection paused a healthy account for a week and
// emailed the customer a false limit warning). A real account limit rejects
// EVERY recipient, so only several distinct leads failing with no successful
// invite in between - callers clear the tally on success - within a day count
// as evidence of an account-wide limit.
export const INVITE_LIMIT_SIGNAL_THRESHOLD = 3;
const INVITE_LIMIT_SIGNAL_WINDOW_MS = 24 * 60 * 60 * 1000;

export function addInviteLimitSignal(
  prior: Record<string, string>,
  leadId: string,
  now: string,
) {
  const cutoff = new Date(Date.parse(now) - INVITE_LIMIT_SIGNAL_WINDOW_MS).toISOString();
  const signals: Record<string, string> = {};
  for (const [id, at] of Object.entries(prior)) {
    if (typeof at === "string" && at > cutoff) signals[id] = at;
  }
  signals[leadId] = now;
  return signals;
}

export function canSendCampaignMessage(
  enrollment: Pick<CampaignEnrollment, "status">,
  lead: Pick<Lead, "outreachStatus">,
) {
  return (
    enrollment.status === "connected" ||
    enrollment.status === "message_sent" ||
    lead.outreachStatus === "connected" ||
    lead.outreachStatus === "messaged"
  );
}
