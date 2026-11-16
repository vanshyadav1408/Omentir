import { describe, expect, test } from "bun:test";
import { resolveUsableLinkedInAccount } from "./linkedin-account-fallback";

const account = (id: string, status: string, accountId: string, displayName: string) => ({ id, status, accountId, displayName });

describe("resolveUsableLinkedInAccount", () => {
  test("keeps the agent's account when it is still connected so a chosen sender is not replaced", () => {
    const requested = account("agent-account", "connected", "own_ACoAna", "Ana Silva");
    const other = account("default-account", "connected", "own_ACoBen", "Ben Okoro");
    expect(resolveUsableLinkedInAccount(requested, [other, requested])).toBe(requested);
  });

  test("uses the same person's reconnected row when the stored row is disconnected so reconnect unblocks invites", () => {
    const requested = account("old-row", "disconnected", "own_ACoAna", "Ana Silva");
    const reconnected = account("new-row", "connected", "own_ACoAna", "Ana Silva");
    expect(resolveUsableLinkedInAccount(requested, [reconnected])).toBe(reconnected);
  });

  test("uses the own-client account that replaced an old Unipile account under the same name", () => {
    const requested = account("unipile-row", "disconnected", "Xk3pUnipileId", "Ana Silva");
    const ben = account("ben-row", "connected", "own_ACoBen", "Ben Okoro");
    const ana = account("ana-row", "connected", "own_ACoAna", "Ana  Silva");
    expect(resolveUsableLinkedInAccount(requested, [ben, ana])).toBe(ana);
  });

  // Two seats in one workspace: Ben reconnected after the switch, Ana did not
  // yet. Ana's campaign must wait for Ana, not invite and message as Ben.
  test("never sends a disconnected teammate's campaign from another person's profile", () => {
    const anaUnipile = account("ana-row", "disconnected", "Xk3pUnipileId", "Ana Silva");
    const anaOwn = account("ana-own", "disconnected", "own_ACoAna", "Ana Silva");
    const ben = account("ben-row", "connected", "own_ACoBen", "Ben Okoro");
    expect(resolveUsableLinkedInAccount(anaUnipile, [ben])).toBe(null);
    expect(resolveUsableLinkedInAccount(anaOwn, [ben])).toBe(null);
  });

  test("uses the workspace default when the agent has no account id yet", () => {
    const fallback = account("default-account", "connected", "own_ACoAna", "Ana Silva");
    expect(resolveUsableLinkedInAccount(null, [fallback])).toBe(fallback);
    expect(resolveUsableLinkedInAccount(undefined, [fallback])).toBe(fallback);
  });

  test("stays empty when no account is connected so invites do not go out from nowhere", () => {
    expect(resolveUsableLinkedInAccount(account("old-account", "disconnected", "own_ACoAna", "Ana"), [])).toBe(null);
    expect(resolveUsableLinkedInAccount(null, [])).toBe(null);
  });
});
