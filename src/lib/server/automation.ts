import "server-only";

import {
  acquireTickLock,
  releaseTickLock,
  getActiveCampaigns,
  getAgent,
  getDueAgents,
  getDueEnrollments,
  getConversation,
  getCampaign,
  getCampaignEnrollment,
  findLeadForWorkspace,
  getLinkedInAccountForWorkspace,
  getProductProfile,
  getWorkspace,
  claimDailyNotification,
  claimNotificationAfterInterval,
  claimEnrollmentAction,
  claimInviteSendSlot,
  claimSystemTask,
  createConversationMessage,
  consumeDailyQuota,
  deferAgentRun,
  getInviteCooldown,
  hasDailyQuotaRemaining,
  INVITE_SPACING_MINUTES,
  enrollNewLeadsInCampaign,
  leadDocId,
  listAutomationRuns,
  listCampaigns,
  listConnectionSentEnrollments,
  listLeads,
  listWorkspaces,
  clearInviteLimitSignals,
  logAutomationRun,
  markAgentRun,
  markAgentStarted,
  prepareEnrollmentActionNow,
  recordInviteLimitSignal,
  setInviteCooldown,
  updateEnrollment,
  updateLead,
  upsertLead,
} from "./data";
import { findNextScheduledStepIndex } from "./campaign-sequence";
import {
  draftCampaignMessage,
  draftCampaignReplyMessage,
  draftLeadHandoverSummary,
  MAX_AI_SEQUENCE_MESSAGES,
  normalizeAgentSearch,
  scoreLeadForProduct,
} from "./gemini";
import {
  applyConnectionAccepted,
  draftUpcomingMessagePreview,
  processInboundMessage,
} from "./inbound";
import { agentTargetLocations, matchesTargetLocation } from "./geo";
import {
  agentHasSignalSources,
  enrichLinkedInLead,
  runPeopleEngineForAgent,
} from "./people-engine";
import { planLimits } from "@/lib/plan-limits";
import {
  automationDecisionMessage,
  getAutomationSafetyMode,
  isWorkspaceAutomationPaused,
  type AutomationSafetyMode,
  type AutomationSafetyOptions,
} from "./automation-safety";
import {
  canSendCampaignMessage,
  fitConnectionNote,
  INVITE_LIMIT_SIGNAL_THRESHOLD,
  isAnonymousLinkedInProfile,
  renderTemplate,
} from "./outreach-rules";
import { isHotReply, isTerminalReplyIntent } from "./reply-automation-policy";
import { localDayAndHour } from "./scheduling";
import { hasActiveSubscription } from "./subscription";
import { getAppBaseUrl } from "./runtime-config";
import {
  sendDailyDigestEmail,
  sendInvitePauseNotification,
  sendSequenceHandoverEmail,
} from "./email";
import {
  ensureUnipileWebhooks,
  hasPendingSentInvitation,
  isFirstDegreeConnection,
  listRecentInboundMessages,
  listSentInvitationProviderIds,
  searchLinkedInProfiles,
  sendConnectionRequest,
  sendLinkedInMessage,
  UnipileResponseError,
} from "./unipile";
import type {
  Campaign,
  CampaignEnrollment,
  CampaignStep,
  Lead,
  LinkedInAccount,
  ProductProfile,
  Workspace,
} from "./types";

const DEFAULT_DAILY_DISCOVERED_LEAD_LIMIT = 75;
// Standard (non-signal) agents pull broad keyword matches, so a real fit check
// must gate what gets saved - otherwise irrelevant leads enter campaigns and
// get contacted. Mirrors the signal engine's QUALIFIED_SCORE_THRESHOLD (65).
const STANDARD_AGENT_SCORE_THRESHOLD = 65;
const TICK_LOCK_ID = "automation-tick";
// Must exceed a legitimate tick's worst-case runtime, or the next cron starts
// while the previous tick is still sending and the per-tick pacing budgets
// double up. A single signal-agent discovery run alone may take 15 minutes
// (PEOPLE_ENGINE_RUN_MS), so 8 minutes overlapped routinely. A crashed tick
// (lock released in finally; only a process kill leaks it) now delays
// automation by at most 20 minutes, which a 10-minute drip system absorbs.
const TICK_LOCK_TTL_MS = 20 * 60 * 1000;
// A distributed cadence gate is separate from the overlap TTL. Production may
// have several PM2 processes (and an external cron), all with their own timer.
// 1.75 minutes tolerates scheduler jitter while keeping the intended ~2-minute
// tick cadence instead of multiplying it by the instance count.
const TICK_SCHEDULE_MIN_INTERVAL_MS = 1.75 * 60 * 1000;
// Webhooks (new_relation) are the primary acceptance signal; the per-account
// sweep below is the fallback. Pending invites therefore carry NO individual
// recheck schedule - each one used to wake daily (or 4x daily once the
// profile-view budget ran out) and a steady pool of a few hundred pending
// invites per account consumed nearly the whole due-enrollment window. The
// sweep compares all of them against one sent-invitations listing instead:
// a few API calls, zero profile views for the still-pending majority.
const CONNECTION_SWEEP_INTERVAL_MS = 12 * 60 * 60 * 1000;
// Invites that vanished from the sent list get one live profile check each to
// confirm acceptance; bounded per sweep so a burst can never drain the
// account's daily profile-view budget.
const CONNECTION_SWEEP_CHECK_LIMIT = 20;
// Reply-sync fallback cadence per account. Webhooks deliver replies instantly;
// this bounds how stale a reply can go unnoticed when webhooks are down.
const REPLY_SYNC_INTERVAL_MS = 45 * 60 * 1000;
// Overlap window when filtering provider messages against the last sync
// cursor, so boundary messages are never skipped (dedupe drops re-reads).
const REPLY_SYNC_OVERLAP_MS = 10 * 60 * 1000;
const REPLY_SYNC_MESSAGE_LIMIT = 100;
// The full account enumeration only runs every cycle claim, keeping the claim
// reads off the per-tick hot path.
const PROVIDER_SYNC_CYCLE_MS = 15 * 60 * 1000;
const WEBHOOK_REGISTRATION_INTERVAL_MS = 6 * 60 * 60 * 1000;
// Paused/draft campaigns park their enrollments a full day (marked with
// pausedDeferredAt) because resumeCampaign wakes them explicitly - shorter
// defers just churn the due queue hourly. Workspaces without an active
// subscription have no resume hook (billing can restore any time), so they
// stay on an hourly recheck.
const PAUSED_CAMPAIGN_DEFER_MINUTES = 24 * 60;
const INACTIVE_WORKSPACE_DEFER_MINUTES = 60;
const CONNECTION_GIVE_UP_DAYS = 21;
const ENROLLMENT_MAX_RETRIES = 3;
const CONNECTION_SEND_RETRY_MINUTES = 30;
const ENROLLMENT_RETRY_MINUTES = 6 * 60;
const ENROLLMENT_COOLDOWN_MINUTES = 24 * 60;
const MISSING_ACCOUNT_RETRY_MINUTES = 60;

// Human-like pacing. Connection requests are the signal LinkedIn rate-checks
// hardest, so they drip strictly: at most 1 per tick per account AND at most
// one per INVITE_SPACING_MINUTES (data.ts) per account, enforced across ticks
// (and manual runs) by the persistent claimInviteSendSlot gate - never a
// burst. Deferred invites are laddered INVITE_SPACING_MINUTES apart so the
// Actions page shows the real drip schedule instead of a pile-up on one
// timestamp. Messages stay budgeted at a random 1-3 per tick per account.
const PACING_MIN_PER_TICK = 1;
const PACING_MAX_PER_TICK = 3;
const PACING_DEFER_MINUTES = 10;

// A cannot_resend_yet rejection is treated as being about the recipient (a
// previous invite to the same person is pending or was withdrawn - LinkedIn
// blocks re-invites for around three weeks), so only that enrollment is
// deferred, for the full block window - a shorter defer just fails again. The
// account-level circuit breaker needs INVITE_LIMIT_SIGNAL_THRESHOLD distinct
// recipients rejected with no success in between. Because the provider error
// cannot distinguish those cases, the breaker rechecks after a few hours
// instead of claiming a weekly limit and parking the account for days.
const RESEND_BLOCKED_DEFER_MINUTES = 21 * 24 * 60;
const INVITE_RECHECK_MINUTES = 6 * 60;

// Daily digest email: first tick at/after this hour in the workspace's local
// timezone sends a summary of the trailing window.
const DIGEST_LOCAL_HOUR = 9;
const DIGEST_WINDOW_MS = 24 * 60 * 60 * 1000;

