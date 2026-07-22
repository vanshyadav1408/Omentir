import "server-only";

import type { Workspace } from "./types";
import { entitlementsFor } from "./entitlements";

export function hasActiveSubscription(workspace: Pick<Workspace, "billing">) {
  return entitlementsFor(workspace).subscriptionActive;
}

export function requireActiveSubscription(workspace: Pick<Workspace, "billing">) {
  if (!hasActiveSubscription(workspace)) {
    throw new Error("Active subscription required.");
  }
}
