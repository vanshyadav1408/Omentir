import "server-only";

import type { Agent, Lead, LinkedInInboxMessage, LinkedInInboxThread } from "./types";
import { consumeProfileViewBudget } from "./data";
import { searchableLocationNames } from "./geo";

const UNIPILE_TIMEOUT_MS = 30_000;
const UNIPILE_MIN_REQUEST_SPACING_MS = 250;
// Free LinkedIn accounts reject notes over ~200 chars (Unipile returns
// errors/too_many_characters). Paid accounts allow 300; 200 is safe for both.
const LINKEDIN_CONNECTION_NOTE_LIMIT = 200;
const LINKEDIN_MESSAGE_LIMIT = 8000;
let nextUnipileRequestAt = 0;
let unipileThrottle = Promise.resolve();

// Every /users/{id} retrieval registers as a profile view on the customer's
// LinkedIn account. Unbounded views trip LinkedIn's "high volume of profile
// data" enforcement, so all profile reads share a per-account daily budget
// (persisted in Firestore - restarts and multiple processes must not reset or
// multiply it) and human-like in-process spacing.
const PROFILE_VIEW_DAILY_LIMIT = 75;
const PROFILE_VIEW_MIN_SPACING_MS = 2_000;
// At most this many chats get a profile lookup per inbox load, and only when
// the chat itself carries no usable attendee name.
const INBOX_ENRICHMENT_LIMIT = 5;
let nextProfileViewAt = 0;

function takeProfileViewBudget(accountId: string) {
  return consumeProfileViewBudget(accountId, PROFILE_VIEW_DAILY_LIMIT);
}

function waitForProfileViewSlot() {
  const waitMs = nextProfileViewAt - Date.now();
  nextProfileViewAt = Math.max(Date.now(), nextProfileViewAt) + PROFILE_VIEW_MIN_SPACING_MS;
  return waitMs > 0 ? wait(waitMs) : Promise.resolve();
}

// Thrown only when Unipile returned an HTTP response with a non-ok status. That
// guarantees the request reached Unipile and the action was rejected outright,
// so the side effect (invite/message) did not happen - unlike a network drop or
// timeout, where it's ambiguous. Callers use this to retry safely instead of
// parking the work for manual review.
export class UnipileResponseError extends Error {
  status: number;
  // Unipile error identifier from the response body, e.g.
  // "errors/cannot_resend_yet" - lets callers branch on failure type instead
  // of pattern-matching message strings.
  errorType?: string;
  detail?: string;

  constructor(status: number, message: string, body?: string) {
    super(message);
    this.name = "UnipileResponseError";
    this.status = status;
    if (body) {
      try {
        const parsed = JSON.parse(body) as { type?: unknown; detail?: unknown };
        if (typeof parsed.type === "string") this.errorType = parsed.type;
        if (typeof parsed.detail === "string") this.detail = parsed.detail;
      } catch {
        // Non-JSON body: message already carries the raw text.
      }
    }
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttleUnipileRequest() {
  const previous = unipileThrottle;
  let release = () => {};
  unipileThrottle = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  const waitMs = Math.max(0, nextUnipileRequestAt - Date.now());
  if (waitMs > 0) await wait(waitMs);
  nextUnipileRequestAt = Date.now() + UNIPILE_MIN_REQUEST_SPACING_MS;
  release();
}

export type UnipileProfile = {
  id?: string;
  public_identifier?: string;
  provider_id?: string;
  profile_url?: string;
  linkedin_url?: string;
  profile_picture_url?: string;
  profile_image_url?: string;
  picture_url?: string;
  avatar_url?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  headline?: string;
  occupation?: string;
  company?: string;
  location?: string;
  location_name?: string;
  locationName?: string;
  geo_location?: string;
  geoLocation?: string;
  city?: string;
  country?: string;
  summary?: string;
  image?: unknown;
  picture?: unknown;
  avatar?: unknown;
  profile_picture?: unknown;
  profile?: unknown;
  user?: unknown;
  linkedin?: unknown;
  linkedin_specific?: unknown;
  provider_data?: unknown;
};

export type UnipilePost = {
  id?: string;
  social_id?: string;
  object_urn?: string;
  url?: string;
  share_url?: string;
  text?: string;
  content?: string;
  commentary?: string;
  created_at?: string;
  posted_at?: string;
  date?: string;
  author?: UnipileProfile;
  user?: UnipileProfile;
};

type UnipileComment = {
  id?: string;
  text?: string;
  message?: string;
  body?: string;
  url?: string;
  created_at?: string;
  posted_at?: string;
  author?: UnipileProfile;
  user?: UnipileProfile;
  from?: UnipileProfile;
  profile?: UnipileProfile;
};

type UnipileReaction = {
  id?: string;
  type?: string;
  reaction_type?: string;
  url?: string;
  created_at?: string;
  author?: UnipileProfile;
  user?: UnipileProfile;
  from?: UnipileProfile;
  profile?: UnipileProfile;
};

type UnipileListResponse<T> = {
  items?: T[];
  results?: T[];
  data?: T[] | UnipileListResponse<T>;
  cursor?: string | null;
  paging?: { cursor?: string | null };
};

type UnipileAccount = {
  id?: string;
  type?: string;
  account_type?: string;
  provider?: string;
  name?: string;
  display_name?: string;
  status?: string;
};

type UnipileChatAttendee = {
  id?: string;
  provider_id?: string;
  member_id?: string;
  urn?: string;
  name?: string;
  display_name?: string;
  displayName?: string;
  full_name?: string;
  fullName?: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  username?: string;
  headline?: string;
  occupation?: string;
  title?: string;
  job_title?: string;
  jobTitle?: string;
  position?: string;
  company?: string;
  profile_url?: string;
  profileUrl?: string;
  public_profile_url?: string;
  publicProfileUrl?: string;
  linkedin_url?: string;
  linkedinUrl?: string;
  public_identifier?: string;
  publicIdentifier?: string;
  profile_picture_url?: string;
  profilePictureUrl?: string;
  profile_picture_url_large?: string;
  profilePictureUrlLarge?: string;
  profile_image_url?: string;
  profileImageUrl?: string;
  picture_url?: string;
  pictureUrl?: string;
  avatar_url?: string;
  avatarUrl?: string;
  image_url?: string;
  imageUrl?: string;
  image?: unknown;
  picture?: unknown;
  avatar?: unknown;
  profile_picture?: unknown;
  profile?: unknown;
  user?: unknown;
  linkedin?: unknown;
  linkedin_specific?: unknown;
  provider_data?: unknown;
  is_self?: boolean;
  is_current_user?: boolean;
  is_me?: boolean;
  self?: boolean;
};

type UnipileMessage = {
  id?: string;
  chat_id?: string;
  text?: string;
  body?: string;
  message?: string;
  content?: string;
  sender_id?: string;
  attendee_id?: string;
  sender_name?: string;
  sender?: UnipileChatAttendee;
  from?: UnipileChatAttendee;
  is_sender?: boolean;
  is_read?: boolean;
  timestamp?: string;
  date?: string;
  created_at?: string;
  sent_at?: string;
};

type UnipileChat = {
  id?: string;
  provider_id?: string;
  attendee_provider_id?: string;
  account_id?: string;
  name?: string;
  title?: string;
  subject?: string;
  unread?: boolean;
  unread_count?: number;
  read?: boolean;
  timestamp?: string;
  date?: string;
  created_at?: string;
  updated_at?: string;
  last_message_at?: string;
  attendees?: UnipileChatAttendee[];
  participants?: UnipileChatAttendee[];
  users?: UnipileChatAttendee[];
  last_message?: UnipileMessage | string;
};

type LinkedInSearchCategory = "people" | "posts";
type RecordLike = Record<string, unknown>;

function getConfig() {
  const apiKey = process.env.UNIPILE_API_KEY;
  const rawBaseUrl = process.env.UNIPILE_DSN || process.env.UNIPILE_BASE_URL;

  if (!apiKey || !rawBaseUrl) return null;

  const baseUrl = /^https?:\/\//i.test(rawBaseUrl)
    ? rawBaseUrl
    : `https://${rawBaseUrl}`;

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ""),
  };
}

