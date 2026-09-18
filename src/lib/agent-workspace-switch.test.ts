import { describe, expect, test } from "bun:test";
import {
  agentWorkspaceSwitchDenied,
  ownedWorkspacesVisibleInLocalMode,
  summarizeOwnedWorkspaces,
} from "./agent-workspace-switch";

describe("agent workspace switch", () => {
  test("refuses a workspace the token owner does not own so a key cannot jump into someone else's data", () => {
    expect(
      agentWorkspaceSwitchDenied({
        ownerId: "user_1",
        target: { id: "ws_other", ownerId: "user_other" },
        localMode: false,
        localWorkspaceId: "local",
        subscriptionActive: true,
        apiAccess: true,
      }),
    ).toEqual({ status: 404, message: "Workspace not found." });
  });

  test("blocks leaving the local workspace because later calls would 403 in local mode", () => {
    expect(
      agentWorkspaceSwitchDenied({
        ownerId: "local",
        target: { id: "ws_extra", ownerId: "local" },
        localMode: true,
        localWorkspaceId: "local",
        subscriptionActive: true,
        apiAccess: true,
      }),
    ).toEqual({ status: 403, message: "Local mode can only use the local workspace." });
  });

  test("allows an extra workspace the same owner already created", () => {
    expect(
      agentWorkspaceSwitchDenied({
        ownerId: "user_1",
        target: { id: "ws_extra", ownerId: "user_1" },
        localMode: false,
        localWorkspaceId: "local",
        subscriptionActive: true,
        apiAccess: true,
      }),
    ).toBeNull();
  });

  test("hides extra workspaces in local mode so list matches what switch will accept", () => {
    expect(
      ownedWorkspacesVisibleInLocalMode(
        [{ id: "local" }, { id: "ws_extra" }],
        true,
        "local",
      ),
    ).toEqual([{ id: "local" }]);
  });

  test("marks the token's current workspace so get_context can show which one later tools will hit", () => {
    expect(
      summarizeOwnedWorkspaces(
        [
          { id: "user_1", name: "Harborline" },
          { id: "ws_extra", name: "EU" },
        ],
        "ws_extra",
      ),
    ).toEqual([
      { id: "user_1", name: "Harborline", current: false },
      { id: "ws_extra", name: "EU", current: true },
    ]);
  });
});
