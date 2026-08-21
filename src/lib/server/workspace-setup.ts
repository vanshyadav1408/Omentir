import "server-only";

import { redirect } from "next/navigation";
import {
  getProductProfile,
  listAgents,
  listLinkedInAccounts,
} from "./data";
import { normalizeSchedulingLink } from "@/lib/scheduling-link";
import type { ProductProfile } from "./types";

export type WorkspaceSetup = {
  productProfile: ProductProfile | null;
  linkedInConnected: boolean;
  hasBookingLink: boolean;
  hasAgent: boolean;
  setupDone: boolean;
};

export async function getWorkspaceSetup(workspaceId: string): Promise<WorkspaceSetup> {
  const [productProfile, linkedInAccounts, agents] = await Promise.all([
    getProductProfile(workspaceId),
    listLinkedInAccounts(workspaceId),
    listAgents(workspaceId),
  ]);
  const linkedInConnected = linkedInAccounts.length > 0;
  const hasBookingLink = Boolean(
    normalizeSchedulingLink(productProfile?.schedulingLink || ""),
  );
  const hasAgent = agents.length > 0;
  return {
    productProfile,
    linkedInConnected,
    hasBookingLink,
    hasAgent,
    setupDone: linkedInConnected && hasBookingLink && hasAgent,
  };
}

export async function requireWorkspaceSetup(workspaceId: string) {
  const setup = await getWorkspaceSetup(workspaceId);
  if (!setup.setupDone) redirect("/overview");
  return setup;
}