function withQuery(path: string, params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    query.set(key, String(value));
  }

  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

async function request<T>(path: string, init?: RequestInit) {
  const config = getConfig();
  if (!config) {
    throw new Error("Unipile is not configured.");
  }
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UNIPILE_TIMEOUT_MS);

  try {
    await throttleUnipileRequest();
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      signal: init?.signal || controller.signal,
      headers: {
        "x-api-key": config.apiKey,
        ...(isFormData ? {} : { "content-type": "application/json" }),
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new UnipileResponseError(
        response.status,
        `Unipile request failed: ${response.status}${body ? ` ${body}` : ""}`,
        body,
      );
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function asRecord(value: unknown): RecordLike | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;
}

function getListItems<T>(result: UnipileListResponse<T> | T[]): T[];
function getListItems<T>(result: unknown): T[];
function getListItems<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];

  const record = asRecord(result);
  if (!record) return [];

  for (const key of ["items", "results", "data"]) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];

    const nested = asRecord(value);
    if (nested) {
      const nestedItems = getListItems<T>(nested);
      if (nestedItems.length) return nestedItems;
    }
  }

  return [];
}

function getListCursor(result: unknown): string | undefined {
  const record = asRecord(result);
  if (!record) return undefined;
  if (typeof record.cursor === "string" && record.cursor) return record.cursor;
  const paging = asRecord(record.paging);
  if (typeof paging?.cursor === "string" && paging.cursor) return paging.cursor;
  return getListCursor(record.data);
}

function cleanString(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.replace(/\s+/g, " ").trim();
    return trimmed || undefined;
  }

  if (typeof value === "number") return String(value);
  return undefined;
}

function pickString(record: RecordLike | null | undefined, keys: string[]) {
  if (!record) return undefined;

  for (const key of keys) {
    const value = cleanString(record[key]);
    if (value) return value;
  }

  return undefined;
}

function pickNestedString(
  record: RecordLike | null | undefined,
  parentKeys: string[],
  childKeys: string[],
) {
  if (!record) return undefined;

  for (const parentKey of parentKeys) {
    const nested = asRecord(record[parentKey]);
    const value = pickString(nested, childKeys);
    if (value) return value;
  }

  return undefined;
}

function actorFromEngagement(item: UnipileComment | UnipileReaction) {
  return item.author || item.user || item.from || item.profile || null;
}

function profileAvatarUrl(profile: UnipileProfile) {
  const record = asRecord(profile);

  return (
    profile.profile_picture_url ||
    profile.profile_image_url ||
    profile.picture_url ||
    profile.avatar_url ||
    pickString(record, [
      "profilePictureUrl",
      "profile_picture_url_large",
      "profilePictureUrlLarge",
      "profileImageUrl",
      "pictureUrl",
      "avatarUrl",
      "image_url",
      "imageUrl",
      "picture",
      "avatar",
      "profile_picture",
      "image",
    ]) ||
    pickNestedString(
      record,
      [
        "picture",
        "avatar",
        "profile_picture",
        "image",
        "profile",
        "user",
        "linkedin",
        "linkedin_specific",
        "provider_data",
      ],
      [
        "url",
        "large",
        "profile_picture_url_large",
        "profilePictureUrlLarge",
        "profile_picture_url",
        "profilePictureUrl",
        "profile_image_url",
        "profileImageUrl",
        "picture_url",
        "pictureUrl",
        "avatar_url",
        "avatarUrl",
        "image_url",
        "imageUrl",
      ],
    )
  );
}

function profileLocation(profile: UnipileProfile) {
  return (
    profile.location ||
    profile.location_name ||
    profile.locationName ||
    profile.geo_location ||
    profile.geoLocation ||
    [profile.city, profile.country].filter(Boolean).join(", ")
  );
}

function normalizeUnipileProfile(profile: UnipileProfile) {
  const name =
    profile.name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "LinkedIn profile";

  return {
    providerProfileId: profile.provider_id || profile.id || profile.public_identifier,
    linkedInUrl:
      profile.profile_url ||
      profile.linkedin_url ||
      (profile.public_identifier ? `https://www.linkedin.com/in/${profile.public_identifier}` : ""),
    avatarUrl: profileAvatarUrl(profile),
    name,
    title: profile.headline || profile.occupation || "",
    company: profile.company || "",
    location: profileLocation(profile) || "",
    summary: profile.summary || "",
  } satisfies Partial<Lead>;
}

function attendeeName(attendee: UnipileChatAttendee | null | undefined) {
  const record = asRecord(attendee);
  const direct =
    pickString(record, [
      "name",
      "display_name",
      "displayName",
      "full_name",
      "fullName",
      "username",
      "public_identifier",
      "publicIdentifier",
      "provider_id",
      "member_id",
    ]) ||
    [attendee?.first_name || attendee?.firstName, attendee?.last_name || attendee?.lastName]
      .filter(Boolean)
      .join(" ") ||
    pickNestedString(
      record,
      ["profile", "user", "linkedin", "linkedin_specific", "provider_data"],
      [
        "name",
        "display_name",
        "displayName",
        "full_name",
        "fullName",
        "username",
        "public_identifier",
        "publicIdentifier",
      ],
    );

  return (
    direct ||
    ""
  );
}

