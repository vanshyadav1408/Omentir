import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import type { Campaign, CampaignEnrollment, Conversation, ConversationMessage, Lead } from "./types";

mock.module("server-only", () => ({}));

let conversation: Partial<Conversation> | null = null;
let workspace: { id: string; billing: { status?: string }; notificationEmail?: string } = { id: "workspace", billing: {} };
let campaigns: Partial<Campaign>[] = [];
let enrollments: Partial<CampaignEnrollment>[] = [];
let outcomeClaimFree = false;
// Stands in for the per-reply lock: the first claim for a reply wins.
const ownerRequestClaims = new Set<string>();
const createConversationMessage = mock(async () => true);
const setConversationReplyIntent = mock(async () => undefined);
const classifyReplyIntent = mock(async () => ({ intent: "negative", confidence: 0.95, reason: "asked to stop", nextStepHint: "", ownerRequest: "" }));
const sendOwnerRequestNotification = mock<(input: unknown) => Promise<object>>(async () => ({}));
const sendInterestedLeadNotification = mock<(input: unknown) => Promise<object>>(async () => ({}));
const releaseOwnerRequestNotification = mock(async (_workspaceId: string, _leadId: string, messageId: string) => {
  ownerRequestClaims.delete(messageId);
});

mock.module("./data", () => ({
  claimLeadOutcomeNotification: async () => outcomeClaimFree,
  claimOwnerRequestNotification: async (_workspaceId: string, _leadId: string, messageId: string) => {
    if (ownerRequestClaims.has(messageId)) return false;
    ownerRequestClaims.add(messageId);
    return true;
  },
  claimReplyNotification: async () => false,
  createConversationMessage,
  findLeadForWorkspace: async () => null,
  getConversation: async () => conversation,
  getLeadsByIds: async () => [],
  getLinkedInAccountForWorkspace: async () => null,
  getProductProfile: async () => ({}),
  getWorkspace: async () => workspace,
  listCampaignEnrollments: async () => enrollments,
  listCampaigns: async () => campaigns,
  listWorkspaceIdsSharingLinkedIn: async () => ["workspace"],
  logAutomationRun: async () => undefined,
  planActionSlots: async () => [],
  releaseLeadOutcomeNotification: async () => undefined,
  releaseOwnerRequestNotification,
  releaseReplyNotification: async () => undefined,
  setConversationReplyIntent,
  updateEnrollment: async () => undefined,
  updateLead: async () => undefined,
}));
mock.module("./gemini", () => ({ classifyReplyIntent, draftCampaignMessage: async () => "" }));
mock.module("./email", () => ({
  emailWasSkipped: () => false,
  sendInterestedLeadNotification,
  sendOwnerRequestNotification,
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
  workspace = { id: "workspace", billing: {} };
  campaigns = [];
  enrollments = [];
  outcomeClaimFree = false;
  ownerRequestClaims.clear();
  createConversationMessage.mockClear();
  setConversationReplyIntent.mockClear();
  classifyReplyIntent.mockClear();
  sendOwnerRequestNotification.mockClear();
  sendInterestedLeadNotification.mockClear();
  releaseOwnerRequestNotification.mockClear();
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

// A lead said "Yes please!" to an offered overview, the AI answered "I'll send
// that over to you today", and nobody sent anything because the owner never
// knew. Omentir can only type text, so a request for a file, a video or an
// email has to reach the person who can send it.
const OFFER = "I can send over a short demo video if that's useful.";
const YES_PLEASE = {
  workspaceId: "workspace", lead, senderName: "Ana", body: "Yes please!",
  providerMessageId: "own_ACoSelf123~m~eWVz",
  providerCreatedAt: "2026-11-24T08:09:00Z",
};
function aiRunThread(replyHandling: Campaign["replyHandling"] = "ai") {
  workspace = { id: "workspace", billing: { status: "active" }, notificationEmail: "owner@example.com" };
  campaigns = [{ id: "campaign", name: "Sales leaders", replyHandling }];
  enrollments = [{ id: "enrollment", leadId: "lead", campaignId: "campaign", status: "message_sent" }];
  conversation = {
    messages: [{ id: "sent-1", direction: "outbound", senderName: "You", body: OFFER, createdAt: "2026-11-24T07:00:00Z" }],
  };
}
const asksFor = (ownerRequest: string, intent = "warm", confidence = 0.8) =>
  classifyReplyIntent.mockImplementationOnce(async () => ({ intent, confidence, reason: "", nextStepHint: "", ownerRequest }));

test("the owner is emailed when a lead accepts something the AI can't send, with the offer they said yes to", async () => {
  aiRunThread();
  asksFor("A demo video");
  await processInboundMessage(YES_PLEASE);
  expect(sendOwnerRequestNotification).toHaveBeenCalledTimes(1);
  expect(sendOwnerRequestNotification.mock.calls[0][0]).toMatchObject({
    to: "owner@example.com",
    request: "A demo video",
    message: "Yes please!",
    // "Yes please!" alone tells the owner nothing.
    previousMessage: OFFER,
    aiWillReply: true,
  });
  // Stored so the AI reply knows what it may say it will send.
  expect(setConversationReplyIntent).toHaveBeenCalledWith("workspace", "lead", expect.objectContaining({ ownerRequest: "A demo video" }));
});

test("reply sync reading the same reply again does not email the owner twice", async () => {
  aiRunThread();
  asksFor("A demo video");
  await processInboundMessage(YES_PLEASE);
  createConversationMessage.mockImplementationOnce(async () => false);
  conversation = {
    messages: [...(conversation?.messages || []), storedReply(YES_PLEASE.providerMessageId, "Yes please!", "2026-11-24T08:09:00Z")],
    replyIntent: "warm",
    replyIntentConfidence: 0.8,
    replyOwnerRequest: "A demo video",
  };
  await processInboundMessage(YES_PLEASE);
  expect(sendOwnerRequestNotification).toHaveBeenCalledTimes(1);
});

test("a reply that asks for nothing sends no owner email, so the email keeps meaning something", async () => {
  aiRunThread();
  asksFor("");
  await processInboundMessage({ ...YES_PLEASE, body: "How is it different from Lemlist?" });
  expect(sendOwnerRequestNotification).not.toHaveBeenCalled();
});

test("hand-off outreach gets no extra email, because the owner has owned the thread since the first reply", async () => {
  aiRunThread("handoff");
  asksFor("A demo video");
  await processInboundMessage(YES_PLEASE);
  expect(sendOwnerRequestNotification).not.toHaveBeenCalled();
});

test("a hot reply is one email, the interest one, and it carries what they asked for", async () => {
  aiRunThread();
  outcomeClaimFree = true;
  asksFor("A demo video", "hot", 0.9);
  await processInboundMessage(YES_PLEASE);
  expect(sendOwnerRequestNotification).not.toHaveBeenCalled();
  expect(sendInterestedLeadNotification).toHaveBeenCalledTimes(1);
  expect(sendInterestedLeadNotification.mock.calls[0][0]).toMatchObject({ ownerRequest: "A demo video" });
});

test("a 'not now, but send me the PDF' reply still reaches the owner, and says the AI went quiet", async () => {
  aiRunThread();
  asksFor("The product PDF", "not_now", 0.9);
  await processInboundMessage({ ...YES_PLEASE, body: "Not this quarter, but send me the PDF for later." });
  expect(sendOwnerRequestNotification.mock.calls[0][0]).toMatchObject({ request: "The product PDF", aiWillReply: false });
});

test("a failed send frees that reply, so the next sync pass tries again instead of losing the request", async () => {
  aiRunThread();
  asksFor("A demo video");
  sendOwnerRequestNotification.mockImplementationOnce(async () => {
    throw new Error("Resend is down");
  });
  await processInboundMessage(YES_PLEASE);
  expect(releaseOwnerRequestNotification).toHaveBeenCalledWith("workspace", "lead", YES_PLEASE.providerMessageId);
  expect(ownerRequestClaims.has(YES_PLEASE.providerMessageId)).toBe(false);
});
