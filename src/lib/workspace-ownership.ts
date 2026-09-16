export const ACTIVE_WORKSPACE_COOKIE = "omentir_workspace_id";

export function workspaceBelongsToOwner(
  workspace: { id: string; ownerId: string },
  ownerId: string,
) {
  return workspace.ownerId === ownerId || workspace.id === ownerId;
}

export function isOriginalWorkspace(workspace: { id: string; ownerId: string }) {
  return workspace.id === workspace.ownerId;
}

// Extra workspaces can leave the switcher. The original user-id workspace
// cannot: the next authenticated request recreates it empty via
// ensureWorkspace, which would drop billing until a later Whop sync.
export function workspaceCanBeDeleted(workspace: { id: string; ownerId: string }) {
  return !isOriginalWorkspace(workspace);
}

export function workspaceDisplayName(workspace: { name?: string; id: string }) {
  const name = workspace.name?.trim();
  return name || "Workspace";
}