function attendeeHeadline(attendee: UnipileChatAttendee | null | undefined) {
  const record = asRecord(attendee);
  const direct = pickString(record, [
    "headline",
    "occupation",
    "title",
    "job_title",
    "jobTitle",
    "position",
  ]);
  const nested = pickNestedString(
    record,
    ["profile", "user", "linkedin", "linkedin_specific", "provider_data"],
    ["headline", "occupation", "title", "job_title", "jobTitle", "position"],
  );
  const company = pickString(record, ["company"]) || pickNestedString(
    record,
    ["profile", "user", "linkedin", "linkedin_specific", "provider_data"],
    ["company"],
  );

  return direct || nested || company || "";
}

function chatTitle(chat: UnipileChat, extraAttendees: UnipileChatAttendee[] = []) {
  const attendees = chatAttendees(chat, extraAttendees);
  const otherNames = attendees
    .filter((attendee) => !isSelfAttendee(attendee))
    .map(attendeeName)
    .filter(Boolean);

  return chat.name || chat.title || chat.subject || otherNames.join(", ") || "LinkedIn chat";
}

function chatAttendees(chat: UnipileChat, extraAttendees: UnipileChatAttendee[] = []) {
  return [
    ...(chat.attendees || []),
    ...(chat.participants || []),
    ...(chat.users || []),
    ...extraAttendees,
  ];
}

function isSelfAttendee(attendee: UnipileChatAttendee) {
  return Boolean(attendee.is_self || attendee.is_current_user || attendee.is_me || attendee.self);
}

function primaryChatAttendee(
  chat: UnipileChat,
  extraAttendees: UnipileChatAttendee[] = [],
  inboundSenderName?: string,
) {
  const attendees = chatAttendees(chat, extraAttendees);
  if (!attendees.length) return null;

  if (inboundSenderName) {
    const normalizedInboundName = inboundSenderName.trim().toLowerCase();
    const matchingSender = attendees.find(
      (attendee) => attendeeName(attendee).trim().toLowerCase() === normalizedInboundName,
    );
    if (matchingSender) return matchingSender;
  }

  return attendees.find((attendee) => !isSelfAttendee(attendee)) || attendees[0] || null;
}

function attendeeProfileUrl(attendee: UnipileChatAttendee | null) {
  const record = asRecord(attendee);
  if (!record) return undefined;

  return (
    pickString(record, ["profile_url", "public_profile_url", "linkedin_url"]) ||
    pickString(record, ["profileUrl", "publicProfileUrl", "linkedinUrl"]) ||
    pickNestedString(
      record,
      ["profile", "user", "linkedin", "linkedin_specific", "provider_data"],
      [
        "profile_url",
        "profileUrl",
        "public_profile_url",
        "publicProfileUrl",
        "linkedin_url",
        "linkedinUrl",
      ],
    ) ||
    (pickString(record, ["public_identifier", "publicIdentifier", "username"])
      ? `https://www.linkedin.com/in/${pickString(record, ["public_identifier", "publicIdentifier", "username"])}`
      : undefined)
  );
}

function attendeeAvatarUrl(attendee: UnipileChatAttendee | null) {
  const record = asRecord(attendee);
  if (!record) return undefined;

  return (
    pickString(record, [
      "profile_picture_url_large",
      "profilePictureUrlLarge",
      "profile_picture_url",
      "profilePictureUrl",
      "profile_image_url",
      "profileImageUrl",
      "picture_url",
      "pictureUrl",
      "avatar_url",
      "avatarUrl",
      "image_url",
      "imageUrl",
      "picture",
      "avatar",
      "profile_picture",
      "image",
    ]) ||
    pickNestedString(
      record,
      [
        "picture",
        "avatar",
        "profile_picture",
        "image",
        "profile",
        "user",
        "linkedin",
        "linkedin_specific",
        "provider_data",
      ],
      [
        "url",
        "large",
        "profile_picture_url_large",
        "profilePictureUrlLarge",
        "profile_picture_url",
        "profilePictureUrl",
        "profile_image_url",
        "profileImageUrl",
        "picture_url",
        "pictureUrl",
        "avatar_url",
        "avatarUrl",
        "image_url",
        "imageUrl",
      ],
    )
  );
}

function attendeeProviderIdentifier(attendee: UnipileChatAttendee | null) {
  const record = asRecord(attendee);
  return pickString(record, [
    "provider_id",
    "providerId",
    "member_id",
    "memberId",
    "urn",
    "public_identifier",
    "publicIdentifier",
    "id",
  ]);
}

function chatAttendeeProviderIdentifier(chat: UnipileChat) {
  return chat.attendee_provider_id || attendeeProviderIdentifier(primaryChatAttendee(chat));
}

function messageSenderAttendee(message: UnipileMessage) {
  if (message.is_sender) return null;
  if (message.sender) return message.sender;
  if (message.from) return message.from;
  if (!message.sender_name) return null;

  return {
    id: message.sender_id || message.attendee_id,
    name: message.sender_name,
  } satisfies UnipileChatAttendee;
}

function mergeProfileIntoAttendee(
  attendee: UnipileChatAttendee | null,
  profile: Partial<Lead> | null,
) {
  if (!profile) return attendee;

  return {
    ...(attendee || {}),
    name: attendeeName(attendee) || profile.name,
    headline: attendeeHeadline(attendee) || profile.title,
    profile_url: attendeeProfileUrl(attendee) || profile.linkedInUrl,
    profile_picture_url: attendeeAvatarUrl(attendee) || profile.avatarUrl,
  } satisfies UnipileChatAttendee;
}

function messageBody(message: UnipileMessage | string | undefined) {
  if (!message) return "";
  if (typeof message === "string") return message;
  return message.text || message.body || message.message || message.content || "";
}

function messageTimestamp(message: UnipileMessage) {
  return (
    message.timestamp ||
    message.date ||
    message.sent_at ||
    message.created_at ||
    new Date().toISOString()
  );
}

function normalizeChatMessage(message: UnipileMessage, chatId: string): LinkedInInboxMessage {
  const outbound = Boolean(message.is_sender);
  const senderName =
    message.sender_name ||
    attendeeName(message.sender) ||
    attendeeName(message.from) ||
    "LinkedIn";

  return {
    id: message.id || `${chatId}-${messageTimestamp(message)}`,
    chatId,
    direction: outbound ? "outbound" : "inbound",
    senderName: outbound ? "You" : senderName,
    body: messageBody(message),
    createdAt: messageTimestamp(message),
  };
}

