import { afterAll, beforeEach, expect, mock, setSystemTime, test } from "bun:test";
import * as fx from "./test-fixtures";

// End-to-end through linkedin.ts's public functions (the ones automation, the
// inbox and the people engine call) for an account on the own client. Only
// the HTTP boundary is faked; routing, mapping, paging and the existing
// linkedin.ts logic all run for real.

mock.module("server-only", () => ({}));
mock.module("../data", () => ({
  consumeAvatarViewBudget: async () => "ok",
  consumeProfileViewBudget: async () => profileViewsAllowed,
  listLinkedInAccounts: async () => [],
}));

let profileViewsAllowed = true;
let sessionAvailable = true;
const deletedSessions: string[] = [];
mock.module("./session-store", () => ({
  loadOwnSession: async (accountId: string) => {
    if (!sessionAvailable) {
      const { LinkedInResponseError } = await import("../linkedin-errors");
      throw new LinkedInResponseError(401, "expired", JSON.stringify({ type: "errors/disconnected_account" }));
    }
    return { accountId, memberId: fx.SELF, cookies: {}, userAgent: "Mozilla/5.0", proxySessionId: "p" };
  },
  sessionHooks: () => ({}),
  deleteOwnSession: async (accountId: string) => {
    deletedSessions.push(accountId);
  },
}));

type Call = { path: string; method?: string; body?: unknown; write?: boolean };
const calls: Call[] = [];
let inviteError: { status: number; type: string } | null = null;
let conversationsPage1: unknown[] = [];
let conversationsPage2: unknown[] = [];
let threads: Record<string, ReturnType<typeof fx.message>[]> = {};
let ignoreConversationCursor = false;
let afterConversationRead: (() => void) | undefined;
let relationship: "connection" | "DISTANCE_2" = "DISTANCE_2";
let createResponseHasUrn = true;
let uploadFails = false;
const uploads: string[] = [];

