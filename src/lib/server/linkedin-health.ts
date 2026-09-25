import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import {
  MAX_DAILY_INVITE_WITHDRAWALS,
  acceptanceSample,
  normalizeInviteWithdrawAfterDays,
  staleInvitationIds,
  type LinkedInAccountHealth,
} from "@/lib/linkedin-health";
import { type AutomationSafetyMode, isWorkspaceAutomationPaused } from "./automation-safety";
import {
  claimSystemTask,
  listCampaignEnrollmentPreviews,
  listCampaigns,
  listLeadAgentRefs,
  listLinkedInAccounts,
  logAutomationRun,
} from "./data";
import { cleanId, getDb, nowIso } from "./firebase";
import { hasActiveSubscription } from "./subscription";
import { STAGE_ACCEPTED, enrollmentProgressStage, leadStage } from "@/lib/outreach-stage";
import type { LinkedInAccount, Workspace } from "./types";
import { listSentInvitations, withdrawSentInvitation } from "./unipile";

// Must match PROFILE_VIEW_DAILY_LIMIT in unipile.ts, which enforces it.
const PROFILE_VIEW_DAILY_LIMIT = 75;

// Same doc the profile-view budget writes (consumeProfileViewBudget): keyed by
// the Unipile account id and the UTC day.
function accountUsageRef(unipileAccountId: string, day = new Date().toISOString().slice(0, 10)) {
  return getDb().collection("usageDays").doc(`account-${cleanId(unipileAccountId)}-${day}`);
}

// The account a campaign sends from: its own if connected, else the workspace's
// first connected one, as getLinkedInAccountForWorkspace resolves it.
function sendingAccountId(connected: LinkedInAccount[], linkedInAccountId?: string) {
  return (connected.find((account) => account.id === linkedInAccountId) ?? connected[0])?.id;
}

export async function loadLinkedInHealth(workspace: Workspace): Promise<LinkedInAccountHealth[]> {
  // The enrollment and lead reads are the same full-workspace projections the
  // Overview page loads; this only runs when Settings shows the accounts tab.
  const [accounts, campaigns, enrollments, leads] = await Promise.all([
    listLinkedInAccounts(workspace.id),
    listCampaigns(workspace.id),
    listCampaignEnrollmentPreviews(workspace.id),
    listLeadAgentRefs(workspace.id),
  ]);
  const withdrawAfterDays = normalizeInviteWithdrawAfterDays(
    workspace.settings.inviteWithdrawAfterDays,
  );
  const nowMs = Date.now();
  const leadStatus = new Map(leads.map((lead) => [lead.id, lead.outreachStatus]));
  const accountByCampaign = new Map(
    campaigns.map((campaign) => [campaign.id, sendingAccountId(accounts, campaign.linkedInAccountId)]),
  );
  const invitesByAccount = new Map<string, Array<{ sentAt?: string; accepted: boolean }>>();
  for (const enrollment of enrollments) {
    if (!enrollment.connectionSentAt) continue;
    const accountId = accountByCampaign.get(enrollment.campaignId);
    if (!accountId) continue;
    // Either record can be the one that remembers the accept: the enrollment
    // collapses to "stopped" and the lead's status gets written back down.
    const stage = Math.max(
      enrollmentProgressStage(enrollment.status, enrollment.connectionSentAt),
      leadStage(leadStatus.get(enrollment.leadId)),
    );
    const list = invitesByAccount.get(accountId) ?? [];
    list.push({ sentAt: enrollment.connectionSentAt, accepted: stage >= STAGE_ACCEPTED });
    invitesByAccount.set(accountId, list);
  }

  return Promise.all(
    accounts.map(async (account) => {
      const [{ invitations, complete }, usage] = await Promise.all([
        listSentInvitations(account.accountId),
        accountUsageRef(account.accountId).get(),
      ]);
      const sample = acceptanceSample(invitesByAccount.get(account.id) ?? [], nowMs);
      return {
        linkedInAccountId: account.id,
        pendingInvites: invitations.length,
        pendingComplete: complete,
        invitesSentInWindow: sample.sent,
        acceptedInWindow: sample.accepted,
        profileViewsToday: Number(usage.data()?.profileViews || 0),
        profileViewLimit: PROFILE_VIEW_DAILY_LIMIT,
        withdrawAfterDays,
      } satisfies LinkedInAccountHealth;
    }),
  );
}