async function searchLinkedIn<T>(input: {
  accountId: string;
  category: LinkedInSearchCategory;
  keywords?: string;
  url?: string;
  limit: number;
  locationIds?: string[];
  // Items rejected by `take` are fetched but neither returned nor counted, so
  // the search pages past them toward `limit` accepted items. This is how a
  // repeat of yesterday's query digs below the first page instead of returning
  // the same already-known people again.
  take?: (item: T) => boolean;
  // Bounds how deep a mostly-rejected result set can page; never binds for
  // callers without `take` (their limits fit in the first pages anyway).
  maxPages?: number;
}) {
  if (!isUnipileConfigured()) return [];

  const maxPages = input.maxPages ?? 8;
  const items: T[] = [];
  let cursor: string | undefined;

  // Unipile reads limit from the query string and pages with a cursor; a
  // single un-paginated request only ever returns the first page.
  for (let page = 0; page < maxPages && items.length < input.limit; page += 1) {
    const result = await request<UnipileListResponse<T>>(
      withQuery("/api/v1/linkedin/search", {
        account_id: input.accountId,
        // With a take filter most of a page may be rejected, so always request
        // full pages; without one, only fetch what is still missing.
        limit: input.take ? 50 : Math.min(input.limit - items.length, 50),
      }),
      {
        method: "POST",
        body: JSON.stringify({
          api: "classic",
          category: input.category,
          type: input.category,
          keywords: input.keywords,
          url: input.url,
          ...(input.locationIds?.length ? { location: input.locationIds } : {}),
          cursor,
        }),
      },
    );

    const pageItems = getListItems<T>(result);
    if (!pageItems.length) break;
    items.push(...(input.take ? pageItems.filter(input.take) : pageItems));

    const nextCursor = result.cursor || result.paging?.cursor;
    if (!nextCursor) break;
    cursor = nextCursor;
  }

  return items.slice(0, input.limit);
}

export function isUnipileConfigured() {
  return Boolean(getConfig());
}

export async function listUnipileLinkedInAccounts() {
  requireUnipileConfigured();

  const result = await request<UnipileListResponse<UnipileAccount>>("/api/v1/accounts?limit=250");
  return getListItems<UnipileAccount>(result)
    .filter((account) => {
      const provider = String(account.type || account.account_type || account.provider || "").toUpperCase();
      return Boolean(account.id) && provider === "LINKEDIN";
    })
    .map((account) => ({
      id: account.id || "",
      name: account.name || account.display_name || "LinkedIn",
      status: account.status,
      createdAt: (account as UnipileAccount & { created_at?: string }).created_at,
    }));
}

// Fetches the connected account owner's basic LinkedIn identity. Unlike a
// prospect profile view, `me` is the authenticated user's own profile and no
// optional profile sections are requested.
export async function retrieveOwnLinkedInProfile(accountId: string) {
  if (!isUnipileConfigured()) return null;

  const profile = await request<UnipileProfile>(
    withQuery("/api/v1/users/me", { account_id: accountId }),
  );
  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.name?.trim();

  if (!displayName && !profileAvatarUrl(profile)) return null;
  return {
    displayName,
    avatarUrl: profileAvatarUrl(profile),
  };
}

function requireUnipileConfigured() {
  if (!isUnipileConfigured()) {
    throw new Error("Unipile is not configured.");
  }
}

function limitText(value: string | undefined, maxLength: number) {
  const text = String(value || "").trim();
  return text.length > maxLength ? text.slice(0, maxLength).trim() : text;
}

function linkedInIdentifier(value: string) {
  if (!value.includes("/")) return value;

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const parts = url.pathname.split("/").filter(Boolean);
    const profileIndex = parts.findIndex((part) => part === "in" || part === "pub");
    return profileIndex >= 0 ? parts[profileIndex + 1] || value : parts.at(-1) || value;
  } catch {
    return value.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop() || value;
  }
}

export async function createLinkedInAuthLink(input: {
  callbackToken: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  notifyUrl: string;
}) {
  const config = getConfig();
  if (!config) throw new Error("Unipile is not configured.");
  const expiresOn = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const data = await request<{ url?: string }>("/api/v1/hosted/accounts/link", {
    method: "POST",
    body: JSON.stringify({
      type: "create",
      providers: ["LINKEDIN"],
      api_url: config.baseUrl,
      expiresOn,
      name: input.callbackToken,
      success_redirect_url: input.successRedirectUrl,
      failure_redirect_url: input.failureRedirectUrl,
      notify_url: input.notifyUrl,
    }),
  });

  if (!data.url) throw new Error("No auth URL returned.");
  return data.url;
}

// Idempotently registers the message/relation webhooks that drive reply
// detection and acceptance events. Historically this was dashboard-only
// configuration: if it was missing or wrong, replies (and interest emails)
// silently never fired. Re-asserted periodically from the automation tick so
// the server guarantees its own event source.
export async function ensureUnipileWebhooks(input: {
  requestUrl: string;
  secretHeaderValue: string;
}) {
  if (!isUnipileConfigured()) return { skipped: true as const };

  const result = await request<
    UnipileListResponse<{ id?: string; source?: string; request_url?: string }>
  >("/api/v1/webhooks");
  const existing = getListItems<{ id?: string; source?: string; request_url?: string }>(result);

  // "messaging" delivers new_message (replies); "users" delivers new_relation
  // (invite accepted). Both point at the same handler route.
  const created: string[] = [];
  for (const source of ["messaging", "users"]) {
    const alreadyRegistered = existing.some(
      (webhook) => webhook.source === source && webhook.request_url === input.requestUrl,
    );
    if (alreadyRegistered) continue;

    await request<{ id?: string }>("/api/v1/webhooks", {
      method: "POST",
      body: JSON.stringify({
        source,
        request_url: input.requestUrl,
        name: `omentir-${source}`,
        headers: [{ key: "x-omentir-webhook-secret", value: input.secretHeaderValue }],
      }),
    });
    created.push(source);
  }

  return { skipped: false as const, created };
}

export async function deleteLinkedInAccount(accountId: string) {
  if (!accountId) throw new Error("Unipile account id is required.");

  try {
    await request<void>(`/api/v1/accounts/${encodeURIComponent(accountId)}`, {
      method: "DELETE",
    });
  } catch (error) {
    // 404 means the account is already gone on Unipile's side.
    if (error instanceof UnipileResponseError && error.status === 404) return;
    throw error;
  }
}

// LinkedIn's location parameter takes geo ids, not names. Resolve each target
// name via Unipile's parameter search; ids are LinkedIn-global, so cache by
// name across accounts. Failed lookups are not cached so a transient error
// doesn't permanently disable location targeting for that name.
const locationIdCache = new Map<string, string | null>();

