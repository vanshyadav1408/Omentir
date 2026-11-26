import { beforeEach, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
mock.module("./lead-avatar-cache", () => ({ queueLeadAvatarPersist: () => undefined }));
const firebase = await import("./firebase");
type Document = Record<string, unknown>;
type Ref = { key: string; get: () => Promise<ReturnType<typeof snapshot>> };
const documents = new Map<string, Document>();
const snapshot = (key: string) => ({ exists: documents.has(key), data: () => documents.get(key) });
const reference = (key: string): Ref => ({ key, get: async () => snapshot(key) });
const writes = {
  update: (ref: Ref, patch: Document) => { documents.set(ref.key, { ...documents.get(ref.key), ...patch }); },
  set: (ref: Ref, value: Document) => { documents.set(ref.key, value); },
};
mock.module("./firebase", () => ({
  ...firebase,
  getDb: () => ({
    collection: (name: string) => ({ doc: (id: string) => reference(`${name}/${id}`) }),
    runTransaction: async <T>(fn: (transaction: typeof writes & {
      get: (ref: Ref) => Promise<ReturnType<typeof snapshot>>;
    }) => Promise<T>) => fn({ ...writes, get: async (ref) => snapshot(ref.key) }),
  }),
}));
const { claimOwnerRequestNotification, ownerWasEmailedAboutRequest, releaseOwnerRequestNotification } =
  await import("./data");

const claim = (messageId: string) => claimOwnerRequestNotification("workspace", "lead", messageId);
const emailed = (messageId: string) => ownerWasEmailedAboutRequest("workspace", "lead", messageId);

beforeEach(() => documents.clear());

// Reply sync reads the last day of a thread on every pass. An old reply comes
// back long after newer ones, and must never email the owner a second time.
test("each reply is emailed once, however often and in whatever order sync reads it again", async () => {
  expect(await claim("deck")).toBe(true);
  expect(await claim("deck")).toBe(false);
  // A later reply asking for something else is its own email.
  expect(await claim("case-study")).toBe(true);
  expect(await claim("deck")).toBe(false);
  expect(await claim("case-study")).toBe(false);
});

// The AI reply writes "I'll send it over" only if this says yes. Saying yes
// for a reply nobody was emailed about is the broken promise this prevents.
test("the AI may promise to send only for a reply the owner was emailed about", async () => {
  expect(await emailed("deck")).toBe(false);
  await claim("deck");
  expect(await emailed("deck")).toBe(true);
  expect(await emailed("a-newer-reply")).toBe(false);
});

test("a failed send frees only its own reply, and withdraws the AI's permission to promise", async () => {
  await claim("deck");
  await claim("case-study");
  await releaseOwnerRequestNotification("workspace", "lead", "case-study");
  expect(await emailed("case-study")).toBe(false);
  expect(await claim("case-study")).toBe(true);
  expect(await claim("deck")).toBe(false);
});