mock.module("./transport", () => ({
  voyagerRequest: async (_session: unknown, request: Call) => {
    calls.push(request);
    const path = decodeURIComponent(request.path);
    if (request.path === "/me") return fx.meResponse;
    if (path.includes("MediaUploadMetadata")) return { data: { value: { urn: "urn:li:digitalmediaAsset:attachment", singleUploadUrl: "https://www.linkedin.com/dms/upload/attachment" } } };
    if (path.startsWith("/identity/dash/profiles")) {
      if (path.includes("gone-person")) {
        // What the real transport throws for a LinkedIn 404 on a read.
        const { LinkedInResponseError } = await import("../linkedin-errors");
        throw new LinkedInResponseError(404, "not found", JSON.stringify({ type: "errors/resource_not_found" }));
      }
      // What a profile read looks like today: no relationship attached.
      if (path.includes("no-relationship")) return fx.profileWithoutRelationshipResponse();
      return fx.profileResponse();
    }
    if (path.startsWith("/voyagerRelationshipsDashMemberRelationships/")) return fx.memberRelationshipResponse(relationship);
    if (path.startsWith("/feed/comments")) return fx.flatCommentsResponse;
    if (path.includes("voyagerSocialDashReactions")) return fx.actorUnionReactionsResponse;
    if (path.includes("voyagerSearchDashReusableTypeahead")) return fx.typeaheadResponse;
    if (path.includes("messengerConversations")) {
      afterConversationRead?.();
      // Page 2 exists only behind the cursor page 1 hands out.
      if (path.includes("nextCursor:cursor-2") && !ignoreConversationCursor) {
        return fx.graphql("messengerConversationsByCategoryQuery", conversationsPage2);
      }
      return fx.graphql("messengerConversationsByCategoryQuery", conversationsPage1, conversationsPage2.length ? "cursor-2" : undefined);
    }
    if (path.includes("messengerMessages")) {
      const id = path.match(/,2-([^)]+)\)/)?.[1] || "";
      const before = Number(path.match(/deliveredAt:(\d+)/)?.[1]) || Infinity;
      return fx.graphql("messengerMessagesBySyncToken", (threads[id] || []).filter((item) => item.deliveredAt < before));
    }
    if (path.includes("createMessage")) {
      const body = request.body as { message: { body: { text: string }; originToken: string; conversationUrn?: string }; hostRecipientUrns?: string[] };
      // LinkedIn files a message to a person into the existing 1:1 thread.
      const recipient = body.hostRecipientUrns?.[0]?.split(":").pop();
      const existing = (conversationsPage1 as Array<{ entityUrn: string; conversationParticipants: Array<{ hostIdentityUrn: string }> }>).find(
        (item) => item.conversationParticipants.some((participant) => participant.hostIdentityUrn.endsWith(`:${recipient}`)),
      );
      const conversationId =
        (body.message.conversationUrn || existing?.entityUrn)?.match(/,2-([^)]+)\)/)?.[1] || "new1";
      const sent = fx.message(`sent-${calls.length}`, fx.selfParticipant, body.message.body.text, new Date().toISOString(), {
        originToken: body.message.originToken,
      });
      threads[conversationId] = [sent, ...(threads[conversationId] || [])];
      return createResponseHasUrn
        ? { value: { entityUrn: sent.entityUrn, conversationUrn: fx.conversationUrn(conversationId) } }
        : { value: {} };
    }
    if (path.includes("verifyQuotaAndCreateV2")) {
      if (inviteError) {
        // What the real transport throws for LinkedIn's CANT_RESEND_YET
        // (mapping covered in transport.test.ts).
        const { LinkedInResponseError } = await import("../linkedin-errors");
        throw new LinkedInResponseError(inviteError.status, "rejected", JSON.stringify({ type: inviteError.type }));
      }
      return { data: { value: { invitationUrn: "urn:li:fsd_invitation:8001" } } };
    }
    if (path.includes("sentInvitationViewsV2")) return fx.sentInvitationsResponse;
    if (path.includes("action=withdraw")) return undefined;
    if (path.includes("/relationships/dash/connections")) return fx.connectionsResponse;
    // The GraphQL search answers empty today, which sends search to the web page.
    if (path.includes("voyagerSearchDashClusters")) return path.includes("Limited") ? { data: {}, included: [] } : fx.peopleSearchResponse;
    if (path.startsWith("/feed/updates/")) return fx.feedResponse;
    throw new Error(`unexpected LinkedIn call ${request.path}`);
  },
  fetchLinkedInMedia: async () => new Response("bytes", { headers: { "content-type": "application/pdf" } }),
  fetchLinkedInWebPage: async (_session: unknown, url: URL) =>
    String(url).includes("Limited")
      ? `<div data-sdui-screen="s"><a href="https://www.linkedin.com/in/only-one/"><div>Only One</div><span>Only One</span><span>• 2nd</span><p>Head of Growth at Oneco</p><p>Berlin</p></a><section><h2>You've reached the monthly limit for profile searches</h2></section></div>`
      : String(url).includes("/search/results/people/")
      ? `<div data-sdui-screen="s"><a href="https://www.linkedin.com/in/url-found/"><div>Url Found</div><span>Url Found</span><span>• 2nd</span><p>Founder at Urlco</p><p>Berlin</p></a></div>`
      : "",
  flagshipWebRequest: async (_session: unknown, request: Call) => {
    calls.push(request);
    return '0:{"response":{"errors":[]}}';
  },
  proxyUrlForSession: () => undefined,
  proxyIdentityOf: (value: { proxySessionId: string }) => value,
  fetchOptionsForProxy: () => ({}),
  mergeSetCookies: () => null,
  serializeCookies: () => "",
  setCookieHeaders: () => [],
  uploadLinkedInMedia: async (_session: unknown, _url: string, file: File) => {
    if (uploadFails) throw new Error("Upload failed");
    uploads.push(await file.text());
  },
}));

const linkedin = await import("../linkedin");
const { ownAccountIdForMember, ownChatId } = await import("./ids");
const { LinkedInResponseError } = await import("../linkedin-errors");
// Each test gets its own account: the router caches LinkedIn reads per
// account for a minute, which must not leak between tests.
let accountSeq = 0;
let ACCOUNT = ownAccountIdForMember(fx.SELF);

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

beforeEach(() => {
  accountSeq += 1;
  ACCOUNT = ownAccountIdForMember(`${fx.SELF}t${accountSeq}`);
  calls.length = 0;
  inviteError = null;
  profileViewsAllowed = true;
  sessionAvailable = true;
  createResponseHasUrn = true;
  conversationsPage1 = [];
  conversationsPage2 = [];
  ignoreConversationCursor = false;
  afterConversationRead = undefined;
  relationship = "DISTANCE_2";
  threads = {};
  deletedSessions.length = 0;
  uploads.length = 0;
  uploadFails = false;
});

