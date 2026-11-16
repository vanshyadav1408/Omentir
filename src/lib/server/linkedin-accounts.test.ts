import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import type { LinkedInAccount } from "./types";

// Verification disconnects every account it cannot confirm. The stored own
// client session is the only source of truth; accounts left from the old
// Unipile integration have none and must show up as needing a reconnect.

mock.module("server-only", () => ({}));

let accounts: LinkedInAccount[] = [];
let ownStatuses = new Map<string, "active" | "expired">();
const disconnected: string[] = [];
const completed: string[] = [];

mock.module("./data", () => ({
  listLinkedInAccounts: async () => accounts,
  disconnectLinkedInAccount: async (_workspaceId: string, id: string) => {
    disconnected.push(id);
  },
  completeLinkedInAccountRetirement: async (_id: string, retiredId: string) => { completed.push(retiredId); },
  listAllLinkedInAccounts: async () => accounts,
  listConnectedLinkedInAccountsEverywhere: async () => accounts,
  markLinkedInAccountDisconnected: async (_workspaceId: string, id: string) => {
    disconnected.push(id);
    return null;
  },
  saveLinkedInAccount: async () => null,
  workspaceForLinkedInAccountCap: async () => ({}),
}));
mock.module("./linkedin", () => ({
  deleteLinkedInAccount: async () => undefined,
  retrieveOwnLinkedInProfile: async () => null,
}));
mock.module("./linkedin-own/session-store", () => ({
  listOwnSessionStatuses: async (ids: string[]) =>
    new Map(ids.filter((id) => ownStatuses.has(id)).map((id) => [id, ownStatuses.get(id)!])),
}));
mock.module("./entitlements", () => ({ entitlementsFor: () => ({ limits: { linkedInAccounts: 1 } }) }));

const { disconnectLegacyLinkedInAccounts, listVerifiedLinkedInAccounts } = await import("./linkedin-accounts");

function account(id: string, accountId: string): LinkedInAccount {
  return {
    id,
    workspaceId: "ws",
    provider: accountId.startsWith("own_") ? "own" : "unipile",
    accountId,
    displayName: id,
    status: "connected",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  };
}

beforeEach(() => {
  accounts = [];
  ownStatuses = new Map();
  disconnected.length = 0;
  completed.length = 0;
});

afterAll(() => {
  mock.restore();
});

test("own accounts with a live session stay connected", async () => {
  accounts = [account("doc-own", "own_ACoAAlive01")];
  ownStatuses.set("own_ACoAAlive01", "active");
  const result = await listVerifiedLinkedInAccounts("ws");
  expect(result.accounts.map((item) => item.id)).toEqual(["doc-own"]);
  expect(disconnected).toEqual([]);
});

test("own accounts whose session expired or vanished ask for a reconnect", async () => {
  accounts = [account("doc-expired", "own_ACoAAexpired"), account("doc-missing", "own_ACoAAmissing")];
  ownStatuses.set("own_ACoAAexpired", "expired");
  const result = await listVerifiedLinkedInAccounts("ws");
  expect(result.accounts).toEqual([]);
  expect(disconnected.sort()).toEqual(["doc-expired", "doc-missing"]);
});

test("old Unipile accounts are disconnected so the owner is asked to reconnect, while live own accounts stay", async () => {
  accounts = [account("doc-unipile", "UnipileAbc"), account("doc-own", "own_ACoAAlive01")];
  ownStatuses.set("own_ACoAAlive01", "active");
  const result = await listVerifiedLinkedInAccounts("ws");
  expect(result.accounts.map((item) => item.id)).toEqual(["doc-own"]);
  expect(result.staleAccounts.map((item) => item.id)).toEqual(["doc-unipile"]);
  expect(disconnected).toEqual(["doc-unipile"]);
});

test("leftover retirement markers from a replaced Unipile account are cleared", async () => {
  accounts = [{ ...account("doc-own", "own_ACoAAlive01"), retiredUnipileAccountIds: ["old-billable"] }];
  ownStatuses.set("own_ACoAAlive01", "active");
  expect((await listVerifiedLinkedInAccounts("ws")).accounts).toHaveLength(1);
  expect(completed).toEqual(["old-billable"]);
  expect(disconnected).toEqual([]);
});

test("the tick disconnects old Unipile accounts even when the owner never opens the app", async () => {
  // Verification only runs when someone loads the app. Until then the tick
  // saw these accounts as connected and kept trying to send through them,
  // which failed every time and used up each lead's retries.
  accounts = [account("doc-unipile", "UnipileAbc"), account("doc-own", "own_ACoAAlive01")];
  expect(await disconnectLegacyLinkedInAccounts()).toBe(1);
  expect(disconnected).toEqual(["doc-unipile"]);
});
