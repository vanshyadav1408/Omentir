import { beforeEach, expect, mock, test } from "bun:test";
import { createHash } from "crypto";
import type { Lead } from "./types";

mock.module("server-only", () => ({}));
mock.module("./lead-avatar-cache", () => ({ queueLeadAvatarPersist: () => undefined }));
const firebase = await import("./firebase");
let existing: Lead;
const writes: unknown[] = [];
const legacyEntries: Record<string, unknown> = {};
const ref = { id: "person" };
mock.module("./firebase", () => ({
  ...firebase,
  getDb: () => ({
    collection: () => ({
      doc: () => ref,
      where: () => ({ get: async () => ({ docs: [{ data: () => ({ entries: legacyEntries }) }] }) }),
    }),
    runTransaction: async <T>(fn: (transaction: {
      get: () => Promise<{ exists: boolean; data: () => Lead }>;
      update: (...args: unknown[]) => void;
    }) => Promise<T>) => fn({
      get: async () => ({ exists: true, data: () => existing }),
      update: (...args: unknown[]) => { writes.push(args); },
    }),
  }),
}));
const { upsertLead, loadWorkspaceLeadRejections } = await import("./data");
beforeEach(() => {
  writes.length = 0;
  existing = {
    id: "person", workspaceId: "workspace", groupIds: ["first-group"],
    sourceAgentId: "first-agent", name: "Person", outreachStatus: "messaged",
  } as Lead;
});

test("a second agent cannot add a group, change evidence, or increment its lead count", async () => {
  const result = await upsertLead("workspace", "second-group", {
    name: "New evidence", sourceAgentId: "second-agent", outreachStatus: "new",
  });
  expect(result).toEqual(existing);
  expect(writes).toHaveLength(0);
});

test("sharing a group does not allow a second agent to steal lead ownership", async () => {
  const result = await upsertLead("workspace", "first-group", { sourceAgentId: "second-agent" });
  expect(result.sourceAgentId).toBe("first-agent");
  expect(writes).toHaveLength(0);
});

test("the original agent can refresh its own lead without resetting outreach history", async () => {
  const result = await upsertLead("workspace", "first-group", {
    sourceAgentId: "first-agent", title: "Updated role", outreachStatus: "new",
  });
  expect(result.groupIds).toEqual(["first-group"]);
  expect(result.outreachStatus).toBe("messaged");
  expect(result.title).toBe("Updated role");
  expect(writes).toHaveLength(1);
});

test("old rejections from other agents still prevent processing, despite targeting changes and different discovery identity prefixes", async () => {
  const key = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 16);
  legacyEntries[key("person-one")] = { k: "old-rubric", at: "2020-01-01" };
  legacyEntries[key("workspace-person-two")] = { k: "another-agent", at: "2020-01-01" };
  const rejected = await loadWorkspaceLeadRejections("workspace");
  expect(rejected("workspace-person-one")).toBe(true);
  expect(rejected("person-two")).toBe(true);
  expect(rejected("new-person")).toBe(false);
});
