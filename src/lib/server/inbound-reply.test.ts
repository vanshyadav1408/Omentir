import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import type { Conversation, ConversationMessage, Lead } from "./types";

mock.module("server-only", () => ({}));

let conversation: Partial<Conversation> | null = null;
const createConversationMessage = mock(async () => true);
const setConversationReplyIntent = mock(async () => undefined);
const classifyReplyIntent = mock(async () => ({ intent: "negative", confidence: 0.95, reason: "asked to stop", nextStepHint: "" }));

mock.module("./data", () => ({
  claimLeadOutcomeNotification: async () => false,
  claimReplyNotification: async () => false,
  createConversationMessage,
  findLeadForWorkspace: async () => null,
  getConversation: async () => conversation,
  getLeadsByIds: async () => [],
  getLinkedInAccountForWorkspace: async () => null,
  getProductProfile: async () => ({}),
  getWorkspace: async () => ({ id: "workspace", billing: {} }),
  listCampaignEnrollments: async () => [],
  listCampaigns: async () => [],
  listWorkspaceIdsSharingLinkedIn: async () => ["workspace"],
  logAutomationRun: async () => undefined,
  planActionSlots: async () => [],
  releaseLeadOutcomeNotification: async () => undefined,
  releaseReplyNotification: async () => undefined,
  setConversationReplyIntent,
  updateEnrollment: async () => undefined,
  updateLead: async () => undefined,
}));
mock.module("./gemini", () => ({ classifyReplyIntent, draftCampaignMessage: async () => "" }));
mock.module("./email", () => ({
  emailWasSkipped: () => false,
  sendInterestedLeadNotification: async () => ({}),
  sendReplyNotification: async () => ({}),
}));
mock.module("./linkedin", () => ({
  getLinkedInPostCreatedAt: () => undefined,
  getLinkedInPostText: () => "",
  isFirstDegreeConnection: async () => null,
  listLinkedInPostsForProfile: async () => [],
  retrieveLinkedInProfile: async () => null,
}));
mock.module("./lead-avatar-cache", () => ({ leadAvatarBytes: async () => null }));
mock.module("@/lib/posthog-server", () => ({ capturePostHogEvent: () => undefined }));

const { processInboundMessage } = await import("./inbound");

afterAll(() => {
  mock.restore();
});

const lead = { id: "lead", workspaceId: "workspace", name: "Ana" } as Lead;
const storedReply = (id: string, body: string, createdAt: string): ConversationMessage => ({
  id, direction: "inbound", senderName: "Ana", body, createdAt,
});

beforeEach(() => {
  conversation = null;
  createConversationMessage.mockClear();
  setConversationReplyIntent.mockClear();
  classifyReplyIntent.mockClear();
});

// Right after the switch from Unipile, reply sync reads the last day of
// messages again under new ids. A reply Unipile already delivered must not be
// stored, re-armed or emailed a second time.
test("a reply already stored under its old Unipile id is not processed again", async () => {
  conversation = { messages: [storedReply("unipile-msg-1", "Sounds good, tell me more", "2026-11-16T10:02:00Z")] };
  const result = await processInboundMessage({
    workspaceId: "workspace", lead, senderName: "Ana",
    body: "Sounds good,  tell me more",
    providerMessageId: "own_ACoSelf123~m~bmV3",
    providerCreatedAt: "2026-11-16T10:00:00Z",
  });
  expect(result.duplicate).toBe(true);
  expect(createConversationMessage).not.toHaveBeenCalled();
  expect(classifyReplyIntent).not.toHaveBeenCalled();
});

test("the same words sent again days later are a new reply", async () => {
  conversation = { messages: [storedReply("unipile-msg-1", "Thanks!", "2026-11-10T10:00:00Z")] };
  await processInboundMessage({
    workspaceId: "workspace", lead, senderName: "Ana", body: "Thanks!",
    providerMessageId: "own_ACoSelf123~m~bmV3",
    providerCreatedAt: "2026-11-16T10:00:00Z",
  });
  expect(createConversationMessage).toHaveBeenCalledTimes(1);
});

// The stored intent belongs to an earlier reply. A later "stop" must be read
// on its own, or the AI keeps answering someone who asked it to stop.
test("a new reply is classified on its own words, not the previous reply's label", async () => {
  conversation = {
    messages: [storedReply("own_ACoSelf123~m~b2xk", "Tell me more", "2026-11-16T09:00:00Z")],
    replyIntent: "warm",
    replyIntentConfidence: 0.9,
  };
  const result = await processInboundMessage({
    workspaceId: "workspace", lead, senderName: "Ana", body: "Not interested, please stop",
    providerMessageId: "own_ACoSelf123~m~bmV3",
    providerCreatedAt: "2026-11-16T10:00:00Z",
  });
  expect(classifyReplyIntent).toHaveBeenCalledTimes(1);
  expect(result).toMatchObject({ duplicate: false, intent: "negative" });
  expect(setConversationReplyIntent).toHaveBeenCalledWith("workspace", "lead", expect.objectContaining({ intent: "negative" }));
});

test("a reply read again by an overlapping sync keeps the label it was acted on", async () => {
  createConversationMessage.mockImplementationOnce(async () => false);
  conversation = {
    messages: [storedReply("own_ACoSelf123~m~bmV3", "Tell me more", "2026-11-16T10:00:00Z")],
    replyIntent: "warm",
    replyIntentConfidence: 0.9,
  };
  await processInboundMessage({
    workspaceId: "workspace", lead, senderName: "Ana", body: "Tell me more",
    providerMessageId: "own_ACoSelf123~m~bmV3",
    providerCreatedAt: "2026-11-16T10:00:00Z",
  });
  expect(classifyReplyIntent).not.toHaveBeenCalled();
});
