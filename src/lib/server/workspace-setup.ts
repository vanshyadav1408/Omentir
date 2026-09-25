import "server-only";

import { cache } from "react";
import { after } from "next/server";
import { getLatestLinkedInAccount, getProductProfile, listAgents, listLinkedInAccounts } from "./data";
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

// Overview calls this on every visit. Stored connection state is enough to
// render (Leads and Messages gate the same way); the Unipile verification that
// disconnects dead sessions runs after the response, so a dead session shows
// the reconnect prompt from the next visit instead of costing every visit a
// Unipile round trip.
export const getWorkspaceSetup = cache(async function getWorkspaceSetup(
  workspaceId: string,
): Promise<WorkspaceSetup> {
  const [productProfile, storedAccounts, agents, latestLinkedInAccount] = await Promise.all([
    getProductProfile(workspaceId),
    listLinkedInAccounts(workspaceId),
    listAgents(workspaceId),
    getLatestLinkedInAccount(workspaceId),
  ]);
  if (storedAccounts.length) {
    after(() =>
      listVerifiedLinkedInAccounts(workspaceId).catch((error) => {
        console.error(
          "[workspace-setup] LinkedIn verification failed:",
          error instanceof Error ? error.message : error,
        );
      }),
    );
  }
  const linkedInConnected = storedAccounts.length > 0;
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
