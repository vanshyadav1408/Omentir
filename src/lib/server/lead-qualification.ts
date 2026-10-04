import "server-only";

import { createHash } from "crypto";
import { consumeDailyQuota } from "./data";
import { claimWorkspaceLead } from "./workspace-lead-history";
import { expandedTargetTitles, matchesTargetTitle } from "./gemini";
import {
  buildLeadFitQuestions,
  leadFitFromAnswers,
  type JevAnswers,
  type LeadFitBasis,
} from "./lead-fit";
import type { Agent, Lead, ProductProfile } from "./types";

// Lead qualification runs on Typesafe's Jev decision model. Gemini only writes
// messages; it has no say in whether a lead is eligible.
const TYPESAFE_URL = "https://api.typesafe.ai/v1/systemone";
const JEV_MODEL = "jev-latest";
const JEV_ATTEMPTS = 3;
const JEV_ATTEMPT_TIMEOUT_MS = 15_000;

// Jev calls per workspace per local day, shared by all of its agents. Once
// spent, discovery stops quietly until the workspace's next local midnight.
export const DAILY_LEAD_FILTER_LIMIT = 300;

export class LeadFilterCapReached extends Error {
  constructor(workspaceId: string) {
    super(`Workspace ${workspaceId} used its ${DAILY_LEAD_FILTER_LIMIT} lead filters for today.`);
    this.name = "LeadFilterCapReached";
  }
}

let warnedMissingKey = false;

async function askJev(state: unknown, questions: Record<string, unknown>, apiKey: string) {
  for (let attempt = 0; ; attempt += 1) {
    let retryAfterMs = 1_000 * 2 ** attempt;
    try {
      const response = await fetch(TYPESAFE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ state, model: JEV_MODEL, questions }),
        signal: AbortSignal.timeout(JEV_ATTEMPT_TIMEOUT_MS),
      });
      if (response.ok) {
        const body = (await response.json()) as { answers?: JevAnswers };
        return body.answers || {};
      }
      const detail = (await response.text()).slice(0, 300);
      // 429 rate limit and 529 overload are the documented retryable statuses.
      if (![429, 529].includes(response.status) && response.status < 500) {
        throw new Error(`Typesafe ${response.status}: ${detail}`);
      }
      const retryAfter = Number(response.headers.get("retry-after"));
      if (Number.isFinite(retryAfter) && retryAfter > 0) retryAfterMs = retryAfter * 1_000;
      if (attempt + 1 >= JEV_ATTEMPTS) throw new Error(`Typesafe ${response.status}: ${detail}`);
    } catch (error) {
      const retryable =
        error instanceof Error && (error.name === "TimeoutError" || error.name === "TypeError");
      if (!retryable || attempt + 1 >= JEV_ATTEMPTS) throw error;
    }
    console.error(`[jev] retrying after attempt ${attempt + 1}`);
    await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfterMs, 8_000)));
  }
}

