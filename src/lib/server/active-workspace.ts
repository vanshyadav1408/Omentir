import "server-only";

import { cookies } from "next/headers";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/workspace-ownership";
import {
  ensureWorkspace,
  findOwnedWorkspace,
  listWorkspacesForOwner,
} from "./data";
import type { Workspace } from "./types";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export async function readActiveWorkspaceCookie() {
  return (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value?.trim() || "";
}

export async function setActiveWorkspaceCookie(workspaceId: string) {
  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, workspaceId, cookieOptions());
}

export async function clearActiveWorkspaceCookie() {
  (await cookies()).delete(ACTIVE_WORKSPACE_COOKIE);
}

export async function resolveActiveWorkspace(userId: string): Promise<Workspace> {
  const primary = await ensureWorkspace(userId);
  const requestedId = await readActiveWorkspaceCookie();
  if (!requestedId || requestedId === primary.id) return primary;

  const selected = await findOwnedWorkspace(userId, requestedId);
  if (selected) return selected;

  await clearActiveWorkspaceCookie();
  return primary;
}

export async function listOwnedWorkspaces(userId: string) {
  return listWorkspacesForOwner(userId);
}
