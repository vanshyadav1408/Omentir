import { describe, expect, test } from "bun:test";
import { resolveUsableLinkedInAccount } from "./linkedin-account-fallback";

describe("resolveUsableLinkedInAccount", () => {
  test("keeps the agent's account when it is still connected so a chosen sender is not replaced", () => {
    const requested = { id: "agent-account", status: "connected" };
    const fallback = { id: "default-account", status: "connected" };
    expect(resolveUsableLinkedInAccount(requested, fallback)).toBe(requested);
  });

  test("uses the workspace default when the stored account is disconnected so reconnect unblocks invites", () => {
    const requested = { id: "old-account", status: "disconnected" };
    const fallback = { id: "default-account", status: "connected" };
    expect(resolveUsableLinkedInAccount(requested, fallback)).toBe(fallback);
  });

  test("uses the workspace default when the agent has no account id yet", () => {
    const fallback = { id: "default-account", status: "connected" };
    expect(resolveUsableLinkedInAccount(null, fallback)).toBe(fallback);
    expect(resolveUsableLinkedInAccount(undefined, fallback)).toBe(fallback);
  });

  test("stays empty when no account is connected so invites do not go out from nowhere", () => {
    expect(
      resolveUsableLinkedInAccount({ id: "old-account", status: "disconnected" }, null),
    ).toBe(null);
  });
});
