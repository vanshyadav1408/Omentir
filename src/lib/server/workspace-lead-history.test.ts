import { beforeEach, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
const firebase = await import("./firebase");
const entries = new Map<string, Record<string, unknown>>();
let tail = Promise.resolve();
const transaction = {
  get: async (ref: { id: string }) => ({ data: () => entries.get(ref.id) }),
  set: (ref: { id: string }, value: Record<string, unknown>) => { entries.set(ref.id, value); },
  delete: (ref: { id: string }) => { entries.delete(ref.id); },
};
mock.module("./firebase", () => ({
  ...firebase,
  getDb: () => ({
    collection: () => ({ doc: (id: string) => ({ id, get: async () => ({ data: () => entries.get(id) }) }) }),
    runTransaction: <T>(fn: (value: typeof transaction) => Promise<T>) => {
      const result = tail.then(() => fn(transaction));
      tail = result.then(() => undefined, () => undefined);
      return result;
    },
  }),
}));
const { claimWorkspaceLead, wasWorkspaceLeadProcessed } = await import("./workspace-lead-history");
const lead = { linkedInUrl: "https://www.linkedin.com/in/same-person/", providerProfileId: "abc123" };
beforeEach(() => entries.clear());

test("a successful verdict prevents every later agent in that workspace from processing either identity alias", async () => {
  const finish = await claimWorkspaceLead("workspace-a", lead);
  expect(finish).not.toBeNull();
  await finish!(true);
  expect(await wasWorkspaceLeadProcessed("workspace-a", { linkedInUrl: "https://linkedin.com/in/same-person?trk=search" })).toBe(true);
  expect(await wasWorkspaceLeadProcessed("workspace-a", { providerProfileId: "ABC123" })).toBe(true);
  expect(await claimWorkspaceLead("workspace-a", lead)).toBeNull();
  expect(await wasWorkspaceLeadProcessed("workspace-b", lead)).toBe(false);
  expect(await claimWorkspaceLead("workspace-b", lead)).not.toBeNull();
});

test("concurrent agents reserve a person once, before spending a Jev call or quota", async () => {
  const claims = await Promise.all([claimWorkspaceLead("workspace-a", lead), claimWorkspaceLead("workspace-a", lead)]);
  expect(claims.filter(Boolean)).toHaveLength(1);
});

test("provider failure releases the person so an outage does not permanently exclude a buyer", async () => {
  const finish = await claimWorkspaceLead("workspace-a", lead);
  await finish!(false);
  expect(await wasWorkspaceLeadProcessed("workspace-a", lead)).toBe(false);
  expect(await claimWorkspaceLead("workspace-a", lead)).not.toBeNull();
});

test("abandoned reservations expire, while successful verdicts do not", async () => {
  await claimWorkspaceLead("workspace-a", lead);
  for (const entry of entries.values()) entry.lockedUntil = Date.now() - 1;
  const finish = await claimWorkspaceLead("workspace-a", lead);
  expect(finish).not.toBeNull();
  await finish!(true);
  expect([...entries.values()].every((entry) => entry.processed === true && !entry.lockedUntil)).toBe(true);
});