afterAll(() => {
  mock.restore();
});

test("own accounts read profiles and relationships through the own client", async () => {
  const lead = await linkedin.retrieveLinkedInProfile({ accountId: ACCOUNT, identifier: "https://www.linkedin.com/in/alice-example/" });
  expect(lead).toMatchObject({ providerProfileId: fx.ALICE, company: "Acme Widgets" });
  expect(await linkedin.isFirstDegreeConnection({ accountId: ACCOUNT, identifier: fx.ALICE })).toBe(false);
});

// Profile links keep accented names percent-encoded. Encoded a second time,
// LinkedIn looked up "jos%C3%A9" literally and answered 404, and the lead was
// stopped as unreachable at its invite.
test("a profile link with an accented name reaches LinkedIn encoded once", async () => {
  const lead = await linkedin.retrieveLinkedInProfile({ accountId: ACCOUNT, identifier: "https://www.linkedin.com/in/jos%C3%A9-garc%C3%ADa/" });
  expect(lead?.providerProfileId).toBe(fx.ALICE);
  const read = calls.find((call) => call.path.startsWith("/identity/dash/profiles"));
  expect(read?.path).toContain("memberIdentity=jos%C3%A9-garc%C3%ADa&");
  expect(read?.path).not.toContain("%25");
});

// Unipile is gone. An account id left from it must never reach LinkedIn or
// any outside API, and a send through it must read as "reconnect".
test("old Unipile account ids never reach LinkedIn or any outside API", async () => {
  const originalFetch = globalThis.fetch;
  const outside: string[] = [];
  globalThis.fetch = (async (url: string) => {
    outside.push(String(url));
    return Response.json({});
  }) as unknown as typeof fetch;
  try {
    expect(await linkedin.retrieveLinkedInProfile({ accountId: "UnipileAccount123", identifier: "someone" })).toBeNull();
    await expect(linkedin.withdrawSentInvitation("UnipileAccount123", "invitation")).rejects.toMatchObject({ errorType: "errors/disconnected_account" });
    expect(calls).toHaveLength(0);
    expect(outside).toHaveLength(0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the inbox lists every chat with the other person's name, photo, preview and unread state", async () => {
  conversationsPage1 = [
    fx.conversation("c1", fx.aliceParticipant, minutesAgo(5), [fx.message("a2", fx.aliceParticipant, "Yes, let's talk", minutesAgo(5))], { unreadCount: 1, read: false }),
    fx.conversation("c2", fx.bobParticipant, minutesAgo(60), [fx.message("b1", fx.selfParticipant, "Hi Bob", minutesAgo(60))]),
  ];
  threads = { c1: [fx.message("a2", fx.aliceParticipant, "Yes, let's talk", minutesAgo(5)), fx.message("a1", fx.selfParticipant, "Hi Alice", minutesAgo(30))] };
  const inbox = await linkedin.listLinkedInInbox({ accountId: ACCOUNT, includeMessageHistory: false });
  const alice = inbox.find((thread) => thread.attendeeProviderId === fx.ALICE)!;
  expect(alice).toMatchObject({ profileName: "Alice Example", unread: true, accountId: ACCOUNT });
  expect(alice.avatarUrl).toContain("media.licdn.com");
  expect(alice.messages.at(-1)?.body).toBe("Yes, let's talk");
  expect(inbox.find((thread) => thread.attendeeProviderId === fx.BOB)?.profileName).toBe("Bob Sample");
  // Chats, attendees and previews load in parallel but share one read. 25
  // chats were asked for, but page 1 came without a cursor, so there is no
  // page 2 to ask LinkedIn for.
  expect(calls.filter((call) => call.path.includes("messengerConversations")).length).toBe(1);
});

test("reply sync finds every inbound message since the cutoff, across conversation pages", async () => {
  // c1 has two unread inbound messages but LinkedIn only embeds the latest;
  // c3 sits on the second conversations page. Both must be found.
  conversationsPage1 = [
    fx.conversation("c1", fx.aliceParticipant, minutesAgo(2), [fx.message("a3", fx.aliceParticipant, "Also, pricing?", minutesAgo(2))], { unreadCount: 2, read: false }),
    fx.conversation("c2", fx.bobParticipant, minutesAgo(4), [fx.message("b2", fx.selfParticipant, "Following up", minutesAgo(4))]),
  ];
  conversationsPage2 = [
    fx.conversation("c3", fx.participant("ACoAAcarol01", "Carol", "Third"), minutesAgo(6), [fx.message("c31", fx.participant("ACoAAcarol01", "Carol", "Third"), "Not now, thanks", minutesAgo(6))]),
  ];
  threads = {
    c1: [fx.message("a3", fx.aliceParticipant, "Also, pricing?", minutesAgo(2)), fx.message("a2", fx.aliceParticipant, "Interested", minutesAgo(8)), fx.message("a1", fx.selfParticipant, "Hi", minutesAgo(600))],
    c2: [fx.message("b2", fx.selfParticipant, "Following up", minutesAgo(4))],
    c3: [fx.message("c31", fx.participant("ACoAAcarol01", "Carol", "Third"), "Not now, thanks", minutesAgo(6))],
  };
  const replies = await linkedin.listRecentInboundMessages({ accountId: ACCOUNT, sinceMs: Date.now() - 15 * 60_000 });
  // Oldest first, the order the automation processes replies in. Owner-sent
  // "Following up" is included so sync can stop outreach (old Unipile webhook parity).
  expect(replies?.map((reply) => reply.body)).toEqual(["Interested", "Not now, thanks", "Following up", "Also, pricing?"]);
  expect(replies?.find((reply) => reply.body === "Interested")?.senderProviderId).toBe(fx.ALICE);
  expect(replies?.find((reply) => reply.body === "Following up")).toMatchObject({
    isSender: true,
    senderProviderId: fx.BOB,
  });
  // Ids must be stable for the webhook/sync dedupe.
  const again = await linkedin.listRecentInboundMessages({ accountId: ACCOUNT, sinceMs: Date.now() - 15 * 60_000 });
  expect(again?.map((reply) => reply.id)).toEqual(replies?.map((reply) => reply.id));
  // Read threads must be checked too: unread state cannot hide replies.
  const threadReads = calls.filter((call) => call.path.includes("messengerMessages"));
  expect(new Set(threadReads.map((call) => decodeURIComponent(call.path).match(/,2-([^)]+)\)/)?.[1]))).toEqual(new Set(["c1", "c2", "c3"]));
});

