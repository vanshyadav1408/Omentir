import { describe, expect, test } from "bun:test";
import {
  isOriginalWorkspace,
  ownerBillingWorkspaceIds,
  workspaceBelongsToOwner,
  workspaceDisplayName,
  workspaceIsRemovedOnDelete,
} from "./workspace-ownership";

describe("workspaceBelongsToOwner", () => {
  test("treats the original user-id workspace as owned even if ownerId is missing from a caller", () => {
    expect(
      workspaceBelongsToOwner({ id: "user_1", ownerId: "user_1" }, "user_1"),
    ).toBe(true);
    expect(
      workspaceBelongsToOwner({ id: "ws_2", ownerId: "user_1" }, "user_1"),
    ).toBe(true);
    expect(
      workspaceBelongsToOwner({ id: "ws_2", ownerId: "user_1" }, "user_other"),
    ).toBe(false);
  });
});

describe("workspaceIsRemovedOnDelete", () => {
  test("lets an extra workspace leave the switcher so a leftover test company can be removed", () => {
    expect(workspaceIsRemovedOnDelete({ id: "ws_extra", ownerId: "user_1" })).toBe(true);
  });

  test("empties the original user-id workspace instead of removing it because the next page load would recreate it blank and drop billing", () => {
    expect(isOriginalWorkspace({ id: "user_1", ownerId: "user_1" })).toBe(true);
    expect(workspaceIsRemovedOnDelete({ id: "user_1", ownerId: "user_1" })).toBe(false);
  });

  test("treats a workspace whose id is the owner as original even when ownerId was never stored", () => {
    expect(isOriginalWorkspace({ id: "user_1" }, "user_1")).toBe(true);
    expect(workspaceIsRemovedOnDelete({ id: "user_1" }, "user_1")).toBe(false);
  });
});

describe("workspaceDisplayName", () => {
  test("falls back to Workspace when the stored name is blank", () => {
    expect(workspaceDisplayName({ id: "ws", name: "Harborline" })).toBe("Harborline");
    expect(workspaceDisplayName({ id: "ws", name: "  " })).toBe("Workspace");
  });
});

describe("ownerBillingWorkspaceIds", () => {
  test("includes the original account and the extra workspace so Extra Seats checkout metadata can match either id", () => {
    expect(ownerBillingWorkspaceIds("user_1", "ws_extra").sort()).toEqual(["user_1", "ws_extra"]);
    expect(ownerBillingWorkspaceIds("user_1")).toEqual(["user_1"]);
  });
});
