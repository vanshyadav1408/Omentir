import "server-only";

import { findLeadForWorkspace, updateLead } from "./data";
import { httpsAvatarUrl, isExpiredLinkedInMediaUrl } from "../lead-avatar";
import { persistLeadAvatarFromUrl } from "./lead-avatar-cache";
import type { LinkedInInboxThread } from "./types";

// Inbox threads often carry a still-live Unipile headshot after the stored
// lead URL has expired. Copy that photo onto the lead and persist the bytes
// so /leads, Messages, and the dashboard keep showing a face.
export async function syncLeadAvatarsFromInboxThreads(
  workspaceId: string,
  threads: LinkedInInboxThread[],
) {
  const seen = new Set<string>();

  for (const thread of threads) {
    const url = httpsAvatarUrl(thread.avatarUrl);
    if (!url || isExpiredLinkedInMediaUrl(url)) continue;
    const identity = thread.attendeeProviderId || thread.profileUrl;
    if (!identity || seen.has(identity)) continue;
    seen.add(identity);

    const lead = await findLeadForWorkspace({
      workspaceId,
      providerProfileId: thread.attendeeProviderId,
      linkedInUrl: thread.profileUrl,
    });
    if (!lead) continue;

    const current = httpsAvatarUrl(lead.avatarUrl);
    if (!current || isExpiredLinkedInMediaUrl(current)) {
      await updateLead(workspaceId, lead.id, { avatarUrl: url });
    }
    await persistLeadAvatarFromUrl(lead.id, workspaceId, url);
  }
}
