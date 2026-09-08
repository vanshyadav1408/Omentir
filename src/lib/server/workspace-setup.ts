import "server-only";

import { cache } from "react";
import { getLatestLinkedInAccount, getProductProfile, listAgents } from "./data";
import { listVerifiedLinkedInAccounts } from "./linkedin-accounts";
import { hasUsableBookingLink } from "@/lib/scheduling-link";
import type { ProductProfile } from "./types";

export type WorkspaceSetup = {
  productProfile: ProductProfile | null;
  linkedInConnected: boolean;
  needsLinkedInReconnect: boolean;
  hasBookingLink: boolean;
  hasAgent: boolean;
  setupDone: boolean;
};

// Overview and per-page setup checks call this in one request. Verification
// hits Unipile, so cache it for the request.
export const getWorkspaceSetup = cache(async function getWorkspaceSetup(
  workspaceId: string,
): Promise<WorkspaceSetup> {
  const [productProfile, linkedInVerification, agents, latestLinkedInAccount] = await Promise.all([
    getProductProfile(workspaceId),
    listVerifiedLinkedInAccounts(workspaceId),
    listAgents(workspaceId),
    getLatestLinkedInAccount(workspaceId),
  ]);
  const linkedInConnected = linkedInVerification.accounts.length > 0;
  const hasBookingLink = hasUsableBookingLink(productProfile?.schedulingLink);
  const hasAgent = agents.length > 0;
  return {
    productProfile,
    linkedInConnected,
    needsLinkedInReconnect: !linkedInConnected && Boolean(latestLinkedInAccount),
    hasBookingLink,
    hasAgent,
    setupDone: linkedInConnected && hasBookingLink && hasAgent,
  };
});