type TickBudget = {
  connects: number;
  messages: number;
  // Per-tick cache of this LinkedIn account's invite cooldown: undefined = not yet
  // fetched, null = none active.
  inviteCooldownUntil?: string | null;
  // When the account's next invite slot opens (set after a send or a blocked
  // slot claim). Used as the base of the deferral ladder below.
  nextInviteOpenAtMs?: number;
  deferredInvites: number;
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function newTickBudget(): TickBudget {
  return {
    connects: 1,
    messages: randomInt(PACING_MIN_PER_TICK, PACING_MAX_PER_TICK),
    deferredInvites: 0,
  };
}

// Deferred invites are laddered one INVITE_SPACING_MINUTES step apart behind
// the account's next open slot, so the Actions page shows the real drip
// schedule (10:00, 10:10, 10:20, ...) instead of piling every queued request
// onto the same timestamp.
function nextInviteLadderSlot(budget: TickBudget) {
  const spacingMs = INVITE_SPACING_MINUTES * 60 * 1000;
  const base = budget.nextInviteOpenAtMs ?? Date.now() + spacingMs;
  const slot = base + budget.deferredInvites * spacingMs;
  budget.deferredInvites += 1;
  return new Date(slot).toISOString();
}

type SourceAgentPausedLookup = (workspaceId: string, agentId: string) => Promise<boolean>;

// Many due enrollments share the same source agent; its pause status only
// needs one read per tick. A deleted agent (doc gone) reads as not paused so
// its already-discovered leads keep flowing, matching pre-existing behavior.
function newSourceAgentPausedLookup(): SourceAgentPausedLookup {
  const cache = new Map<string, boolean>();
  return async (workspaceId, agentId) => {
    const key = `${workspaceId}:${agentId}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const agent = await getAgent(workspaceId, agentId);
    const paused = agent?.status === "paused";
    cache.set(key, paused);
    return paused;
  };
}

function addMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

async function runAgents(mode: AutomationSafetyMode) {
  const agents = await getDueAgents();
  let leadsAdded = 0;
  let signalsObserved = 0;
  let signalAgents = 0;
  let timeBudgetExpiredRuns = 0;

  for (const agent of agents) {
    try {
      if (isWorkspaceAutomationPaused(mode, agent.workspaceId)) {
        await safeLogAutomationRun({
          workspaceId: agent.workspaceId,
          kind: "agent",
          status: "completed",
          message: `Skipped agent ${agent.id}: workspace automation paused.`,
        });
        continue;
      }
      const account = await getLinkedInAccountForWorkspace(agent.workspaceId, agent.linkedInAccountId);
      const profile = await getProductProfile(agent.workspaceId);

      if (!account) {
        await markAgentRun(agent, false);
        continue;
      }

      // Don't run paid lead discovery for workspaces without an active plan.
      // Defer to the next daily slot - a bare `continue` left nextRunAt in the
      // past, so the agent stayed due and re-read its workspace every tick.
      const workspace = await getWorkspace(agent.workspaceId);
      if (!hasActiveSubscription(workspace)) {
        if (!mode.dryRun) await deferAgentRun(agent);
        continue;
      }

      if (mode.dryRun) {
        await safeLogAutomationRun({
          workspaceId: agent.workspaceId,
          kind: "agent",
          status: "completed",
          message: `DRY RUN would start agent ${agent.id}.`,
        });
        continue;
      }

      await markAgentStarted(agent);

      if (agentHasSignalSources(agent)) {
        const result = await runPeopleEngineForAgent({
          agent,
          account,
          profile,
          dailyLeadLimit: planLimits(workspace.billing?.plan).dailyDiscoveredLeads,
        });
        signalAgents += 1;
        signalsObserved += result.signalsObserved;
        leadsAdded += result.leadsAdded;
        if (result.timeBudgetExpired) timeBudgetExpiredRuns += 1;
        await markAgentRun(agent, true);
        continue;
      }

      const criteria = await normalizeAgentSearch(agent, profile);
      const targetLocations = agentTargetLocations(agent, profile);
      const rawLeads = await searchLinkedInProfiles({
        accountId: account.accountId,
        // The agent's own target locations are the contract with the user;
        // don't let the AI-normalized criteria widen or drop them.
        criteria: targetLocations.length ? { ...criteria, locations: targetLocations } : criteria,
        limit: Math.min(
          DEFAULT_DAILY_DISCOVERED_LEAD_LIMIT,
          planLimits(workspace.billing?.plan).dailyDiscoveredLeads,
        ),
        agent,
      });

      // Daily searches largely return the same people. Known leads must not be
      // re-scored (burns an AI call each and churns their stored fitScore) and
      // must not count as newly discovered. Mirrors the signal engine's
      // existing-lead handling.
      const existingLeads = await listLeads(agent.workspaceId, undefined, 5000);
      const existingLeadsById = new Map(existingLeads.map((lead) => [lead.id, lead]));

      for (const rawLead of rawLeads) {
        // Hard location gate. LinkedIn classic search ignores the agent's
        // target country (network-biased results), and AI fit scoring alone
        // still lets wrong-region leads through when title/industry match.
        if (!matchesTargetLocation(rawLead.location, targetLocations)) {
          continue;
        }
        const existing = existingLeadsById.get(leadDocId(agent.workspaceId, rawLead));
        if (existing) {
          // Known person surfaced by this agent too: only make sure they're in
          // this agent's group; never overwrite their scored fields or status.
          if (!existing.groupIds?.includes(agent.targetGroupId)) {
            await upsertLead(agent.workspaceId, agent.targetGroupId, {
              linkedInUrl: existing.linkedInUrl || rawLead.linkedInUrl,
              providerProfileId: existing.providerProfileId || rawLead.providerProfileId,
              sourceAgentId: agent.id,
            });
          }
          continue;
        }
        const enrichedLead = await enrichLinkedInLead(account, rawLead);
        if (
          isAnonymousLinkedInProfile(enrichedLead) ||
          !matchesTargetLocation(enrichedLead.location, targetLocations)
        ) {
          continue;
        }

        const enrichedExisting = existingLeadsById.get(
          leadDocId(agent.workspaceId, enrichedLead),
        );
        if (enrichedExisting) {
          if (!enrichedExisting.groupIds?.includes(agent.targetGroupId)) {
            await upsertLead(agent.workspaceId, agent.targetGroupId, {
              linkedInUrl: enrichedExisting.linkedInUrl || enrichedLead.linkedInUrl,
              providerProfileId:
                enrichedExisting.providerProfileId || enrichedLead.providerProfileId,
              sourceAgentId: agent.id,
            });
          }
          continue;
        }

        const score = await scoreLeadForProduct(enrichedLead, profile, agent);
        // Gate on fit so broad keyword matches (right title, wrong
        // industry/location) don't enter the group and get auto-contacted.
        if (score.fitScore < STANDARD_AGENT_SCORE_THRESHOLD) {
          continue;
        }
        await upsertLead(agent.workspaceId, agent.targetGroupId, {
          ...enrichedLead,
          fitScore: score.fitScore,
          scoreReasons: score.scoreReasons,
          summary: score.summary || enrichedLead.summary,
          sourceAgentId: agent.id,
          outreachStatus: "new",
        });
        leadsAdded += 1;
      }

      await markAgentRun(agent, true);
    } catch (error) {
      await markAgentRun(agent, false);
      await logAutomationRun({
        workspaceId: agent.workspaceId,
        kind: "agent",
        status: "error",
        message: error instanceof Error ? error.message : "Agent run failed",
      });
    }
  }

  return { agents: agents.length, signalAgents, signalsObserved, leadsAdded, timeBudgetExpiredRuns };
}

// The AI sequence is done with this lead (final message sent, or the cap was
// hit) - put them in the user's hands: an email with an AI briefing of why the
// person is still worth a personal message, plus everything Omentir knows
// about them and the full transcript. Email failures are logged, never thrown:
// the enrollment must still stop cleanly.
async function handOverLeadToUser(input: {
  workspace: Workspace;
  campaign: Campaign;
  lead: Lead;
  account: LinkedInAccount;
  profile: ProductProfile | null;
}) {
  const { workspace, campaign, lead, account, profile } = input;
  try {
    const email = workspace.notificationEmail;
    if (!email) {
      await safeLogAutomationRun({
        workspaceId: workspace.id,
        kind: "campaign",
        status: "error",
        message: `Sequence finished for ${lead.name} but no notification email is set - handover email skipped.`,
      });
      return;
    }
    // Refetch so the transcript includes the message that was just sent.
    const conversation = await getConversation(workspace.id, lead.id);
    const messages = conversation?.messages || [];
    const leadFirstName = lead.name.split(" ")[0] || lead.name;
    const aiBriefing = await draftLeadHandoverSummary({
      lead,
      productProfile: profile,
      conversation: messages,
    });
    await sendSequenceHandoverEmail({
      to: email,
      lead: {
        name: lead.name,
        title: lead.title,
        company: lead.company,
        location: lead.location,
        linkedInUrl: lead.linkedInUrl,
        summary: lead.summary,
        fitScore: lead.fitScore,
        scoreReasons: lead.scoreReasons,
        leadReason: lead.leadReason,
        signalText: lead.signalText,
        signalSource: lead.signalSource,
        signalUrl: lead.signalUrl,
        signalObservedAt: lead.signalObservedAt,
      },
      campaignName: campaign.name,
      linkedInAccountName: account.displayName,
      aiBriefing,
      transcript: messages.map(
        (message) =>
          `${message.direction === "outbound" ? account.displayName || "You" : leadFirstName}: ${message.body}`,
      ),
      messagesSent: messages.filter((message) => message.direction === "outbound").length,
      idempotencyKey: `sequence-handover-${workspace.id}-${lead.id}-${campaign.id}`,
    });
    await safeLogAutomationRun({
      workspaceId: workspace.id,
      kind: "campaign",
      status: "completed",
      message: `Sequence finished for ${lead.name}; handover email sent to ${email}.`,
    });
  } catch (error) {
    await safeLogAutomationRun({
      workspaceId: workspace.id,
      kind: "campaign",
      status: "error",
      message: `Handover email for ${lead.name} failed: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    });
  }
}