// Everything Jev is told except the lead, built once per agent. questionKey
// fingerprints it with the questions and model: a remembered rejection is only
// reused while the agent's request, the product profile, and the rubric are
// all unchanged.
export function leadQualificationContext(profile: ProductProfile | null, agent: Agent) {
  const targetTitles = expandedTargetTitles(agent, null);
  // An agent with no prompt or filters asks for "buyers of my product", so Jev
  // judges those leads against the product profile instead of an empty request.
  const hasAgentRequest = Boolean(
    agent.prompt?.trim() ||
      targetTitles.length ||
      agent.filters?.industries?.length ||
      agent.filters?.keywords?.length,
  );
  const basis: LeadFitBasis =
    agent.mode === "steal_customers" ? "steal" : hasAgentRequest || !profile ? "agent" : "product";

  const askLocation = basis === "agent" && !agent.filters.locations?.length;
  // Input tokens are the whole Jev bill, so Jev gets only what its questions
  // read. Against an agent's request the product only feeds the rival check,
  // which needs what the product is, not who buys it.
  const shared =
    basis === "agent"
      ? {
          agent_request: {
            prospect_definition: String(agent.prompt || "").slice(0, 250),
            titles: agent.filters.titles,
            industries: agent.filters.industries,
          },
          sender_product: profile
            ? { companyName: profile.companyName, description: String(profile.description || "").slice(0, 120) }
            : null,
        }
      : {
          sender_product: profile
            ? {
                companyName: profile.companyName,
                description: String(profile.description || "").slice(0, 300),
                targetBuyers: (profile.targetBuyers || []).slice(0, 3),
                buyerTitles: (profile.buyerTitles || []).slice(0, 6),
                industries: (profile.industries || []).slice(0, 4),
              }
            : null,
          ...(basis === "steal" ? { agent_notes: agent.prompt } : {}),
        };
  const questions = buildLeadFitQuestions({ basis, hasProduct: Boolean(profile), askLocation });
  const questionKey = createHash("sha256")
    .update(JSON.stringify([JEV_MODEL, basis, shared, questions]))
    .digest("hex")
    .slice(0, 16);

  return { basis, targetTitles, shared, questions, questionKey };
}

export type LeadScore = {
  fitScore: number;
  scoreReasons: string[];
  summary: string;
  // Present only on a real Jev verdict; see the return at the bottom.
  questionKey?: string;
};

