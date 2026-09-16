import { describe, expect, test } from "bun:test";
import {
  workspaceBelongsToOwner,
  workspaceCanBeDeleted,
  workspaceDisplayName,
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

describe("workspaceCanBeDeleted", () => {
  test("lets an extra workspace be removed so a leftover test company can leave the switcher", () => {
    expect(workspaceCanBeDeleted({ id: "ws_extra", ownerId: "user_1" })).toBe(true);
  });

  test("keeps the original user-id workspace because the next page load would recreate it empty and drop billing", () => {
    expect(workspaceCanBeDeleted({ id: "user_1", ownerId: "user_1" })).toBe(false);
  });
});

describe("workspaceDisplayName", () => {
  test("falls back to Workspace when the stored name is blank", () => {
    expect(workspaceDisplayName({ id: "ws", name: "Harborline" })).toBe("Harborline");
    expect(workspaceDisplayName({ id: "ws", name: "  " })).toBe("Workspace");
  });
});