test("a message we send is recognised as ours in history (owner-message guard)", async () => {
  // The guard stops outreach if history holds an outbound message whose id is
  // not one automation stored. Our send id must equal the history id.
  for (const hasUrn of [true, false]) {
    createResponseHasUrn = hasUrn;
    conversationsPage1 = [fx.conversation("c1", fx.aliceParticipant, minutesAgo(1), [])];
    threads = { c1: [] };
    const sent = await linkedin.sendLinkedInMessage({ accountId: ACCOUNT, providerProfileId: fx.ALICE, linkedInUrl: "", body: "Hello Alice" });
    expect(sent.id).toBeTruthy();
    const chatId = await linkedin.findLinkedInChatWithAttendee({ accountId: ACCOUNT, providerProfileId: fx.ALICE });
    const page = await linkedin.listLinkedInChatMessagesPage({ chatId: chatId!, limit: 100 });
    const outbound = page.messages.filter((message) => message.direction === "outbound");
    expect(outbound.map((message) => message.id)).toContain(sent.id!);
  }
});

test("chat history pages move strictly older and end, so the guard's loop check never trips", async () => {
  conversationsPage1 = [fx.conversation("c1", fx.aliceParticipant, minutesAgo(1), [])];
  threads = { c1: [fx.message("m2", fx.aliceParticipant, "two", minutesAgo(1)), fx.message("m1", fx.selfParticipant, "one", minutesAgo(2))] };
  const chatId = ownChatId(ACCOUNT, fx.conversationUrn("c1"));
  const cursors = new Set<string>();
  let cursor: string | undefined;
  let pages = 0;
  do {
    const page = await linkedin.listLinkedInChatMessagesPage({ chatId, limit: 1, cursor });
    cursor = page.cursor;
    if (cursor) {
      expect(cursors.has(cursor)).toBe(false);
      cursors.add(cursor);
    }
    pages += 1;
  } while (cursor && pages < 10);
  expect(pages).toBeLessThan(10);
});