async function runEnrollment(
  enrollment: CampaignEnrollment,
  campaign: Campaign,
  budgetForAccount: (linkedInAccountId: string) => TickBudget,
  sourceAgentPaused: SourceAgentPausedLookup,
) {
  const updateCurrentEnrollment = (patch: Partial<CampaignEnrollment>) =>
    updateEnrollment(enrollment.workspaceId, enrollment.id, patch);
  const workspace = await getWorkspace(enrollment.workspaceId);
  const account = await getLinkedInAccountForWorkspace(
    enrollment.workspaceId,
    campaign.linkedInAccountId,
  );
  if (!account) {
    await updateCurrentEnrollment({
      lastError: "No connected LinkedIn account.",
      retryCount: (enrollment.retryCount || 0) + 1,
      nextActionAt: addMinutes(MISSING_ACCOUNT_RETRY_MINUTES),
    });
    return "missing-account";
  }
  const budget = budgetForAccount(account.id);

  const lead = await findLeadForWorkspace({
    workspaceId: enrollment.workspaceId,
    leadId: enrollment.leadId,
  });
  if (!lead || (lead.outreachStatus === "replied" && enrollment.status !== "reply_received")) {
    await updateCurrentEnrollment({ status: "stopped" });
    return "stopped";
  }

  // Lead was removed from this campaign's group after enrollment - stop so we
  // don't keep contacting someone the user pulled out of the audience.
  if (!lead.groupIds?.includes(campaign.groupId)) {
    await updateCurrentEnrollment({ status: "stopped" });
    return "left-group";
  }

  // Pausing an agent freezes every automated touch to the leads it sourced -
  // invites, follow-ups, acceptance polling, and AI replies - not just lead
  // discovery. Park like a paused campaign (marked with pausedDeferredAt) so
  // resumeAgent can wake exactly these enrollments instead of them idling for
  // up to a day.
  if (lead.sourceAgentId && (await sourceAgentPaused(enrollment.workspaceId, lead.sourceAgentId))) {
    await updateCurrentEnrollment({
      nextActionAt: addMinutes(PAUSED_CAMPAIGN_DEFER_MINUTES),
      pausedDeferredAt: new Date().toISOString(),
    });
    return "agent-paused";
  }

  // Anonymized "LinkedIn Member" profiles can never be contacted; stop before
  // spending invite budget on a send LinkedIn will reject.
  if (enrollment.status === "queued" && isAnonymousLinkedInProfile(lead)) {
    await updateCurrentEnrollment({
      status: "stopped",
      lastError: "Lead is an anonymized LinkedIn Member profile and cannot be contacted.",
    });
    return "stopped";
  }

  const recoveredStatus: CampaignEnrollment["status"] =
    enrollment.connectionSentAt || lead.outreachStatus === "invited"
      ? "connection_sent"
      : lead.outreachStatus === "connected" || lead.outreachStatus === "messaged"
        ? "connected"
        : "queued";

  if (enrollment.pendingAction) {
    // Clear the claim and retry later. Parking on status "error" permanently
    // removed enrollments from the due queue (error was not a due status), so
    // a single network blip after claim killed outreach for that lead forever.
    // If the prior send actually landed, the next attempt sees outreachStatus
    // / already-connected and stops cleanly; Unipile rejects true duplicates.
    await updateCurrentEnrollment({
      status: enrollment.status === "error" ? recoveredStatus : enrollment.status,
      pendingAction: undefined,
      lastError: `Previous ${enrollment.pendingAction.kind} was unconfirmed; will retry.`,
      nextActionAt: addMinutes(ENROLLMENT_COOLDOWN_MINUTES),
    });
    return "pending-action";
  }

  // Re-open recoverable automation failures so they re-enter the normal flow.
  // Policy errors (message-before-connection, unknown step) stay parked only
  // while their cause still holds - once the lead connects or the campaign's
  // steps are fixed, the enrollment must recover instead of being parked
  // forever (the acceptance webhook only wakes "connection_sent" enrollments,
  // so this daily recheck is the only way back in). While the cause holds,
  // re-opening would just bounce error → recover → error, so keep the park.
  if (enrollment.status === "error") {
    const lastError = enrollment.lastError || "";
    const parkedStep = campaign.steps[enrollment.currentStepIndex] as CampaignStep | undefined;
    const stillUnknownStep =
      /Unknown campaign step type/i.test(lastError) &&
      Boolean(parkedStep) &&
      !["wait", "connect", "message"].includes((parkedStep as { type?: string }).type || "");
    const stillBlockedBeforeConnection =
      /Connection must be accepted/i.test(lastError) &&
      !canSendCampaignMessage({ status: recoveredStatus }, lead);
    if (stillUnknownStep || stillBlockedBeforeConnection) {
      await updateCurrentEnrollment({ nextActionAt: addMinutes(ENROLLMENT_COOLDOWN_MINUTES) });
      return "error-parked";
    }
    await updateCurrentEnrollment({
      status: recoveredStatus,
      pendingAction: undefined,
      lastError: undefined,
    });
    enrollment = { ...enrollment, status: recoveredStatus, pendingAction: undefined, lastError: undefined };
  }

  if (enrollment.status === "reply_received") {
    // Hand-off campaigns never AI-reply: the user owns the conversation after
    // the first reply. The webhook stops these, but defend against a race or
    // a campaign edited to hand-off while the enrollment was already armed.
    if (campaign.replyHandling === "handoff") {
      await updateCurrentEnrollment({
        status: "replied",
        pendingAction: undefined,
        lastError: "Hand-off outreach: automation stopped after the lead replied.",
      });
      return "handoff-stop";
    }

    const conversation = await getConversation(enrollment.workspaceId, lead.id);
    const intent = conversation?.replyIntent;
    // The webhook already stops terminal and hot replies, but defend here if
    // a race left the enrollment armed while the latest inbound was stored.
    if (isTerminalReplyIntent(intent) || isHotReply(intent, conversation?.replyIntentConfidence)) {
      await updateCurrentEnrollment({
        status: "stopped",
        pendingAction: undefined,
        lastError: `Skipped AI reply (intent: ${intent || "unknown"}).`,
      });
      return "reply-intent-stop";
    }

    const profile = await getProductProfile(enrollment.workspaceId);
    const body = await draftCampaignReplyMessage({
      lead,
      productProfile: profile,
      campaignName: campaign.name,
      conversation: conversation?.messages || [],
      replyIntent: intent,
      nextStepHint: conversation?.replyIntentNextStepHint,
      senderName: account.displayName,
      campaignGoal: campaign.campaignGoal,
      messageTone: campaign.messageTone,
    });

    const claimed = await claimEnrollmentAction({
      workspaceId: enrollment.workspaceId,
      id: enrollment.id,
      expectedStatus: enrollment.status,
      expectedStepIndex: enrollment.currentStepIndex,
      kind: "reply",
    });
    if (!claimed) return "action-claimed";

    const sendResult = await sendLinkedInMessage({
      accountId: account.accountId,
      providerProfileId: lead.providerProfileId,
      linkedInUrl: lead.linkedInUrl,
      body,
    });
    await createConversationMessage({
      workspaceId: enrollment.workspaceId,
      leadId: lead.id,
      campaignId: campaign.id,
      userId: enrollment.workspaceId,
      senderName: "You",
      body,
      direction: "outbound",
      providerMessageId: sendResult.id,
    });
    await updateLead(enrollment.workspaceId, lead.id, { outreachStatus: "replied" });
    await updateCurrentEnrollment({
      status: "replied",
      pendingAction: undefined,
      nextActionAt: addMinutes(24 * 60),
    });
    return "ai-reply";
  }

  // Acceptance is detected by the webhook (instant) or the per-account sweep
  // (batched fallback), so a pending invite only comes due here at its give-up
  // date (or via a manual run) - one final live check, then stop. Per-lead
  // periodic polling burned a profile view per pending invite per day and
  // crowded the due window out at scale.
  if (enrollment.status === "connection_sent") {
    const accepted = await isFirstDegreeConnection({
      accountId: account.accountId,
      identifier: lead.providerProfileId || lead.linkedInUrl,
    });

    if (accepted !== true) {
      const sentAt = enrollment.connectionSentAt || enrollment.updatedAt;
      const giveUpAt =
        new Date(sentAt).getTime() + CONNECTION_GIVE_UP_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() >= giveUpAt) {
        await updateCurrentEnrollment({ status: "stopped" });
        return "invite-expired";
      }
      await updateCurrentEnrollment({ nextActionAt: new Date(giveUpAt).toISOString() });
      return "awaiting-connection";
    }

    enrollment = { ...enrollment, status: "connected" };
    await updateCurrentEnrollment({ status: "connected" });
    await updateLead(enrollment.workspaceId, lead.id, { outreachStatus: "connected" });
  }

  const step = campaign.steps[enrollment.currentStepIndex] as CampaignStep | undefined;
  if (!step) {
    await updateCurrentEnrollment({ status: "stopped" });
    return "complete";
  }

  const stepType = (step as { type?: string }).type;
  if (!["wait", "connect", "message"].includes(stepType || "")) {
    await updateCurrentEnrollment({
      status: "error",
      lastError: `Unknown campaign step type: ${stepType || "missing"}.`,
      nextActionAt: addMinutes(ENROLLMENT_COOLDOWN_MINUTES),
    });
    return "unknown-step";
  }

  if (step.type === "wait") {
    // Draft the message this wait leads up to right now (i.e. the moment the
    // connection was accepted, for the connect→wait→message shape) so the user
    // can review it on the Actions page for the whole wait window.
    const nextMessageDraft = await draftUpcomingMessagePreview({
      campaign,
      lead,
      account,
      fromStepIndex: enrollment.currentStepIndex + 1,
    });
    await updateCurrentEnrollment({
      currentStepIndex: enrollment.currentStepIndex + 1,
      nextActionAt: addMinutes(step.delayMinutes),
      ...(nextMessageDraft ? { nextMessageDraft } : {}),
    });
    return "wait";
  }

  if (step.type === "connect") {
    // Another campaign already started outreach to this lead before this
    // enrollment's first action - don't send a second invite to the same person.
    if (enrollment.status === "queued" && lead.outreachStatus !== "new") {
      await updateCurrentEnrollment({ status: "stopped" });
      return "duplicate-lead";
    }

    // Account under a LinkedIn invite limit: park until the cooldown passes
    // instead of burning attempts. Checked before pacing so the enrollment is
    // deferred to the cooldown end, not churned every 10 minutes.
    if (budget.inviteCooldownUntil === undefined) {
      budget.inviteCooldownUntil = await getInviteCooldown(enrollment.workspaceId, account.id);
    }
    if (budget.inviteCooldownUntil) {
      await updateCurrentEnrollment({ nextActionAt: budget.inviteCooldownUntil });
      return "invite-cooldown";
    }

    // Human-like pacing: only a few invites per account per tick. This gate
    // must run before the 1st-degree profile check below - otherwise every
    // queued enrollment performs a live profile view on every tick while
    // waiting its turn, which is exactly the high-volume profile access
    // pattern LinkedIn flags.
    if (budget.connects <= 0) {
      await updateCurrentEnrollment({ nextActionAt: nextInviteLadderSlot(budget) });
      return "connect-paced";
    }

    // Bail before profile views / AI drafting when today's invite budget is
    // already spent - those work units were previously wasted on invite-limit.
    if (
      !(await hasDailyQuotaRemaining(
        enrollment.workspaceId,
        "invites",
        workspace.settings.dailyInviteLimit,
      ))
    ) {
      await updateCurrentEnrollment({ nextActionAt: addMinutes(60) });
      return "invite-limit";
    }

    // Strict drip: at most one invite per account per INVITE_SPACING_MINUTES,
    // across ticks and manual runs. Claimed before the profile check below so
    // a waiting queue doesn't burn a live profile view on every tick; a claim
    // that ends up not sending (already connected, Unipile rejection) only
    // delays the next invite - it can never over-send.
    const nextInviteAllowedAt = await claimInviteSendSlot(enrollment.workspaceId, account.id);
    if (nextInviteAllowedAt) {
      budget.connects = 0;
      budget.nextInviteOpenAtMs ??= Date.parse(nextInviteAllowedAt);
      await updateCurrentEnrollment({ nextActionAt: nextInviteLadderSlot(budget) });
      return "invite-spaced";
    }
    // Slot claimed: the next invite from this account opens one spacing window
    // from now; anything else deferred this tick ladders behind that.
    budget.nextInviteOpenAtMs = Date.now() + INVITE_SPACING_MINUTES * 60 * 1000;

    // Already a 1st-degree connection (connected manually or via another
    // campaign): skip the redundant invite and move straight to messaging.
    const alreadyConnected = await isFirstDegreeConnection({
      accountId: account.accountId,
      identifier: lead.providerProfileId || lead.linkedInUrl,
    });
    if (alreadyConnected) {
      await updateLead(enrollment.workspaceId, lead.id, { outreachStatus: "connected" });
      await updateCurrentEnrollment({
        status: "connected",
        currentStepIndex: enrollment.currentStepIndex + 1,
        nextActionAt: addMinutes(1),
      });
      return "already-connected";
    }

    // AI never writes invitation notes. Only a user-written template that
    // renders cleanly is attached; anything degraded means a bare invite,
    // which converts fine and can't embarrass the sender.
    let note: string | undefined;
    if (step.includeNote) {
      const rendered = renderTemplate(step.noteTemplate, lead);
      note = rendered.natural && rendered.text ? fitConnectionNote(rendered.text) : undefined;
    }

    const claimed = await claimEnrollmentAction({
      workspaceId: enrollment.workspaceId,
      id: enrollment.id,
      expectedStatus: enrollment.status,
      expectedStepIndex: enrollment.currentStepIndex,
      kind: "connection",
    });
    if (!claimed) return "action-claimed";

    budget.connects -= 1;
    // Send first; only count quota after Unipile accepts. Counting before send
    // burned the full daily invite budget on rejected notes/ids, then every
    // later enrollment sat on invite-limit with zero outreach.
    let sendResult;
    try {
      sendResult = await sendConnectionRequest({
        accountId: account.accountId,
        providerProfileId: lead.providerProfileId,
        linkedInUrl: lead.linkedInUrl,
        note,
      });
    } catch (error) {
      // Free accounts have a small monthly allowance of personalized invites;
      // once it's spent LinkedIn rejects ANY note as too_many_characters even
      // under the length cap. A bare invite still goes through and is the
      // whole point of the step, so retry once without the note.
      if (
        !note ||
        !(error instanceof UnipileResponseError) ||
        error.errorType !== "errors/too_many_characters"
      ) {
        throw error;
      }
      sendResult = await sendConnectionRequest({
        accountId: account.accountId,
        providerProfileId: lead.providerProfileId,
        linkedInUrl: lead.linkedInUrl,
      });
    }
    // The account provably accepts invites, so any tallied cannot_resend_yet
    // rejections were about their recipients, not an account-wide limit.
    await clearInviteLimitSignals(enrollment.workspaceId, account.id);
    const counted = await consumeDailyQuota(
      enrollment.workspaceId,
      "invites",
      workspace.settings.dailyInviteLimit,
    );
    if (!counted) {
      // Race: another path exhausted the limit after our pre-check. Invite
      // already went out - record it and move on (slight overage is fine).
      console.warn(
        `[automation] invite sent for ${enrollment.id} after daily invite limit was reached`,
      );
    }
    await updateLead(enrollment.workspaceId, lead.id, {
      outreachStatus: "invited",
      providerProfileId: sendResult.providerProfileId || lead.providerProfileId,
    });
    await updateCurrentEnrollment({
      status: "connection_sent",
      currentStepIndex: enrollment.currentStepIndex + 1,
      connectionSentAt: new Date().toISOString(),
      pendingAction: undefined,
      // The send succeeded, so any stored rejection is stale; the Actions page
      // surfaces lastError as the card's blocked reason.
      lastError: undefined,
      // Due again only at the give-up date; the webhook or the per-account
      // sweep wakes it the moment the invite is actually accepted.
      nextActionAt: addMinutes(CONNECTION_GIVE_UP_DAYS * 24 * 60),
    });
    return "connection";
  }

  if (!canSendCampaignMessage(enrollment, lead)) {
    await updateCurrentEnrollment({
      status: "error",
      lastError: "Connection must be accepted before sending campaign messages.",
      nextActionAt: addMinutes(ENROLLMENT_COOLDOWN_MINUTES),
    });
    return "message-before-connection";
  }

  // Human-like pacing: only a few messages per account per tick.
  if (budget.messages <= 0) {
    await updateCurrentEnrollment({ nextActionAt: addMinutes(PACING_DEFER_MINUTES) });
    return "message-paced";
  }

  if (
    !(await hasDailyQuotaRemaining(
      enrollment.workspaceId,
      "messages",
      workspace.settings.dailyMessageLimit,
    ))
  ) {
    await updateCurrentEnrollment({ nextActionAt: addMinutes(60) });
    return "message-limit";
  }

  const profile = await getProductProfile(enrollment.workspaceId);
  const rendered = renderTemplate(step.messageTemplate, lead);
  let body: string;
  // Stage of this message when AI-drafted (0 for user-written templates).
  // AI-run sequences hard-stop after MAX_AI_SEQUENCE_MESSAGES unanswered
  // messages: a silent lead is not interested, so they are handed to the user
  // by email instead of getting another AI touch.
  let aiStage = 0;
  if (rendered.natural && rendered.text) {
    body = rendered.text;
  } else {
    // Dedicated Gemini call per message per lead, with everything it needs:
    // which message of the sequence this is (each stage has its own intent),
    // the campaign's goal and tone, and the full transcript already exchanged
    // with this person, so follow-ups build on the first message instead of
    // re-introducing the company.
    const sequencePosition = campaign.steps
      .slice(0, enrollment.currentStepIndex + 1)
      .filter((candidate) => candidate.type === "message").length;
    const conversation = await getConversation(enrollment.workspaceId, lead.id);
    const messages = conversation?.messages || [];
    const outboundSent = messages.filter((message) => message.direction === "outbound").length;
    aiStage = Math.max(sequencePosition, outboundSent + 1);
    if (campaign.replyHandling !== "handoff" && aiStage > MAX_AI_SEQUENCE_MESSAGES) {
      await handOverLeadToUser({ workspace, campaign, lead, account, profile });
      await updateCurrentEnrollment({
        status: "stopped",
        pendingAction: undefined,
        lastError: `AI sequence finished after ${MAX_AI_SEQUENCE_MESSAGES} messages with no reply; the lead was handed over to you by email.`,
      });
      return "sequence-handover";
    }
    // Reuse the pre-drafted preview the user saw on the Actions page, so what
    // was shown is exactly what goes out. Only when no draft matches this step
    // (older enrollments, preview drafting failed) is the message drafted here.
    const draft = enrollment.nextMessageDraft;
    const storedDraft =
      draft && draft.stepIndex === enrollment.currentStepIndex && draft.body.trim()
        ? draft.body
        : undefined;
    body =
      storedDraft ??
      (await draftCampaignMessage({
        lead,
        productProfile: profile,
        campaignName: campaign.name,
        templateHint: step.messageTemplate,
        senderName: account.displayName,
        sequencePosition,
        conversation: messages,
        campaignGoal: campaign.campaignGoal,
        messageTone: campaign.messageTone,
      }));
  }
  const claimed = await claimEnrollmentAction({
    workspaceId: enrollment.workspaceId,
    id: enrollment.id,
    expectedStatus: enrollment.status,
    expectedStepIndex: enrollment.currentStepIndex,
    kind: "message",
  });
  if (!claimed) return "action-claimed";

  budget.messages -= 1;
  // Same as invites: only count quota after Unipile accepts the send.
  const messageSendResult = await sendLinkedInMessage({
    accountId: account.accountId,
    providerProfileId: lead.providerProfileId,
    linkedInUrl: lead.linkedInUrl,
    body,
  });
  // Record what was sent: follow-up and reply drafting read this transcript,
  // and without it every later message drafts blind and repeats itself.
  await createConversationMessage({
    workspaceId: enrollment.workspaceId,
    leadId: lead.id,
    campaignId: campaign.id,
    userId: enrollment.workspaceId,
    senderName: account.displayName || "You",
    body,
    direction: "outbound",
    providerMessageId: messageSendResult.id,
  });
  await consumeDailyQuota(
    enrollment.workspaceId,
    "messages",
    workspace.settings.dailyMessageLimit,
  );
  await updateLead(enrollment.workspaceId, lead.id, { outreachStatus: "messaged" });
  // Final AI message of the ladder just went out: don't let the sequence idle
  // out silently - stop here and put the lead in the user's hands with
  // everything Omentir knows about them.
  if (aiStage >= MAX_AI_SEQUENCE_MESSAGES && campaign.replyHandling !== "handoff") {
    await handOverLeadToUser({ workspace, campaign, lead, account, profile });
    await updateCurrentEnrollment({
      status: "stopped",
      pendingAction: undefined,
      lastError: `AI sequence finished after ${MAX_AI_SEQUENCE_MESSAGES} messages; the lead was handed over to you by email.`,
    });
    return "sequence-handover";
  }
  // The sequence's own wait step defines the gap to the next message, so hand
  // control back to it on the next tick. A fixed 24h defer here silently
  // inflated every configured follow-up delay by a day (an 18h wait became
  // ~42h - see tests/outreach-timeline.test.mts for the intended timeline).
  // Only when the author put another action directly after this message (no
  // wait step in between) do we keep a 24h floor between touches to the same
  // person.
  const stepAfterMessage = campaign.steps[enrollment.currentStepIndex + 1] as
    | CampaignStep
    | undefined;
  await updateCurrentEnrollment({
    status: "message_sent",
    currentStepIndex: enrollment.currentStepIndex + 1,
    pendingAction: undefined,
    nextMessageDraft: undefined,
    // The send succeeded, so any stored rejection is stale; the Actions page
    // surfaces lastError as the card's blocked reason.
    lastError: undefined,
    nextActionAt: addMinutes(
      !stepAfterMessage || stepAfterMessage.type === "wait" ? 1 : 24 * 60,
    ),
  });
  return "message";
}

