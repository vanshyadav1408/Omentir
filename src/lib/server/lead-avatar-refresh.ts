import "server-only";

import { claimSystemTask, getLinkedInAccount, releaseSystemTask, updateLead } from "./data";
import {
  httpsAvatarUrl,
  isExpiredLinkedInMediaUrl,
  leadAvatarRefreshIdentifiers,
} from "../lead-avatar";
import { persistLeadAvatarFromUrl } from "./lead-avatar-cache";
import { retrieveLinkedInProfileAvatar } from "./unipile";
import type { Lead } from "./types";

const inflight = new Map<string, Promise<boolean>>();
const failedAt = new Map<string, number>();
const FAIL_TTL_MS = 10 * 60 * 1000;
const LEAD_REFRESH_LOCK_MS = 2 * 60 * 1000;

function leadAvatarLockId(leadId: string) {
  return `lead-avatar-${leadId}`;
}

async function refreshLeadAvatar(lead: Lead) {
  if ((failedAt.get(lead.id) || 0) + FAIL_TTL_MS > Date.now()) return false;

  const identifiers = leadAvatarRefreshIdentifiers(lead);
  if (!identifiers.length) {
    failedAt.set(lead.id, Date.now());
    return false;
  }

  const account = await getLinkedInAccount(lead.workspaceId);
  if (!account?.accountId || account.status !== "connected") {
    console.error(`[lead-avatar] no connected LinkedIn account for ${lead.id}`);
    return false;
  }

  const lockId = leadAvatarLockId(lead.id);
  const claimed = await claimSystemTask(lockId, LEAD_REFRESH_LOCK_MS).catch((error) => {
    console.error(
      `[lead-avatar] lock failed for ${lead.id}:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  });
  if (!claimed) return false;

  const result = await retrieveLinkedInProfileAvatar({
    accountId: account.accountId,
    identifiers,
  });

  if (!result.ok) {
    switch (result.reason) {
      case "throttled":
      case "unconfigured":
        await releaseSystemTask(lockId).catch(() => undefined);
        break;
      case "exhausted":
      case "missing":
        failedAt.set(lead.id, Date.now());
        break;
      default: {
        const unexpected: never = result.reason;
        throw new Error(`Unhandled avatar retrieve reason: ${unexpected}`);
      }
    }
    return false;
  }

  const current = httpsAvatarUrl(lead.avatarUrl);
  if (current !== result.url) {
    await updateLead(lead.workspaceId, lead.id, { avatarUrl: result.url }).catch((error) => {
      console.error(
        `[lead-avatar] saved a fresh photo URL but could not update ${lead.id}:`,
        error instanceof Error ? error.message : error,
      );
    });
  }

  failedAt.delete(lead.id);
  const persisted = await persistLeadAvatarFromUrl(lead.id, lead.workspaceId, result.persistUrl);
  if (persisted || result.persistUrl === result.url) return persisted;
  return persistLeadAvatarFromUrl(lead.id, lead.workspaceId, result.url);
}

export function leadAvatarUrlIsLive(rawUrl: string | undefined, nowMs = Date.now()) {
  const url = httpsAvatarUrl(rawUrl);
  if (!url) return false;
  return !isExpiredLinkedInMediaUrl(url, nowMs);
}

export function refreshLeadAvatarIfNeeded(lead: Lead) {
  const existing = inflight.get(lead.id);
  if (existing) return existing;

  const work = refreshLeadAvatar(lead).finally(() => {
    inflight.delete(lead.id);
  });
  inflight.set(lead.id, work);
  return work;
}
