import { describe, expect, mock, test } from "bun:test";

const scheduled: Array<() => unknown> = [];
let storedAccounts: Array<{ accountId: string }> = [];
let verifyCalls = 0;

mock.module("server-only", () => ({}));
mock.module("next/server", () => ({
  after: (work: () => unknown) => {
    scheduled.push(work);
  },
}));
mock.module("./data", () => ({
  getProductProfile: async () => ({ schedulingLink: "https://cal.com/founder/intro" }),
  listLinkedInAccounts: async () => storedAccounts,
  listAgents: async () => [{ id: "agent-1" }],
  getLatestLinkedInAccount: async () => storedAccounts[0] ?? null,
}));
mock.module("./linkedin-accounts", () => ({
  // Unipile never answers: the setup check must not care.
  listVerifiedLinkedInAccounts: () => {
    verifyCalls += 1;
    return new Promise(() => {});
  },
}));

const { getWorkspaceSetup } = await import("./workspace-setup");

describe("getWorkspaceSetup", () => {
  test("renders Overview from stored LinkedIn state without waiting on Unipile", async () => {
    storedAccounts = [{ accountId: "acc-1" }];
    scheduled.length = 0;
    verifyCalls = 0;

    const setup = await Promise.race([
      getWorkspaceSetup("ws-stored"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("setup waited on Unipile verification")), 200),
      ),
    ]);

    expect(setup.linkedInConnected).toBe(true);
    expect(setup.setupDone).toBe(true);
    // Verification still happens, after the response, so dead sessions are
    // still disconnected and the next visit shows the reconnect prompt.
    expect(verifyCalls).toBe(0);
    expect(scheduled).toHaveLength(1);
    void scheduled[0]();
    expect(verifyCalls).toBe(1);
  });

  test("skips the background Unipile call when nothing is connected", async () => {
    storedAccounts = [];
    scheduled.length = 0;

    const setup = await getWorkspaceSetup("ws-empty");

    expect(setup.linkedInConnected).toBe(false);
    expect(scheduled).toHaveLength(0);
  });
});