test("an accepted message with no recoverable ID remains unconfirmed so automation cannot resend it", async () => {
  createResponseHasUrn = false;
  const error = await linkedin.sendLinkedInMessage({ accountId: ACCOUNT, providerProfileId: fx.ALICE, linkedInUrl: "", body: "Hello Alice" }).catch((caught) => caught);
  expect(error).toBeInstanceOf(Error);
  expect(error).not.toBeInstanceOf(LinkedInResponseError);
  expect(error.message).toContain("accepted this message");
  expect(calls.filter((call) => call.path.includes("createMessage"))).toHaveLength(1);
});

test("invite rejections keep the error types automation branches on", async () => {
  inviteError = { status: 400, type: "errors/cannot_resend_yet" };
  const error = await linkedin
    .sendConnectionRequest({ accountId: ACCOUNT, providerProfileId: fx.ALICE, linkedInUrl: "" })
    .catch((caught) => caught);
  // automation.ts imports LinkedInResponseError from ./linkedin; it must be the same class.
  expect(error).toBeInstanceOf(linkedin.LinkedInResponseError);
  expect(error.errorType).toBe("errors/cannot_resend_yet");
  inviteError = null;
  const ok = await linkedin.sendConnectionRequest({ accountId: ACCOUNT, providerProfileId: fx.ALICE, linkedInUrl: "", note: "Hi" });
  expect(ok.providerProfileId).toBe(fx.ALICE);
  const invite = calls.findLast((call) => call.path.includes("verifyQuotaAndCreateV2") && call.write);
  expect(invite?.body).toMatchObject({ invitee: { inviteeUnion: { memberProfile: `urn:li:fsd_profile:${fx.ALICE}` } }, customMessage: "Hi" });
});

test("pending invites are listed for the sweep and can be withdrawn with their secret", async () => {
  const pending = await linkedin.listSentInvitationProviderIds(ACCOUNT);
  expect(pending?.has(fx.ALICE.toLowerCase())).toBe(true);
  const { invitations, complete } = await linkedin.listSentInvitations(ACCOUNT);
  expect(complete).toBe(true);
  await linkedin.withdrawSentInvitation(ACCOUNT, invitations[0].id);
  const withdraw = calls.find((call) => call.path.includes("action=withdraw"));
  expect(withdraw).toMatchObject({ write: true, body: { invitationId: "7001", invitationSharedSecret: "s3cr3t" } });
  const relations = await linkedin.listRecentRelations(ACCOUNT);
  expect(relations?.[0]).toMatchObject({ providerProfileId: fx.BOB, publicIdentifier: "bob-sample" });
});

test("sending a file uploads its bytes and includes the asset in the message", async () => {
  const chatId = ownChatId(ACCOUNT, fx.conversationUrn("c1"));
  const result = await linkedin.sendLinkedInChatMessage({ chatId, accountId: ACCOUNT, body: "", attachments: [new File(["file contents"], "a.txt", { type: "text/plain" })] });
  expect(result.id).toBeTruthy();
  expect(uploads).toEqual(["file contents"]);
  const sent = calls.find((call) => call.path.includes("createMessage"));
  expect(sent?.body).toMatchObject({ message: { body: { text: "" }, renderContentUnions: [{ file: { assetUrn: "urn:li:digitalmediaAsset:attachment", name: "a.txt", byteSize: 13, mediaType: "text/plain" } }] } });
});

test("a failed file upload never sends a message with the attachment missing", async () => {
  uploadFails = true;
  const chatId = ownChatId(ACCOUNT, fx.conversationUrn("c1"));
  await expect(linkedin.sendLinkedInChatMessage({ chatId, accountId: ACCOUNT, body: "attached", attachments: [new File(["x"], "a.txt")] })).rejects.toThrow("Upload failed");
  expect(calls.some((call) => call.path.includes("createMessage"))).toBe(false);
});

test("a reply that is only a file or photo still counts as a reply", async () => {
  // A lead who answers with a voice note, image or file has replied. Dropping
  // it left the lead unmarked, sent no reply email, and let the next
  // follow-up go out on top of their answer.
  const file = fx.message("p1", fx.aliceParticipant, "", minutesAgo(3), {
    renderContent: [{ file: { url: "https://www.linkedin.com/dms/prv/file", name: "brief.pdf" } }],
  });
  conversationsPage1 = [fx.conversation("c1", fx.aliceParticipant, minutesAgo(3), [file])];
  threads = { c1: [file] };
  const replies = await linkedin.listRecentInboundMessages({ accountId: ACCOUNT, sinceMs: Date.now() - 15 * 60_000 });
  expect(replies?.map((reply) => reply.body)).toEqual(["[Sent an attachment]"]);
  expect(replies?.[0]?.senderProviderId).toBe(fx.ALICE);
});