export async function executeScheduledActionNow(workspaceId: string, enrollmentId: string) {
  const mode = getAutomationSafetyMode();
  if (mode.disabled || mode.dryRun || isWorkspaceAutomationPaused(mode, workspaceId)) {
    throw new Error("Outreach is paused by the workspace safety settings.");
  }

  const workspace = await getWorkspace(workspaceId);
  if (!hasActiveSubscription(workspace)) throw new Error("An active subscription is required.");

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const enrollment = await getCampaignEnrollment(workspaceId, enrollmentId);
    if (!enrollment) throw new Error("Scheduled action not found.");
    if (["stopped", "replied"].includes(enrollment.status)) {
      throw new Error("This outreach sequence is no longer active.");
    }

    const campaign = await getCampaign(workspaceId, enrollment.campaignId);
    if (!campaign || campaign.status !== "active") {
      throw new Error("This campaign is not active.");
    }

    const actionStepIndex = findNextScheduledStepIndex(
      campaign.steps,
      enrollment.currentStepIndex,
    );
    const step = campaign.steps[actionStepIndex];
    if (!step || (step.type !== "connect" && step.type !== "message")) {
      throw new Error("There is no outreach action to run.");
    }

    const lead = await findLeadForWorkspace({ workspaceId, leadId: enrollment.leadId });
    if (!lead) throw new Error("Lead not found.");
    if (step.type === "message" && !canSendCampaignMessage(enrollment, lead)) {
      throw new Error("The connection must be accepted before this message can be sent.");
    }
    if (lead.sourceAgentId) {
      const sourceAgent = await getAgent(workspaceId, lead.sourceAgentId);
      if (sourceAgent?.status === "paused") {
        throw new Error("The agent that found this lead is paused. Resume it to run outreach.");
      }
    }

    const prepared = await prepareEnrollmentActionNow({
      workspaceId,
      id: enrollment.id,
      expectedStepIndex: enrollment.currentStepIndex,
      actionStepIndex,
    });
    if (!prepared) continue;

    try {
      const manualBudget = newTickBudget();
      const result = await runEnrollment(
        prepared,
        campaign,
        () => manualBudget,
        newSourceAgentPausedLookup(),
      );
      await safeLogAutomationRun({
        workspaceId,
        kind: "campaign",
        status: "completed",
        message: `Manual action for enrollment ${enrollment.id}: ${result}.`,
      });
      if (enrollment.retryCount) {
        await updateEnrollment(workspaceId, enrollment.id, { retryCount: 0 });
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Manual action failed";
      const retryMinutes =
        step.type === "connect" ? CONNECTION_SEND_RETRY_MINUTES : ENROLLMENT_RETRY_MINUTES;
      await updateEnrollment(workspaceId, enrollment.id, {
        lastError: message,
        retryCount: (enrollment.retryCount || 0) + 1,
        nextActionAt: addMinutes(retryMinutes),
        ...(error instanceof UnipileResponseError ? { pendingAction: undefined } : {}),
      });
      await safeLogAutomationRun({ workspaceId, kind: "campaign", status: "error", message });
      throw new Error(message);
    }
  }

  throw new Error("This action is already being processed. Refresh to see its latest status.");
}

