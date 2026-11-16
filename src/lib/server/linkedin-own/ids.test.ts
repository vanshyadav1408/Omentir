import { expect, test } from "bun:test";
import {
  isOwnLinkedInId,
  memberIdFromOwnAccountId,
  ownAccountIdForMember,
  ownAccountIdOf,
  ownChatId,
  ownInvitationId,
  ownMessageId,
  parseOwnChatId,
  parseOwnInvitationId,
  parseOwnMessageId,
} from "./ids";

const account = ownAccountIdForMember("ACoAAB1234_xyz-Q");
const conversation = "urn:li:msg_conversation:(urn:li:fsd_profile:ACoAAB1234_xyz-Q,2-YTE0ZDM=)";
const message = "urn:li:msg_message:(urn:li:fsd_profile:ACoAAB1234_xyz-Q,2-MTcxNjM=)";

test("routing relies on the prefix: old Unipile ids must never look like own ids", () => {
  // Old Unipile account ids are opaque base62 strings; none start with own_.
  expect(isOwnLinkedInId("AbCdEf123456")).toBe(false);
  expect(isOwnLinkedInId("")).toBe(false);
  expect(isOwnLinkedInId(undefined)).toBe(false);
  expect(isOwnLinkedInId(account)).toBe(true);
});

test("chat and message ids round-trip so a chat-only call still finds its session", () => {
  const chatId = ownChatId(account, conversation);
  expect(parseOwnChatId(chatId)).toEqual({ accountId: account, urn: conversation });
  expect(ownAccountIdOf(chatId)).toBe(account);
  // Ids travel through URL paths; they must survive encodeURIComponent.
  expect(decodeURIComponent(encodeURIComponent(chatId))).toBe(chatId);

  const messageId = ownMessageId(account, message);
  expect(parseOwnMessageId(messageId)).toEqual({ accountId: account, urn: message });
  // A message id is not a chat id; mixing them up would read the wrong thread.
  expect(parseOwnChatId(messageId)).toBeNull();
});

test("the same message urn always yields the same id (send result == history id)", () => {
  // The owner-message guard compares stored send ids against history ids. A
  // mismatch would read every automated send as a manual owner message.
  expect(ownMessageId(account, message)).toBe(ownMessageId(account, message));
});

test("malformed ids are rejected rather than routed to a guessed account", () => {
  expect(parseOwnChatId(`${account}~c~`)).toBeNull();
  expect(parseOwnChatId("own_~c~abc")).toBeNull();
  expect(parseOwnChatId(`${account}~c~${Buffer.from("not-an-urn").toString("base64url")}`)).toBeNull();
  expect(ownAccountIdOf("own_has spaces")).toBeNull();
  expect(() => ownAccountIdForMember("bad id/with slash")).toThrow();
  expect(() => memberIdFromOwnAccountId("AbCdEf123456")).toThrow();
});

test("invitation ids keep the shared secret that withdraw needs", () => {
  const id = ownInvitationId("7123456789", "abc-secret");
  expect(parseOwnInvitationId(id)).toEqual({ invitationId: "7123456789", sharedSecret: "abc-secret" });
  expect(parseOwnInvitationId("7123456789")).toBeNull();
  expect(parseOwnInvitationId("7123456789.")).toBeNull();
});