test("a read thread still syncs the inbound reply behind its latest outbound message", async () => {
  const reply = fx.message("reply", fx.aliceParticipant, "Interested", minutesAgo(2));
  const answer = fx.message("answer", fx.selfParticipant, "Thanks", minutesAgo(1));
  conversationsPage1 = [fx.conversation("read", fx.aliceParticipant, minutesAgo(1), [answer])];
  threads = { read: [answer, reply] };
  const messages = await linkedin.listRecentInboundMessages({ accountId: ACCOUNT, sinceMs: Date.now() - 5 * 60_000 });
  expect(messages?.filter((message) => !message.isSender).map((message) => message.body)).toEqual(["Interested"]);
  expect(messages?.find((message) => message.isSender)).toMatchObject({ body: "Thanks", senderProviderId: fx.ALICE });
});

test("a chat belongs only to the account in its id", async () => {
  const chatId = ownChatId(ACCOUNT, fx.conversationUrn("c1"));
  expect(await linkedin.linkedInChatBelongsToAccount(chatId, ACCOUNT)).toBe(true);
  expect(await linkedin.linkedInChatBelongsToAccount(chatId, ownAccountIdForMember("ACoAAsomeoneElse"))).toBe(false);
  expect(await linkedin.linkedInChatBelongsToAccount(chatId, "UnipileAccount123")).toBe(false);
  expect(calls).toHaveLength(0);
});

test("a reply never goes out through a different account than the chat's", async () => {
  const otherAccount = ownAccountIdForMember("ACoAAsomeoneElse");
  const chatId = ownChatId(ACCOUNT, fx.conversationUrn("c1"));
  const error = await linkedin
    .sendLinkedInChatMessage({ chatId, accountId: otherAccount, body: "hello" })
    .catch((caught) => caught);
  expect(error).toBeInstanceOf(LinkedInResponseError);
  expect(error.status).toBe(404);
  expect(calls.some((call) => call.write)).toBe(false);
});

test("disconnecting deletes stored cookies even when the session is already dead", async () => {
  sessionAvailable = false;
  await linkedin.deleteLinkedInAccount(ACCOUNT);
  expect(deletedSessions).toEqual([ACCOUNT]);
});

test("resolving a vanity url for posts spends the shared profile-view budget", async () => {
  profileViewsAllowed = false;
  const error = await linkedin
    .listLinkedInPostsForProfile({ accountId: ACCOUNT, identifier: "https://www.linkedin.com/in/some-founder", limit: 5 })
    .catch((caught) => caught);
  expect(error.errorType).toBe("errors/profile_view_budget");
  expect(calls).toHaveLength(0);
});

test("search by a copied LinkedIn people-search URL returns its results", async () => {
  const leads = await linkedin.searchLinkedInProfilesByUrl({
    accountId: ACCOUNT,
    url: "https://www.linkedin.com/search/results/people/?keywords=founder",
    limit: 5,
  });
  expect(leads).toHaveLength(1);
  expect(leads[0]).toMatchObject({ name: "Url Found", linkedInUrl: "https://www.linkedin.com/in/url-found/" });
});

test("search by an unsupported URL is refused plainly instead of guessed", async () => {
  const error = await linkedin
    .searchLinkedInProfilesByUrl({ accountId: ACCOUNT, url: "https://www.linkedin.com/feed/", limit: 5 })
    .catch((caught) => caught);
  expect(error.errorType).toBe("errors/invalid_parameters");
});

test("people search returns new leads through the existing search loop", async () => {
  const agent = { id: "agent", workspaceId: "ws" } as Parameters<typeof linkedin.searchLinkedInProfiles>[0]["agent"];
  const leads = await linkedin.searchLinkedInProfiles({
    accountId: ACCOUNT,
    agent,
    limit: 2,
    criteria: { titles: ["Head of Growth"], industries: [], locations: [], keywords: [] },
  });
  expect(leads.map((lead) => lead.providerProfileId)).toEqual([fx.BOB, fx.ALICE]);
});