// A run withdraws at most this many, every WITHDRAW_INTERVAL_MS, so the daily
// cap is spread across the day instead of landing in one burst, and a run never
// holds the tick for more than about half a minute.
const WITHDRAWALS_PER_RUN = 10;
const WITHDRAW_INTERVAL_MS = 2 * 60 * 60 * 1000;

function humanPause() {
  return new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1500));
}

async function withdrawForAccount(workspace: Workspace, account: LinkedInAccount, afterDays: number) {
  if (!(await claimSystemTask(`invite-withdraw-${account.accountId}`, WITHDRAW_INTERVAL_MS))) {
    return 0;
  }
  const usageRef = accountUsageRef(account.accountId);
  const usedToday = Number((await usageRef.get()).data()?.invitesWithdrawn || 0);
  const budget = Math.min(WITHDRAWALS_PER_RUN, MAX_DAILY_INVITE_WITHDRAWALS - usedToday);
  if (budget <= 0) return 0;

  // A partial list is fine here: anything it did return with an old enough
  // date is still safe to withdraw.
  const { invitations } = await listSentInvitations(account.accountId);
  const ids = staleInvitationIds(invitations, { nowMs: Date.now(), afterDays, max: budget });

  let withdrawn = 0;
  let failure: string | undefined;
  for (const id of ids) {
    try {
      await withdrawSentInvitation(account.accountId, id);
      withdrawn += 1;
      await usageRef.set(
        { accountId: account.accountId, invitesWithdrawn: FieldValue.increment(1), updatedAt: nowIso() },
        { merge: true },
      );
    } catch (error) {
      // Stop on the first failure: a provider error on one withdrawal usually
      // means the rest would fail the same way.
      failure = error instanceof Error ? error.message : "unknown error";
      break;
    }
    await humanPause();
  }

  if (withdrawn || failure) {
    const weeks = Math.round(afterDays / 7);
    await logAutomationRun({
      workspaceId: workspace.id,
      kind: "campaign",
      status: failure ? "error" : "completed",
      message: failure
        ? `Withdrew ${withdrawn} invitation${withdrawn === 1 ? "" : "s"} pending over ${weeks} weeks on ${account.displayName}, then stopped: ${failure}`
        : `Withdrew ${withdrawn} invitation${withdrawn === 1 ? "" : "s"} pending over ${weeks} weeks on ${account.displayName}.`,
    }).catch((error) => console.error("[invite-withdraw] failed to log run:", error));
  }
  return withdrawn;
}

// On for every workspace at 28 days unless its owner set 0 in Settings, so the
// job walks connected accounts rather than querying for the setting: most
// workspaces never store it.
export async function runInviteWithdrawals(mode: AutomationSafetyMode) {
  if (mode.dryRun) return 0;
  const accounts = await getDb()
    .collection("linkedinAccounts")
    .where("status", "==", "connected")
    .get();
  const byWorkspace = new Map<string, LinkedInAccount[]>();
  for (const doc of accounts.docs) {
    const account = doc.data() as LinkedInAccount;
    byWorkspace.set(account.workspaceId, [...(byWorkspace.get(account.workspaceId) ?? []), account]);
  }

  let total = 0;
  for (const [workspaceId, workspaceAccounts] of byWorkspace) {
    if (isWorkspaceAutomationPaused(mode, workspaceId)) continue;
    const snap = await getDb().collection("workspaces").doc(workspaceId).get();
    if (!snap.exists) continue;
    const workspace = { ...(snap.data() as Workspace), id: snap.id };
    const afterDays = normalizeInviteWithdrawAfterDays(workspace.settings?.inviteWithdrawAfterDays);
    // Lapsed workspaces are skipped like every other automation: their
    // LinkedIn seats get purged, and nothing else acts on those accounts.
    if (!afterDays || !hasActiveSubscription(workspace)) continue;
    for (const account of workspaceAccounts) {
      try {
        total += await withdrawForAccount(workspace, account, afterDays);
      } catch (error) {
        console.error(`[invite-withdraw] ${workspaceId}/${account.id} failed:`, error);
      }
    }
  }
  return total;
}
