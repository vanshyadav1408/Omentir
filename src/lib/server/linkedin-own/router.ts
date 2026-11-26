import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { LinkedInResponseError } from "../linkedin-errors";
import { ACCEPT_GRAPHQL, companySizeCodes, endpoints } from "./endpoints";
import {
  base64UrlDecode,
  isOwnLinkedInId,
  ownAccountIdOf,
  parseOwnChatId,
  parseOwnInvitationId,
  parseOwnMessageId,
} from "./ids";
import {
  graphqlElements,
  graphqlNextCursor,
  mapComments,
  mapCompanyResponse,
  mapCompanySearch,
  mapConnections,
  mapConversation,
  mapFeedUpdates,
  mapMeResponse,
  mapMemberRelationship,
  mapMessage,
  mapPeopleSearch,
  mapPostSearch,
  mapProfileResponse,
  mapReactions,
  mapSentInvitations,
  mapTypeahead,
  searchLimitReached,
  searchTotal,
  type MappedAttendee,
} from "./mappers";
import { deleteOwnSession, loadOwnSession, sessionHooks } from "./session-store";
import { fetchLinkedInMedia, flagshipWebRequest, uploadLinkedInMedia, voyagerRequest, type OwnSession, type VoyagerRequest } from "./transport";
import { parseLinkedInSearchUrl, webSearch } from "./web-search";
import { activityIdFromUrn, asObject, profileUrn, str, type VoyagerResponse } from "./voyager";

// Answers the REST-style paths linkedin.ts calls, for accounts connected
// through Omentir's own client (account ids starting with own_). The paths,
// response shapes and error types are the ones the old Unipile integration
// used, so everything above this file stays provider-agnostic.

export type OwnRequestContext = {
  // Spends one of the account's daily profile views (shared Firestore budget).
  takeProfileView: (accountId: string) => Promise<boolean>;
};

type Conversation = NonNullable<ReturnType<typeof mapConversation>>;
type Message = NonNullable<ReturnType<typeof mapMessage>>;

// Every read here is a live LinkedIn request. The Messages page polls every
// 5 s, so reads are cached per account for a minute: new messages show up to
// a minute late instead of putting a request-every-few-seconds pattern on the
// account.
const CONVERSATION_CACHE_MS = 60_000;
const MESSAGES_CACHE_MS = 60_000;
const MAX_CONVERSATION_PAGES = 250;
const MAX_HISTORY_PAGES = 250;
const SEARCH_PAGE_SIZE = 10;
const MAX_SEARCH_PAGES_PER_CALL = 5;

function reject(status: number, type: string, message: string): never {
  throw new LinkedInResponseError(status, message, JSON.stringify({ type, detail: message }));
}

// ------------------------------------------------------------------ routing

function bodyAccountId(body: unknown) {
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const value = body.get("account_id");
    return typeof value === "string" ? value : undefined;
  }
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body) as { account_id?: unknown };
      return typeof parsed.account_id === "string" ? parsed.account_id : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

// The own account a request targets, or null when it names an account left
// from the old Unipile integration. Looks at account_id (query or body) and
// at ids in the path.
export function ownAccountIdForRequest(path: string, init?: RequestInit) {
  const url = new URL(path, "http://linkedin.local");
  const candidates = [
    url.searchParams.get("account_id") || undefined,
    bodyAccountId(init?.body),
    ...url.pathname.split("/").map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    }),
  ];
  for (const candidate of candidates) {
    if (!isOwnLinkedInId(candidate)) continue;
    const accountId = ownAccountIdOf(candidate as string);
    if (!accountId) reject(400, "errors/invalid_parameters", "Malformed LinkedIn id.");
    return accountId;
  }
  return null;
}

type Route = {
  method: string;
  pattern: RegExp;
} & (
  | { handle: (input: HandlerInput) => Promise<unknown> }
  // Answered from the id alone. Must keep working when the session is expired
  // or the client is switched off (e.g. deleting stored cookies on purge).
  | { handleWithoutSession: (input: { accountId: string; params: string[] }) => Promise<unknown> }
);

type HandlerInput = {
  session: OwnSession;
  params: string[];
  query: URLSearchParams;
  body: unknown;
  context: OwnRequestContext;
};

function send(session: OwnSession, request: VoyagerRequest) {
  return voyagerRequest(session, request, sessionHooks(session.accountId, session.version)) as Promise<VoyagerResponse>;
}

function sendWeb(
  session: OwnSession,
  request: { method?: "GET" | "POST"; path: string; body?: unknown; accept?: string; referer?: string; write?: boolean },
) {
  return flagshipWebRequest(session, request, sessionHooks(session.accountId, session.version));
}

function limitParam(query: URLSearchParams, fallback: number, max: number) {
  const value = Number(query.get("limit"));
  return Number.isFinite(value) && value > 0 ? Math.min(value, max) : fallback;
}

function jsonBody(body: unknown) {
  if (typeof body !== "string") return {} as Record<string, unknown>;
  try {
    return (JSON.parse(body) || {}) as Record<string, unknown>;
  } catch {
    return reject(400, "errors/invalid_parameters", "Request body is not JSON.");
  }
}

function formText(body: unknown, key: string) {
  if (!(typeof FormData !== "undefined" && body instanceof FormData)) return undefined;
  const value = body.get(key);
  return typeof value === "string" ? value : undefined;
}

// ------------------------------------------------------------ profile cache

// Vanity -> member id, learned from every profile read. Resolving a vanity
// costs a profile view, so each one is paid for at most once per process.
const memberIdByVanity = new Map<string, string>();
const universalNameByCompanyId = new Map<string, string>();

function rememberMember(publicIdentifier: string | undefined, memberId: string | undefined) {
  if (publicIdentifier && memberId) memberIdByVanity.set(publicIdentifier.toLowerCase(), memberId);
}

function looksLikeMemberId(value: string) {
  return /^(?:ACo|ACw|AE)[A-Za-z0-9_-]+$/.test(value);
}

// Profile links keep accented vanity names percent-encoded (/in/jos%C3%A9).
// Encoding that again for LinkedIn asked for "jos%C3%A9" literally, a profile
// that does not exist, so leads with non-English names read as unreachable.
// A vanity name never contains "%" itself, so decoding is safe.
function plainIdentifier(identifier: string) {
  if (!identifier.includes("%")) return identifier;
  try {
    return decodeURIComponent(identifier);
  } catch {
    return identifier;
  }
}