// Past LinkedIn's monthly search limit every search still answers, with about
// three people. Discovery used to report that as "found few leads" with no
// reason; the owner is now told, once a day per account.
test("a free account past LinkedIn's monthly search limit is reported once a day", async () => {
  const startedAt = Date.now();
  const agent = { id: "agent", workspaceId: "ws" } as Parameters<typeof linkedin.searchLinkedInProfiles>[0]["agent"];
  await linkedin.searchLinkedInProfiles({
    accountId: ACCOUNT,
    agent,
    limit: 5,
    criteria: { titles: ["Limited Role"], industries: [], locations: [], keywords: [] },
  });
  expect(linkedin.takeLinkedInSearchLimitNotice(ACCOUNT, startedAt)).toBe(true);
  expect(linkedin.takeLinkedInSearchLimitNotice(ACCOUNT, startedAt)).toBe(false);
});

test("an ordinary search raises no search-limit notice", async () => {
  const startedAt = Date.now();
  const agent = { id: "agent", workspaceId: "ws" } as Parameters<typeof linkedin.searchLinkedInProfiles>[0]["agent"];
  await linkedin.searchLinkedInProfiles({
    accountId: ACCOUNT,
    agent,
    limit: 2,
    criteria: { titles: ["Head of Growth"], industries: [], locations: [], keywords: [] },
  });
  expect(linkedin.takeLinkedInSearchLimitNotice(ACCOUNT, startedAt)).toBe(false);
});

test("an unknown profile reads as invalid_recipient, so avatar refresh tries the next id", async () => {
  const result = await linkedin.retrieveLinkedInProfileAvatar({ accountId: ACCOUNT, identifiers: ["gone-person", fx.ALICE] });
  expect(result).toMatchObject({ ok: true });
  expect(calls.filter((call) => call.path.startsWith("/identity/dash/profiles"))).toHaveLength(2);
});

test("a specific post remains readable for post-based lead discovery through the own client", async () => {
  const post = await linkedin.retrieveLinkedInPost({ accountId: ACCOUNT, postId: `urn:li:activity:${fx.POST_ID}` });
  expect(linkedin.getLinkedInPostText(post!)).toBe("We are hiring SDRs.");
  expect(linkedin.getLinkedInPostId(post!)).toBe(`urn:li:activity:${fx.POST_ID}`);
  await expect(linkedin.retrieveLinkedInPost({ accountId: ACCOUNT, postId: "123" })).rejects.toMatchObject({ status: 404 });
});

// ---- found against live LinkedIn on 2026-11-11

test("a repeated inbox page is refused rather than taken for the whole inbox", async () => {
  // LinkedIn answers 200 with page 1 again when it ignores a paging cursor
  // (it did for the timestamp cursor this client used to send). Accepting
  // that as "no older conversations" hides replies from sync, so sync must
  // report "could not check" (null), never "no replies" ([]).
  conversationsPage1 = [fx.conversation("c1", fx.aliceParticipant, minutesAgo(2), [fx.message("a1", fx.aliceParticipant, "Hi", minutesAgo(2))])];
  conversationsPage2 = [fx.conversation("c3", fx.bobParticipant, minutesAgo(6), [fx.message("b1", fx.bobParticipant, "Reply", minutesAgo(6))])];
  threads = { c1: [fx.message("a1", fx.aliceParticipant, "Hi", minutesAgo(2))] };
  ignoreConversationCursor = true;
  expect(await linkedin.listRecentInboundMessages({ accountId: ACCOUNT, sinceMs: Date.now() - 15 * 60_000 })).toBeNull();
});

test("looking for a lead's chat reads each inbox page once, even when the walk outlasts the cache window", async () => {
  // The owner-message guard runs this lookup before every first message, and
  // a lead with no chat sends it through the whole inbox. Paced reads of a
  // large inbox take longer than the one-minute cache. Starting again from
  // page 1 each time the cache expired held the automation tick, and with it
  // every workspace's outreach, for as long as the walk kept restarting.
  conversationsPage1 = [fx.conversation("c1", fx.aliceParticipant, minutesAgo(2), [])];
  conversationsPage2 = [fx.conversation("c3", fx.bobParticipant, minutesAgo(6), [])];
  afterConversationRead = () => setSystemTime(new Date(Date.now() + 61_000));
  try {
    expect(await linkedin.findLinkedInChatWithAttendee({ accountId: ACCOUNT, providerProfileId: "ACoAAnobody01" })).toBeNull();
  } finally {
    setSystemTime();
  }
  const inboxReads = calls.filter((call) => decodeURIComponent(call.path).includes("messengerConversations"));
  expect(inboxReads).toHaveLength(2);
});

