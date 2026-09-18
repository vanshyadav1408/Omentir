import { workspaceBelongsToOwner, workspaceDisplayName } from "./workspace-ownership";

export type AgentWorkspaceSummary = {
  id: string;
  name: string;
  current: boolean;
};

export function summarizeOwnedWorkspaces(
  workspaces: Array<{ id: string; name?: string }>,
  currentWorkspaceId: string,
): AgentWorkspaceSummary[] {
  return workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspaceDisplayName(workspace),
    current: workspace.id === currentWorkspaceId,
  }));
}

export function ownedWorkspacesVisibleInLocalMode<T extends { id: string }>(
  workspaces: T[],
  localMode: boolean,
  localWorkspaceId: string,
) {
  if (!localMode) return workspaces;
  return workspaces.filter((workspace) => workspace.id === localWorkspaceId);
}

export function agentWorkspaceSwitchDenied(input: {
  ownerId: string;
  target: { id: string; ownerId?: string } | null;
  localMode: boolean;
  localWorkspaceId: string;
  subscriptionActive: boolean;
  apiAccess: boolean;
}): { status: number; message: string } | null {
  if (!input.target || !workspaceBelongsToOwner(input.target, input.ownerId)) {
    return { status: 404, message: "Workspace not found." };
  }
  if (input.localMode && input.target.id !== input.localWorkspaceId) {
    return { status: 403, message: "Local mode can only use the local workspace." };
  }
  if (!input.subscriptionActive) {
    return { status: 402, message: "Active subscription required." };
  }
  if (!input.apiAccess) {
    return { status: 403, message: "API access is available on every paid Omentir plan." };
  }
  return null;
}
