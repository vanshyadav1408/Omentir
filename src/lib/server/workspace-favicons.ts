import "server-only";

import { getProductProfile, updateWorkspaceIdentity } from "./data";
import type { Workspace } from "./types";
import { resolveWebsiteFavicon } from "./website-favicon";

export async function backfillWorkspaceFavicons(
  workspaces: Workspace[],
  limit = 40,
) {
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const pending = workspaces.filter((workspace) => !workspace.faviconUrl).slice(0, limit);

  skipped += Math.max(0, workspaces.length - pending.length);

  for (const workspace of pending) {
    try {
      const profile = await getProductProfile(workspace.id);
      const websiteUrl = profile?.websiteUrl?.trim();
      if (!websiteUrl) {
        skipped += 1;
        continue;
      }
      const faviconUrl = await resolveWebsiteFavicon(websiteUrl);
      if (!faviconUrl) {
        failed += 1;
        continue;
      }
      await updateWorkspaceIdentity(workspace.id, {
        name: profile?.companyName,
        faviconUrl,
      });
      updated += 1;
    } catch (error) {
      failed += 1;
      console.error(
        "Workspace favicon backfill failed",
        workspace.id,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return { updated, skipped, failed, considered: workspaces.length };
}
