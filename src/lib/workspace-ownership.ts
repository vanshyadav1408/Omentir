export const ACTIVE_WORKSPACE_COOKIE = "omentir_workspace_id";

export function workspaceBelongsToOwner(
  workspace: { id: string; ownerId: string },
  ownerId: string,
) {
  return workspace.ownerId === ownerId || workspace.id === ownerId;
}

export function workspaceDisplayName(workspace: { name?: string; id: string }) {
  const name = workspace.name?.trim();
  return name || "Workspace";
}
