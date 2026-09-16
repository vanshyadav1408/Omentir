import { describe, expect, test } from "bun:test";
import {
  canonicalLinkedInAccountsByProvider,
  linkedInAccountIsOnOwnedWorkspace,
} from "./linkedin-account-sharing";

describe("canonicalLinkedInAccountsByProvider", () => {
  test("keeps one Unipile account so a new workspace sees the owner's existing LinkedIn instead of asking to connect again", () => {
    const shared = canonicalLinkedInAccountsByProvider([
      { accountId: "unipile-1", createdAt: "2026-01-02T00:00:00.000Z", workspaceId: "ws-new" },
      { accountId: "unipile-1", createdAt: "2026-01-01T00:00:00.000Z", workspaceId: "ws-home" },
    ]);
    expect(shared).toEqual([
      { accountId: "unipile-1", createdAt: "2026-01-01T00:00:00.000Z", workspaceId: "ws-home" },
    ]);
  });
});

describe("linkedInAccountIsOnOwnedWorkspace", () => {
  test("lets a workspace use a LinkedIn account stored on a sibling workspace owned by the same user", () => {
    expect(linkedInAccountIsOnOwnedWorkspace("ws-home", ["ws-home", "ws-new"])).toBe(true);
  });

  test("rejects a LinkedIn account that belongs to a different owner", () => {
    expect(linkedInAccountIsOnOwnedWorkspace("ws-other", ["ws-home", "ws-new"])).toBe(false);
  });
});