async function resolveLinkedInLocationIds(accountId: string, locations: string[]) {
  const ids = new Set<string>();

  for (const location of locations) {
    const key = location.trim().toLowerCase();
    if (!key) continue;

    if (!locationIdCache.has(key)) {
      try {
        const result = await request<UnipileListResponse<{ id?: string; title?: string }>>(
          withQuery("/api/v1/linkedin/search/parameters", {
            account_id: accountId,
            type: "LOCATION",
            keywords: location,
            limit: 5,
          }),
        );
        const items = getListItems<{ id?: string; title?: string }>(result);
        // Prefer the exact-title match ("Australia" over "New South Wales,
        // Australia"), falling back to LinkedIn's top suggestion.
        const exact = items.find((item) => (item.title || "").trim().toLowerCase() === key);
        locationIdCache.set(key, (exact || items[0])?.id || null);
      } catch (error) {
        console.error(`[unipile] failed to resolve location "${location}":`, error);
        continue;
      }
    }

    const id = locationIdCache.get(key);
    if (id) ids.add(id);
  }

  return Array.from(ids);
}

// Identity keys for matching a search result against already-saved leads:
// the lowercase provider id plus the lowercase public identifier from the
// profile URL, so a match on either field identifies the same person even
// when the two records carry different URL formats.
export function profileSearchKeys(
  profile: Pick<Partial<Lead>, "providerProfileId" | "linkedInUrl">,
) {
  const keys: string[] = [];
  if (profile.providerProfileId) keys.push(profile.providerProfileId.toLowerCase());
  if (profile.linkedInUrl) keys.push(linkedInIdentifier(profile.linkedInUrl).toLowerCase());
  return keys;
}

export async function searchLinkedInProfiles(input: {
  accountId: string;
  criteria: {
    titles: string[];
    industries: string[];
    locations: string[];
    keywords: string[];
  };
  limit: number;
  agent: Agent;
  // profileSearchKeys of leads the caller already has. The search skips these
  // and pages deeper until it accumulates `limit` genuinely new profiles -
  // without this, a mature agent re-reads the same first page of the same
  // query every day and discovers nobody.
  excludeKeys?: Set<string>;
}) {
  // One search per title/keyword. Joining every criterion into a single
  // keyword string produces an AND query that matches almost nobody.
  const queries = [...input.criteria.titles, ...input.criteria.keywords]
    .map((value) => value.trim())
    .filter(Boolean);

  if (!queries.length) {
    queries.push(
      [...input.criteria.industries, ...input.criteria.locations]
        .filter(Boolean)
        .join(" "),
    );
  }

  // Constrain the search itself to the target locations. LinkedIn ignores
  // keywords like "Australia" and returns network-biased (local) results;
  // only the location parameter actually scopes results to the country.
  const locationIds = await resolveLinkedInLocationIds(
    input.accountId,
    searchableLocationNames(input.criteria.locations),
  );

  const profiles = new Map<string, ReturnType<typeof normalizeUnipileProfile>>();
  const perQueryLimit = Math.max(Math.ceil(input.limit / queries.length), 10);
  const excluded = input.excludeKeys;
  const takeFresh =
    excluded?.size
      ? (item: UnipileProfile) =>
          !profileSearchKeys(normalizeUnipileProfile(item)).some((key) => excluded.has(key))
      : undefined;

  for (const keywords of queries) {
    if (profiles.size >= input.limit) break;
    if (!keywords) continue;

    const items = await searchLinkedIn<UnipileProfile>({
      accountId: input.accountId,
      category: "people",
      keywords,
      limit: perQueryLimit,
      locationIds,
      take: takeFresh,
      // Up to 250 scanned results per query when known profiles clog the top.
      maxPages: takeFresh ? 5 : undefined,
    });

    for (const item of items) {
      const profile = normalizeUnipileProfile(item);
      const key = profile.providerProfileId || profile.linkedInUrl || profile.name;
      if (!key || profiles.has(key)) continue;
      profiles.set(key, profile);
      if (profiles.size >= input.limit) break;
    }
  }

  return Array.from(profiles.values());
}

export async function searchLinkedInProfilesByUrl(input: {
  accountId: string;
  url: string;
  limit: number;
}) {
  const items = await searchLinkedIn<UnipileProfile>({
    accountId: input.accountId,
    category: "people",
    url: input.url,
    limit: input.limit,
  });

  return items.map(normalizeUnipileProfile);
}

export async function searchLinkedInPosts(input: {
  accountId: string;
  keywords: string;
  limit: number;
}) {
  return searchLinkedIn<UnipilePost>({
    accountId: input.accountId,
    category: "posts",
    keywords: input.keywords,
    limit: input.limit,
  });
}

export async function listLinkedInPostsForProfile(input: {
  accountId: string;
  identifier: string;
  isCompany?: boolean;
  limit: number;
}) {
  if (!isUnipileConfigured()) return [];

  const result = await request<UnipileListResponse<UnipilePost>>(
    withQuery(`/api/v1/users/${encodeURIComponent(input.identifier)}/posts`, {
      account_id: input.accountId,
      is_company: input.isCompany,
      limit: input.limit,
    }),
  );

  return getListItems(result).slice(0, input.limit);
}

export async function retrieveLinkedInPost(input: {
  accountId: string;
  postId: string;
}) {
  if (!isUnipileConfigured()) return null;

  return request<UnipilePost>(
    withQuery(`/api/v1/posts/${encodeURIComponent(input.postId)}`, {
      account_id: input.accountId,
    }),
  );
}

export async function listLinkedInPostComments(input: {
  accountId: string;
  postId: string;
  limit: number;
}) {
  if (!isUnipileConfigured()) return [];

  const result = await request<UnipileListResponse<UnipileComment>>(
    withQuery(`/api/v1/posts/${encodeURIComponent(input.postId)}/comments`, {
      account_id: input.accountId,
      limit: input.limit,
    }),
  );

  return getListItems(result).slice(0, input.limit).map((comment) => ({
    id: comment.id,
    text: comment.text || comment.message || comment.body || "",
    url: comment.url,
    createdAt: comment.created_at || comment.posted_at,
    profile: actorFromEngagement(comment),
  }));
}

export async function listLinkedInPostReactions(input: {
  accountId: string;
  postId: string;
  limit: number;
}) {
  if (!isUnipileConfigured()) return [];

  const result = await request<UnipileListResponse<UnipileReaction>>(
    withQuery(`/api/v1/posts/${encodeURIComponent(input.postId)}/reactions`, {
      account_id: input.accountId,
      limit: input.limit,
    }),
  );

  return getListItems(result).slice(0, input.limit).map((reaction) => ({
    id: reaction.id,
    type: reaction.reaction_type || reaction.type || "reaction",
    url: reaction.url,
    createdAt: reaction.created_at,
    profile: actorFromEngagement(reaction),
  }));
}