test("comments are requested with the colon in the post key encoded", async () => {
  // Rest.li reads a bare ":" in a query value as syntax. LinkedIn answered
  // 400 to every comments read until it was encoded.
  const comments = await linkedin.listLinkedInPostComments({ accountId: ACCOUNT, postId: `urn:li:activity:${fx.POST_ID}`, limit: 10 });
  expect(comments[0].profile?.provider_id).toBe(fx.BOB);
  expect(calls.find((call) => call.path.startsWith("/feed/comments"))?.path).toContain(`updateId=activity%3A${fx.POST_ID}`);
});

test("reactions are read under the post's share, where LinkedIn files them", async () => {
  // Asked under the activity id (the id every post carries), LinkedIn answers
  // 200 with zero reactions, so discovery would find no reactors and no error.
  const postId = `urn:li:activity:${fx.POST_ID}`;
  const reactions = await linkedin.listLinkedInPostReactions({ accountId: ACCOUNT, postId, limit: 10 });
  expect(reactions[0].profile?.provider_id).toBe(fx.BOB);
  const reactionCalls = () => calls.filter((call) => call.path.includes("voyagerSocialDashReactions"));
  expect(decodeURIComponent(reactionCalls()[0].path)).toContain(`threadUrn=${fx.THREAD_URN}`);
  // Once a post's share is known, asking again costs no extra post read.
  const postReads = calls.filter((call) => call.path.startsWith("/feed/updates/")).length;
  await linkedin.listLinkedInPostReactions({ accountId: ACCOUNT, postId, limit: 10 });
  expect(calls.filter((call) => call.path.startsWith("/feed/updates/")).length).toBe(postReads);
  expect(reactionCalls()).toHaveLength(2);
});

test("an accepted invite is detected although profile reads carry no relationship", async () => {
  // Without the separate relationship read every profile reports "unknown"
  // and accepted invites never move on to the first message.
  relationship = "connection";
  expect(await linkedin.isFirstDegreeConnection({ accountId: ACCOUNT, identifier: "no-relationship-person" })).toBe(true);
  expect(calls.some((call) => call.path.startsWith("/voyagerRelationshipsDashMemberRelationships/"))).toBe(true);
});

test("inbox loads beyond 20 chats keep preview messages and names on page 2", async () => {
  conversationsPage1 = Array.from({ length: 20 }, (_, i) =>
    fx.conversation(`p1-${i}`, fx.participant(`ACoPageOnePerson${i}`, "First", `P${i}`), minutesAgo(i + 1), [
      fx.message(`m1-${i}`, fx.selfParticipant, `Hello P${i}`, minutesAgo(i + 1)),
    ]),
  );
  conversationsPage2 = [
    fx.conversation("p2-0", fx.bobParticipant, minutesAgo(30), [
      fx.message("m2-0", fx.bobParticipant, "Page two reply", minutesAgo(30)),
    ]),
  ];
  const inbox = await linkedin.listLinkedInInbox({ accountId: ACCOUNT, limit: 30, includeMessageHistory: false });
  const bob = inbox.find((thread) => thread.attendeeProviderId === fx.BOB);
  expect(bob?.profileName).toBe("Bob Sample");
  expect(bob?.messages.at(-1)?.body).toBe("Page two reply");
});

test("pending invites with LinkedIn's dummy sharedSecret withdraw through SDUI", async () => {
  await linkedin.withdrawSentInvitation(ACCOUNT, "7525708238084984832.dummy");
  const sdui = calls.find((call) => call.path.includes("addaWithdrawInvitation"));
  expect(sdui?.write).toBe(true);
  expect(JSON.stringify(sdui?.body)).toContain('"invitationId":"7525708238084984832"');
});

test("a location filter reaches LinkedIn as the geo id its search understands", async () => {
  const agent = { id: "agent", workspaceId: "ws" } as Parameters<typeof linkedin.searchLinkedInProfiles>[0]["agent"];
  await linkedin.searchLinkedInProfiles({
    accountId: ACCOUNT,
    agent,
    limit: 2,
    criteria: { titles: ["Head of Growth"], industries: [], locations: ["Germany"], keywords: [] },
  });
  const search = calls.find((call) => call.path.includes("voyagerSearchDashClusters"))!;
  expect(decodeURIComponent(search.path)).toContain("(key:geoUrn,value:List(101282230))");
});
