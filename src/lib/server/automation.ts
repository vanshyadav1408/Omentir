import "server-only";

import {
  acquireTickLock,
  releaseTickLock,
  renewTickLock,
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
  claimActionSlot,
  claimSystemTask,
  createConversationMessage,
  consumeDailyQuota,
  deferAgentRun,
  getInviteCooldown,
  hasDailyQuotaRemaining,
  loadSchedulingContext,
  planActionSlots,
  type SchedulingContext,
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
import { resolveBookingLink } from "@/lib/scheduling-link";
import {
  draftCampaignMessage,
  draftCampaignReplyMessage,
  MAX_AI_SEQUENCE_MESSAGES,
  normalizeAgentSearch,
  scoreLeadForProduct,
} from "./gemini";
import {
  applyConnectionAccepted,
  draftUpcomingMessagePreview,
  processInboundMessage,
  refreshLeadProfileForDrafting,
} from "./inbound";
import { agentTargetLocations, matchesTargetLocation } from "./geo";
import { sendWindowTimeZoneForLead } from "./lead-time-zone";
import {
  agentUsesPeopleEngine,
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
  isInviteResendBlockedErrorType,
  INVITE_LIMIT_SIGNAL_THRESHOLD,
  isAnonymousLinkedInProfile,
  renderTemplate,
} from "./outreach-rules";
import { shouldStopForReply } from "./reply-automation-policy";
import { localDayAndHour } from "./scheduling";
import { isWithinSendWindow, type SendActionKind } from "./send-schedule";
import { hasActiveSubscription } from "./subscription";
import { getAppBaseUrl } from "./runtime-config";
import { sendDailyDigestEmail, sendInvitePauseNotification } from "./email";
import {
  ensureUnipileWebhooks,
  hasPendingSentInvitation,
  isFirstDegreeConnection,
  listRecentInboundMessages,
  listSentInvitationProviderIds,
  profileSearchKeys,
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
// automation by at most 20 minutes, which the account drip safely absorbs.
const TICK_LOCK_TTL_MS = 20 * 60 * 1000;
const TICK_LOCK_RENEW_INTERVAL_MS = 5 * 60 * 1000;
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
const UNCONFIRMED_PROVIDER_SEND_PREFIX = "Unconfirmed provider send";

class UnconfirmedProviderSendError extends Error {}

// Human-like pacing. Every outbound action - invite, follow-up, AI reply -
// now shares one per-account drip of at most one per SPACING_MINUTES, enforced
// across ticks and manual runs by the persistent claimActionSlot gate. Anything
// that cannot go now is handed to the planner (send-schedule.ts), which returns
// the real next slot inside the campaign's send window and under the local-day
// caps, rather than a ladder that ignored both.
const PACING_MIN_PER_TICK = 1;
const PACING_MAX_PER_TICK = 3;
// Only used when the planner itself fails (Firestore error); a short defer so
// the enrollment retries rather than stranding.
const PACING_FALLBACK_MINUTES = 10;

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

// Daily digest email: 9am in the workspace's local timezone, every day. Ticks
// run every couple of minutes, so the 9am hour is what normally sends; the
// catch-up hours only exist so an outage across 9am still gets the digest out
// that morning instead of at whatever hour the tick recovered. Past that it is
// skipped - a "your last 24 hours" mail at 11pm is worse than none.
const DIGEST_LOCAL_HOUR = 9;
const DIGEST_LAST_CATCH_UP_HOUR = 11;
// Trailing period the digest reports on.
const DIGEST_WINDOW_MS = 24 * 60 * 60 * 1000;
// Guard against a second digest inside one local day, without pinning the send
// to yesterday's clock time: a catch-up send at 11:59 is still >= 20h before
// the next 9am, so tomorrow's digest lands back on 9am instead of drifting
// later every day (which a strict 24h interval did).
const DIGEST_MIN_INTERVAL_MS = 20 * 60 * 60 * 1000;

type TickBudget = {
  connects: number;
  messages: number;
  // Per-tick cache of this LinkedIn account's invite cooldown: undefined = not yet
  // fetched, null = none active.
  inviteCooldownUntil?: string | null;
  // Slots handed out by the planner earlier in this same tick. They are already
  // written to their enrollments, but a Firestore query issued moments later
  // may not see them yet, so they ride along as additionalReserved to stop two
  // enrollments in one tick being planned onto the same minute.
  slotsPlannedThisTick: number[];
  // Reserved slots + spent quota, read once per account per tick. Without this
  // every deferred enrollment re-ran two Firestore queries on every tick.
  // The quota snapshot goes stale as this tick sends, which can only make the
  // planner optimistic about today; hasDailyQuotaRemaining is still checked
  // live at send time, so the result is a re-plan next tick, never an
  // over-send. Correct per-account even when two campaigns share the account:
  // the context depends only on workspace + account, and each campaign's own
  // send window is applied per call inside planActionSlots.
  schedulingContext?: SchedulingContext;
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sendProviderAction<T>(action: () => Promise<T>) {
  try {
    return await action();
  } catch (error) {
    if (error instanceof UnipileResponseError) throw error;
    throw new UnconfirmedProviderSendError(
      error instanceof Error ? error.message : "The provider result was unavailable.",
    );
  }
}

function newTickBudget(): TickBudget {
  return {
    connects: 1,
    messages: randomInt(PACING_MIN_PER_TICK, PACING_MAX_PER_TICK),
    slotsPlannedThisTick: [],
  };
}

// The single "when can this actually go out" answer, used for every deferral
// that represents a pending send. Policy parks (paused campaign, invite
// cooldown, 21-day give-up) deliberately do NOT come through here - they are
// "re-evaluate later", not "send later", and forcing them into a send slot
// would burn scheduling capacity on work that is not going to send.
async function reserveSendSlot(input: {
  budget: TickBudget;
  workspace: Workspace;
  campaign: Campaign;
  enrollmentId: string;
  kind: SendActionKind;
  earliestAt?: number;
  // The recipient's zone, so the slot lands inside THEIR window. Undefined
  // falls back to the workspace's zone inside the planner.
  timezone?: string;
}) {
  const { budget, workspace, campaign } = input;
  try {
    budget.schedulingContext ??= await loadSchedulingContext(workspace, campaign);
    const plan = await planActionSlots({
      workspace,
      campaign,
      context: budget.schedulingContext,
      additionalReserved: budget.slotsPlannedThisTick,
      actions: [
        {
          id: input.enrollmentId,
          kind: input.kind,
          earliestAt: input.earliestAt ?? Date.now(),
          timezone: input.timezone,
        },
      ],
    });
    const slot = plan.get(input.enrollmentId);
    if (slot === undefined) return addMinutes(PACING_FALLBACK_MINUTES);
    budget.slotsPlannedThisTick.push(slot);
    return new Date(slot).toISOString();
  } catch (error) {
    // Planning is a read-heavy path; a Firestore hiccup must not strand the
    // enrollment. Fall back to the old fixed defer so it retries soon.
    console.warn(
      "[automation] send-slot planning failed; using fallback defer:",
      error instanceof Error ? error.message : error,
    );
    return addMinutes(PACING_FALLBACK_MINUTES);
  }
}

type SourceAgentBlock = "paused" | "deleted" | null;
type SourceAgentBlockLookup = (workspaceId: string, agentId: string) => Promise<SourceAgentBlock>;

// Many due enrollments share the same source agent; its state only needs one
// read per tick.
//
// Pause applies to leads-only agents too. It used to exempt them, reasoning
// that a leads-only agent owns no outreach so its pause should only stop
// discovery - but the leads it finds do get enrolled by campaigns on OTHER
// groups, and the leads-only send block only covers the agent's own group.
// Between them a paused leads-only agent kept sending invites with no way for
// the user to stop it. Pausing any agent now freezes automated touches to the
// leads it sourced.
//
// A deleted agent (doc gone) used to read as not paused, so its leads kept
// flowing: deleteAgent stops the enrollments that exist at that moment, but a
// lead of the deleted agent sitting in a second group was simply re-enrolled by
// that group's campaign on a later tick and messaged again. Deleted now blocks
// like paused, permanently rather than parked - there is no agent left to
// resume.
function newSourceAgentBlockLookup(): SourceAgentBlockLookup {
  const cache = new Map<string, SourceAgentBlock>();
  return async (workspaceId, agentId) => {
    const key = `${workspaceId}:${agentId}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const agent = await getAgent(workspaceId, agentId);
    const block: SourceAgentBlock = !agent ? "deleted" : agent.status === "paused" ? "paused" : null;
    cache.set(key, block);
    return block;
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
        await safeLogAutomationRun({
          workspaceId: agent.workspaceId,
          kind: "agent",
          status: "error",
          message: `Agent ${agent.id} needs a connected LinkedIn account before discovery can run.`,
        });
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

      // Agent may have been deleted between getDueAgents and here (or mid
      // cascade). Skip quietly - there is nothing left to mark running/error.
      if (!(await markAgentStarted(agent))) continue;

      if (agentUsesPeopleEngine(agent)) {
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

      const criteria = await normalizeAgentSearch(agent);
      const targetLocations = agentTargetLocations(agent, profile);

      // Daily searches largely return the same people. Leads already in this
      // group are paged past, while a lead from another group must be scored
      // against this agent before adoption. A global score from another agent
      // is not evidence that the person matches this agent's request.
      const existingLeads = await listLeads(agent.workspaceId, undefined, 5000);
      const existingLeadsById = new Map(existingLeads.map((lead) => [lead.id, lead]));
      const groupLeadKeys = new Set(
        existingLeads
          .filter((lead) => lead.groupIds?.includes(agent.targetGroupId))
          .flatMap((lead) => profileSearchKeys(lead)),
      );

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
        excludeKeys: groupLeadKeys,
      });

      for (const rawLead of rawLeads) {
        // Hard location gate. LinkedIn classic search ignores the agent's
        // target country (network-biased results), and AI fit scoring alone
        // still lets wrong-region leads through when title/industry match.
        if (!matchesTargetLocation(rawLead.location, targetLocations)) {
          continue;
        }
        const existing = existingLeadsById.get(leadDocId(agent.workspaceId, rawLead));
        if (existing) {
          if (!existing.groupIds?.includes(agent.targetGroupId)) {
            const score = await scoreLeadForProduct(
              { ...rawLead, ...existing },
              profile,
              agent,
            );
            if (score.fitScore >= STANDARD_AGENT_SCORE_THRESHOLD) {
              await upsertLead(agent.workspaceId, agent.targetGroupId, {
                linkedInUrl: existing.linkedInUrl || rawLead.linkedInUrl,
                providerProfileId: existing.providerProfileId || rawLead.providerProfileId,
              });
            }
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
            const score = await scoreLeadForProduct(
              { ...enrichedLead, ...enrichedExisting },
              profile,
              agent,
            );
            if (score.fitScore >= STANDARD_AGENT_SCORE_THRESHOLD) {
              await upsertLead(agent.workspaceId, agent.targetGroupId, {
                linkedInUrl: enrichedExisting.linkedInUrl || enrichedLead.linkedInUrl,
                providerProfileId:
                  enrichedExisting.providerProfileId || enrichedLead.providerProfileId,
              });
            }
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
      // Soft-fail the agent to error + next daily slot, but always record the
      // real cause so the activity feed is not just a red badge with no reason.
      // If the agent was deleted mid-run, markAgentRun no-ops and we skip the
      // error log - there is no agent left to surface it on.
      const message = error instanceof Error ? error.message : "Agent run failed";
      console.error(
        `[automation] agent ${agent.id} run failed:`,
        message,
        error instanceof Error ? error.stack : error,
      );

      // Vertex/Firestore INVALID_ARGUMENT is often one bad candidate payload
      // after partial progress. Parking the agent as Error until tomorrow
      // hid working discovery (leads already saved, outreach already running).
      // Keep the agent active and on its normal daily slot; still log the error.
      const softRecover = /INVALID_ARGUMENT|Request contains an invalid argument/i.test(
        message,
      );
      const marked = await markAgentRun(agent, softRecover);
      if (!marked) continue;
      await logAutomationRun({
        workspaceId: agent.workspaceId,
        kind: "agent",
        status: "error",
        message: softRecover ? `Recovered active after: ${message}` : message,
      });
    }
  }

  return { agents: agents.length, signalAgents, signalsObserved, leadsAdded, timeBudgetExpiredRuns };
}

// The AI sequence is done with this lead (final message sent, or the cap was
// hit) and they never replied. Silence is not a signal worth an email: the user
// only hears from Omentir when a lead does something (replies, shows interest),
// so this just records the end of the sequence in the activity log. The lead is
// still on the Leads and Messages pages for anyone who wants to follow up.
async function recordSequenceExhausted(input: {
  workspace: Workspace;
  campaign: Campaign;
  lead: Lead;
}) {
  const { workspace, campaign, lead } = input;
  await safeLogAutomationRun({
    workspaceId: workspace.id,
    kind: "campaign",
    status: "completed",
    message: `Sequence finished for ${lead.name} in ${campaign.name} with no reply; outreach stopped for this lead.`,
  });
}

async function runEnrollment(
  enrollment: CampaignEnrollment,
  campaign: Campaign,
  budgetForAccount: (linkedInAccountId: string) => TickBudget,
  sourceAgentBlock: SourceAgentBlockLookup,
  // A manual "Run now" is the user explicitly choosing this moment, so it may
  // send outside the campaign's window. The per-account spacing still applies:
  // that one protects the LinkedIn account, not the recipient's evening.
  options: { ignoreSendWindow?: boolean } = {},
) {
  const updateCurrentEnrollment = (patch: Partial<CampaignEnrollment>) =>
    updateEnrollment(enrollment.workspaceId, enrollment.id, patch);
  const workspace = await getWorkspace(enrollment.workspaceId);
  const sendWindow = campaign.sendWindow || "always";
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

  // Leads-only agents discover and score only. If one sourced this lead, never
  // connect or message - stop any enrollment that slipped through a shared
  // group, a second group the lead also belongs to, or an older attach path.
  if (lead.sourceAgentId) {
    const sourceAgent = await getAgent(enrollment.workspaceId, lead.sourceAgentId);
    if (sourceAgent?.leadsOnly) {
      await updateCurrentEnrollment({
        status: "stopped",
        lastError:
          "This lead was found by a leads-only agent and must not be messaged automatically.",
      });
      return "leads-only-agent";
    }
  }

  // The clock the send window is read on. A 9-6 window means 9-6 where the
  // LEAD is - the workspace's zone only stands in for leads whose profile
  // location names nowhere we recognise.
  const leadTimeZone = sendWindowTimeZoneForLead(lead.location, workspace.timezone);

  // Pausing an agent freezes every automated touch to the leads it sourced -
  // invites, follow-ups, acceptance polling, and AI replies - not just lead
  // discovery. Park like a paused campaign (marked with pausedDeferredAt) so
  // resumeAgent can wake exactly these enrollments instead of them idling for
  // up to a day. Deletion is not resumable, so it stops outright instead.
  const block = lead.sourceAgentId
    ? await sourceAgentBlock(enrollment.workspaceId, lead.sourceAgentId)
    : null;
  if (block === "deleted") {
    await updateCurrentEnrollment({
      status: "stopped",
      lastError: "The agent that sourced this lead was deleted; outreach stopped.",
      pendingAction: undefined,
    });
    return "agent-deleted";
  }
  if (block === "paused") {
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
    // A claim proves that an action was about to be sent, not that the provider
    // did not receive it. Never blindly retry an action whose result was lost.
    await updateCurrentEnrollment({
      status: "error",
      pendingAction: undefined,
      lastError: `${UNCONFIRMED_PROVIDER_SEND_PREFIX}: previous ${enrollment.pendingAction.kind} result was lost; manual verification is required.`,
      nextActionAt: addMinutes(ENROLLMENT_COOLDOWN_MINUTES),
    });
    return "unconfirmed-send";
  }

  if (enrollment.lastError?.startsWith(UNCONFIRMED_PROVIDER_SEND_PREFIX)) {
    return "unconfirmed-send";
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
    // The webhook applies the campaign's selected stopping point. Defend here
    // if a race left the enrollment armed while the latest inbound was stored.
    if (
      shouldStopForReply({
        replyHandling: campaign.replyHandling,
        intent,
        confidence: conversation?.replyIntentConfidence,
      })
    ) {
      await updateCurrentEnrollment({
        status: "stopped",
        pendingAction: undefined,
        lastError: `Skipped AI reply (intent: ${intent || "unknown"}).`,
      });
      return "reply-intent-stop";
    }

    // Gate before drafting, not after: a Gemini call per deferred attempt was
    // pure waste, and the draft would be stale by the time the slot opened.
    if (!options.ignoreSendWindow && !isWithinSendWindow(sendWindow, leadTimeZone, Date.now())) {
      await updateCurrentEnrollment({
        nextActionAt: await reserveSendSlot({
          budget,
          workspace,
          campaign,
          enrollmentId: enrollment.id,
          timezone: leadTimeZone,
          kind: "reply",
        }),
      });
      return "outside-send-window";
    }

    const replySlotAt = await claimActionSlot(enrollment.workspaceId, account.id);
    if (replySlotAt) {
      await updateCurrentEnrollment({
        nextActionAt: await reserveSendSlot({
          budget,
          workspace,
          campaign,
          enrollmentId: enrollment.id,
          timezone: leadTimeZone,
          kind: "reply",
          earliestAt: Date.parse(replySlotAt),
        }),
      });
      return "reply-spaced";
    }

    const profile = await getProductProfile(enrollment.workspaceId);
    const body = await draftCampaignReplyMessage({
      lead,
      productProfile: profile,
      campaignName: campaign.name,
      conversation: conversation?.messages || [],
      replyIntent: intent,
      replyIntentConfidence: conversation?.replyIntentConfidence,
      nextStepHint: conversation?.replyIntentNextStepHint,
      senderName: account.displayName,
      campaignGoal: campaign.campaignGoal,
      messageTone: campaign.messageTone,
      replyHandling: campaign.replyHandling,
      // Campaign may override; otherwise use the My Product demo booking link.
      bookingLink: resolveBookingLink(campaign.bookingLink, profile?.schedulingLink),
    });

    const claimed = await claimEnrollmentAction({
      workspaceId: enrollment.workspaceId,
      id: enrollment.id,
      expectedStatus: enrollment.status,
      expectedStepIndex: enrollment.currentStepIndex,
      kind: "reply",
    });
    if (!claimed) return "action-claimed";

    const sendResult = await sendProviderAction(() => sendLinkedInMessage({
      accountId: account.accountId,
      providerProfileId: lead.providerProfileId,
      linkedInUrl: lead.linkedInUrl,
      body,
    }));
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
    // An AI reply is a LinkedIn message like any other, so it counts against
    // the daily message budget. It previously did not, which meant the planner
    // reserved capacity for replies that reality never spent.
    await consumeDailyQuota(
      enrollment.workspaceId,
      "messages",
      workspace.settings.dailyMessageLimit,
      workspace.timezone,
    );
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
    // The wait's delay sets the EARLIEST the next message may go; the planner
    // then moves it to the first real slot at or after that inside the send
    // window. This is what stops a connection accepted at 03:04 from firing
    // its "15 minutes later" message at 03:19.
    await updateCurrentEnrollment({
      currentStepIndex: enrollment.currentStepIndex + 1,
      nextActionAt: await reserveSendSlot({
        budget,
        workspace,
        campaign,
        enrollmentId: enrollment.id,
        timezone: leadTimeZone,
        kind: "message",
        earliestAt: Date.now() + step.delayMinutes * 60 * 1000,
      }),
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

    // Outside this campaign's send window: reschedule to the next opening
    // rather than sending at 3am. Manual "Run now" bypasses this - the user
    // explicitly chose the moment - which is why the check lives here and not
    // in the shared claim.
    if (!options.ignoreSendWindow && !isWithinSendWindow(sendWindow, leadTimeZone, Date.now())) {
      await updateCurrentEnrollment({
        nextActionAt: await reserveSendSlot({
          budget,
          workspace,
          campaign,
          enrollmentId: enrollment.id,
          timezone: leadTimeZone,
          kind: "invite",
        }),
      });
      return "outside-send-window";
    }

    // Human-like pacing: only a few invites per account per tick. This gate
    // must run before the 1st-degree profile check below - otherwise every
    // queued enrollment performs a live profile view on every tick while
    // waiting its turn, which is exactly the high-volume profile access
    // pattern LinkedIn flags.
    if (budget.connects <= 0) {
      await updateCurrentEnrollment({
        nextActionAt: await reserveSendSlot({
          budget,
          workspace,
          campaign,
          enrollmentId: enrollment.id,
          timezone: leadTimeZone,
          kind: "invite",
        }),
      });
      return "connect-paced";
    }

    // Bail before profile views / AI drafting when today's invite budget is
    // already spent - those work units were previously wasted on invite-limit.
    // The planner rolls the enrollment to the next LOCAL day that has capacity,
    // instead of the old hourly churn that made every workspace resume in a
    // burst the instant the UTC day flipped.
    if (
      !(await hasDailyQuotaRemaining(
        enrollment.workspaceId,
        "invites",
        workspace.settings.dailyInviteLimit,
        workspace.timezone,
      ))
    ) {
      await updateCurrentEnrollment({
        nextActionAt: await reserveSendSlot({
          budget,
          workspace,
          campaign,
          enrollmentId: enrollment.id,
          timezone: leadTimeZone,
          kind: "invite",
        }),
      });
      return "invite-limit";
    }

    // Strict drip: at most one action per account per SPACING_MINUTES, across
    // ticks and manual runs. Claimed before the profile check below so a
    // waiting queue doesn't burn a live profile view on every tick; a claim
    // that ends up not sending (already connected, Unipile rejection) only
    // delays the next action - it can never over-send.
    const nextSlotAllowedAt = await claimActionSlot(enrollment.workspaceId, account.id);
    if (nextSlotAllowedAt) {
      budget.connects = 0;
      await updateCurrentEnrollment({
        nextActionAt: await reserveSendSlot({
          budget,
          workspace,
          campaign,
          enrollmentId: enrollment.id,
          timezone: leadTimeZone,
          kind: "invite",
          earliestAt: Date.parse(nextSlotAllowedAt),
        }),
      });
      return "invite-spaced";
    }

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
      sendResult = await sendProviderAction(() => sendConnectionRequest({
        accountId: account.accountId,
        providerProfileId: lead.providerProfileId,
        linkedInUrl: lead.linkedInUrl,
        note,
      }));
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
      sendResult = await sendProviderAction(() => sendConnectionRequest({
        accountId: account.accountId,
        providerProfileId: lead.providerProfileId,
        linkedInUrl: lead.linkedInUrl,
      }));
    }
    // The account provably accepts invites, so any tallied cannot_resend_yet
    // rejections were about their recipients, not an account-wide limit.
    await clearInviteLimitSignals(enrollment.workspaceId, account.id);
    const counted = await consumeDailyQuota(
      enrollment.workspaceId,
      "invites",
      workspace.settings.dailyInviteLimit,
      workspace.timezone,
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

  // A reply is the one action that may already be overdue when it gets here,
  // so it is planned as kind "reply" and outranks queued invites for the next
  // free slot. It still respects the send window: an AI reply at 03:19 is the
  // same unnatural behaviour whether or not a human triggered it.
  const messageKind: SendActionKind =
    enrollment.status === "reply_received" ? "reply" : "message";

  if (!options.ignoreSendWindow && !isWithinSendWindow(sendWindow, leadTimeZone, Date.now())) {
    await updateCurrentEnrollment({
      nextActionAt: await reserveSendSlot({
        budget,
        workspace,
        campaign,
        enrollmentId: enrollment.id,
        timezone: leadTimeZone,
        kind: messageKind,
      }),
    });
    return "outside-send-window";
  }

  // Human-like pacing: only a few messages per account per tick.
  if (budget.messages <= 0) {
    await updateCurrentEnrollment({
      nextActionAt: await reserveSendSlot({
        budget,
        workspace,
        campaign,
        enrollmentId: enrollment.id,
        timezone: leadTimeZone,
        kind: messageKind,
      }),
    });
    return "message-paced";
  }

  if (
    !(await hasDailyQuotaRemaining(
      enrollment.workspaceId,
      "messages",
      workspace.settings.dailyMessageLimit,
      workspace.timezone,
    ))
  ) {
    await updateCurrentEnrollment({
      nextActionAt: await reserveSendSlot({
        budget,
        workspace,
        campaign,
        enrollmentId: enrollment.id,
        timezone: leadTimeZone,
        kind: messageKind,
      }),
    });
    return "message-limit";
  }

  // Messages now share the per-account drip with invites. Previously they had
  // no spacing at all and went 1-3 per two-minute tick, so a burst of
  // follow-ups could fire within a few minutes of each other.
  const nextMessageSlotAt = await claimActionSlot(enrollment.workspaceId, account.id);
  if (nextMessageSlotAt) {
    budget.messages = 0;
    await updateCurrentEnrollment({
      nextActionAt: await reserveSendSlot({
        budget,
        workspace,
        campaign,
        enrollmentId: enrollment.id,
        timezone: leadTimeZone,
        kind: messageKind,
        earliestAt: Date.parse(nextMessageSlotAt),
      }),
    });
    return "message-spaced";
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
    // the campaign's goal and tone, and the recent transcript already exchanged
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
      await recordSequenceExhausted({ workspace, campaign, lead });
      await updateCurrentEnrollment({
        status: "stopped",
        pendingAction: undefined,
        lastError: `AI sequence finished after ${MAX_AI_SEQUENCE_MESSAGES} messages with no reply; outreach stopped for this lead.`,
      });
      return "sequence-exhausted";
    }
    // Reuse the pre-drafted preview the user saw on the Actions page, so what
    // was shown is exactly what goes out. Only when no draft matches this step
    // (older enrollments, preview drafting failed) is the message drafted here.
    const draft = enrollment.nextMessageDraft;
    const storedDraft =
      draft && draft.stepIndex === enrollment.currentStepIndex && draft.body.trim()
        ? draft.body
        : undefined;
    const leadForDrafting =
      !storedDraft && sequencePosition === 1
        ? await refreshLeadProfileForDrafting(lead, account)
        : lead;
    body =
      storedDraft ??
      (await draftCampaignMessage({
        lead: leadForDrafting,
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
  const messageSendResult = await sendProviderAction(() => sendLinkedInMessage({
    accountId: account.accountId,
    providerProfileId: lead.providerProfileId,
    linkedInUrl: lead.linkedInUrl,
    body,
  }));
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
    workspace.timezone,
  );
  await updateLead(enrollment.workspaceId, lead.id, { outreachStatus: "messaged" });
  // Final AI message of the ladder just went out: stop here instead of letting
  // the enrollment idle on. No email - the lead never engaged, and an unanswered
  // sequence is not news the user asked to be interrupted for.
  if (aiStage >= MAX_AI_SEQUENCE_MESSAGES && campaign.replyHandling !== "handoff") {
    await recordSequenceExhausted({ workspace, campaign, lead });
    await updateCurrentEnrollment({
      status: "stopped",
      pendingAction: undefined,
      lastError: `AI sequence finished after ${MAX_AI_SEQUENCE_MESSAGES} messages; outreach stopped for this lead.`,
    });
    return "sequence-exhausted";
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
      if (!sourceAgent) {
        throw new Error("The agent that found this lead was deleted, so its outreach is stopped.");
      }
      if (sourceAgent.leadsOnly) {
        throw new Error(
          "This lead was found by a leads-only agent and cannot be messaged automatically.",
        );
      }
      if (sourceAgent.status === "paused") {
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
        newSourceAgentBlockLookup(),
        // The user pressed "Run now"; honouring the campaign's send window here
        // would silently do nothing outside business hours.
        { ignoreSendWindow: true },
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
  sourceAgentBlock: SourceAgentBlockLookup,
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
  if (lead.sourceAgentId) {
    const sourceAgent = await getAgent(enrollment.workspaceId, lead.sourceAgentId);
    if (sourceAgent?.leadsOnly) {
      return "leads-only-agent";
    }
  }
  const block = lead.sourceAgentId
    ? await sourceAgentBlock(enrollment.workspaceId, lead.sourceAgentId)
    : null;
  if (block) return block === "deleted" ? "agent-deleted" : "agent-paused";
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
  const sourceAgentBlock = newSourceAgentBlockLookup();
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
        ? await previewEnrollment(enrollment, campaign, sourceAgentBlock)
        : await runEnrollment(enrollment, campaign, budgetForAccount, sourceAgentBlock);
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

      if (error instanceof UnconfirmedProviderSendError) {
        const unconfirmedMessage = `${UNCONFIRMED_PROVIDER_SEND_PREFIX}: ${message}`;
        await updateEnrollment(enrollment.workspaceId, enrollment.id, {
          status: "error",
          lastError: unconfirmedMessage,
          pendingAction: undefined,
          nextActionAt: addMinutes(ENROLLMENT_COOLDOWN_MINUTES),
        });
        await logAutomationRun({
          workspaceId: enrollment.workspaceId,
          kind: "campaign",
          status: "error",
          message: unconfirmedMessage,
        });
        continue;
      }

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

      if (isInviteResendBlockedErrorType(errorType)) {
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

// Sends each workspace one summary email at 9am in its local timezone,
// covering the trailing 24 hours.
async function sendDailyDigests(mode: AutomationSafetyMode) {
  let sent = 0;
  const workspaces = await listWorkspaces();

  for (const workspace of workspaces) {
    try {
      const email = workspace.notificationEmail;
      if (!email || !hasActiveSubscription(workspace)) continue;

      const { day, hour } = localDayAndHour(workspace.timezone);
      if (hour < DIGEST_LOCAL_HOUR || hour > DIGEST_LAST_CATCH_UP_HOUR) continue;
      // Dry-run must not consume the day claim, or the real tick stays silent.
      if (mode.dryRun) continue;
      if (
        !(await claimNotificationAfterInterval(
          workspace.id,
          "digest",
          day,
          DIGEST_MIN_INTERVAL_MS,
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

  const ownerToken = await acquireTickLock(
    TICK_LOCK_ID,
    TICK_LOCK_TTL_MS,
    options.scheduled ? TICK_SCHEDULE_MIN_INTERVAL_MS : 0,
  ).catch((error) => {
    console.error("[automation] failed to acquire tick lock:", error);
    return null;
  });
  if (!ownerToken) {
    return {
      skipped: true as const,
      reason: "Another automation tick is still running or started recently.",
    };
  }

  const renewTimer = setInterval(() => {
    void renewTickLock(TICK_LOCK_ID, ownerToken).catch((error) => {
      console.error("[automation] failed to renew tick lock:", error);
    });
  }, TICK_LOCK_RENEW_INTERVAL_MS);
  renewTimer.unref();

  try {
    return await runAutomationTickInner(mode);
  } finally {
    clearInterval(renewTimer);
    await releaseTickLock(TICK_LOCK_ID, ownerToken).catch((error) => {
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