async function fetchProfile(session: OwnSession, rawIdentifier: string) {
  const identifier = plainIdentifier(rawIdentifier);
  // An unknown profile is reported as errors/invalid_recipient, and the
  // avatar refresher relies on that to move on to the person's next id.
  const response = await send(session, { path: endpoints.profile(identifier) }).catch((error) => {
    if (error instanceof LinkedInResponseError && error.status === 404) {
      reject(404, "errors/invalid_recipient", "LinkedIn profile not found.");
    }
    throw error;
  });
  const profile = mapProfileResponse(response, identifier);
  if (!profile) reject(404, "errors/invalid_recipient", "LinkedIn profile not found.");
  rememberMember(profile.public_identifier, profile.provider_id);
  if (!profile.network_distance) {
    // The profile read carries no relationship. One extra read keeps
    // isFirstDegreeConnection from reporting "unknown" forever.
    try {
      const distance = mapMemberRelationship(await send(session, { path: endpoints.memberRelationship(profile.provider_id) }));
      if (distance) Object.assign(profile, { network_distance: distance, is_relationship: distance === "DISTANCE_1" });
    } catch {
      // Unknown distance stays unknown; callers treat that as "check later".
    }
  }
  return profile;
}

async function resolveMemberId(session: OwnSession, rawIdentifier: string, context: OwnRequestContext) {
  const identifier = plainIdentifier(rawIdentifier);
  if (looksLikeMemberId(identifier)) return identifier;
  const known = memberIdByVanity.get(identifier.toLowerCase());
  if (known) return known;
  if (!(await context.takeProfileView(session.accountId))) {
    reject(403, "errors/profile_view_budget", "Daily LinkedIn profile-view budget is spent for this account.");
  }
  return (await fetchProfile(session, identifier)).provider_id;
}

// ---------------------------------------------------------- conversations

// Cached as promises: an inbox load asks for chats, attendees and previews in
// parallel, and all three must share one LinkedIn read instead of racing to
// make their own. Failed reads are dropped so the next call retries.
type ConversationPage = { items: Conversation[]; nextCursor?: string; seen: Set<string> };
const conversationCache = new Map<string, { at: number; pages: Promise<ConversationPage>[] }>();
const messagesCache = new Map<string, { at: number; messages: Promise<Message[]> }>();

function mailboxUrn(session: OwnSession) {
  return profileUrn(session.memberId);
}

async function fetchConversationPage(session: OwnSession, previous: ConversationPage | undefined): Promise<ConversationPage> {
  const seen = new Set(previous?.seen);
  // LinkedIn pages the inbox with an opaque cursor; no cursor means no more.
  if (previous && !previous.nextCursor) return { items: [], seen };
  const response = await send(session, {
    path: endpoints.conversations(mailboxUrn(session), previous?.nextCursor),
    accept: ACCEPT_GRAPHQL,
  });
  const items = graphqlElements(response)
    .map((item) => mapConversation(item, { accountId: session.accountId, selfMemberId: session.memberId }))
    .filter((item): item is Conversation => Boolean(item))
    .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  // A conversation coming back a second time means the cursor was ignored.
  // Reply sync and the "have we already messaged this person" check must not
  // mistake a repeated first page for the whole inbox.
  if (items.some((item) => seen.has(item.id))) {
    reject(502, "errors/incomplete_history", "LinkedIn conversation pagination did not advance.");
  }
  for (const item of items) seen.add(item.id);
  return { items, nextCursor: graphqlNextCursor(response), seen };
}

function conversationCacheEntry(session: OwnSession) {
  let entry = conversationCache.get(session.accountId);
  if (!entry || Date.now() - entry.at >= CONVERSATION_CACHE_MS) {
    entry = { at: Date.now(), pages: [] };
    conversationCache.set(session.accountId, entry);
  }
  return entry;
}

// Conversation pages 1..count (fewer once LinkedIn runs out), newest first.
// A caller that reads page after page passes the entry it started with: a
// walk that outlasts the cache window would otherwise start again from page 1
// every minute and never finish a large inbox.
async function conversationPages(session: OwnSession, count: number, cacheEntry = conversationCacheEntry(session)) {
  const pages: Conversation[][] = [];
  for (let index = 0; index < count; index += 1) {
    if (!cacheEntry.pages[index]) {
      const previous = index ? cacheEntry.pages[index - 1] : Promise.resolve(undefined);
      const page = previous.then((before) => fetchConversationPage(session, before));
      page.catch(() => {
        if (conversationCache.get(session.accountId) === cacheEntry) conversationCache.delete(session.accountId);
      });
      cacheEntry.pages[index] = page;
    }
    const page = (await cacheEntry.pages[index]).items;
    pages.push(page);
    if (!page.length) break;
  }
  return pages;
}

async function conversationMessages(session: OwnSession, conversationUrn: string, before?: number) {
  const key = `${session.accountId}|${conversationUrn}|${before || ""}`;
  const cached = messagesCache.get(key);
  if (cached && Date.now() - cached.at < MESSAGES_CACHE_MS) return cached.messages;
  const messages = send(session, {
    path: endpoints.messages(conversationUrn, before),
    accept: ACCEPT_GRAPHQL,
  }).then((response) => {
    const mapped = graphqlElements(response)
      .map((item) => mapMessage(item, { accountId: session.accountId, selfMemberId: session.memberId, conversationUrn }))
      .filter((item): item is Message => Boolean(item));
    if (mapped.some((item) => !Number.isFinite(Date.parse(item.timestamp || "")))) {
      reject(502, "errors/incomplete_history", "LinkedIn message timestamps are missing.");
    }
    if (before !== undefined && mapped.length && !mapped.some((item) => Date.parse(item.timestamp || "") < before)) {
      reject(502, "errors/incomplete_history", "LinkedIn message pagination did not advance.");
    }
    return mapped
      .filter((item) => !before || Date.parse(item.timestamp || "") < before)
      .sort((a, b) => Date.parse(b.timestamp || "") - Date.parse(a.timestamp || ""));
  });
  const entry = { at: Date.now(), messages };
  messagesCache.set(key, entry);
  messages.catch(() => {
    if (messagesCache.get(key) === entry) messagesCache.delete(key);
  });
  return messages;
}

function invalidateConversationCaches(accountId: string) {
  conversationCache.delete(accountId);
  for (const key of messagesCache.keys()) {
    if (key.startsWith(`${accountId}|`)) messagesCache.delete(key);
  }
}

