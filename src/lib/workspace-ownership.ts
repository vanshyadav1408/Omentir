export const ACTIVE_WORKSPACE_COOKIE = "omentir_workspace_id";

export function workspaceBelongsToOwner(
  workspace: { id: string; ownerId?: string },
  ownerId: string,
) {
  return workspace.ownerId === ownerId || workspace.id === ownerId;
}

export function isOriginalWorkspace(
  workspace: { id: string; ownerId?: string },
  ownerId = workspace.ownerId || workspace.id,
) {
  return workspace.id === ownerId;
}

// Extra workspaces are removed from the switcher. The original user-id
// workspace is emptied instead: deleting that document would make the next
// page load recreate it blank via ensureWorkspace and drop billing until a
// later Whop sync.
export function workspaceIsRemovedOnDelete(
  workspace: { id: string; ownerId?: string },
  ownerId = workspace.ownerId || workspace.id,
) {
  return !isOriginalWorkspace(workspace, ownerId);
}

export function workspaceDisplayName(workspace: { name?: string; id: string }) {
  const name = workspace.name?.trim();
  return name || "Workspace";
}
