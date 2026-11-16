// Ids for LinkedIn accounts connected through Omentir's own client (the own_
// prefix tells them apart from ids left by the old Unipile integration).
// Every id carries its account, so routing a call is string parsing:
// no Firestore read, and chat/message calls that only know a chat id still
// reach the right LinkedIn session.
//
//   account     own_<memberId>                  memberId = LinkedIn's ACo... id
//   chat        own_<memberId>~c~<b64(conversationUrn)>
//   message     own_<memberId>~m~<b64(messageUrn)>
//
// The account id is derived from the LinkedIn member, so reconnecting the same
// person reuses the same account (and its campaigns), and the per-account
// ownership lock in saveLinkedInAccount applies to the person, not the session.

const ACCOUNT_PREFIX = "own_";
const SEPARATOR = "~";
const MEMBER_ID_PATTERN = /^[A-Za-z0-9_-]{6,128}$/;

export function isOwnLinkedInId(value: string | null | undefined) {
  return typeof value === "string" && value.startsWith(ACCOUNT_PREFIX);
}

export function ownAccountIdForMember(memberId: string) {
  if (!MEMBER_ID_PATTERN.test(memberId)) {
    throw new Error("LinkedIn member id has an unexpected format.");
  }
  return `${ACCOUNT_PREFIX}${memberId}`;
}

export function memberIdFromOwnAccountId(accountId: string) {
  const memberId = accountId.slice(ACCOUNT_PREFIX.length);
  if (!isOwnLinkedInId(accountId) || !MEMBER_ID_PATTERN.test(memberId)) {
    throw new Error("Not an Omentir LinkedIn account id.");
  }
  return memberId;
}

export function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

type OwnEntityKind = "c" | "m";

function encodeEntityId(kind: OwnEntityKind, accountId: string, urn: string) {
  memberIdFromOwnAccountId(accountId);
  return `${accountId}${SEPARATOR}${kind}${SEPARATOR}${base64UrlEncode(urn)}`;
}

function decodeEntityId(kind: OwnEntityKind, id: string) {
  const parts = id.split(SEPARATOR);
  if (parts.length !== 3 || parts[1] !== kind || !parts[2]) return null;
  try {
    memberIdFromOwnAccountId(parts[0]);
  } catch {
    return null;
  }
  const urn = base64UrlDecode(parts[2]);
  return urn.startsWith("urn:li:") ? { accountId: parts[0], urn } : null;
}

export function ownChatId(accountId: string, conversationUrn: string) {
  return encodeEntityId("c", accountId, conversationUrn);
}

export function parseOwnChatId(chatId: string) {
  return decodeEntityId("c", chatId);
}

export function ownMessageId(accountId: string, messageUrn: string) {
  return encodeEntityId("m", accountId, messageUrn);
}

export function parseOwnMessageId(messageId: string) {
  return decodeEntityId("m", messageId);
}

// The account an id belongs to, for any own id (account, chat or message).
export function ownAccountIdOf(id: string) {
  if (!isOwnLinkedInId(id)) return null;
  const accountId = id.split(SEPARATOR)[0];
  try {
    memberIdFromOwnAccountId(accountId);
    return accountId;
  } catch {
    return null;
  }
}

// Withdrawing an invitation needs both its id and its shared secret, so the
// listed id carries both.
export function ownInvitationId(invitationId: string, sharedSecret: string) {
  return `${invitationId}.${sharedSecret}`;
}

export function parseOwnInvitationId(value: string) {
  const dot = value.indexOf(".");
  if (dot <= 0 || dot === value.length - 1) return null;
  return { invitationId: value.slice(0, dot), sharedSecret: value.slice(dot + 1) };
}