function chatSummary(conversation: Conversation) {
  // The cache-internal fields stay out of the returned chat record.
  const { messages, lastActivityAt, conversationUrn, ...chat } = conversation;
  void messages;
  void lastActivityAt;
  void conversationUrn;
  return chat;
}

function messageRecord(message: Message) {
  const { origin_token: originToken, ...record } = message;
  void originToken;
  return record;
}

// ---------------------------------------------------------------- handlers

// A chat id names its account; never act on it with another account's session.
function chatOf(session: OwnSession, chatId: string) {
  const chat = parseOwnChatId(chatId);
  if (!chat || chat.accountId !== session.accountId) reject(404, "errors/resource_not_found", "Chat not found.");
  return chat;
}

async function listChats({ session, query }: HandlerInput) {
  const limit = limitParam(query, 25, 100);
  const pages = await conversationPages(session, Math.min(MAX_CONVERSATION_PAGES, Math.ceil(limit / 20)));
  return { items: pages.flat().slice(0, limit).map(chatSummary), cursor: null };
}

async function getChat({ accountId, params }: { accountId: string; params: string[] }) {
  const chat = parseOwnChatId(params[0]);
  if (!chat || chat.accountId !== accountId) reject(404, "errors/resource_not_found", "Chat not found.");
  // Ownership is in the id itself; no LinkedIn call needed.
  return { id: params[0], provider_id: chat.urn, account_id: accountId };
}

async function listChatMessages({ session, params, query }: HandlerInput) {
  const chat = chatOf(session, params[0]);
  const limit = limitParam(query, 30, 200);
  const items: Message[] = [];
  const seen = new Set<string>();
  let before = Number(query.get("cursor")) || undefined;
  let exhausted = false;
  for (let page = 0; page < 10 && items.length < limit; page += 1) {
    const messages = await conversationMessages(session, chat.urn, before);
    const fresh = messages.filter((message) => !seen.has(message.id));
    if (!fresh.length) {
      exhausted = true;
      break;
    }
    for (const message of fresh) {
      seen.add(message.id);
      items.push(message);
    }
    const oldest = Math.min(...fresh.map((message) => Date.parse(message.timestamp || "")).filter(Number.isFinite));
    if (!Number.isFinite(oldest) || (before !== undefined && oldest >= before)) {
      exhausted = true;
      break;
    }
    before = oldest;
  }
  items.sort((a, b) => Date.parse(b.timestamp || "") - Date.parse(a.timestamp || ""));
  // The cursor always moves strictly older, so callers that detect repeated
  // cursors never see one.
  return { items: items.map(messageRecord), cursor: exhausted || !before ? null : String(before) };
}

async function listChatAttendees({ session, params }: HandlerInput) {
  const chat = chatOf(session, params[0]);
  const attendees = new Map<string, MappedAttendee>();
  const conversation = (await conversationPages(session, 1)).flat().find((item) => item.conversationUrn === chat.urn);
  for (const attendee of conversation?.attendees || []) attendees.set(attendee.provider_id, attendee);
  if (!conversation) {
    for (const message of await conversationMessages(session, chat.urn)) {
      if (message.sender) attendees.set(message.sender.provider_id, message.sender);
    }
  }
  return { items: [...attendees.values()] };
}

async function listAccountAttendees({ session }: HandlerInput) {
  const attendees = new Map<string, MappedAttendee>();
  const pagesToRead = Math.max(2, conversationCache.get(session.accountId)?.pages.length || 2);
  for (const conversation of (await conversationPages(session, pagesToRead)).flat()) {
    for (const attendee of conversation.attendees) {
      if (!attendees.has(attendee.provider_id)) attendees.set(attendee.provider_id, attendee);
    }
  }
  return { items: [...attendees.values()], cursor: null };
}

// Member -> their 1:1 chats, per account. LinkedIn has no lookup by person
// that this client knows of, so the owner-message guard used to page through
// the whole inbox before every first message to a lead with no chat: 50 to
// 250 paced reads per send, holding the account's queue (Messages page,
// sync) for minutes, and never finishing past 5,000 conversations.
//
// The index is built once by walking the inbox from the top, a bounded number
// of pages per call and resumed by the next call. Inbox order is newest
// activity first and a conversation only moves up, so after that walk the
// conversations it has not seen are exactly the ones with activity newer than
// `topWatermark`: the first page or two, read again on each lookup.
type ChatRef = { id: string; provider_id: string; account_id: string; attendee_provider_id: string; timestamp?: string };
type ChatIndex = {
  chats: Map<string, Map<string, ChatRef>>;
  topWatermark?: number;
  walk?: ConversationPage;
  walkPages: number;
  complete: boolean;
  lock: Promise<unknown>;
};
const chatIndexes = new Map<string, ChatIndex>();
const CHAT_INDEX_PAGES_PER_CALL = 40;
const CHAT_INDEX_MAX_PAGES = 2_500;

function indexChats(index: ChatIndex, conversations: Conversation[]) {
  for (const conversation of conversations) {
    const memberId = conversation.attendee_provider_id;
    if (!memberId) continue;
    const chats = index.chats.get(memberId) || new Map<string, ChatRef>();
    chats.set(conversation.conversationUrn, {
      id: conversation.id,
      provider_id: conversation.provider_id,
      account_id: conversation.account_id,
      attendee_provider_id: memberId,
      ...(conversation.timestamp ? { timestamp: conversation.timestamp } : {}),
    });
    index.chats.set(memberId, chats);
  }
}

function newestActivity(conversations: Conversation[], floor = 0) {
  return conversations.reduce((newest, conversation) => Math.max(newest, conversation.lastActivityAt), floor);
}

