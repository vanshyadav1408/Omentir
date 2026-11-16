import type { Campaign, CampaignEnrollment, Lead } from "./types";

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
    /\{\{(firstName|lastName|name|company|title|leadReason|signalSource)\}\}/g,
    (_match, token: string) => {
      if (token === "leadReason" || token === "signalSource") {
        natural = false;
        return "";
      }
      const value =
        token === "firstName"
          ? lead.name.split(" ")[0] || lead.name
          : token === "lastName"
            ? lead.name.split(" ").slice(1).join(" ")
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

// The text a sequence message step sends without AI, in the order the send
// path, the Actions/Leads preview and AI pre-drafting all follow: the message
// the user wrote for this lead, then the step's template if it renders
// cleanly. Undefined means AI drafts it at send time.
export function writtenSequenceMessage(
  step: { id: string; messageTemplate: string },
  lead: Pick<Lead, "name" | "company" | "title">,
  messageEdits: Record<string, string> | undefined,
) {
  const edited = messageEdits?.[step.id]?.trim();
  if (edited) return { text: edited, edited: true };
  const rendered = renderTemplate(step.messageTemplate, lead);
  return rendered.natural && rendered.text ? { text: rendered.text, edited: false } : undefined;
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
// (errors/too_many_characters). linkedin.ts hard-caps outbound text at the same
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

// The note a connect step attaches to its invite, or undefined for a bare
// invite. Sending and the owner-message guard both read it here, so the guard
// recognises exactly the text the invite carried.
export function connectionNoteFor(
  step: { includeNote: boolean; noteTemplate: string },
  lead: Pick<Lead, "name" | "company" | "title">,
) {
  if (!step.includeNote) return undefined;
  const rendered = renderTemplate(step.noteTemplate, lead);
  return rendered.natural && rendered.text ? fitConnectionNote(rendered.text) : undefined;
}

// The notes this campaign's connect steps send this lead, for telling an
// accepted invite's note apart from a message the owner typed by hand.
function campaignInviteNotes(campaign: Pick<Campaign, "steps">, lead: Pick<Lead, "name" | "company" | "title">) {
  return campaign.steps.flatMap((step) => {
    const note = step.type === "connect" ? connectionNoteFor(step, lead) : undefined;
    return note ? [note] : [];
  });
}

// The note each invite actually carried comes first. Re-rendering is only for
// invites sent before the note was stored: it misses once the template was
// edited or the lead's title or company were refreshed on acceptance.
export function inviteNotesFor(
  enrollments: Array<Pick<CampaignEnrollment, "connectionNote">>,
  campaigns: Array<Pick<Campaign, "steps">>,
  lead: Pick<Lead, "name" | "company" | "title">,
) {
  return [
    ...enrollments.flatMap((enrollment) => (enrollment.connectionNote ? [enrollment.connectionNote] : [])),
    ...campaigns.flatMap((campaign) => campaignInviteNotes(campaign, lead)),
  ];
}

// errors/cannot_resend_yet is one error type for three different situations
// (the old Unipile integration reported them that way and the own client's
// error mapping keeps it):
// 1. this recipient already has a pending/withdrawn invite (LinkedIn blocks
//    re-invites for weeks)
// 2. the account's weekly invitation limit
// 3. a free account's personalized-note quota is spent (LinkedIn still accepts
//    a bare Connect, so the same invite is retried without a note).
//    too_many_characters is the other note-quota signal.
// A single rejection is indistinguishable and is usually (1) or (3)
// (2026-07-13: one such rejection paused a healthy account for a week and
// emailed the customer a false limit warning). Callers must retry without the
// note before treating the error as a recipient/account limit. A real weekly
// limit rejects EVERY recipient even on a bare invite, so only several
// distinct leads failing with no successful invite in between - callers clear
// the tally on success - within a day count as evidence of an account-wide
// limit.
export const INVITE_LIMIT_SIGNAL_THRESHOLD = 3;
const INVITE_LIMIT_SIGNAL_WINDOW_MS = 24 * 60 * 60 * 1000;

const INVITE_RESEND_BLOCKED_ERROR_TYPES = new Set([
  "errors/cannot_resend_yet",
  "errors/already_invited_recently",
]);

export function isInviteResendBlockedErrorType(errorType: string | undefined) {
  return Boolean(errorType && INVITE_RESEND_BLOCKED_ERROR_TYPES.has(errorType));
}

// Noted invite failed in a way LinkedIn often still accepts as a bare Connect.
// The LinkedIn app's default Connect button has no note, which is why a user
// can still send from the app while Omentir looks "limit reached".
export function shouldRetryConnectionWithoutNote(
  note: string | undefined,
  errorType: string | undefined,
) {
  if (!note) return false;
  return errorType === "errors/too_many_characters" || isInviteResendBlockedErrorType(errorType);
}

export function hasInviteResendBlockedError(message: string | undefined) {
  return Boolean(
    message &&
      [...INVITE_RESEND_BLOCKED_ERROR_TYPES].some((errorType) => message.includes(errorType)),
  );
}

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
  // A LinkedIn reply means the conversation is already open. Leaving replied
  // out of this list is what made the leads page keep saying the invite was
  // still pending after they wrote back.
  return (
    enrollment.status === "connected" ||
    enrollment.status === "message_sent" ||
    enrollment.status === "reply_received" ||
    enrollment.status === "replied" ||
    lead.outreachStatus === "connected" ||
    lead.outreachStatus === "messaged" ||
    lead.outreachStatus === "replied"
  );
}