// Pulls leads discovered after a campaign was created into that campaign so
// they get contacted too. New enrollments are queued for "now", so they're
// picked up by getDueEnrollments in this same tick.
async function syncNewEnrollments(mode: AutomationSafetyMode) {
  let newlyEnrolled = 0;
  const campaigns = await getActiveCampaigns();

  for (const campaign of campaigns) {
    try {
      if (mode.dryRun || isWorkspaceAutomationPaused(mode, campaign.workspaceId)) {
        await safeLogAutomationRun({
          workspaceId: campaign.workspaceId,
          kind: "campaign",
          status: "completed",
          message: `${mode.dryRun ? "DRY RUN would sync" : "Skipped"} new enrollments for ${campaign.id}.`,
        });
        continue;
      }
      newlyEnrolled += await enrollNewLeadsInCampaign(campaign.workspaceId, campaign);
    } catch (error) {
      await safeLogAutomationRun({
        workspaceId: campaign.workspaceId,
        kind: "campaign",
        status: "error",
        message: `Enrolling new leads for ${campaign.id} failed: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      });
    }
  }

  return { newlyEnrolled, campaigns };
}

async function previewEnrollment(
  enrollment: CampaignEnrollment,
  campaign: Campaign,
  sourceAgentPaused: SourceAgentPausedLookup,
) {
  const account = await getLinkedInAccountForWorkspace(
    enrollment.workspaceId,
    campaign.linkedInAccountId,
  );
  if (!account) return "missing-account";
  if (enrollment.pendingAction) return "pending-action";

  const lead = await findLeadForWorkspace({
    workspaceId: enrollment.workspaceId,
    leadId: enrollment.leadId,
  });
  if (!lead || (lead.outreachStatus === "replied" && enrollment.status !== "reply_received")) {
    return "stopped";
  }
  if (!lead.groupIds?.includes(campaign.groupId)) return "left-group";
  if (lead.sourceAgentId && (await sourceAgentPaused(enrollment.workspaceId, lead.sourceAgentId))) {
    return "agent-paused";
  }
  if (enrollment.status === "reply_received") {
    return campaign.replyHandling === "handoff" ? "would-stop-for-handoff" : "would-send-ai-reply";
  }
  if (enrollment.status === "connection_sent") return "would-check-connection";

  const step = campaign.steps[enrollment.currentStepIndex] as CampaignStep | undefined;
  if (!step) return "complete";
  const stepType = (step as { type?: string }).type;
  if (!["wait", "connect", "message"].includes(stepType || "")) return "unknown-step";
  if (step.type === "wait") return `would-wait-${step.delayMinutes}m`;
  if (step.type === "connect") {
    if (enrollment.status === "queued" && lead.outreachStatus !== "new") return "duplicate-lead";
    return "would-send-connection";
  }
  if (!canSendCampaignMessage(enrollment, lead)) return "message-before-connection";
  return step.messageTemplate.trim() ? "would-send-message" : "would-draft-and-send-message";
}

async function runCampaigns(mode: AutomationSafetyMode) {
  let newlyEnrolled = 0;
  let activeCampaigns: Campaign[] = [];
  // Isolated so a failure to enroll new leads never blocks processing the
  // enrollments that are already due.
  try {
    const syncResult = await syncNewEnrollments(mode);
    newlyEnrolled = syncResult.newlyEnrolled;
    activeCampaigns = syncResult.campaigns;
  } catch (error) {
    await safeLogAutomationRun({
      kind: "campaign",
      status: "error",
      message: `Enrollment sync failed: ${error instanceof Error ? error.message : "unknown error"}`,
    });
  }

  const enrollments = await getDueEnrollments(
    50,
    Array.from(new Set(activeCampaigns.map((campaign) => campaign.workspaceId))),
  );
  const campaignCache = new Map<string, Campaign>();
  const workspaceActiveCache = new Map<string, boolean>();
  const sourceAgentPaused = newSourceAgentPausedLookup();
  // Per-LinkedIn-account send budget for this tick, so one connected account
  // doesn't consume another's pacing allowance in the same workspace.
  const budgets = new Map<string, TickBudget>();
  const budgetForAccount = (linkedInAccountId: string) => {
    let budget = budgets.get(linkedInAccountId);
    if (!budget) {
      budget = newTickBudget();
      budgets.set(linkedInAccountId, budget);
    }
    return budget;
  };
  let actions = 0;

  for (const enrollment of enrollments) {
    const campaign =
      campaignCache.get(enrollment.campaignId) ||
      (await listCampaigns(enrollment.workspaceId)).find((item) => item.id === enrollment.campaignId);

    // Campaign deleted out from under the enrollment: stop it for good.
    if (!campaign) {
      if (mode.dryRun) {
        await safeLogAutomationRun({
          workspaceId: enrollment.workspaceId,
          kind: "campaign",
          status: "completed",
          message: automationDecisionMessage({
            dryRun: true,
            enrollmentId: enrollment.id,
            campaignId: enrollment.campaignId,
            leadId: enrollment.leadId,
            result: "campaign-deleted",
          }),
        });
      } else {
        await updateEnrollment(enrollment.workspaceId, enrollment.id, { status: "stopped" });
      }
      continue;
    }

    if (isWorkspaceAutomationPaused(mode, enrollment.workspaceId)) {
      await safeLogAutomationRun({
        workspaceId: enrollment.workspaceId,
        kind: "campaign",
        status: "completed",
        message: automationDecisionMessage({
          enrollmentId: enrollment.id,
          campaignId: campaign.id,
          leadId: enrollment.leadId,
          result: "workspace-paused",
        }),
      });
      continue;
    }

    // Paused/draft campaign: defer instead of `continue`. Leaving a due, never-
    // updated enrollment in place lets inactive work occupy the limited due
    // enrollment window and crowd out active campaigns. pausedDeferredAt marks
    // the defer as pause-only so resumeCampaign can wake exactly these.
    if (campaign.status !== "active") {
      if (mode.dryRun) {
        await safeLogAutomationRun({
          workspaceId: enrollment.workspaceId,
          kind: "campaign",
          status: "completed",
          message: automationDecisionMessage({
            dryRun: true,
            enrollmentId: enrollment.id,
            campaignId: campaign.id,
            leadId: enrollment.leadId,
            result: "campaign-inactive",
          }),
        });
      } else {
        await updateEnrollment(enrollment.workspaceId, enrollment.id, {
          nextActionAt: addMinutes(PAUSED_CAMPAIGN_DEFER_MINUTES),
          pausedDeferredAt: new Date().toISOString(),
        });
      }
      continue;
    }

    // Don't run paid outreach for workspaces without an active subscription;
    // defer (don't drop) so it resumes immediately once billing is restored.
    let workspaceActive = workspaceActiveCache.get(enrollment.workspaceId);
    if (workspaceActive === undefined) {
      workspaceActive = hasActiveSubscription(await getWorkspace(enrollment.workspaceId));
      workspaceActiveCache.set(enrollment.workspaceId, workspaceActive);
    }
    if (!workspaceActive) {
      if (mode.dryRun) {
        await safeLogAutomationRun({
          workspaceId: enrollment.workspaceId,
          kind: "campaign",
          status: "completed",
          message: automationDecisionMessage({
            dryRun: true,
            enrollmentId: enrollment.id,
            campaignId: campaign.id,
            leadId: enrollment.leadId,
            result: "workspace-inactive",
          }),
        });
      } else {
        await updateEnrollment(enrollment.workspaceId, enrollment.id, {
          nextActionAt: addMinutes(INACTIVE_WORKSPACE_DEFER_MINUTES),
        });
      }
      continue;
    }

    campaignCache.set(campaign.id, campaign);
    try {
      const result = mode.dryRun
        ? await previewEnrollment(enrollment, campaign, sourceAgentPaused)
        : await runEnrollment(enrollment, campaign, budgetForAccount, sourceAgentPaused);
      if (result !== "stopped") actions += 1;
      await safeLogAutomationRun({
        workspaceId: enrollment.workspaceId,
        kind: "campaign",
        status: "completed",
        message: automationDecisionMessage({
          dryRun: mode.dryRun,
          enrollmentId: enrollment.id,
          campaignId: campaign.id,
          leadId: enrollment.leadId,
          result,
        }),
      });
      if (!mode.dryRun && enrollment.retryCount) {
        await updateEnrollment(enrollment.workspaceId, enrollment.id, { retryCount: 0 });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Enrollment run failed";
      const errorType = error instanceof UnipileResponseError ? error.errorType : undefined;

      if (errorType === "errors/invalid_recipient") {
        // LinkedIn can never deliver to this recipient (deleted/locked
        // profile, bad id) - retrying only burns pacing budget forever.
        await updateEnrollment(enrollment.workspaceId, enrollment.id, {
          status: "stopped",
          lastError: message,
          pendingAction: undefined,
        });
        await logAutomationRun({
          workspaceId: enrollment.workspaceId,
          kind: "campaign",
          status: "error",
          message: `Stopped enrollment ${enrollment.id}: recipient unreachable. ${message}`,
        });
        continue;
      }

      if (errorType === "errors/cannot_resend_yet") {
        // Unipile's detail text is the same generic "temporary provider limit"
        // whether this one recipient can't be re-invited yet or the whole
        // account hit its weekly cap. The sent-invitations list is ground
        // truth for the first case: if this person already has a pending
        // invite (sent manually or before this enrollment), record that
        // reality and hand over to acceptance polling instead of retrying a
        // send LinkedIn will keep rejecting.
        const rejectedLead = await findLeadForWorkspace({
          workspaceId: enrollment.workspaceId,
          leadId: enrollment.leadId,
        });
        const rejectedAccount = await getLinkedInAccountForWorkspace(
          enrollment.workspaceId,
          campaign.linkedInAccountId,
        );
        const invitePending =
          rejectedLead && rejectedAccount
            ? await hasPendingSentInvitation({
                accountId: rejectedAccount.accountId,
                providerProfileId: rejectedLead.providerProfileId,
              })
            : null;

        if (invitePending) {
          await updateLead(enrollment.workspaceId, enrollment.leadId, {
            outreachStatus: "invited",
          });
          await updateEnrollment(enrollment.workspaceId, enrollment.id, {
            status: "connection_sent",
            currentStepIndex: enrollment.currentStepIndex + 1,
            connectionSentAt: new Date().toISOString(),
            pendingAction: undefined,
            lastError: undefined,
            nextActionAt: addMinutes(CONNECTION_GIVE_UP_DAYS * 24 * 60),
          });
          await logAutomationRun({
            workspaceId: enrollment.workspaceId,
            kind: "campaign",
            status: "completed",
            message: `Lead ${enrollment.leadId} already has a pending invite; marked connection_sent and waiting for acceptance.`,
          });
          continue;
        }

        // No pending invite: the recipient was previously invited and
        // withdrawn (LinkedIn blocks re-invites for weeks), or the account is
        // capped. A single rejection only defers this enrollment.
        // Distinct-recipient rejections are tallied per LinkedIn account and
        // cleared on any successful invite from that account. Enough failures
        // close together arm a short breaker, but do not prove a weekly limit:
        // withdrawn invites produce the same provider error.
        await updateEnrollment(enrollment.workspaceId, enrollment.id, {
          lastError: message,
          nextActionAt: addMinutes(RESEND_BLOCKED_DEFER_MINUTES),
          pendingAction: undefined,
        });
        await logAutomationRun({
          workspaceId: enrollment.workspaceId,
          kind: "campaign",
          status: "error",
          message: `Invite to lead ${enrollment.leadId} is blocked from resending; deferring this enrollment three weeks. ${message}`,
        });

        if (!rejectedAccount) {
          await logAutomationRun({
            workspaceId: enrollment.workspaceId,
            kind: "campaign",
            status: "error",
            message: `Could not identify the LinkedIn account for ${enrollment.id}; only the rejected recipient was deferred.`,
          });
          continue;
        }

        const distinctRejections = await recordInviteLimitSignal(
          enrollment.workspaceId,
          rejectedAccount.id,
          enrollment.leadId,
        );
        if (distinctRejections >= INVITE_LIMIT_SIGNAL_THRESHOLD) {
          const until = addMinutes(INVITE_RECHECK_MINUTES);
          const alreadyCoolingDown = Boolean(
            await getInviteCooldown(enrollment.workspaceId, rejectedAccount.id),
          );
          await setInviteCooldown(enrollment.workspaceId, rejectedAccount.id, until);
          const budget = budgetForAccount(rejectedAccount.id);
          budget.connects = 0;
          budget.inviteCooldownUntil = until;
          await logAutomationRun({
            workspaceId: enrollment.workspaceId,
            kind: "campaign",
            status: "error",
            message: `${distinctRejections} recipients were rejected within a day on ${rejectedAccount.displayName}; pausing invites for this LinkedIn account until ${until}, then automatically probing again.`,
          });
          if (!alreadyCoolingDown) {
            await notifyInvitePause(
              enrollment.workspaceId,
              until,
              rejectedAccount.id,
              rejectedAccount.displayName,
            );
          }
        }
        continue;
      }

      const retryCount = (enrollment.retryCount || 0) + 1;
      const failedStep = campaign.steps[enrollment.currentStepIndex];
      const retryMinutes =
        retryCount >= ENROLLMENT_MAX_RETRIES
          ? ENROLLMENT_COOLDOWN_MINUTES
          : failedStep?.type === "connect"
            ? CONNECTION_SEND_RETRY_MINUTES
            : ENROLLMENT_RETRY_MINUTES;
      await updateEnrollment(enrollment.workspaceId, enrollment.id, {
        lastError: message,
        retryCount,
        nextActionAt: addMinutes(retryMinutes),
        // A response-bearing Unipile error means the send was rejected outright,
        // so its side effect never happened. Clear the in-flight claim so the
        // next tick retries cleanly instead of seeing a stranded pendingAction
        // and parking the enrollment for manual review. Network drops/timeouts
        // (no UnipileResponseError) stay ambiguous and keep the claim.
        ...(error instanceof UnipileResponseError ? { pendingAction: undefined } : {}),
      });
      await logAutomationRun({
        workspaceId: enrollment.workspaceId,
        kind: "campaign",
        status: "error",
        message,
      });
    }
  }

  return { enrollments: enrollments.length, actions, newlyEnrolled };
}

// Re-asserts the Unipile message/relation webhooks from the server itself.
// Dashboard-only configuration was a silent single point of failure for the
// product's core promise (reply detection -> interest emails). Never registers
// a non-https URL: dev and prod share one Unipile account, and a localhost
// registration would add a dead delivery target.
async function registerUnipileWebhooks() {
  try {
    const secret = process.env.UNIPILE_WEBHOOK_SECRET;
    const appUrl = getAppBaseUrl();
    if (!secret || !appUrl.startsWith("https://")) return;
    if (!(await claimSystemTask("unipile-webhook-registration", WEBHOOK_REGISTRATION_INTERVAL_MS))) {
      return;
    }

    const requestUrl = `${appUrl}/api/webhooks/unipile`;
    const result = await ensureUnipileWebhooks({
      requestUrl,
      secretHeaderValue: secret,
    });
    if (!result.skipped && result.created.length) {
      await safeLogAutomationRun({
        kind: "cron",
        status: "completed",
        message: `Registered Unipile webhooks (${result.created.join(", ")}) -> ${requestUrl}.`,
      });
    }
  } catch (error) {
    await safeLogAutomationRun({
      kind: "cron",
      status: "error",
      message: `Unipile webhook registration failed: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    });
  }
}

// Batched acceptance detection for one account: compare every pending invite
// against a single sent-invitations listing. Invites still in the list are
// pending - no per-lead work at all. Invites that vanished are either accepted
// or withdrawn; only those few get a live profile check to confirm.
async function sweepAcceptedInvitations(input: {
  workspaceId: string;
  account: LinkedInAccount;
  campaignsById: Map<string, Campaign>;
}) {
  const { workspaceId, account, campaignsById } = input;
  const enrollments = (await listConnectionSentEnrollments(workspaceId)).filter((enrollment) =>
    campaignsById.has(enrollment.campaignId),
  );
  if (!enrollments.length) return { accepted: 0 };

  const pendingIds = await listSentInvitationProviderIds(account.accountId);
  if (!pendingIds) {
    await safeLogAutomationRun({
      workspaceId,
      kind: "campaign",
      status: "error",
      message: `Acceptance sweep for ${account.displayName || account.id} skipped: sent-invitations list unavailable.`,
    });
    return { accepted: 0 };
  }

  let accepted = 0;
  let checks = 0;
  for (const enrollment of enrollments) {
    const lead = await findLeadForWorkspace({ workspaceId, leadId: enrollment.leadId });
    const providerId = lead?.providerProfileId;
    if (!lead || !providerId) continue;
    // Still in the sent list: the invite is pending, nothing to do.
    if (pendingIds.has(providerId.toLowerCase())) continue;
    if (checks >= CONNECTION_SWEEP_CHECK_LIMIT) break;
    checks += 1;

    const isConnected = await isFirstDegreeConnection({
      accountId: account.accountId,
      identifier: providerId,
    });
    // Not first-degree (withdrawn/expired invite) or unknown: leave the
    // enrollment for its give-up date rather than guessing.
    if (isConnected !== true) continue;

    await applyConnectionAccepted({
      workspaceId,
      lead,
      enrollment,
      campaign: campaignsById.get(enrollment.campaignId),
      account,
    });
    await updateLead(workspaceId, lead.id, { outreachStatus: "connected" });
    accepted += 1;
    await safeLogAutomationRun({
      workspaceId,
      kind: "campaign",
      status: "completed",
      message: `Stored connection approval from ${lead.name} (acceptance sweep).`,
    });
  }

  return { accepted };
}

// Reply-sync fallback for one account: pull recent inbound provider messages
// and run any unseen ones through the same pipeline as the webhook. Dedupe on
// the provider message id makes re-reading an already-handled message a no-op.
async function syncInboundReplies(input: {
  workspaceId: string;
  account: LinkedInAccount;
  previousRunAt: number;
}) {
  const { workspaceId, account } = input;
  const sinceMs =
    (input.previousRunAt || Date.now() - REPLY_SYNC_INTERVAL_MS) - REPLY_SYNC_OVERLAP_MS;
  const messages = await listRecentInboundMessages({
    accountId: account.accountId,
    sinceMs,
    limit: REPLY_SYNC_MESSAGE_LIMIT,
  });

  let stored = 0;
  for (const message of messages) {
    // Without a stable provider id the dedupe cannot hold; skip rather than
    // risk double-processing the same reply on every sync pass.
    if (!message.id || !message.senderProviderId) continue;
    const lead = await findLeadForWorkspace({
      workspaceId,
      providerProfileId: message.senderProviderId,
    });
    if (!lead) continue;

    const result = await processInboundMessage({
      workspaceId,
      lead,
      body: message.body,
      senderName: message.senderName || lead.name,
      providerMessageId: message.id,
      account,
    });
    if (!result.duplicate) stored += 1;
  }

  return stored;
}

// Webhooks are the primary signal for acceptances and replies; this phase is
// the batched fallback that keeps both flowing when a webhook is missed, plus
// the periodic webhook (re-)registration itself. Runs on its own claim cycle
// so the per-account claim reads stay off the every-tick hot path.
async function runProviderSyncs(mode: AutomationSafetyMode) {
  const result = { sweptAccounts: 0, acceptedViaSweep: 0, syncedReplies: 0 };
  // Live provider reads plus real state transitions and emails - nothing here
  // is dry-run safe, and a dry run must not consume the interval claims.
  if (mode.dryRun) return result;

  if (!(await claimSystemTask("provider-sync-cycle", PROVIDER_SYNC_CYCLE_MS))) return result;

  await registerUnipileWebhooks();

  const campaigns = await getActiveCampaigns();
  const accounts = new Map<
    string,
    { workspaceId: string; account: LinkedInAccount; campaignsById: Map<string, Campaign> }
  >();
  for (const campaign of campaigns) {
    if (isWorkspaceAutomationPaused(mode, campaign.workspaceId)) continue;
    try {
      const account = await getLinkedInAccountForWorkspace(
        campaign.workspaceId,
        campaign.linkedInAccountId,
      );
      if (!account) continue;
      const key = `${campaign.workspaceId}:${account.id}`;
      const entry =
        accounts.get(key) ||
        { workspaceId: campaign.workspaceId, account, campaignsById: new Map<string, Campaign>() };
      entry.campaignsById.set(campaign.id, campaign);
      accounts.set(key, entry);
    } catch (error) {
      console.error(
        `[automation] failed to resolve account for campaign ${campaign.id}:`,
        error,
      );
    }
  }

  for (const entry of accounts.values()) {
    try {
      if (await claimSystemTask(`connection-sweep-${entry.account.id}`, CONNECTION_SWEEP_INTERVAL_MS)) {
        const sweep = await sweepAcceptedInvitations(entry);
        result.sweptAccounts += 1;
        result.acceptedViaSweep += sweep.accepted;
      }
    } catch (error) {
      await safeLogAutomationRun({
        workspaceId: entry.workspaceId,
        kind: "campaign",
        status: "error",
        message: `Acceptance sweep failed: ${error instanceof Error ? error.message : "unknown error"}`,
      });
    }

    try {
      const syncClaim = await claimSystemTask(
        `reply-sync-${entry.account.id}`,
        REPLY_SYNC_INTERVAL_MS,
      );
      if (syncClaim) {
        result.syncedReplies += await syncInboundReplies({
          workspaceId: entry.workspaceId,
          account: entry.account,
          previousRunAt: syncClaim.previousRunAt,
        });
      }
    } catch (error) {
      await safeLogAutomationRun({
        workspaceId: entry.workspaceId,
        kind: "campaign",
        status: "error",
        message: `Reply sync failed: ${error instanceof Error ? error.message : "unknown error"}`,
      });
    }
  }

  return result;
}

// Logging itself writes to Firestore, so it must never throw and abort the tick
// (e.g. when the database is unreachable). Failures still surface in stdout.
async function safeLogAutomationRun(run: Parameters<typeof logAutomationRun>[0]) {
  try {
    await logAutomationRun(run);
  } catch (error) {
    console.error("[automation] failed to log run:", error);
  }
}

// Tells the workspace owner repeated provider rejections activated a temporary
// account-specific safety pause. Called only when a pause is newly activated,
// and additionally day-claimed per account. Never throws - an email failure
// must not disturb enrollment error handling.
async function notifyInvitePause(
  workspaceId: string,
  cooldownUntil: string,
  linkedInAccountId: string,
  accountName?: string,
) {
  try {
    const workspace = await getWorkspace(workspaceId);
    const email = workspace.notificationEmail;
    // Product emails only go to paying/bypassed workspaces.
    if (!email || !hasActiveSubscription(workspace)) return;

    const timezone = workspace.timezone || "UTC";
    const { day } = localDayAndHour(timezone);
    const notificationKind = `invite-pause-${linkedInAccountId}`;
    if (!(await claimDailyNotification(workspaceId, notificationKind, day))) return;

    const resumeAtText = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(cooldownUntil));
    await sendInvitePauseNotification({
      to: email,
      resumeAtText,
      accountName,
      idempotencyKey: `${notificationKind}-${workspaceId}-${day}`,
    });
    await safeLogAutomationRun({
      workspaceId,
      kind: "digest",
      status: "completed",
      message: `Sent temporary invite-pause notification to ${email}${accountName ? ` (${accountName})` : ""}.`,
    });
  } catch (error) {
    console.error("[automation] failed to send invite-pause notification:", error);
  }
}