async function updateChatIndex(session: OwnSession, index: ChatIndex, memberId: string) {
  // Activity since the last lookup sits at the top of the inbox.
  if (index.topWatermark !== undefined) {
    const watermark = index.topWatermark;
    const cacheEntry = conversationCacheEntry(session);
    let newest = watermark;
    for (let page = 1; page <= MAX_CONVERSATION_PAGES; page += 1) {
      const items = (await conversationPages(session, page, cacheEntry))[page - 1] || [];
      indexChats(index, items);
      // Pages can come from reads a minute apart (cache), so a chat that
      // started between them may be on neither. Only the first page moves
      // the mark: anything newer than its newest chat is read again next time.
      if (page === 1) newest = newestActivity(items, newest);
      if (!items.length || items.some((conversation) => conversation.lastActivityAt <= watermark)) break;
    }
    index.topWatermark = newest;
  }
  // The older part of the inbox, resumed where the previous call stopped.
  for (let page = 0; !index.complete && !index.chats.has(memberId) && page < CHAT_INDEX_PAGES_PER_CALL; page += 1) {
    if (index.walkPages >= CHAT_INDEX_MAX_PAGES) break;
    let next: ConversationPage;
    try {
      next = await fetchConversationPage(session, index.walk);
    } catch (error) {
      // A cursor LinkedIn no longer accepts: walk again from the top later.
      // Chats indexed so far stay valid.
      index.walk = undefined;
      index.walkPages = 0;
      throw error;
    }
    index.walkPages += 1;
    if (index.topWatermark === undefined) index.topWatermark = newestActivity(next.items);
    indexChats(index, next.items);
    index.walk = next;
    if (!next.items.length || !next.nextCursor) index.complete = true;
  }
}

async function listChatsWithAttendee({ session, params }: HandlerInput) {
  const memberId = params[0];
  let index = chatIndexes.get(session.accountId);
  if (!index) {
    index = { chats: new Map(), walkPages: 0, complete: false, lock: Promise.resolve() };
    chatIndexes.set(session.accountId, index);
  }
  // One lookup at a time per account, so two sends never walk the same pages.
  const current = index;
  const run = current.lock.catch(() => undefined).then(() => updateChatIndex(session, current, memberId));
  current.lock = run;
  await run;
  const chats = current.chats.get(memberId);
  if (chats?.size) return { items: [...chats.values()] };
  if (current.complete) return { items: [] };
  return reject(503, "errors/incomplete_history", "LinkedIn message history could not be fully checked. Try again later.");
}

// Messages across the account, newest first, paged so that every message on
// page k is newer than every message on page k+1. Reply sync stops paging at
// the first page that reaches its cutoff, so an out-of-order message on a
// later page would never be read.
//
// Page k covers conversation pages 1..k and returns the messages that fall in
// [boundary_k, boundary_k-1), where boundary_k is the oldest last-activity in
// pages 1..k. Older messages of early conversations surface on later pages.
async function listAccountMessages({ session, query }: HandlerInput) {
  const since = query.has("since") ? Number(query.get("since")) : undefined;
  if (since !== undefined && (!Number.isFinite(since) || since < 0)) reject(400, "errors/invalid_parameters", "Invalid message cutoff.");
  if (since === undefined && !query.has("cursor")) {
    // Unpaged bulk preview call from listLinkedInInbox: cover the same
    // conversation pages listChats requested (limit = chatLimit * 6) so
    // chats beyond the first 20 keep their last-message preview.
    const previewChats = Math.ceil(limitParam(query, 150, 250) / 6);
    const pagesToRead = Math.min(5, Math.max(1, Math.ceil(previewChats / 20)));
    const items = (await conversationPages(session, pagesToRead))
      .flat()
      .flatMap((conversation) => conversation.messages)
      .filter((message) => Number.isFinite(Date.parse(message.timestamp || "")))
      .sort((a, b) => Date.parse(b.timestamp || "") - Date.parse(a.timestamp || ""));
    return { items: items.map(messageRecord), cursor: null };
  }
  const page = Math.max(1, Number(query.get("cursor")) || 1);
  if (page > MAX_CONVERSATION_PAGES) reject(503, "errors/incomplete_history", "LinkedIn message history is incomplete.");
  const pages = await conversationPages(session, page);
  const conversations = pages.flat();
  const lastPage = pages[page - 1] || [];
  const minActivity = (items: Conversation[]) =>
    items.length ? Math.min(...items.map((item) => item.lastActivityAt)) : 0;
  const upper = page === 1 ? Number.POSITIVE_INFINITY : minActivity(pages.slice(0, page - 1).flat());
  const hasMore = lastPage.length > 0 && (since === undefined || minActivity(conversations) > since);
  const lower = Math.max(hasMore ? minActivity(conversations) : 0, since || 0);

  type SyncMessage = Message & {
    attendee_provider_id?: string;
    attendee_profile_url?: string;
    attendee_name?: string;
  };
  const items: SyncMessage[] = [];
  for (const conversation of conversations) {
    let messages = conversation.messages;
    // Inbox previews use embedded messages. Sync reads every active thread,
    // including read threads and replies hidden behind an outbound preview.
    if (since !== undefined && conversation.lastActivityAt >= lower) {
      messages = [];
      let before: number | undefined;
      for (let historyPage = 0; historyPage < MAX_HISTORY_PAGES; historyPage += 1) {
        const history = await conversationMessages(session, conversation.conversationUrn, before);
        if (!history.length) break;
        messages.push(...history);
        const oldest = Math.min(...history.map((message) => Date.parse(message.timestamp || "")));
        if (!Number.isFinite(oldest)) reject(502, "errors/incomplete_history", "LinkedIn message timestamps are missing.");
        if (oldest <= lower) break;
        before = oldest;
        if (historyPage === MAX_HISTORY_PAGES - 1) reject(503, "errors/incomplete_history", "LinkedIn message history is incomplete.");
      }
    }
    for (const message of messages) {
      const at = Date.parse(message.timestamp || "");
      if (Number.isFinite(at) && at >= lower && at < upper) {
        // Reply sync needs the other person on owner-sent messages so it can
        // stop outreach the way the old Unipile new_message webhook did.
        const other = conversation.attendees?.find((attendee) => !attendee.is_self);
        items.push({
          ...message,
          ...(conversation.attendee_provider_id
            ? { attendee_provider_id: conversation.attendee_provider_id }
            : {}),
          ...(other?.profile_url ? { attendee_profile_url: other.profile_url } : {}),
          ...(other?.name ? { attendee_name: other.name } : {}),
        });
      }
    }
  }
  items.sort((a, b) => Date.parse(b.timestamp || "") - Date.parse(a.timestamp || ""));
  if (hasMore && page === MAX_CONVERSATION_PAGES) reject(503, "errors/incomplete_history", "LinkedIn message history is incomplete.");
  return { items: items.map(messageRecord), cursor: hasMore ? String(page + 1) : null };
}