export async function scoreLeadForProduct(
  lead: Partial<Lead>,
  profile: ProductProfile | null,
  agent: Agent,
  timezone: string | undefined,
): Promise<LeadScore> {
  // Do not throw here: one missing config would mark every discovery agent Error
  // after the first candidate. Callers treat a low score as "skip this lead".
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.error("[jev] TYPESAFE_API_KEY is not set; every lead will be skipped as unqualified.");
    }
    return {
      fitScore: 40,
      scoreReasons: ["Lead scoring is unavailable without a Typesafe API key."],
      summary: lead.summary || "",
    };
  }

  // Only a missing title is unscorable. A missing company is common when the
  // profile-view budget blocked enrichment and the lead only carries search
  // data - those must still be judged on title + signal context, otherwise
  // budget exhaustion silently zeroes daily lead discovery.
  if (!lead.title?.trim()) {
    return {
      fitScore: 45,
      scoreReasons: ["The profile carries no current job title to judge fit from."],
      summary: lead.summary || "",
    };
  }

  if (
    profile?.companyName?.trim() &&
    lead.company?.trim().toLowerCase() === profile.companyName.trim().toLowerCase()
  ) {
    return {
      fitScore: 0,
      scoreReasons: ["The lead works at the product company."],
      summary: lead.summary || "",
    };
  }

  // A lead can already carry another agent's score and source attribution.
  // Those are conclusions, not profile evidence, and must not influence a new
  // agent's qualification decision.
  const scoringLead = { ...lead };
  delete scoringLead.fitScore;
  delete scoringLead.scoreReasons;
  delete scoringLead.sourceAgentId;
  delete scoringLead.groupIds;
  delete scoringLead.outreachStatus;

  const context = leadQualificationContext(profile, agent);
  const { targetTitles } = context;
  // Explicit titles are a hard gate. The workspace product vocabulary must not
  // make an unrelated persona look relevant to a narrowly configured agent.
  // Steal customers has no title ICP: commenters are filtered only by product fit.
  if (
    agent.mode !== "steal_customers" &&
    targetTitles.length &&
    !matchesTargetTitle(lead.title || "", targetTitles)
  ) {
    return {
      fitScore: 40,
      scoreReasons: ["The lead's current role does not match the agent's requested roles."],
      summary: lead.summary || "",
    };
  }

  const requestedSize = [agent.prompt, ...agent.filters.keywords]
    .join(" ")
    .match(
      /(\d{1,6})\s*(?:-|\u2013|\u2014|to)\s*(\d{1,6})\s*(?:employees?|staff|people|personnel)\b/i,
    );
  if (requestedSize) {
    const min = Number(requestedSize[1]);
    const max = Number(requestedSize[2]);
    const evidence = [lead.summary, JSON.stringify(lead.profileContext || {})].join(" ");
    const sizeEvidence = new RegExp(
      `\\b${min}\\s*(?:-|\\u2013|\\u2014|to)\\s*${max}\\s*(?:employees?|staff|people|personnel)\\b`,
      "i",
    );
    if (!sizeEvidence.test(evidence)) {
      return {
        fitScore: 40,
        scoreReasons: [
          `The profile evidence does not verify the requested ${min}-${max} employee company size.`,
        ],
        summary: lead.summary || "",
      };
    }
  }

  const fallback = {
    fitScore: 40,
    scoreReasons: ["The available profile evidence does not prove the agent's targeting requirements."],
    summary: lead.summary || "",
  };

  // Jev reads only what the decision needs: unrelated profile detail costs it
  // accuracy, and state plus the longest question must fit in 32k tokens.
  const scoringLeadForModel = {
    name: scoringLead.name,
    title: scoringLead.title,
    company: scoringLead.company,
    location: scoringLead.location,
    summary: String(scoringLead.summary || "").slice(0, 300),
    // For thin profiles, how search found the person is the only role hint.
    leadReason: scoringLead.leadReason,
    // For engagement leads signalText repeats the comment and post below.
    ...(context.basis === "steal" && !scoringLead.engagementContext
      ? { signalText: String(scoringLead.signalText || "").slice(0, 300) }
      : {}),
    // Against an agent's request the summary and current role carry the job
    // title; About usually repeats them. Product and steal fit can hinge on a
    // situation ("open to work") that lives in About or past roles.
    ...(context.basis === "agent"
      ? {
          about: scoringLead.summary?.trim()
            ? undefined
            : String(scoringLead.profileContext?.about || "").slice(0, 200) || undefined,
          currentRole: String(scoringLead.profileContext?.experience?.[0] || "").slice(0, 150) || undefined,
        }
      : {
          about: String(scoringLead.profileContext?.about || "").slice(0, 300) || undefined,
          experience: (scoringLead.profileContext?.experience || [])
            .slice(0, 3)
            .map((entry) => String(entry).slice(0, 150)),
        }),
    engagementContext: scoringLead.engagementContext
      ? {
          kind: scoringLead.engagementContext.kind,
          sourceLabel: scoringLead.engagementContext.sourceLabel,
          postText: String(scoringLead.engagementContext.postText || "").slice(0, 300),
          commentText: String(scoringLead.engagementContext.commentText || "").slice(0, 300),
        }
      : undefined,
  };
  const state = { lead: scoringLeadForModel, ...context.shared };

  const finish = await claimWorkspaceLead(agent.workspaceId, lead);
  if (!finish) return { fitScore: 0, scoreReasons: ["Already processed in this workspace."], summary: fallback.summary };
  try {
    if (!(await consumeDailyQuota(agent.workspaceId, "leadFilters", DAILY_LEAD_FILTER_LIMIT, timezone))) {
      throw new LeadFilterCapReached(agent.workspaceId);
    }
    const answers = await askJev(state, context.questions, apiKey);
    const verdict = leadFitFromAnswers(answers, context.basis);
    await finish(true);
    // questionKey marks a real Jev verdict. Callers remember rejections only
    // when it is present, so an outage or a missing key never blacklists anyone.
    return {
      ...verdict,
      summary: fallback.summary,
      questionKey: context.questionKey,
    };
  } catch (error) {
    await finish(false);
    if (error instanceof LeadFilterCapReached) throw error;
    console.error(
      "[jev] scoreLeadForProduct failed:",
      error instanceof Error ? error.message : error,
    );
    return fallback;
  }
}
