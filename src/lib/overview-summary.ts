// Everything Overview renders from the lead and enrollment lists, computed on
// the server so the page no longer downloads the whole workspace. The rules are
// the ones overview-view.tsx used to run in the browser; the agent API's stats
// resource shares countSendsInRange so the two never disagree.

import { sumAgentLeadTotals } from "@/lib/agent-lead-totals";
import {
  buildActivityTotalsFromLive,
  toActivityDayKey,
  type ActivityDayTotals,
} from "@/lib/activity-overview";
import {
  STAGE_CONTACTED,
  STAGE_MESSAGED,
  STAGE_REPLIED,
  combinedOutreachStage,
  countAcceptedConnections,
} from "@/lib/outreach-stage";
import { isInStatsRange, statsRangeStartMs } from "@/lib/workspace-stats-range";
import type { Conversation, LeadPreview } from "@/lib/server/types";

export const OVERVIEW_RANGES = ["7d", "30d", "3m", "month"] as const;
export type OverviewRange = (typeof OVERVIEW_RANGES)[number];

// The longest Overview range is 3 months (90 days); older live days can never
// be on the chart, so they are not sent.
const LIVE_ACTIVITY_DAYS = 92;
const HOT_LEAD_COUNT = 5;

type StageLead = { id: string; outreachStatus?: string };
type StageEnrollment = {
  leadId: string;
  status?: string;
  connectionSentAt?: string;
  updatedAt?: string;
};

export type HotLead = Pick<
  LeadPreview,
  "id" | "name" | "avatarUrl" | "linkedInUrl" | "title" | "company" | "fitScore"
>;

export type ReplyLead = Pick<LeadPreview, "id" | "name" | "title" | "company" | "avatarUrl">;

export type OverviewSummary = {
  hotOpportunities: number;
  acceptedConnections: number;
  sends: Record<OverviewRange, { invitationsSent: number; messagesSent: number }>;
  hotLeads: HotLead[];
  /** Per-UTC-day totals from the live rows; the chart max-merges them with activityDays. */
  liveActivity: ActivityDayTotals[];
};

// These count sends, so the unit stays the enrollment. Its status is not a
// record of what was sent though: it collapses to "stopped"/"error" when the
// sequence ends, expires or is cut short, which used to drop those invites and
// messages out of the totals. Where the stage was lost, the lead's own status
// still remembers how far it got.
export function countSendsInRange(
  leads: StageLead[],
  enrollments: StageEnrollment[],
  rangeStart: number,
) {
  const leadStatusById = new Map(leads.map((lead) => [lead.id, lead.outreachStatus]));
  const stageOf = (enrollment: StageEnrollment) =>
    combinedOutreachStage(enrollment.status, leadStatusById.get(enrollment.leadId));
  let invitationsSent = 0;
  let messagesSent = 0;
  let repliesReceived = 0;
  for (const enrollment of enrollments) {
    const stage = stageOf(enrollment);
    if (stage >= STAGE_CONTACTED && isInStatsRange(enrollment.connectionSentAt, rangeStart)) {
      invitationsSent += 1;
    }
    if (stage >= STAGE_MESSAGED && isInStatsRange(enrollment.updatedAt, rangeStart)) {
      messagesSent += 1;
    }
    if (stage >= STAGE_REPLIED && isInStatsRange(enrollment.updatedAt, rangeStart)) {
      repliesReceived += 1;
    }
  }
  return { invitationsSent, messagesSent, repliesReceived };
}

export function buildOverviewSummary(input: {
  agents: Array<{ id: string; targetGroupId: string }>;
  groups: Array<{ id: string; leadCount?: number }>;
  leads: LeadPreview[];
  enrollments: Array<StageEnrollment & { status: string; createdAt?: string }>;
  conversations: Array<
    Pick<Conversation, "messages" | "replyIntent" | "replyIntentAt" | "meetingBookedAt">
  >;
  timeZone: string;
  now?: number;
}): OverviewSummary {
  const now = input.now ?? Date.now();
  const sends = Object.fromEntries(
    OVERVIEW_RANGES.map((range) => {
      const { invitationsSent, messagesSent } = countSendsInRange(
        input.leads,
        input.enrollments,
        statsRangeStartMs(range, input.timeZone, now),
      );
      return [range, { invitationsSent, messagesSent }];
    }),
  ) as OverviewSummary["sends"];

  // Array.prototype.sort is stable, so equal scores keep the list's order.
  const hotLeads = [...input.leads]
    .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0))
    .slice(0, HOT_LEAD_COUNT)
    .map(({ id, name, avatarUrl, linkedInUrl, title, company, fitScore }) => ({
      id,
      name,
      avatarUrl,
      linkedInUrl,
      title,
      company,
      fitScore,
    }));

  const oldestDay = toActivityDayKey(
    new Date(now - LIVE_ACTIVITY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  ) as string;
  const liveActivity = buildActivityTotalsFromLive({
    leads: input.leads,
    enrollments: input.enrollments,
    conversations: input.conversations,
  }).filter((day) => day.dateKey >= oldestDay);

  return {
    hotOpportunities: sumAgentLeadTotals(input.agents, input.groups, input.leads),
    acceptedConnections: countAcceptedConnections(input.leads, input.enrollments),
    sends,
    hotLeads,
    liveActivity,
  };
}

/** The lead behind an inbox thread: same profile URL, or same name ignoring case and spaces. */
export function findReplyLead(
  leads: LeadPreview[],
  identity: { profileUrl?: string; profileName?: string },
): ReplyLead | null {
  const { profileUrl, profileName } = identity;
  const name = profileName?.trim().toLowerCase();
  const lead = leads.find(
    (item) =>
      (item.linkedInUrl && profileUrl && item.linkedInUrl === profileUrl) ||
      (item.name && profileName && item.name.trim().toLowerCase() === name),
  );
  if (!lead) return null;
  return {
    id: lead.id,
    name: lead.name,
    title: lead.title,
    company: lead.company,
    avatarUrl: lead.avatarUrl,
  };
}