async function getMessage({ accountId, params }: { accountId: string; params: string[] }) {
  const message = parseOwnMessageId(params[0]);
  if (!message || message.accountId !== accountId) reject(404, "errors/resource_not_found", "Message not found.");
  return { id: params[0], account_id: accountId };
}

function messageFiles(body: unknown) {
  if (!(body instanceof FormData)) return [];
  const files = body.getAll("attachments");
  if (files.length > 5 || files.some((file) => !(file instanceof File) || file.size <= 0 || file.size > 15 * 1024 * 1024)) {
    reject(400, "errors/invalid_parameters", "Send up to five non-empty attachments, each under 15MB.");
  }
  return files as File[];
}

async function uploadAttachments(session: OwnSession, files: File[]) {
  const content: unknown[] = [];
  for (const file of files) {
    const response = asObject(await send(session, {
      method: "POST", write: true, path: endpoints.uploadMedia(),
      body: { mediaUploadType: "MESSAGING_FILE_ATTACHMENT", fileSize: file.size, filename: file.name },
    }));
    const data = asObject(response?.data);
    const referenced = Array.isArray(response?.included)
      ? response.included.map(asObject).find((item) => item?.entityUrn === data?.["*value"])
      : undefined;
    const slot = asObject(data?.value) || asObject(response?.value) || referenced;
    const urn = str(slot?.urn);
    const url = str(slot?.singleUploadUrl);
    if (!urn?.startsWith("urn:li:") || !url) reject(502, "errors/provider_error", "LinkedIn did not return an attachment upload slot.");
    const headers = Object.fromEntries(Object.entries(asObject(slot?.singleUploadHeaders) || {}).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
    await uploadLinkedInMedia(session, url, file, headers, sessionHooks(session.accountId, session.version));
    content.push({ file: { assetUrn: urn, byteSize: file.size, mediaType: file.type.split(";")[0] || "application/octet-stream", name: file.name } });
  }
  return content;
}

// Finds the message we just sent when LinkedIn's create response omitted its
// urn. The id must match what history later lists, or the owner-message guard
// mistakes our own send for a manual one and stops the lead's outreach.
async function findSentMessage(session: OwnSession, input: { conversationUrn?: string; recipient?: string; originToken: string }) {
  invalidateConversationCaches(session.accountId);
  let conversationUrn = input.conversationUrn;
  if (!conversationUrn && input.recipient) {
    conversationUrn = (await conversationPages(session, 1))
      .flat()
      .find((conversation) => conversation.attendee_provider_id === input.recipient)?.conversationUrn;
  }
  if (!conversationUrn) return null;
  const message = (await conversationMessages(session, conversationUrn)).find(
    (item) => item.origin_token === input.originToken,
  );
  return message ? { id: message.id, chatId: message.chat_id } : null;
}

async function createMessage(
  session: OwnSession,
  input: { text: string; conversationUrn?: string; recipient?: string; files?: File[] },
) {
  const attachments = await uploadAttachments(session, input.files || []);
  const originToken = randomUUID();
  const response = asObject(
    await send(session, {
      method: "POST",
      write: true,
      path: endpoints.createMessage(),
      body: {
        message: {
          body: { attributes: [], text: input.text },
          renderContentUnions: attachments,
          originToken,
          ...(input.conversationUrn ? { conversationUrn: input.conversationUrn } : {}),
        },
        mailboxUrn: mailboxUrn(session),
        trackingId: randomBytes(16).toString("latin1"),
        dedupeByClientGeneratedToken: false,
        ...(input.recipient ? { hostRecipientUrns: [profileUrn(input.recipient)] } : {}),
      },
    }),
  );
  invalidateConversationCaches(session.accountId);
  const data = asObject(response?.data);
  const referenced = Array.isArray(response?.included)
    ? response.included.map(asObject).find((item) => item?.entityUrn === data?.["*value"])
    : undefined;
  const value = asObject(response?.value) || asObject(data?.value) || referenced || response;
  const messageUrn = str(value?.entityUrn);
  const conversationUrn = str(value?.conversationUrn) || input.conversationUrn;
  if (messageUrn && conversationUrn) {
    const mapped = mapMessage(
      { entityUrn: messageUrn, deliveredAt: value?.deliveredAt },
      { accountId: session.accountId, selfMemberId: session.memberId, conversationUrn },
    );
    return { message_id: mapped?.id, id: mapped?.id, chat_id: mapped?.chat_id };
  }
  // The message went out; only its id is unknown. Look it up instead of
  // throwing, which would make automation treat a delivered send as unsent.
  const found = await findSentMessage(session, { conversationUrn, recipient: input.recipient, originToken }).catch(() => null);
  if (!found) {
    throw new Error("LinkedIn accepted this message but did not return its ID. Check the conversation before sending again.");
  }
  return { message_id: found.id, id: found.id, chat_id: found.chatId };
}

async function startChat({ session, body }: HandlerInput) {
  const files = messageFiles(body);
  const recipient = formText(body, "attendees_ids");
  const messageText = formText(body, "text") || "";
  if (!recipient || !looksLikeMemberId(recipient)) reject(400, "errors/invalid_recipient", "A LinkedIn member id is required.");
  if (!messageText.trim() && !files.length) reject(400, "errors/invalid_parameters", "A message or attachment is required.");
  return createMessage(session, { text: messageText, recipient, files });
}

async function sendChatMessage({ session, params, body }: HandlerInput) {
  const files = messageFiles(body);
  const chat = chatOf(session, params[0]);
  const messageText = formText(body, "text") || "";
  if (!messageText.trim() && !files.length) reject(400, "errors/invalid_parameters", "A message or attachment is required.");
  return createMessage(session, { text: messageText, conversationUrn: chat.urn, files });
}

async function getMe({ session }: HandlerInput) {
  const me = mapMeResponse(await send(session, { path: endpoints.me() }));
  if (!me) reject(502, "errors/provider_error", "LinkedIn did not return the account profile.");
  rememberMember(me.public_identifier, me.provider_id);
  return me;
}

async function getProfile({ session, params }: HandlerInput) {
  return fetchProfile(session, params[0]);
}

// Activity id -> share urn, learned from every feed read. LinkedIn files
// reactions under the share, so a post already seen costs no extra read.
const threadUrnByActivityId = new Map<string, string>();

function rememberThreads<T extends { id: string; thread_urn?: string }>(posts: T[]) {
  return posts.map(({ thread_urn: threadUrn, ...post }) => {
    if (threadUrn) {
      if (threadUrnByActivityId.size >= 5_000) threadUrnByActivityId.clear();
      threadUrnByActivityId.set(post.id, threadUrn);
    }
    return post;
  });
}

async function listPosts({ session, params, query, context }: HandlerInput) {
  const limit = limitParam(query, 10, 50);
  if (query.get("is_company") === "true") {
    const companyId = params[0];
    let universalName = universalNameByCompanyId.get(companyId);
    if (!universalName) {
      const company = mapCompanyResponse(await send(session, { path: endpoints.companyById(companyId) }));
      universalName = company?.public_identifier;
      if (universalName) universalNameByCompanyId.set(companyId, universalName);
    }
    if (!universalName) reject(422, "errors/invalid_parameters", "LinkedIn company not found.");
    return { items: rememberThreads(mapFeedUpdates(await send(session, { path: endpoints.companyUpdates(universalName, limit) }))) };
  }
  const memberId = await resolveMemberId(session, params[0], context);
  return { items: rememberThreads(mapFeedUpdates(await send(session, { path: endpoints.profileUpdates(profileUrn(memberId), limit) }))) };
}

function activityIdParam(value: string) {
  const id = /^\d+$/.test(value) ? value : activityIdFromUrn(value);
  if (!id) reject(400, "errors/invalid_parameters", "Unsupported LinkedIn post id.");
  return id;
}

// A post as callers hold it: a bare activity id, or an activity, ugcPost or
// share urn. The kind matters: the same digits under another kind are a
// different post.
function postRef(value: string) {
  if (/^\d+$/.test(value)) return { kind: "activity", id: value };
  const match = value.match(/urn:li:(activity|ugcPost|share):(\d+)/);
  if (!match) reject(400, "errors/invalid_parameters", "Unsupported LinkedIn post id.");
  return { kind: match[1], id: match[2] };
}

async function getPost({ session, params }: HandlerInput) {
  const activityId = activityIdParam(params[0]);
  const post = rememberThreads(mapFeedUpdates(await send(session, { path: endpoints.post(activityId) })))
    .find((item) => item.id === activityId);
  if (!post) reject(404, "errors/resource_not_found", "LinkedIn post not found.");
  return post;
}

async function listComments({ session, params, query }: HandlerInput) {
  const limit = limitParam(query, 50, 100);
  const post = postRef(params[0]);
  return { items: mapComments(await send(session, { path: endpoints.comments(`${post.kind}:${post.id}`, limit) })) };
}

async function listReactions({ session, params, query }: HandlerInput) {
  const limit = limitParam(query, 50, 100);
  const post = postRef(params[0]);
  let threadUrn = post.kind === "activity" ? threadUrnByActivityId.get(post.id) : `urn:li:${post.kind}:${post.id}`;
  if (!threadUrn) {
    // Not seen in a feed read by this process: one post read finds its share.
    rememberThreads(mapFeedUpdates(await send(session, { path: endpoints.post(post.id) })));
    threadUrn = threadUrnByActivityId.get(post.id);
  }
  if (!threadUrn) reject(404, "errors/resource_not_found", "LinkedIn post not found.");
  return { items: mapReactions(await send(session, { path: endpoints.reactions(threadUrn, limit) })) };
}

async function getCompany({ session, params }: HandlerInput) {
  const identifier = params[0];
  const response = await send(session, {
    path: /^\d+$/.test(identifier) ? endpoints.companyById(identifier) : endpoints.companyByUniversalName(identifier),
  });
  const company = mapCompanyResponse(response);
  if (!company) reject(404, "errors/resource_not_found", "LinkedIn company not found.");
  if (company.public_identifier) universalNameByCompanyId.set(company.id, company.public_identifier);
  return company;
}

async function searchParameters({ session, query }: HandlerInput) {
  const type = query.get("type");
  const keywords = query.get("keywords")?.trim();
  if (!keywords) return { items: [] };
  if (type !== "LOCATION" && type !== "COMPANY") reject(400, "errors/invalid_parameters", "Unsupported search parameter type.");
  const items = mapTypeahead(await send(session, { path: endpoints.typeahead(type === "LOCATION" ? "GEO" : "COMPANY", keywords) }));
  return { items: items.slice(0, limitParam(query, 5, 50)) };
}

// LinkedIn caps free accounts at a monthly number of people searches. Past it
// every search still answers 200 with about three results, so discovery looks
// like it found almost nobody. Say so, once an hour per account.
const searchLimitWarnedAt = new Map<string, number>();

function warnSearchLimit(accountId: string) {
  if (Date.now() - (searchLimitWarnedAt.get(accountId) || 0) < 60 * 60_000) return;
  searchLimitWarnedAt.set(accountId, Date.now());
  console.warn(`[linkedin-own] ${accountId} reached LinkedIn's monthly people-search limit; searches return only a few results until it resets.`);
}

async function search({ session, query, body }: HandlerInput) {
  const input = jsonBody(body);
  const limit = limitParam(query, 10, 50);

  // Search by a copied LinkedIn URL: search pages carry their keywords
  // and filters in the query string, a profile or company page names one
  // result. Unsupported URLs are refused plainly, never guessed at.
  if (input.url) {
    const parsed = parseLinkedInSearchUrl(String(input.url));
    if (!parsed) reject(400, "errors/invalid_parameters", "That LinkedIn URL is not a search, profile or company URL this connection can use.");
    if (parsed.kind === "profile") {
      const profile = await fetchProfile(session, parsed.identifier);
      return { items: [profile], cursor: null };
    }
    if (parsed.kind === "company") {
      const company = mapCompanyResponse(await send(session, {
        path: /^\d+$/.test(parsed.identifier) ? endpoints.companyById(parsed.identifier) : endpoints.companyByUniversalName(parsed.identifier),
      }));
      if (!company) reject(404, "errors/resource_not_found", "LinkedIn company not found.");
      if (company.public_identifier) universalNameByCompanyId.set(company.id, company.public_identifier);
      return { items: [company], cursor: null };
    }
    const web = await webSearch(
      session,
      { resultType: parsed.resultType, keywords: parsed.keywords, filters: parsed.filters, pageUrl: parsed.pageUrl, start: Math.max(0, Number(input.cursor) || 0), limit },
      sessionHooks(session.accountId, session.version),
    );
    if (web.limitReached) warnSearchLimit(session.accountId);
    return {
      items: web.items,
      cursor: web.more ? String(Math.max(0, Number(input.cursor) || 0) + web.items.length) : null,
      ...(web.limitReached ? { search_limit_reached: true } : {}),
    };
  }

  const category = String(input.category || input.type || "");
  const resultType = category === "people" ? "PEOPLE" : category === "companies" ? "COMPANIES" : category === "posts" ? "CONTENT" : null;
  if (!resultType) reject(400, "errors/invalid_parameters", "Unsupported search category.");
  // reject() throws; keep a narrowed copy for the nested searchViaWeb closure.
  const searchType: "PEOPLE" | "COMPANIES" | "CONTENT" = resultType;
  const locations = Array.isArray(input.location) ? input.location.map(String) : [];
  const companies = Array.isArray(input.company) ? input.company.map(String) : [];
  const headcount = Array.isArray(input.headcount) ? (asObject(input.headcount[0]) as { min?: number; max?: number } | null) : null;
  const filters =
    searchType === "PEOPLE"
      ? [{ key: "geoUrn", values: locations }, { key: "currentCompany", values: companies }]
      : searchType === "COMPANIES"
        ? [
            { key: "companyHqGeo", values: locations },
            { key: "companySize", values: headcount ? companySizeCodes({ min: Number(headcount.min) || 0, max: Number(headcount.max) || 0 }) : [] },
          ]
        : [];

  let start = Math.max(0, Number(input.cursor) || 0);
  const items: unknown[] = [];
  let more = true;
  let graphqlLimitReached = false;

  async function searchViaWeb() {
    const web = await webSearch(
      session,
      { resultType: searchType, keywords: String(input.keywords || ""), filters, start, limit },
      sessionHooks(session.accountId, session.version),
    );
    const normalizedItems =
      searchType === "CONTENT"
        ? rememberThreads<{ id: string; thread_urn?: string }>(
            web.items as Array<{ id: string; thread_urn?: string }>,
          )
        : web.items;
    for (const item of normalizedItems) {
      const record = item as { provider_id?: string; public_identifier?: string };
      rememberMember(record.public_identifier, record.provider_id);
    }
    if (web.limitReached) warnSearchLimit(session.accountId);
    return {
      items: normalizedItems,
      cursor: web.more ? String(start + normalizedItems.length) : null,
      ...(web.limitReached || graphqlLimitReached ? { search_limit_reached: true } : {}),
    };
  }

  for (let page = 0; page < MAX_SEARCH_PAGES_PER_CALL && items.length < limit; page += 1) {
    let response: Awaited<ReturnType<typeof send>>;
    try {
      response = await send(session, {
        path: endpoints.search({ keywords: String(input.keywords || ""), resultType: searchType, filters, start, count: SEARCH_PAGE_SIZE }),
      });
    } catch (error) {
      // The GraphQL search query id rotates and can 400/500. On the first
      // page, fall through to LinkedIn's own search HTML instead of failing
      // the whole discovery run.
      if (page === 0) return searchViaWeb();
      throw error;
    }
    const pageItems =
      searchType === "PEOPLE"
        ? mapPeopleSearch(response)
        : searchType === "COMPANIES"
          ? mapCompanySearch(response)
          : rememberThreads<{ id: string; thread_urn?: string }>(mapPostSearch(response));
    if (searchType === "PEOPLE" && searchLimitReached(response)) {
      graphqlLimitReached = true;
      warnSearchLimit(session.accountId);
    }
    // The GraphQL search query now answers empty for everyone (verified
    // live against a working account). Fall back to LinkedIn's own
    // search pages, which still return results to a signed-in session.
    if (!pageItems.length && page === 0) return searchViaWeb();
    for (const item of pageItems) {
      const record = item as { provider_id?: string; public_identifier?: string };
      rememberMember(record.public_identifier, record.provider_id);
    }
    items.push(...pageItems);
    start += SEARCH_PAGE_SIZE;
    const total = searchTotal(response);
    if (!pageItems.length || (total !== undefined && start >= total)) {
      more = false;
      break;
    }
  }
  return {
    items: items.slice(0, limit),
    cursor: more ? String(start) : null,
    ...(graphqlLimitReached ? { search_limit_reached: true } : {}),
  };
}

async function sendInvite({ session, body }: HandlerInput) {
  const input = jsonBody(body);
  const recipient = String(input.provider_id || "");
  if (!looksLikeMemberId(recipient)) reject(400, "errors/invalid_recipient", "A LinkedIn member id is required.");
  const note = typeof input.message === "string" && input.message.trim() ? input.message.trim() : undefined;
  const response = asObject(
    await send(session, {
      method: "POST",
      write: true,
      path: endpoints.createInvitation(),
      body: {
        invitee: { inviteeUnion: { memberProfile: profileUrn(recipient) } },
        ...(note ? { customMessage: note } : {}),
      },
    }),
  );
  const urn = JSON.stringify(response || {}).match(/urn:li:(?:fsd_invitation|fs_relInvitation|invitation):(\d+)/)?.[1];
  return { id: urn, invitation_id: urn };
}

async function listSentInvites({ session, query }: HandlerInput) {
  const count = limitParam(query, 100, 100);
  const start = Math.max(0, Number(query.get("cursor")) || 0);
  const items = mapSentInvitations(await send(session, { path: endpoints.sentInvitations(start, count) }));
  // An empty or short page ends the list; a hard offset cap stops a looping provider.
  const next = items.length >= count && start + count < 5_000 ? String(start + count) : null;
  return { items, cursor: next };
}

function sduiWithdrawPayload(invitationId: string) {
  const requestedArguments = {
    $type: "proto.sdui.actions.requests.RequestedArguments",
    requestedStateKeys: [],
    payload: {
      inviterActionType: "InviterActionType_WITHDRAW",
      invitationType: "GenericInvitationType_CONNECTION",
      invitationUrn: { invitationId },
    },
    requestMetadata: { $type: "proto.sdui.common.RequestMetadata" },
  };
  return {
    requestId: "com.linkedin.sdui.requests.mynetwork.addaWithdrawInvitation",
    serverRequest: {
      requestId: "com.linkedin.sdui.requests.mynetwork.addaWithdrawInvitation",
      requestedArguments,
      isApfcEnabled: false,
      isStreaming: false,
      rumPageKey: "",
    },
    states: [],
    requestedArguments: {
      ...requestedArguments,
      states: [],
      screenId: "com.linkedin.sdui.flagshipnav.mynetwork.invitations.WithdrawConfirmationDialog",
      knownTemplateIds: [],
    },
  };
}

async function withdrawInvite({ session, params }: HandlerInput) {
  const invitation = parseOwnInvitationId(params[0]);
  if (!invitation) reject(400, "errors/invalid_parameters", "Malformed invitation id.");
  // LinkedIn's sentInvitationViewsV2 now sets sharedSecret to "dummy" and
  // performs withdrawals through its SDUI server-request action.
  if (invitation.sharedSecret === "dummy" && typeof flagshipWebRequest === "function") {
    const responseText = await sendWeb(session, {
      method: "POST",
      write: true,
      path: endpoints.sduiWithdrawInvitation(),
      accept: "*/*",
      referer: "https://www.linkedin.com/mynetwork/invitation-manager/sent/",
      body: sduiWithdrawPayload(invitation.invitationId),
    });
    if (/"errors":\s*\[\s*\{/.test(responseText)) {
      reject(422, "errors/invalid_parameters", "LinkedIn could not withdraw that invitation.");
    }
    return undefined;
  }
  await send(session, {
    method: "POST",
    write: true,
    path: endpoints.withdrawInvitation(invitation.invitationId),
    body: {
      invitationId: invitation.invitationId,
      invitationSharedSecret: invitation.sharedSecret,
      isGenericInvitation: false,
    },
  });
  return undefined;
}

async function listRelations({ session, query }: HandlerInput) {
  const count = 40;
  const start = Math.max(0, Number(query.get("cursor")) || 0);
  const items = mapConnections(await send(session, { path: endpoints.connections(start, count) }));
  for (const item of items) rememberMember(item.public_identifier, item.provider_id);
  return { items, cursor: items.length >= count && start + count < 2_000 ? String(start + count) : null };
}

async function deleteAccount({ accountId, params }: { accountId: string; params: string[] }) {
  if (params[0] !== accountId) reject(400, "errors/invalid_parameters", "Account id mismatch.");
  // Disconnecting forgets the stored cookies; nothing on LinkedIn changes.
  await deleteOwnSession(accountId);
  invalidateConversationCaches(accountId);
  chatIndexes.delete(accountId);
  return undefined;
}

const ID = "([^/]+)";
const routes: Route[] = [
  { method: "GET", pattern: /^\/api\/v1\/users\/me$/, handle: getMe },
  { method: "GET", pattern: /^\/api\/v1\/users\/relations$/, handle: listRelations },
  { method: "GET", pattern: /^\/api\/v1\/users\/invite\/sent$/, handle: listSentInvites },
  { method: "DELETE", pattern: new RegExp(`^/api/v1/users/invite/sent/${ID}$`), handle: withdrawInvite },
  { method: "POST", pattern: /^\/api\/v1\/users\/invite$/, handle: sendInvite },
  { method: "GET", pattern: new RegExp(`^/api/v1/users/${ID}/posts$`), handle: listPosts },
  { method: "GET", pattern: new RegExp(`^/api/v1/users/${ID}$`), handle: getProfile },
  { method: "POST", pattern: /^\/api\/v1\/linkedin\/search$/, handle: search },
  { method: "GET", pattern: /^\/api\/v1\/linkedin\/search\/parameters$/, handle: searchParameters },
  { method: "GET", pattern: new RegExp(`^/api/v1/linkedin/company/${ID}$`), handle: getCompany },
  { method: "GET", pattern: new RegExp(`^/api/v1/posts/${ID}/comments$`), handle: listComments },
  { method: "GET", pattern: new RegExp(`^/api/v1/posts/${ID}/reactions$`), handle: listReactions },
  { method: "GET", pattern: new RegExp(`^/api/v1/posts/${ID}$`), handle: getPost },
  { method: "GET", pattern: /^\/api\/v1\/chats$/, handle: listChats },
  { method: "POST", pattern: /^\/api\/v1\/chats$/, handle: startChat },
  { method: "GET", pattern: new RegExp(`^/api/v1/chats/${ID}/messages$`), handle: listChatMessages },
  { method: "POST", pattern: new RegExp(`^/api/v1/chats/${ID}/messages$`), handle: sendChatMessage },
  { method: "GET", pattern: new RegExp(`^/api/v1/chats/${ID}/attendees$`), handle: listChatAttendees },
  { method: "GET", pattern: new RegExp(`^/api/v1/chats/${ID}$`), handleWithoutSession: getChat },
  { method: "GET", pattern: /^\/api\/v1\/chat_attendees$/, handle: listAccountAttendees },
  { method: "GET", pattern: new RegExp(`^/api/v1/chat_attendees/${ID}/chats$`), handle: listChatsWithAttendee },
  { method: "GET", pattern: /^\/api\/v1\/messages$/, handle: listAccountMessages },
  { method: "GET", pattern: new RegExp(`^/api/v1/messages/${ID}$`), handleWithoutSession: getMessage },
  { method: "DELETE", pattern: new RegExp(`^/api/v1/accounts/${ID}$`), handleWithoutSession: deleteAccount },
];

export async function ownLinkedInRequest(
  accountId: string,
  path: string,
  init: RequestInit | undefined,
  context: OwnRequestContext,
) {
  const url = new URL(path, "http://linkedin.local");
  const method = (init?.method || "GET").toUpperCase();
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = url.pathname.match(route.pattern);
    if (!match) continue;
    const params = match.slice(1).map((value) => decodeURIComponent(value));
    if ("handleWithoutSession" in route) return route.handleWithoutSession({ accountId, params });
    const session = await loadOwnSession(accountId);
    return route.handle({ session, params, query: url.searchParams, body: init?.body, context });
  }
  return reject(501, "errors/not_supported", `${method} ${url.pathname} is not supported on Omentir's own LinkedIn client.`);
}

export async function ownLinkedInAttachment(messageId: string, attachmentId: string) {
  const message = parseOwnMessageId(messageId);
  if (!message) reject(404, "errors/resource_not_found", "Message not found.");
  let mediaUrl: string;
  try {
    mediaUrl = base64UrlDecode(attachmentId);
  } catch {
    return reject(400, "errors/invalid_parameters", "Invalid attachment.");
  }
  const session = await loadOwnSession(message.accountId);
  return fetchLinkedInMedia(session, mediaUrl, sessionHooks(session.accountId, session.version));
}