// What the workspace's automation actually did in the trailing 24h, tallied
// from automationRuns (the activity ground truth) plus lead creation times.
async function collectDigestStats(workspaceId: string) {
  const since = new Date(Date.now() - DIGEST_WINDOW_MS).toISOString();
  const [leads, runs] = await Promise.all([
    listLeads(workspaceId, undefined, 2000),
    listAutomationRuns(workspaceId, 2000),
  ]);
  const recent = runs.filter((run) => run.createdAt >= since);
  const count = (pattern: RegExp) =>
    recent.filter((run) => pattern.test(run.message || "")).length;

  return {
    newLeads: leads.filter((lead) => lead.createdAt >= since).length,
    invitesSent: count(/-> connection$/),
    connectionsAccepted: count(/^Stored connection approval/),
    messagesSent: count(/-> (message|ai-reply)$/),
    repliesReceived: count(/^Stored reply from/),
  };
}

// Sends each workspace one summary email on the first tick at/after 9am in
// its local timezone, covering the trailing 24 hours.
async function sendDailyDigests(mode: AutomationSafetyMode) {
  let sent = 0;
  const workspaces = await listWorkspaces();

  for (const workspace of workspaces) {
    try {
      const email = workspace.notificationEmail;
      if (!email || !hasActiveSubscription(workspace)) continue;

      const { day, hour } = localDayAndHour(workspace.timezone);
      if (hour < DIGEST_LOCAL_HOUR) continue;
      // Dry-run must not consume the day claim, or the real tick stays silent.
      if (mode.dryRun) continue;
      if (
        !(await claimNotificationAfterInterval(
          workspace.id,
          "digest",
          day,
          DIGEST_WINDOW_MS,
        ))
      ) continue;

      const stats = await collectDigestStats(workspace.id);
      await sendDailyDigestEmail({
        to: email,
        day,
        stats,
        idempotencyKey: `digest-${workspace.id}-${day}`,
      });
      sent += 1;
      await safeLogAutomationRun({
        workspaceId: workspace.id,
        kind: "digest",
        status: "completed",
        message: `Sent daily digest for ${day} to ${email}.`,
      });
    } catch (error) {
      await safeLogAutomationRun({
        workspaceId: workspace.id,
        kind: "digest",
        status: "error",
        message: `Daily digest failed: ${error instanceof Error ? error.message : "unknown error"}`,
      });
    }
  }

  return sent;
}

