import { beforeEach, expect, mock, test } from "bun:test";
import type { Conversation } from "./types";
import { OWNER_MESSAGED_OUTREACH_ERROR } from "./reply-automation-policy";

mock.module("server-only", () => ({}));
mock.module("./lead-avatar-cache", () => ({ queueLeadAvatarPersist: () => undefined }));
const firebase = await import("./firebase");
type Document = Record<string, unknown>;
type Ref = { key: string; get: () => Promise<ReturnType<typeof snapshot>> };
const documents = new Map<string, Document>();
const snapshot = (key: string) => ({
  exists: documents.has(key), data: () => documents.get(key), ref: reference(key),
});
function reference(key: string): Ref {
  return { key, get: async () => snapshot(key) };
}
const writes = {
  update: (ref: Ref, patch: Document) => { documents.set(ref.key, { ...documents.get(ref.key), ...patch }); },
  set: (ref: Ref, value: Document) => { documents.set(ref.key, value); },
};
mock.module("./firebase", () => ({
  ...firebase,
  getDb: () => ({
    collection: (name: string) => ({
      doc: (id: string) => reference(`${name}/${id}`),
      where: (field: string, _operator: string, value: unknown) => ({
        get: async () => ({ docs: [...documents].filter(([key, entry]) =>
          key.startsWith(`${name}/`) && entry[field] === value).map(([key]) => snapshot(key)) }),
      }),
    }),
    runTransaction: async <T>(fn: (transaction: typeof writes & {
      get: (ref: Ref) => Promise<ReturnType<typeof snapshot>>;
    }) => Promise<T>) => fn({ ...writes, get: async (ref) => snapshot(ref.key) }),
    batch: () => ({ ...writes, commit: async () => undefined }),
  }),
}));
const { createConversationMessage } = await import("./data");
const input = {
  workspaceId: "workspace", leadId: "lead", userId: "owner", senderName: "You",
  body: "I will handle this myself", direction: "outbound" as const, providerMessageId: "manual-message",
};
beforeEach(() => {
  documents.clear();
  documents.set("leads/lead", { id: "lead", workspaceId: "workspace", outreachStatus: "messaged" });
  documents.set("campaignEnrollments/sequence", {
    workspaceId: "workspace", leadId: "lead", status: "message_sent", pendingAction: { kind: "message" },
  });
  documents.set("campaignEnrollments/ai-reply", {
    workspaceId: "workspace", leadId: "lead", status: "replied",
  });
  documents.set("campaignEnrollments/other-workspace", {
    workspaceId: "other", leadId: "lead", status: "connected",
  });
});

test("saving a manual reply triggers the existing stop feature immediately for all of that lead's outreach", async () => {
  await createConversationMessage(input);
  expect(documents.get("leads/lead")?.outreachStatus).toBe("stopped");
  for (const key of ["sequence", "ai-reply"]) {
    expect(documents.get(`campaignEnrollments/${key}`)?.status).toBe("stopped");
    expect(documents.get(`campaignEnrollments/${key}`)?.lastError).toBe(OWNER_MESSAGED_OUTREACH_ERROR);
  }
  expect(documents.get("campaignEnrollments/other-workspace")?.status).toBe("connected");
  const conversation = documents.get("conversations/workspace-lead") as unknown as Conversation;
  expect(conversation.messages[0].outboundSource).toBe("manual");
});

test("an automated outbound message is recorded without triggering auto-stop", async () => {
  await createConversationMessage({ ...input, outboundSource: "automation" });
  expect(documents.get("leads/lead")?.outreachStatus).toBe("messaged");
  expect(documents.get("campaignEnrollments/sequence")?.status).toBe("message_sent");
});

test("a retried manual reply still ensures outreach is stopped without duplicating the saved message", async () => {
  expect(await createConversationMessage(input)).toBe(true);
  expect(await createConversationMessage(input)).toBe(false);
  expect(documents.get("campaignEnrollments/sequence")?.status).toBe("stopped");
});
