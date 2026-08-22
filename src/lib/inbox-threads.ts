import {
  linkedInIdentityKeys,
  normalizePersonName,
} from "./linkedin-identity";
import type { LinkedInInboxThread } from "./server/types";

const GENERIC_INBOX_NAMES = new Set([
  "linkedin chat",
  "linkedin",
  "linkedin lead",
  "linkedin member",
]);

type PreviewMessage = {
  direction?: string;
  body?: string;
  createdAt?: string;
};

export function isGenericInboxName(name?: string) {
  const normalized = normalizePersonName(name);
  return !normalized || GENERIC_INBOX_NAMES.has(normalized);
}

function threadIdentityKeys(thread: LinkedInInboxThread) {
  return linkedInIdentityKeys({
    providerProfileId: thread.attendeeProviderId,
    linkedInUrl: thread.profileUrl,
  });
}

function lastPreview(messages: PreviewMessage[] | undefined) {
  const last = messages?.at(-1);
  const body = last?.body?.replace(/\s+/g, " ").trim().toLowerCase();
  if (!last || !body) return null;
  return {
    direction: last.direction || "",
    body,
    at: Date.parse(last.createdAt || ""),
  };
}

function sameLastPreview(a: PreviewMessage[] | undefined, b: PreviewMessage[] | undefined) {
  const left = lastPreview(a);
  const right = lastPreview(b);
  if (!left || !right) return false;
  if (left.direction !== right.direction || left.body !== right.body) return false;
  if (!Number.isFinite(left.at) || !Number.isFinite(right.at)) return true;
  return Math.abs(left.at - right.at) < 2 * 60 * 1000;
}

function threadCompleteness(thread: LinkedInInboxThread) {
  let score = 0;
  if (!isGenericInboxName(thread.profileName || thread.title)) score += 8;
  if (thread.avatarUrl) score += 4;
  if (thread.profileUrl) score += 4;
  if (thread.attendeeProviderId) score += 2;
  if (thread.profileHeadline) score += 2;
  if (thread.messages.some((message) => message.body)) score += 1;
  if (thread.unread) score += 1;
  const updated = Date.parse(thread.updatedAt);
  if (Number.isFinite(updated)) score += updated / 1e15;
  return score;
}

function mergeInboxThreads(
  preferred: LinkedInInboxThread,
  other: LinkedInInboxThread,
): LinkedInInboxThread {
  const preferredUpdated = Date.parse(preferred.updatedAt);
  const otherUpdated = Date.parse(other.updatedAt);
  return {
    ...preferred,
    unread: preferred.unread || other.unread,
    updatedAt:
      Number.isFinite(otherUpdated) &&
      (!Number.isFinite(preferredUpdated) || otherUpdated > preferredUpdated)
        ? other.updatedAt
        : preferred.updatedAt,
    profileName: isGenericInboxName(preferred.profileName)
      ? other.profileName || preferred.profileName
      : preferred.profileName,
    title: isGenericInboxName(preferred.title) ? other.title || preferred.title : preferred.title,
    profileHeadline: preferred.profileHeadline || other.profileHeadline,
    profileUrl: preferred.profileUrl || other.profileUrl,
    avatarUrl: preferred.avatarUrl || other.avatarUrl,
    attendeeProviderId: preferred.attendeeProviderId || other.attendeeProviderId,
    messages: preferred.messages.length ? preferred.messages : other.messages,
  };
}

export function sameLinkedInInboxThread(a: LinkedInInboxThread, b: LinkedInInboxThread) {
  if (a.id && a.id === b.id) return true;
  if (a.accountId !== b.accountId) return false;
  if (a.providerChatId && a.providerChatId === b.providerChatId) return true;

  const keysA = new Set(threadIdentityKeys(a));
  if (keysA.size && threadIdentityKeys(b).some((key) => keysA.has(key))) return true;

  if (!sameLastPreview(a.messages, b.messages)) return false;
  const nameA = normalizePersonName(a.profileName);
  const nameB = normalizePersonName(b.profileName);
  return (
    isGenericInboxName(a.profileName) ||
    isGenericInboxName(b.profileName) ||
    Boolean(nameA && nameA === nameB)
  );
}

// Unipile's /chats list is every inbox (Classic, Sales Navigator, Recruiter).
// LinkedIn still has one 1:1 thread per person, so those copies must collapse
// to a single inbox row. Otherwise the user sees Ezekiel twice and can open
// the wrong copy.
export function dedupeLinkedInInboxThreads(threads: LinkedInInboxThread[]) {
  const ranked = [...threads].sort((a, b) => threadCompleteness(b) - threadCompleteness(a));
  const kept: LinkedInInboxThread[] = [];
  for (const thread of ranked) {
    const matchIndex = kept.findIndex((existing) => sameLinkedInInboxThread(existing, thread));
    if (matchIndex < 0) {
      kept.push(thread);
      continue;
    }
    kept[matchIndex] = mergeInboxThreads(kept[matchIndex], thread);
  }
  return kept.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

// Firestore conversations mirror provider chats. Hide the stored copy when the
// live inbox already shows that person, including Sales Nav vs vanity URLs and
// the unnamed "LinkedIn chat" row whose attendee lookup failed.
export function storedConversationIsLiveMirror(
  liveThreads: LinkedInInboxThread[],
  lead: { name?: string; linkedInUrl?: string } | undefined,
  messages: PreviewMessage[],
) {
  const leadKeys = new Set(linkedInIdentityKeys({ linkedInUrl: lead?.linkedInUrl }));
  const leadName = normalizePersonName(lead?.name);
  const nameCounts = new Map<string, number>();
  for (const thread of liveThreads) {
    const name = normalizePersonName(thread.profileName);
    if (!name || isGenericInboxName(thread.profileName)) continue;
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
  }

  return liveThreads.some((thread) => {
    const threadKeys = threadIdentityKeys(thread);
    if (leadKeys.size && threadKeys.some((key) => leadKeys.has(key))) return true;

    const threadName = normalizePersonName(thread.profileName);
    if (leadName && threadName === leadName && nameCounts.get(leadName) === 1) return true;

    if (!sameLastPreview(thread.messages, messages)) return false;
    return isGenericInboxName(thread.profileName) || Boolean(leadName && threadName === leadName);
  });
}