type RunAutomationTickOptions = AutomationSafetyOptions & {
  scheduled?: boolean;
};

export async function runAutomationTick(options: RunAutomationTickOptions = {}) {
  const mode = getAutomationSafetyMode(options);
  if (mode.disabled) {
    return { skipped: true as const, reason: "Automation is disabled by safety configuration." };
  }

  const acquired = await acquireTickLock(
    TICK_LOCK_ID,
    TICK_LOCK_TTL_MS,
    options.scheduled ? TICK_SCHEDULE_MIN_INTERVAL_MS : 0,
  ).catch((error) => {
    console.error("[automation] failed to acquire tick lock:", error);
    return false;
  });
  if (!acquired) {
    return {
      skipped: true as const,
      reason: "Another automation tick is still running or started recently.",
    };
  }

  try {
    return await runAutomationTickInner(mode);
  } finally {
    await releaseTickLock(TICK_LOCK_ID).catch((error) => {
      console.error("[automation] failed to release tick lock:", error);
    });
  }
}

async function runAutomationTickInner(mode: AutomationSafetyMode) {
  let agentResult = {
    agents: 0,
    signalAgents: 0,
    signalsObserved: 0,
    leadsAdded: 0,
    timeBudgetExpiredRuns: 0,
  };
  let campaignResult = { enrollments: 0, actions: 0, newlyEnrolled: 0 };
  const errors: string[] = [];

  // Run the agent (lead discovery) and campaign (connect/message) phases
  // independently and concurrently. A failure or slowdown in one phase must
  // not prevent the other from running - a backlog of slow discovery runs
  // must never delay due connection requests and messages (and vice versa).
  await Promise.all([
    (async () => {
      try {
        agentResult = await runAgents(mode);
      } catch (error) {
        const message = error instanceof Error ? error.message : "runAgents failed";
        errors.push(`agents: ${message}`);
        console.error("[automation] agent phase failed:", error);
        await safeLogAutomationRun({ kind: "agent", status: "error", message });
      }
    })(),
    (async () => {
      try {
        campaignResult = await runCampaigns(mode);
      } catch (error) {
        const message = error instanceof Error ? error.message : "runCampaigns failed";
        errors.push(`campaigns: ${message}`);
        console.error("[automation] campaign phase failed:", error);
        await safeLogAutomationRun({ kind: "campaign", status: "error", message });
      }
    })(),
  ]);

  // Webhook fallback work (acceptance sweep + reply sync) runs after the send
  // phases so it never competes with due outreach for the same tick's runtime.
  let providerSync = { sweptAccounts: 0, acceptedViaSweep: 0, syncedReplies: 0 };
  try {
    providerSync = await runProviderSyncs(mode);
  } catch (error) {
    const message = error instanceof Error ? error.message : "runProviderSyncs failed";
    errors.push(`provider-sync: ${message}`);
    console.error("[automation] provider sync phase failed:", error);
  }

  // After the action phases so today's activity is included in the summary.
  let digestsSent = 0;
  try {
    digestsSent = await sendDailyDigests(mode);
  } catch (error) {
    const message = error instanceof Error ? error.message : "sendDailyDigests failed";
    errors.push(`digests: ${message}`);
    console.error("[automation] digest phase failed:", error);
  }

  await safeLogAutomationRun({
    kind: "cron",
    status: errors.length ? "error" : "completed",
    message: `${mode.dryRun ? "DRY RUN " : ""}Agents: ${agentResult.agents}, signal agents: ${agentResult.signalAgents}, signals: ${agentResult.signalsObserved}, leads: ${agentResult.leadsAdded}, time-expired runs: ${agentResult.timeBudgetExpiredRuns}, newly enrolled: ${campaignResult.newlyEnrolled}, campaign actions: ${campaignResult.actions}${providerSync.sweptAccounts ? `, sweeps: ${providerSync.sweptAccounts} (accepted: ${providerSync.acceptedViaSweep})` : ""}${providerSync.syncedReplies ? `, synced replies: ${providerSync.syncedReplies}` : ""}${digestsSent ? `, digests: ${digestsSent}` : ""}${errors.length ? ` | errors: ${errors.join("; ")}` : ""}`,
  });

  return { agentResult, campaignResult, errors, dryRun: mode.dryRun };
}
