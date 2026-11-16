import { beforeEach, expect, mock, test } from "bun:test";
import { LinkedInResponseError } from "./linkedin-errors";

mock.module("server-only", () => ({}));
let profileViewsLeft = true;
mock.module("./data", () => ({
  consumeAvatarViewBudget: async () => "exhausted",
  consumeProfileViewBudget: async () => profileViewsLeft,
  listLinkedInAccounts: async () => [],
  getConversation: async () => ({ messages: [] }),
  listLeadEnrollments: async () => [],
  stopLeadOutreach: async () => undefined,
}));
const posts: Array<RequestInit | undefined> = [];
let rejectFirst = false;
function reject(status: number, body: unknown) {
  return new LinkedInResponseError(status, `LinkedIn request failed: ${status}`, JSON.stringify(body));
}
// Stands in for the own LinkedIn client's router, which sends in production.
async function answer(path: string, init?: RequestInit) {
  const pathname = new URL(path, "http://own-client.test").pathname;
  if (pathname === "/api/v1/chats" && init?.method === "POST") {
    posts.push(init);
    if (rejectFirst && posts.length === 1) throw reject(400, { type: "errors/invalid_recipient" });
    return { message_id: "sent-message", chat_id: "chat" };
  }
  if (pathname === "/api/v1/users/person") return { provider_id: "ACo-new-provider" };
  if (pathname === "/api/v1/users/nobody") return { public_identifier: "nobody" };
  if (pathname === "/api/v1/chat_attendees/ACo-old-provider/chats") throw reject(404, {
    type: "errors/resource_not_found",
    detail: "The requested resource were not found.\nAttendee not found",
  });
  throw new Error(`Unexpected request: ${pathname}`);
}
mock.module("./linkedin-own/router", () => ({
  ownAccountIdForRequest: (path: string) =>
    new URL(path, "http://own-client.test").searchParams.get("account_id") === "legacy-unipile-account" ? null : "own_account",
  ownLinkedInRequest: (_accountId: string, path: string, init?: RequestInit) => answer(path, init),
  ownLinkedInAttachment: async () => {
    throw new Error("Unexpected attachment call");
  },
}));
const {
  sendConnectionRequest, sendLinkedInMessage, LinkedInMessageSendBlocked, LinkedInRecipientUnresolved,
} = await import("./linkedin");
const { stopForOwnerMessage } = await import("./owner-message-guard");
const input = {
  accountId: "own_account", providerProfileId: "ACo-old-provider",
  linkedInUrl: "https://linkedin.com/in/person", body: "Scheduled message",
};
beforeEach(() => {
  posts.length = 0;
  rejectFirst = false;
  profileViewsLeft = true;
});

test("owner takeover cancels before any message POST reaches LinkedIn", async () => {
  await expect(sendLinkedInMessage({
    ...input, beforeSend: async () => { throw new LinkedInMessageSendBlocked(); },
  })).rejects.toBeInstanceOf(LinkedInMessageSendBlocked);
  expect(posts).toHaveLength(0);
});

test("a failed history check also cannot send the message", async () => {
  await expect(sendLinkedInMessage({
    ...input, beforeSend: async () => { throw new Error("History unavailable"); },
  })).rejects.toThrow("History unavailable");
  expect(posts).toHaveLength(0);
});

test("the real owner-message check permits a first send when LinkedIn has no attendee yet", async () => {
  expect(await sendLinkedInMessage({
    ...input,
    beforeSend: async (providerProfileId) => {
      const blocked = await stopForOwnerMessage({
        workspaceId: "workspace", leadId: "lead", accountId: input.accountId,
        providerProfileId, linkedInUrl: input.linkedInUrl,
        allowLegacyAutomatedMessages: false,
      }).catch(() => true);
      if (blocked) throw new LinkedInMessageSendBlocked();
    },
  })).toEqual({ id: "sent-message", chatId: "chat" });
  expect(posts).toHaveLength(1);
});

test("a verified history check runs before the POST", async () => {
  const beforeSend = mock(async (providerId: string) => {
    expect(providerId).toBe(input.providerProfileId);
    expect(posts).toHaveLength(0);
  });
  expect(await sendLinkedInMessage({ ...input, beforeSend })).toEqual({ id: "sent-message", chatId: "chat" });
  expect(beforeSend).toHaveBeenCalledTimes(1);
  expect(posts).toHaveLength(1);
});

test("recipient resolution retries check the new recipient's history before a second send attempt", async () => {
  rejectFirst = true;
  const checked: string[] = [];
  await expect(sendLinkedInMessage({
    ...input,
    beforeSend: async (providerId) => {
      checked.push(providerId);
      if (providerId === "ACo-new-provider") throw new LinkedInMessageSendBlocked();
    },
  })).rejects.toBeInstanceOf(LinkedInMessageSendBlocked);
  expect(checked).toEqual(["ACo-old-provider", "ACo-new-provider"]);
  expect(posts).toHaveLength(1);
});

// A lead with no stored member id needs a profile view to resolve one. Agent
// discovery spends the shared 75/day budget early, and every invite to such a
// lead then failed all day (99 enrollments across 4 workspaces on 2026-11-04).
test("send-time recipient lookup still resolves after discovery spent the daily view budget", async () => {
  profileViewsLeft = false;
  expect(await sendLinkedInMessage({ ...input, providerProfileId: undefined }))
    .toEqual({ id: "sent-message", chatId: "chat" });
  expect(posts).toHaveLength(1);
});

// When the profile truly yields no member id, nothing is sent, and the
// automation must know that for certain: a generic error was parked as an
// "unconfirmed send" needing manual review, and connect-step leads stayed
// parked forever.
test("an unresolvable recipient fails with a typed error before any request is sent", async () => {
  const noId = { ...input, providerProfileId: undefined, linkedInUrl: "https://linkedin.com/in/nobody" };
  await expect(sendLinkedInMessage(noId)).rejects.toBeInstanceOf(LinkedInRecipientUnresolved);
  await expect(sendConnectionRequest(noId)).rejects.toBeInstanceOf(LinkedInRecipientUnresolved);
  expect(posts).toHaveLength(0);
});

// Accounts connected through the old Unipile integration have no session in
// Omentir anymore. A send through one must fail as "reconnect this account"
// (automation knows nothing went out) instead of being retried or parked as
// an unconfirmed send.
test("a send through an old Unipile account id fails as disconnected and sends nothing", async () => {
  const legacy = { ...input, accountId: "legacy-unipile-account" };
  await expect(sendLinkedInMessage(legacy)).rejects.toMatchObject({ errorType: "errors/disconnected_account" });
  await expect(sendConnectionRequest(legacy)).rejects.toMatchObject({ errorType: "errors/disconnected_account" });
  expect(posts).toHaveLength(0);
});