// Returns true/false when Unipile reports a network distance, null when the
// profile can't be fetched or the field is missing.
export async function isFirstDegreeConnection(input: {
  accountId: string;
  identifier: string;
}) {
  if (!isUnipileConfigured()) return null;

  // Accepts a provider id or public identifier; reduce a profile URL to its
  // last path segment so callers can pass linkedInUrl as a fallback.
  const identifier = linkedInIdentifier(input.identifier);

  // Over budget reads as "unknown" - callers already defer and retry later.
  if (!(await takeProfileViewBudget(input.accountId))) return null;
  await waitForProfileViewSlot();

  try {
    const profile = await request<UnipileProfile & { network_distance?: string }>(
      withQuery(`/api/v1/users/${encodeURIComponent(identifier)}`, {
        account_id: input.accountId,
      }),
    );
    const distance = (profile.network_distance || "").toUpperCase();
    if (!distance) return null;
    return distance === "FIRST_DEGREE" || distance === "DISTANCE_1" || distance === "FIRST";
  } catch {
    return null;
  }
}

export async function retrieveLinkedInProfile(input: {
  accountId: string;
  identifier: string;
}) {
  if (!isUnipileConfigured()) return null;

  // Enrichment callers all tolerate null and keep their base data.
  if (!(await takeProfileViewBudget(input.accountId))) return null;
  await waitForProfileViewSlot();

  const profile = await request<UnipileProfile>(
    withQuery(`/api/v1/users/${encodeURIComponent(input.identifier)}`, {
      account_id: input.accountId,
      linkedin_sections: "*",
    }),
  );

  return normalizeUnipileProfile(profile);
}

async function fetchLinkedInChatMessages(input: {
  chatId: string;
  limit?: number;
}) {
  if (!isUnipileConfigured()) return [];

  const result = await request<UnipileListResponse<UnipileMessage> | UnipileMessage[]>(
    withQuery(`/api/v1/chats/${encodeURIComponent(input.chatId)}/messages`, {
      limit: input.limit || 50,
    }),
  );

  return getListItems<UnipileMessage>(result);
}

export async function listLinkedInChatMessages(input: {
  chatId: string;
  limit?: number;
}) {
  const messages = await fetchLinkedInChatMessages(input);

  return messages
    .map((message) => normalizeChatMessage(message, input.chatId))
    .filter((message) => message.body)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function listLinkedInChatMessagesPage(input: {
  chatId: string;
  limit?: number;
  cursor?: string;
}) {
  if (!isUnipileConfigured()) return { messages: [], cursor: undefined };

  const result = await request<UnipileListResponse<UnipileMessage> | UnipileMessage[]>(
    withQuery(`/api/v1/chats/${encodeURIComponent(input.chatId)}/messages`, {
      limit: input.limit || 30,
      cursor: input.cursor,
    }),
  );
  const messages = getListItems<UnipileMessage>(result)
    .map((message) => normalizeChatMessage(message, input.chatId))
    .filter((message) => message.body)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return { messages, cursor: getListCursor(result) };
}

export async function listLinkedInChatAttendees(input: {
  chatId: string;
}) {
  if (!isUnipileConfigured()) return [];

  try {
    const result = await request<
      UnipileListResponse<UnipileChatAttendee> | UnipileChatAttendee[]
    >(`/api/v1/chats/${encodeURIComponent(input.chatId)}/attendees`);

    return getListItems<UnipileChatAttendee>(result);
  } catch {
    return [];
  }
}

async function enrichChatAttendee(input: {
  accountId: string;
  attendee: UnipileChatAttendee | null;
  providerIdentifier?: string;
}) {
  const identifier = input.providerIdentifier || attendeeProviderIdentifier(input.attendee);
  if (!identifier) return input.attendee;

  try {
    const profile = await retrieveLinkedInProfile({
      accountId: input.accountId,
      identifier,
    });

    return mergeProfileIntoAttendee(input.attendee, profile);
  } catch {
    return input.attendee;
  }
}

export async function listLinkedInAccountAttendees(accountId: string) {
  if (!isUnipileConfigured()) return [] as UnipileChatAttendee[];

  try {
    const result = await request<
      UnipileListResponse<UnipileChatAttendee> | UnipileChatAttendee[]
    >(withQuery("/api/v1/chat_attendees", { account_id: accountId, limit: 200 }));
    return getListItems<UnipileChatAttendee>(result);
  } catch {
    return [];
  }
}

// Recent messages across all of the account's chats, in one call. Used to build
// last-message previews for the inbox list without a request per chat.
async function listLinkedInAccountMessages(accountId: string, limit: number) {
  if (!isUnipileConfigured()) return [] as UnipileMessage[];

  try {
    const result = await request<UnipileListResponse<UnipileMessage> | UnipileMessage[]>(
      withQuery("/api/v1/messages", { account_id: accountId, limit }),
    );
    return getListItems<UnipileMessage>(result);
  } catch {
    return [];
  }
}

// Inbound messages that arrived after `sinceMs`, newest-provider-order, for
// the reply-sync fallback: when the messaging webhook is missed or down, this
// is how a prospect's reply still reaches the automation. Costs one cheap
// /messages listing - no profile views.
export async function listRecentInboundMessages(input: {
  accountId: string;
  sinceMs: number;
  limit?: number;
}) {
  const messages = await listLinkedInAccountMessages(input.accountId, input.limit || 100);

  return messages
    .filter((message) => !message.is_sender)
    .map((message) => ({
      id: message.id,
      chatId: message.chat_id,
      senderProviderId: message.sender_id || message.attendee_id || "",
      senderName:
        message.sender_name ||
        attendeeName(message.sender) ||
        attendeeName(message.from) ||
        "",
      body: messageBody(message),
      createdAt: messageTimestamp(message),
    }))
    .filter((message) => message.body && Date.parse(message.createdAt) > input.sinceMs);
}

export async function listLinkedInInbox(input: {
  accountId: string;
  limit?: number;
  messageLimit?: number;
  includeMessageHistory?: boolean;
}) {
  if (!isUnipileConfigured()) return [];

  const includeMessageHistory = input.includeMessageHistory ?? true;

  // In the lightweight (list) path, resolve every chat's attendee from ONE bulk
  // attendees call - fetched in parallel with the chats list - instead of one
  // request per chat. The chats-list endpoint itself carries no names/avatars.
  const chatLimit = input.limit || 25;
  const [result, bulkAttendees, bulkMessages] = await Promise.all([
    request<UnipileListResponse<UnipileChat>>(
      withQuery("/api/v1/chats", {
        account_id: input.accountId,
        account_type: "LINKEDIN",
        limit: chatLimit,
      }),
    ),
    includeMessageHistory
      ? Promise.resolve([] as UnipileChatAttendee[])
      : listLinkedInAccountAttendees(input.accountId),
    includeMessageHistory
      ? Promise.resolve([] as UnipileMessage[])
      : listLinkedInAccountMessages(input.accountId, Math.min(chatLimit * 6, 250)),
  ]);
  const chats = getListItems(result).filter((chat) => chat.id);
  const attendeeByProviderId = new Map<string, UnipileChatAttendee>();
  for (const attendee of bulkAttendees) {
    if (attendee.provider_id) attendeeByProviderId.set(attendee.provider_id, attendee);
  }
  // Most recent message per chat, for the inbox list preview.
  const lastMessageByChat = new Map<string, UnipileMessage>();
  for (const message of bulkMessages) {
    const cid = message.chat_id;
    if (!cid) continue;
    const existing = lastMessageByChat.get(cid);
    if (
      !existing ||
      new Date(messageTimestamp(message)).getTime() >
        new Date(messageTimestamp(existing)).getTime()
    ) {
      lastMessageByChat.set(cid, message);
    }
  }
  // Each enrichment is a live profile view on the user's LinkedIn account, so
  // only look up chats that carry no usable name, and only a few per load -
  // never one view per chat per page visit.
  const enrichmentBudget = { left: INBOX_ENRICHMENT_LIMIT };

  return Promise.all(
    chats.map(async (chat): Promise<LinkedInInboxThread> => {
      const chatId = chat.id || "";
      if (!includeMessageHistory) {
        // Resolve this chat's attendee from the bulk attendees map (matched by
        // provider id) so the inbox row gets a real name and avatar without a
        // per-chat request or a rate-limited profile view.
        const matched = chat.attendee_provider_id
          ? attendeeByProviderId.get(chat.attendee_provider_id)
          : undefined;
        const detailedAttendees = matched ? [matched] : [];
        const fallbackTitle = chatTitle(chat, detailedAttendees);
        const baseAttendee = primaryChatAttendee(chat, detailedAttendees);
        let profileName = attendeeName(baseAttendee) || fallbackTitle;
        // Preview = the chat's most recent message from the bulk messages map.
        const lastMessage = lastMessageByChat.get(chatId);
        const lastMessageAt = lastMessage
          ? messageTimestamp(lastMessage)
          : chat.last_message_at ||
            chat.updated_at ||
            chat.timestamp ||
            chat.date ||
            chat.created_at ||
            new Date().toISOString();
        const messages = lastMessage ? [normalizeChatMessage(lastMessage, chatId)] : [];

        if (profileName === "LinkedIn" && fallbackTitle !== "LinkedIn chat") {
          profileName = fallbackTitle;
        }

        return {
          id: chatId,
          providerChatId: chat.provider_id || chatId,
          accountId: chat.account_id || input.accountId,
          title: fallbackTitle,
          profileName,
          profileHeadline: attendeeHeadline(baseAttendee),
          profileUrl: attendeeProfileUrl(baseAttendee),
          avatarUrl: attendeeAvatarUrl(baseAttendee),
          unread: Boolean(chat.unread || Number(chat.unread_count || 0) > 0 || chat.read === false),
          updatedAt: lastMessageAt,
          messages,
        };
      }

      const [rawMessages, detailedAttendees] = await Promise.all([
        fetchLinkedInChatMessages({
          chatId,
          limit: input.messageLimit || 50,
        }).catch(() => []),
        listLinkedInChatAttendees({ chatId }),
      ]);
      let messages = rawMessages
        .map((message) => normalizeChatMessage(message, chatId))
        .filter((message) => message.body)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const messageAttendees = rawMessages
        .map(messageSenderAttendee)
        .filter((attendee): attendee is UnipileChatAttendee => Boolean(attendee));
      const inboundSenderName = messages.find((message) => message.direction === "inbound")
        ?.senderName;
      const baseAttendee = primaryChatAttendee(
        chat,
        [...detailedAttendees, ...messageAttendees],
        inboundSenderName,
      );
      const needsEnrichment = !attendeeName(baseAttendee) && !inboundSenderName;
      let primaryAttendee = baseAttendee;
      if (needsEnrichment && enrichmentBudget.left > 0) {
        enrichmentBudget.left -= 1;
        primaryAttendee = await enrichChatAttendee({
          accountId: input.accountId,
          attendee: baseAttendee,
          providerIdentifier: chatAttendeeProviderIdentifier(chat),
        });
      }
      const fallbackTitle = chatTitle(chat, [...detailedAttendees, ...messageAttendees]);
      let profileName = attendeeName(primaryAttendee) || inboundSenderName || fallbackTitle;
      const profileHeadline = attendeeHeadline(primaryAttendee);
      const profileUrl = attendeeProfileUrl(primaryAttendee);
      const avatarUrl = attendeeAvatarUrl(primaryAttendee);
      const lastMessage = chat.last_message;

      if (profileName === "LinkedIn" && fallbackTitle !== "LinkedIn chat") {
        profileName = fallbackTitle;
      }

      if (!messages.length && lastMessage) {
        messages = [
          typeof lastMessage === "string"
            ? {
                id: `${chatId}-last`,
                chatId,
                direction: "inbound",
                senderName: profileName,
                body: lastMessage,
                createdAt:
                  chat.last_message_at ||
                  chat.updated_at ||
                  chat.timestamp ||
                  chat.date ||
                  chat.created_at ||
                  new Date().toISOString(),
              }
            : normalizeChatMessage(lastMessage, chatId),
        ];
      }

      return {
        id: chatId,
        providerChatId: chat.provider_id || chatId,
        accountId: chat.account_id || input.accountId,
        title: fallbackTitle,
        profileName,
        profileHeadline,
        profileUrl,
        avatarUrl,
        unread: Boolean(chat.unread || Number(chat.unread_count || 0) > 0 || chat.read === false),
        updatedAt:
          chat.last_message_at ||
          chat.updated_at ||
          chat.timestamp ||
          chat.date ||
          chat.created_at ||
          messages.at(-1)?.createdAt ||
          new Date().toISOString(),
        messages,
      };
    }),
  );
}

export function normalizeLinkedInActor(profile: UnipileProfile | null | undefined) {
  if (!profile) return null;
  const lead = normalizeUnipileProfile(profile);
  if (!lead.linkedInUrl && !lead.providerProfileId) return null;
  return lead;
}

export function getLinkedInPostId(post: UnipilePost) {
  return post.social_id || post.id || post.object_urn || "";
}

export function getLinkedInPostText(post: UnipilePost) {
  return post.text || post.content || post.commentary || "";
}

export function getLinkedInPostUrl(post: UnipilePost) {
  return post.url || post.share_url || "";
}

export function getLinkedInPostCreatedAt(post: UnipilePost) {
  return post.created_at || post.posted_at || post.date || new Date().toISOString();
}

// LinkedIn member provider ids start with ACo (Classic), ACw (Sales Navigator),
// or AE (Recruiter). Public vanity slugs
// (e.g. "pavanbabar") are not valid provider_id values for /users/invite and
// produce errors/invalid_parameters ("User ID does not match provider's expected format").
function looksLikeLinkedInProviderId(id: string | undefined): id is string {
  if (!id) return false;
  return /^(?:ACo|ACw|AE)/i.test(id) || /^urn:li:person:/i.test(id);
}

// Unipile reports errors/cannot_resend_yet with one generic detail whether the
// recipient already has a pending/withdrawn invite or the account hit its
// weekly cap. The account's sent-invitations list is ground truth for the
// pending-recipient case. Returns true/false, or null when it can't be
// determined (not configured, missing id, list too long, request failure).
// Every provider id and public identifier in the account's sent-invitations
// list, lowercased. One paginated listing costs a few API requests and zero
// profile views, so the acceptance sweep can compare hundreds of pending
// enrollments against it in a single pass. Returns null when the list could
// not be fetched completely (provider error, or more pages than the cap) -
// callers must treat that as "unknown", never as "nothing pending".
export async function listSentInvitationProviderIds(accountId: string) {
  if (!isUnipileConfigured()) return null;

  const ids = new Set<string>();
  let cursor: string | undefined;

  try {
    // 10 pages of 100 covers a 21-day pending pool at the maximum configurable
    // invite rate; beyond that, give up rather than page forever.
    for (let page = 0; page < 10; page += 1) {
      const result = await request<
        UnipileListResponse<{ invited_user_id?: string; invited_user_public_id?: string }>
      >(
        withQuery("/api/v1/users/invite/sent", {
          account_id: accountId,
          limit: 100,
          cursor,
        }),
      );
      const items = getListItems<{ invited_user_id?: string; invited_user_public_id?: string }>(
        result,
      );
      for (const item of items) {
        if (item.invited_user_id) ids.add(item.invited_user_id.toLowerCase());
        if (item.invited_user_public_id) ids.add(item.invited_user_public_id.toLowerCase());
      }
      cursor = getListCursor(result);
      if (!cursor || !items.length) return ids;
    }
    return null;
  } catch {
    return null;
  }
}

export async function hasPendingSentInvitation(input: {
  accountId: string;
  providerProfileId?: string;
}) {
  if (!input.providerProfileId) return null;

  const ids = await listSentInvitationProviderIds(input.accountId);
  if (!ids) return null;
  return ids.has(input.providerProfileId.toLowerCase());
}

export async function sendConnectionRequest(input: {
  accountId: string;
  providerProfileId?: string;
  linkedInUrl: string;
  note?: string;
}) {
  requireUnipileConfigured();
  let providerProfileId = input.providerProfileId;
  const message = input.note ? limitText(input.note, LINKEDIN_CONNECTION_NOTE_LIMIT) : undefined;

  // Resolve (or re-resolve) when missing or clearly not a member provider id.
  if ((!looksLikeLinkedInProviderId(providerProfileId) || !providerProfileId) && input.linkedInUrl) {
    const profile = await retrieveLinkedInProfile({
      accountId: input.accountId,
      identifier: linkedInIdentifier(input.linkedInUrl),
    });
    if (profile?.providerProfileId) providerProfileId = profile.providerProfileId;
  }

  if (!looksLikeLinkedInProviderId(providerProfileId)) {
    throw new Error("LinkedIn provider id is required to send a connection request.");
  }

  const invite = async (resolvedProviderId: string) => {
    const result = await request<{ id?: string }>("/api/v1/users/invite", {
      method: "POST",
      body: JSON.stringify({
        account_id: input.accountId,
        provider_id: resolvedProviderId,
        message,
      }),
    });
    return { ...result, providerProfileId: resolvedProviderId };
  };

  try {
    return await invite(providerProfileId);
  } catch (error) {
    if (!input.linkedInUrl) throw error;

    const profile = await retrieveLinkedInProfile({
      accountId: input.accountId,
      identifier: linkedInIdentifier(input.linkedInUrl),
    });
    const resolvedProviderId = profile?.providerProfileId;
    if (!looksLikeLinkedInProviderId(resolvedProviderId) || resolvedProviderId === providerProfileId) {
      throw error;
    }

    return invite(resolvedProviderId);
  }
}

export async function sendLinkedInMessage(input: {
  accountId: string;
  providerProfileId?: string;
  linkedInUrl: string;
  body: string;
}) {
  requireUnipileConfigured();

  // Unipile's start-new-chat endpoint only accepts attendees_ids (member
  // provider ids); provider_id/profile_url are silently invalid there. Resolve
  // the recipient the same way sendConnectionRequest does.
  let providerProfileId = input.providerProfileId;
  if (!looksLikeLinkedInProviderId(providerProfileId) && input.linkedInUrl) {
    const profile = await retrieveLinkedInProfile({
      accountId: input.accountId,
      identifier: linkedInIdentifier(input.linkedInUrl),
    });
    if (profile?.providerProfileId) providerProfileId = profile.providerProfileId;
  }

  if (!looksLikeLinkedInProviderId(providerProfileId)) {
    throw new Error("LinkedIn provider id is required to send a message.");
  }

  // Unipile's v1 start-chat contract is multipart form data. Append the single
  // recipient once; repeated attendees_ids fields are only needed for groups.
  const formData = new FormData();
  formData.append("account_id", input.accountId);
  formData.append("attendees_ids", providerProfileId);
  formData.append("text", limitText(input.body, LINKEDIN_MESSAGE_LIMIT));

  const result = await request<{ chat_id?: string; message_id?: string; id?: string }>(
    "/api/v1/chats",
    {
      method: "POST",
      body: formData,
    },
  );
  return { id: result.message_id || result.id, chatId: result.chat_id };
}

export async function sendLinkedInChatMessage(input: {
  chatId: string;
  accountId: string;
  body: string;
  attachments?: File[];
}) {
  requireUnipileConfigured();

  const formData = new FormData();
  formData.set("account_id", input.accountId);
  if (input.body) formData.set("text", limitText(input.body, LINKEDIN_MESSAGE_LIMIT));
  for (const file of input.attachments || []) {
    formData.append("attachments", file, file.name);
  }

  return request<{ id?: string }>(`/api/v1/chats/${encodeURIComponent(input.chatId)}/messages`, {
    method: "POST",
    body: formData,
  });
}
