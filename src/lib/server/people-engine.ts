import "server-only";

import {
  listLeads,
  listLinkedInAccounts,
  logAutomationRun,
  markLeadSignalPromoted,
  updateAgentPeopleEngineCursor,
  upsertLead,
  upsertLeadSignal,
} from "./data";
import { cleanId, normalizeLinkedInProfileUrl, nowIso } from "./firebase";
import { agentTargetLocations, matchesTargetLocation } from "./geo";
import { isAnonymousLinkedInProfile } from "./outreach-rules";
import {
  balanceTitleSeniority,
  expandedTargetTitles,
  findGroundedAgentCandidates,
  matchesTargetTitle,
  planPeopleSearch,
  scoreLeadForProduct,
} from "./gemini";
import {
  getLinkedInPostCreatedAt,
  getLinkedInPostCreatedAtRaw,
  getLinkedInPostId,
  getLinkedInPostText,
  getLinkedInPostUrl,
  listLinkedInPostComments,
  listLinkedInPostReactions,
  listLinkedInPostsForProfile,
  normalizeLinkedInActor,
  profileSearchKeys,
  retrieveLinkedInProfile,
  retrieveLinkedInCompanyEvidence,
  retrieveOwnLinkedInProfile,
  searchLinkedInEmployeesAtCompany,
  searchLinkedInPosts,
  searchLinkedInProfiles,
  searchLinkedInProfilesAtCompanies,
} from "./unipile";
import type {
  Agent,
  Lead,
  LeadEngagementContext,
  LeadSignal,
  LeadSignalType,
  LinkedInAccount,
  ProductProfile,
} from "./types";
import {
  buildEngagementContext,
  buildPeopleEngineSourceQueue,
  buildStealPostSearchQueries,
  commentBuyingIntentScore,
  discoverySignalPriority,
  engagementLeadReason,
  formatEngagementSignalText,
  isLocationScopedPeopleSignal,
  isNoiseEngagementComment,
  isUnscopedKeywordPostEngagement,
  selectStealPosts,
  shouldKeepStealComment,
  sortPostsByRelevance,
} from "../competitor-engagement";
import { buildStealProductTerms } from "../steal-customers-targeting";
import {
  recentLinkedInActivityFromPosts,
  recentLinkedInActivityFromSignals,
} from "../linkedin-activity";
import type { LinkedInActivityEvidence } from "../linkedin-activity";
import {
  planPeopleEngineSourceRun,
  selectDailyTargetLocation,
} from "../people-engine-rotation";

// 65 matches scoreLeadForProduct's "clear functional buyer" band so people
// whose job needs the product are not discarded for imperfect title wording.
const QUALIFIED_SCORE_THRESHOLD = 65;
const DEFAULT_DAILY_QUALIFIED_LEAD_CAP = 75;
// Each enrichment is a live LinkedIn profile view through the user's account.
// Capped per run so one agent cannot burn unlimited views; kept well above
// dailyLeadLimit because most enrichments fail region/score gates before a
// lead is saved.
const DEFAULT_MAX_ENRICHMENTS_PER_RUN = 500;
// Cold people search does not carry an activity timestamp. Check recent posts
// before spending a profile view, but keep the daily read volume bounded.
const DEFAULT_MAX_ACTIVITY_CHECKS_PER_RUN = 250;
const ACTIVITY_POST_LIMIT = 3;
const PEOPLE_ENGINE_RUN_MS = 15 * 60 * 1000;
const STOP_BUFFER_MS = 15 * 1000;
// Competitor/founder pages: pull enough recent posts that product launches and
// demo threads are still in the window, then rank by product keywords.
const SOURCE_POST_LIMIT = 8;
const STEAL_SOURCE_POST_LIMIT = 10;
const STEAL_POST_FETCH_LIMIT = 20;
// Per competitor company: employees whose posts we scan (not added as leads).
const STEAL_EMPLOYEES_PER_COMPANY = 10;
// Recent posts per employee whose comments we scan for buyers.
const STEAL_EMPLOYEE_POST_LIMIT = 4;
const POST_ENGAGER_LIMIT = 40;
const STEAL_KEYWORD_POST_LIMIT = 4;
const KEYWORD_PROFILE_LIMIT = 40;
const TITLE_PROFILE_LIMIT = 40;
const COMPANY_FILTERED_PROFILE_LIMIT = 40;

type SearchCriteria = {
  titles: string[];
  industries: string[];
  locations: string[];
  keywords: string[];
  postKeywords: string[];
  reasonsToMatch: string[];
  useCases: string[];
  roleVocabulary: string[];
};

type ObservedSignal = {
  personKey: string;
  lead: Partial<Lead>;
  signalType: LeadSignalType;
  signalSource: string;
  signalText: string;
  signalUrl: string;
  signalObservedAt: string;
  // Only a timestamp produced by the person's own post, comment, or reaction.
  // Search observation time must never populate this field.
  activityObservedAt?: string;
  leadReason: string;
  engagementContext?: LeadEngagementContext;
};

type Candidate = {
  personKey: string;
  lead: Partial<Lead>;
  signals: ObservedSignal[];
};

type ParsedLinkedInSource = {
  identifier: string;
  isCompany: boolean;
  label: string;
};

type PeopleEngineSource =
  | { kind: "competitor"; value: string; key: string }
  | { kind: "founder"; value: string; key: string }
  | { kind: "keyword"; value: string; key: string }
  | { kind: "title"; value: string; key: string };

export function isStealCustomersAgent(
  agent: Pick<Agent, "mode" | "signalSources" | "filters">,
) {
  if (agent.mode === "steal_customers") return true;
  // Defense in depth: competitor/founder URLs with no title ICP is always steal.
  const hasStealSources = Boolean(
    agent.signalSources?.competitorUrls?.some((value) => value.trim()) ||
      agent.signalSources?.founderUrls?.some((value) => value.trim()),
  );
  const hasTitles = Boolean(agent.filters?.titles?.some((value) => value.trim()));
  return hasStealSources && !hasTitles;
}

export function agentUsesPeopleEngine(agent: Agent) {
  // Current agents already use signals mode. Older prompt/filter agents must
  // use the same qualified and activity-verified path, or they can still save
  // inactive people through the legacy search loop in automation.ts.
  return agent.mode !== "outreach";
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function hasRunTime(deadline: number) {
  return Date.now() < deadline - STOP_BUFFER_MS;
}

function requestedCompanySize(agent: Agent) {
  const target = [agent.prompt, ...agent.filters.keywords].join(" ");
  const match = target.match(
    /(\d{1,6})\s*(?:-|\u2013|\u2014|to)\s*(\d{1,6})\s*(?:employees?|staff|people|personnel)\b/i,
  );
  if (!match) return null;

  const min = Number(match[1]);
  const max = Number(match[2]);
  return Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min
    ? { min, max }
    : null;
}

function getSourceKeywords(
  agent: Agent,
  criteria: SearchCriteria,
) {
  // Agent-configured titles/keywords first. Signal phrases like "hiring SDR"
  // are intent noise for people search unless paired with a real role title.
  const agentTitles = unique([
    ...agent.filters.titles,
    ...criteria.titles,
  ]).slice(0, 8);
  const filterKeywords = unique([...agent.filters.keywords, ...criteria.keywords]).slice(0, 8);
  const roleContextQueries = filterKeywords.slice(0, 4).flatMap((keyword) =>
    agentTitles.slice(0, 4).map((title) => `${keyword} ${title}`),
  );
  const signalWithRole = (agent.signalSources?.keywords || []).slice(0, 6).flatMap((keyword) =>
    agentTitles.slice(0, 2).map((title) => `${title} ${keyword}`),
  );
  const titleIndustry = agentTitles.slice(0, 4).flatMap((title) =>
    (agent.filters.industries.length
      ? agent.filters.industries
      : criteria.industries
    )
      .slice(0, 2)
      .map((industry) => `${title} ${industry}`),
  );

  return unique([
    ...filterKeywords,
    ...roleContextQueries,
    ...titleIndustry,
    ...signalWithRole,
    ...criteria.roleVocabulary.slice(0, 6),
    // Standalone signal phrases last (lowest priority for people search).
    ...(agent.signalSources?.keywords || []).slice(0, 4),
  ]).slice(0, 20);
}

function getSearchTitles(agent: Agent, profile: ProductProfile | null, criteria: SearchCriteria) {
  // Steal customers: commenters are the pool; do not hard-filter by buyer titles.
  // Fit is decided later against My Product via scoreLeadForProduct.
  if (agent.mode === "steal_customers") return [];

  // Agent-created titles are the contract with the user. Search those first so
  // discovery matches the agent setup, not a diluted AI expansion of the product.
  return balanceTitleSeniority(
    unique([
      ...agent.filters.titles,
      ...criteria.titles,
      ...expandedTargetTitles(agent, profile),
    ]),
  ).slice(0, 15);
}

/**
 * People search with per-country location scoping, then safe fallbacks.
 * Multi-country location-id searches often return empty on Classic API; one
 * country at a time plus "Title Country" keyword fallback recovers recall
 * while post-enrich location matching stays the hard geo gate.
 */
async function searchPeopleForAgentQuery(input: {
  agent: Agent;
  account: LinkedInAccount;
  title?: string;
  keyword?: string;
  targetLocations: string[];
  limit: number;
  excludeKeys?: Set<string>;
}): Promise<Partial<Lead>[]> {
  // Searching every target country for every title/keyword turns one agent
  // run into dozens of Classic searches, which regularly exhausts LinkedIn's
  // provider allowance before any profile can be qualified. Spread each
  // independent query across the requested countries instead. The query is
  // stable, so the same role stays in its assigned market while the rotated
  // source queue covers the rest over subsequent runs.
  const locationBatches =
    input.targetLocations.length > 0
      ? [[
          selectDailyTargetLocation(
            input.title || input.keyword || "people",
            input.targetLocations,
          )!,
        ]]
      : [[] as string[]];
  const found = new Map<string, Partial<Lead>>();

  const addProfiles = (profiles: Partial<Lead>[]) => {
    for (const profile of profiles) {
      const key = profile.providerProfileId || profile.linkedInUrl || profile.name;
      if (!key || found.has(key)) continue;
      found.set(key, profile);
      if (found.size >= input.limit) break;
    }
  };

  for (const locations of locationBatches) {
    if (found.size >= input.limit) break;

    let profiles = await searchLinkedInProfiles({
      accountId: input.account.accountId,
      criteria: {
        titles: input.title ? [input.title] : [],
        industries: [],
        locations,
        keywords: input.keyword ? [input.keyword] : [],
      },
      limit: input.limit - found.size,
      agent: input.agent,
      excludeKeys: input.excludeKeys,
    });

    // Location parameter empty: put country into the keyword query.
    if (!profiles.length && locations.length) {
      const query = [input.title, input.keyword, locations[0]].filter(Boolean).join(" ");
      profiles = await searchLinkedInProfiles({
        accountId: input.account.accountId,
        criteria: {
          titles: [],
          industries: [],
          locations: [],
          keywords: [query],
        },
        limit: input.limit - found.size,
        agent: input.agent,
        excludeKeys: input.excludeKeys,
      });
    }

    addProfiles(profiles);
  }

  // Last resort: unscoped title/keyword search. Location gate after enrich
  // still drops wrong-country profiles; without this, India-network accounts
  // often get zero Classic results for US/UK/AU location ids.
  if (!found.size && input.targetLocations.length) {
    const unscoped = await searchLinkedInProfiles({
      accountId: input.account.accountId,
      criteria: {
        titles: input.title ? [input.title] : [],
        industries: [],
        locations: [],
        keywords: input.keyword ? [input.keyword] : [],
      },
      limit: input.limit,
      agent: input.agent,
      excludeKeys: input.excludeKeys,
    });
    addProfiles(unscoped);
  }

  return Array.from(found.values()).slice(0, input.limit);
}

function parseLinkedInSource(value: string): ParsedLinkedInSource | null {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const parts = url.pathname.split("/").filter(Boolean);
    const companyIndex = parts.findIndex((part) => part === "company" || part === "school");
    const profileIndex = parts.findIndex((part) => part === "in" || part === "pub");
    const index = companyIndex >= 0 ? companyIndex : profileIndex;
    const identifier = index >= 0 ? parts[index + 1] : parts.at(-1);

    if (!identifier) return null;

    return {
      identifier,
      isCompany: companyIndex >= 0,
      // Human-readable slug for lead reasons and keyword post search.
      label: decodeURIComponent(identifier).replace(/[-_]+/g, " "),
    };
  } catch {
    return null;
  }
}

function getPublicIdentifier(linkedInUrl?: string) {
  if (!linkedInUrl) return "";

  try {
    const url = new URL(/^https?:\/\//i.test(linkedInUrl) ? linkedInUrl : `https://${linkedInUrl}`);
    const parts = url.pathname.split("/").filter(Boolean);
    const profileIndex = parts.findIndex((part) => part === "in" || part === "pub");
    return profileIndex >= 0 ? parts[profileIndex + 1] || "" : "";
  } catch {
    return "";
  }
}

function leadIdentityValue(lead: Partial<Lead>) {
  return (
    normalizeLinkedInProfileUrl(lead.linkedInUrl) ||
    lead.providerProfileId ||
    [lead.name, lead.title, lead.company].filter(Boolean).join("|")
  );
}

function personKeyFromLead(lead: Partial<Lead>) {
  return cleanId(leadIdentityValue(lead));
}

function expectedLeadId(workspaceId: string, lead: Partial<Lead>) {
  return `${workspaceId}-${cleanId(leadIdentityValue(lead) || lead.name || "lead")}`;
}

function mergeLead(base: Partial<Lead>, next: Partial<Lead>) {
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(next).filter(([, value]) => value !== undefined && value !== ""),
    ),
  };
}

function addObservedSignal(
  candidates: Map<string, Candidate>,
  input: Omit<ObservedSignal, "personKey">,
) {
  if (isAnonymousLinkedInProfile(input.lead)) return;
  const personKey = personKeyFromLead(input.lead);
  if (!personKey) return;

  const signal = { ...input, personKey };
  const existing = candidates.get(personKey);

  if (existing) {
    existing.lead = mergeLead(existing.lead, input.lead);
    existing.signals.push(signal);
    return;
  }

  candidates.set(personKey, {
    personKey,
    lead: input.lead,
    signals: [signal],
  });
}

async function logSourceError(agent: Agent, label: string, error: unknown) {
  await logAutomationRun({
    workspaceId: agent.workspaceId,
    kind: "people_engine",
    status: "error",
    message: `${label}: ${error instanceof Error ? error.message : "Signal collection failed"}`,
  });
}

async function collectPostEngagers(input: {
  agent: Agent;
  account: LinkedInAccount;
  candidates: Map<string, Candidate>;
  postId: string;
  postText: string;
  postUrl: string;
  sourceLabel: string;
  observedAt: string;
  /** Steal-customers: comments only, fresh, intent-bearing. */
  stealMode?: boolean;
  /** Product/problem terms from this workspace (any industry). */
  productKeywords?: string[];
}) {
  const stealMode = Boolean(input.stealMode);
  const productKeywords = input.productKeywords || [];
  // Reactions are low-intent global noise on keyword posts. Only pull them for
  // competitor/founder pages where the thread itself is the targeting signal.
  const sourceLabel = input.sourceLabel;
  const allowReactions =
    !stealMode &&
    (sourceLabel.startsWith("competitor ") ||
      sourceLabel.startsWith("founder ") ||
      sourceLabel.startsWith("employee/founder ") ||
      sourceLabel.startsWith("employee ") ||
      sourceLabel.startsWith("connected account "));
  const comments = await listLinkedInPostComments({
    accountId: input.account.accountId,
    postId: input.postId,
    limit: POST_ENGAGER_LIMIT,
  });
  const reactions = allowReactions
    ? await listLinkedInPostReactions({
        accountId: input.account.accountId,
        postId: input.postId,
        limit: POST_ENGAGER_LIMIT,
      })
    : [];

  for (const comment of comments) {
    const commentText = (comment.text || "").trim();
    if (stealMode) {
      if (
        !shouldKeepStealComment({
          commentText,
          commentCreatedAt: comment.createdAt || "",
          postCreatedAt: input.observedAt,
          productKeywords,
        })
      ) {
        continue;
      }
    } else if (isNoiseEngagementComment(commentText)) {
      // Keep substantive comments only. "Congrats!" and emoji do not convert.
      continue;
    }

    const lead = normalizeLinkedInActor(comment.profile);
    if (!lead) continue;

    const engagementContext = buildEngagementContext({
      kind: "comment",
      postText: input.postText,
      postUrl: input.postUrl,
      sourceLabel: input.sourceLabel,
      commentText,
      commentUrl: comment.url || "",
    });

    addObservedSignal(input.candidates, {
      lead,
      signalType: "post_comment",
      signalSource: input.sourceLabel,
      signalText: formatEngagementSignalText({
        kind: "comment",
        postText: input.postText,
        commentText,
      }),
      signalUrl: comment.url || input.postUrl,
      signalObservedAt: comment.createdAt || input.observedAt || nowIso(),
      activityObservedAt: comment.createdAt || input.observedAt || undefined,
      leadReason: engagementLeadReason(input.sourceLabel, "comment"),
      engagementContext,
    });
  }

  for (const reaction of reactions) {
    const lead = normalizeLinkedInActor(reaction.profile);
    if (!lead) continue;

    const engagementContext = buildEngagementContext({
      kind: "reaction",
      postText: input.postText,
      postUrl: input.postUrl,
      sourceLabel: input.sourceLabel,
    });

    addObservedSignal(input.candidates, {
      lead,
      signalType: "post_reaction",
      signalSource: input.sourceLabel,
      signalText: formatEngagementSignalText({
        kind: "reaction",
        postText: input.postText,
        reactionType: reaction.type,
      }),
      signalUrl: reaction.url || input.postUrl,
      signalObservedAt: reaction.createdAt || input.observedAt || nowIso(),
      activityObservedAt: reaction.createdAt || input.observedAt || undefined,
      leadReason: engagementLeadReason(input.sourceLabel, "reaction"),
      engagementContext,
    });
  }
}

async function collectEngagersFromPosts(input: {
  agent: Agent;
  account: LinkedInAccount;
  candidates: Map<string, Candidate>;
  posts: Awaited<ReturnType<typeof listLinkedInPostsForProfile>>;
  sourceLabel: string;
  fallbackUrl: string;
  stealMode: boolean;
  productKeywords: string[];
  postLimit: number;
}) {
  const posts = input.stealMode
    ? selectStealPosts(input.posts, {
        getText: (post) => getLinkedInPostText(post),
        getCreatedAt: (post) => getLinkedInPostCreatedAtRaw(post) || undefined,
        keywords: input.productKeywords,
        limit: input.postLimit,
      })
    : sortPostsByRelevance(
        input.posts,
        (post) => getLinkedInPostText(post),
        input.productKeywords,
      ).slice(0, input.postLimit);

  for (const post of posts) {
    const postId = getLinkedInPostId(post);
    if (!postId) continue;

    await collectPostEngagers({
      agent: input.agent,
      account: input.account,
      candidates: input.candidates,
      postId,
      postText: getLinkedInPostText(post),
      postUrl: getLinkedInPostUrl(post) || input.fallbackUrl,
      sourceLabel: input.sourceLabel,
      observedAt: getLinkedInPostCreatedAtRaw(post),
      stealMode: input.stealMode,
      productKeywords: input.productKeywords,
    });
  }
}

async function collectFromLinkedInSource(input: {
  agent: Agent;
  account: LinkedInAccount;
  candidates: Map<string, Candidate>;
  sourceUrl: string;
  sourceKind: "competitor" | "founder";
  relevanceKeywords?: string[];
  stealMode?: boolean;
}) {
  const parsed = parseLinkedInSource(input.sourceUrl);
  if (!parsed) {
    await logSourceError(input.agent, input.sourceUrl, new Error("Invalid LinkedIn source URL."));
    return;
  }

  const sourceLabel =
    input.sourceKind === "competitor"
      ? `competitor ${parsed.label}`
      : `employee/founder ${parsed.label}`;
  const stealMode = Boolean(input.stealMode);
  const productKeywords = input.relevanceKeywords || [];

  try {
    // 1) Posts on the company page or the named person profile itself.
    const rawPosts = await listLinkedInPostsForProfile({
      accountId: input.account.accountId,
      identifier: parsed.identifier,
      isCompany: parsed.isCompany,
      limit: stealMode ? STEAL_POST_FETCH_LIMIT : Math.max(SOURCE_POST_LIMIT, 12),
    });
    await collectEngagersFromPosts({
      agent: input.agent,
      account: input.account,
      candidates: input.candidates,
      posts: rawPosts,
      sourceLabel,
      fallbackUrl: input.sourceUrl,
      stealMode,
      productKeywords,
      postLimit: stealMode ? STEAL_SOURCE_POST_LIMIT : SOURCE_POST_LIMIT,
    });

    // 2) Steal + company URL: also find employees at that company, pull their
    // personal posts, and treat commenters on those posts as buyer candidates.
    // Employees themselves are content sources only, not added as leads.
    if (stealMode && parsed.isCompany) {
      const employees = await searchLinkedInEmployeesAtCompany({
        accountId: input.account.accountId,
        companyLabel: parsed.label,
        companyIdentifier: parsed.identifier,
        limit: STEAL_EMPLOYEES_PER_COMPANY,
        agent: input.agent,
      });

      await logAutomationRun({
        workspaceId: input.agent.workspaceId,
        kind: "people_engine",
        status: "completed",
        message:
          `Steal Customers source ${sourceLabel}: ${employees.length} employees found` +
          ` for post scanning (commenters become lead candidates).`,
      }).catch(() => {});

      for (const employee of employees) {
        const employeeId =
          getPublicIdentifier(employee.linkedInUrl) || employee.providerProfileId;
        if (!employeeId) continue;
        if (isAnonymousLinkedInProfile(employee)) continue;

        try {
          const employeePosts = await listLinkedInPostsForProfile({
            accountId: input.account.accountId,
            identifier: employeeId,
            isCompany: false,
            limit: STEAL_EMPLOYEE_POST_LIMIT + 2,
          });
          const employeeLabel =
            `employee ${employee.name || employeeId} @ ${parsed.label}`;
          await collectEngagersFromPosts({
            agent: input.agent,
            account: input.account,
            candidates: input.candidates,
            posts: employeePosts,
            sourceLabel: employeeLabel,
            fallbackUrl: employee.linkedInUrl || input.sourceUrl,
            stealMode: true,
            productKeywords,
            postLimit: STEAL_EMPLOYEE_POST_LIMIT,
          });
        } catch (error) {
          await logSourceError(input.agent, `employee posts ${employeeId}`, error);
        }
      }
    }
  } catch (error) {
    await logSourceError(input.agent, sourceLabel, error);
  }
}

async function collectFromConnectedAccountPosts(input: {
  agent: Agent;
  account: LinkedInAccount;
  candidates: Map<string, Candidate>;
  productKeywords: string[];
  targetLocations: string[];
}) {
  const sourceLabel = "connected account own post";
  try {
    const ownProfile = await retrieveOwnLinkedInProfile(input.account.accountId);
    if (!ownProfile?.providerProfileId) return;
    if (
      input.targetLocations.length &&
      (!ownProfile.location ||
        !matchesTargetLocation(ownProfile.location, input.targetLocations))
    ) {
      return;
    }
    const posts = await listLinkedInPostsForProfile({
      accountId: input.account.accountId,
      identifier: ownProfile.providerProfileId,
      limit: 5,
    });
    const recentPosts = posts.filter((post) =>
      recentLinkedInActivityFromPosts([
        { createdAt: getLinkedInPostCreatedAtRaw(post) },
      ]),
    );
    if (!recentPosts.length) return;
    await collectEngagersFromPosts({
      agent: input.agent,
      account: input.account,
      candidates: input.candidates,
      posts: recentPosts,
      sourceLabel,
      fallbackUrl: "",
      stealMode: false,
      productKeywords: input.productKeywords,
      postLimit: 3,
    });
  } catch (error) {
    await logSourceError(input.agent, sourceLabel, error);
  }
}

async function collectFromKeyword(input: {
  agent: Agent;
  account: LinkedInAccount;
  candidates: Map<string, Candidate>;
  keyword: string;
  targetLocations: string[];
  excludeKeys?: Set<string>;
}): Promise<number> {
  const sourceLabel = `LinkedIn keyword "${input.keyword}"`;
  let added = 0;

  try {
    // People search only. Keyword post mining (authors + reactors) is global,
    // unscoped, and historically drowned location-targeted discovery.
    const profiles = await searchPeopleForAgentQuery({
      agent: input.agent,
      account: input.account,
      keyword: input.keyword,
      targetLocations: input.targetLocations,
      limit: KEYWORD_PROFILE_LIMIT,
      excludeKeys: input.excludeKeys,
    });

    for (const lead of profiles) {
      addObservedSignal(input.candidates, {
        lead,
        signalType: "keyword_search",
        signalSource: sourceLabel,
        signalText: input.keyword,
        signalUrl: lead.linkedInUrl || "",
        signalObservedAt: nowIso(),
        leadReason: `Matched ${sourceLabel}`,
      });
      added += 1;
    }
  } catch (error) {
    await logSourceError(input.agent, sourceLabel, error);
  }

  return added;
}

async function collectFromTitle(input: {
  agent: Agent;
  account: LinkedInAccount;
  candidates: Map<string, Candidate>;
  title: string;
  targetLocations: string[];
  excludeKeys?: Set<string>;
}): Promise<number> {
  const sourceLabel = `LinkedIn title "${input.title}"`;
  let added = 0;

  try {
    // Primary path: agent job titles. Discovery is driven by the agent's
    // configured roles, not post engagers or product-only expansion.
    const profiles = await searchPeopleForAgentQuery({
      agent: input.agent,
      account: input.account,
      title: input.title,
      targetLocations: input.targetLocations,
      limit: TITLE_PROFILE_LIMIT,
      excludeKeys: input.excludeKeys,
    });

    for (const lead of profiles) {
      addObservedSignal(input.candidates, {
        lead,
        signalType: "profile_search",
        signalSource: sourceLabel,
        signalText: input.title,
        signalUrl: lead.linkedInUrl || "",
        signalObservedAt: nowIso(),
        leadReason: `Job title match: ${input.title}`,
      });
      added += 1;
    }
  } catch (error) {
    await logSourceError(input.agent, sourceLabel, error);
  }

  return added;
}

/**
 * When Classic people search returns zero (common on restricted free accounts),
 * post search still works and returns authors with real provider ids. Keep only
 * authors whose headline matches the agent titles so this stays role discovery,
 * not unscoped post-noise mining.
 */
async function collectFromRolePostAuthors(input: {
  agent: Agent;
  account: LinkedInAccount;
  candidates: Map<string, Candidate>;
  titles: string[];
  roleVocabulary: string[];
  excludeKeys?: Set<string>;
  limit?: number;
}): Promise<number> {
  const limit = input.limit ?? 20;
  let added = 0;
  const seen = new Set<string>();

  for (const title of input.titles.slice(0, 6)) {
    if (added >= limit) break;
    const queries = [title, `my day as a ${title}`, `as a ${title}`];
    for (const query of queries) {
      if (added >= limit) break;
      try {
        const posts = await searchLinkedInPosts({
          accountId: input.account.accountId,
          keywords: query,
          limit: 12,
        });
        for (const post of posts) {
          if (added >= limit) break;
          const author = post.author || post.user;
          if (!author || (author as { is_company?: boolean }).is_company) continue;
          const lead = normalizeLinkedInActor(author);
          if (!lead) continue;
          if (!matchesTargetTitle(lead.title || "", input.titles, input.roleVocabulary)) {
            continue;
          }
          const key = (lead.providerProfileId || lead.linkedInUrl || lead.name || "")
            .toLowerCase();
          if (!key || seen.has(key)) continue;
          if (
            input.excludeKeys?.size &&
            profileSearchKeys(lead).some((item) => input.excludeKeys!.has(item))
          ) {
            continue;
          }
          seen.add(key);
          addObservedSignal(input.candidates, {
            lead,
            signalType: "profile_search",
            signalSource: `LinkedIn title post author "${title}"`,
            signalText: getLinkedInPostText(post).slice(0, 280) || title,
            signalUrl: getLinkedInPostUrl(post) || lead.linkedInUrl || "",
            signalObservedAt:
              getLinkedInPostCreatedAtRaw(post) || getLinkedInPostCreatedAt(post) || nowIso(),
            activityObservedAt: getLinkedInPostCreatedAtRaw(post) || undefined,
            leadReason: `Job title match from public post author: ${title}`,
          });
          added += 1;
        }
      } catch (error) {
        await logSourceError(input.agent, `title post author "${title}"`, error);
      }
    }
  }

  return added;
}

function namesAlign(claimed: string | undefined, resolved: string | undefined) {
  const tokens = (value: string | undefined) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((part) => part.length > 1 && !["linkedin", "member"].includes(part));
  const left = tokens(claimed);
  const right = tokens(resolved);
  if (!left.length || !right.length) return false;
  return left.some((part) => right.includes(part));
}

async function collectFromCompanyFilteredSearch(input: {
  agent: Agent;
  account: LinkedInAccount;
  candidates: Map<string, Candidate>;
  titles: string[];
  industries: string[];
  targetLocations: string[];
  companySize: { min: number; max: number };
  excludeKeys?: Set<string>;
}) {
  const sourceLabel =
    `LinkedIn companies with ${input.companySize.min}-${input.companySize.max} employees`;
  try {
    const profiles = await searchLinkedInProfilesAtCompanies({
      accountId: input.account.accountId,
      titles: input.titles,
      industries: input.industries,
      locations: input.targetLocations,
      companySize: input.companySize,
      limit: COMPANY_FILTERED_PROFILE_LIMIT,
      agent: input.agent,
      excludeKeys: input.excludeKeys,
    });

    for (const lead of profiles) {
      addObservedSignal(input.candidates, {
        lead,
        signalType: "profile_search",
        signalSource: sourceLabel,
        signalText: sourceLabel,
        signalUrl: lead.linkedInUrl || "",
        signalObservedAt: nowIso(),
        leadReason: `Current employer matched LinkedIn's ${input.companySize.min}-${input.companySize.max} employee company filter`,
      });
    }
  } catch (error) {
    await logSourceError(input.agent, sourceLabel, error);
  }
}

export async function enrichLinkedInLead(account: LinkedInAccount, lead: Partial<Lead>) {
  // Public identifiers are stable across connected accounts. Provider ids can
  // come from a different workspace-owned account when people-search fallback
  // is used, so prefer the public profile slug for enrichment on the agent's
  // selected outreach account.
  const identifier = getPublicIdentifier(lead.linkedInUrl) || lead.providerProfileId;
  if (!identifier) return lead;

  const workspaceAccounts = await listLinkedInAccounts(account.workspaceId);
  const enrichmentAccounts = [
    account,
    ...workspaceAccounts.filter((candidate) => candidate.id !== account.id),
  ];

  for (const enrichmentAccount of enrichmentAccounts) {
    try {
      const profile = await retrieveLinkedInProfile({
        accountId: enrichmentAccount.accountId,
        identifier,
      });
      if (!profile) continue;

      const companyEvidence = profile.company
        ? await retrieveLinkedInCompanyEvidence({
            accountId: enrichmentAccount.accountId,
            companyName: profile.company,
          })
        : null;
      const enrichedProfile = companyEvidence
        ? {
            ...profile,
            summary: [profile.summary, companyEvidence.text].filter(Boolean).join("\n"),
            profileContext: profile.profileContext
              ? {
                  ...profile.profileContext,
                  experience: [companyEvidence.text, ...profile.profileContext.experience],
                }
              : profile.profileContext,
          }
        : profile;

      return mergeLead(lead, enrichedProfile);
    } catch (error) {
      console.error(
        `[people-engine] failed to enrich lead through ${enrichmentAccount.id}:`,
        error,
      );
    }
  }

  return lead;
}

type ActivityVerification =
  | {
      status: "active";
      evidence: LinkedInActivityEvidence;
      recentPosts: string[];
    }
  | { status: "inactive"; recentPosts: [] }
  | { status: "unknown"; recentPosts: [] };

function activityIdentifierFromLead(lead: Partial<Lead>) {
  // The posts route documents the provider-internal id as its primary key.
  // Fall back to the public slug for older leads that do not have one yet.
  return lead.providerProfileId || getPublicIdentifier(lead.linkedInUrl) || "";
}

function formatRecentActivityPosts(
  posts: Awaited<ReturnType<typeof listLinkedInPostsForProfile>>,
  nowMs: number,
) {
  return posts
    .filter((post) =>
      recentLinkedInActivityFromPosts(
        [{ createdAt: getLinkedInPostCreatedAtRaw(post) }],
        nowMs,
      ),
    )
    .map((post) => {
      const text = getLinkedInPostText(post).replace(/\s+/g, " ").trim().slice(0, 600);
      const createdAt = getLinkedInPostCreatedAtRaw(post);
      return text && createdAt ? `${createdAt.slice(0, 10)} | ${text}` : "";
    })
    .filter(Boolean);
}

async function verifyRecentLinkedInActivity(input: {
  account: LinkedInAccount;
  lead: Partial<Lead>;
  signals: ObservedSignal[];
  nowMs: number;
}): Promise<ActivityVerification> {
  const signalEvidence = recentLinkedInActivityFromSignals(input.signals, input.nowMs);
  if (signalEvidence) {
    return { status: "active", evidence: signalEvidence, recentPosts: [] };
  }

  const identifier = activityIdentifierFromLead(input.lead);
  if (!identifier) return { status: "unknown", recentPosts: [] };

  const workspaceAccounts = await listLinkedInAccounts(input.account.workspaceId);
  const activityAccounts = [
    input.account,
    ...workspaceAccounts.filter((candidate) => candidate.id !== input.account.id),
  ];

  for (const activityAccount of activityAccounts) {
    try {
      const posts = await listLinkedInPostsForProfile({
        accountId: activityAccount.accountId,
        identifier,
        limit: ACTIVITY_POST_LIMIT,
      });
      const postEvidence = recentLinkedInActivityFromPosts(
        posts.map((post) => ({ createdAt: getLinkedInPostCreatedAtRaw(post) })),
        input.nowMs,
      );
      if (!postEvidence) return { status: "inactive", recentPosts: [] };
      return {
        status: "active",
        evidence: postEvidence,
        recentPosts: formatRecentActivityPosts(posts, input.nowMs),
      };
    } catch (error) {
      console.error(
        `[people-engine] activity check failed through ${activityAccount.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return { status: "unknown", recentPosts: [] };
}

function applyLinkedInActivity(
  lead: Partial<Lead>,
  evidence: LinkedInActivityEvidence,
  recentPosts: string[],
) {
  const existingContext = lead.profileContext;
  const profileContext = recentPosts.length
    ? {
        about: existingContext?.about || "",
        experience: existingContext?.experience || [],
        education: existingContext?.education || [],
        skills: existingContext?.skills || [],
        certifications: existingContext?.certifications || [],
        projects: existingContext?.projects || [],
        volunteering: existingContext?.volunteering || [],
        languages: existingContext?.languages || [],
        recentPosts,
        capturedAt: nowIso(),
      }
    : existingContext;

  return mergeLead(lead, {
    linkedinActivityAt: evidence.observedAt,
    linkedinActivitySource: evidence.source,
    ...(profileContext ? { profileContext } : {}),
  });
}

async function persistCandidateSignals(agent: Agent, candidate: Candidate) {
  const persisted: LeadSignal[] = [];

  for (const signal of candidate.signals) {
    const result = await upsertLeadSignal({
      workspaceId: agent.workspaceId,
      agentId: agent.id,
      groupId: agent.targetGroupId,
      personKey: candidate.personKey,
      linkedInUrl: signal.lead.linkedInUrl || "",
      providerProfileId: signal.lead.providerProfileId,
      personName: signal.lead.name || "LinkedIn profile",
      personTitle: signal.lead.title || "",
      personCompany: signal.lead.company || "",
      signalType: signal.signalType,
      signalSource: signal.signalSource,
      signalText: signal.signalText,
      signalUrl: signal.signalUrl,
      signalObservedAt: signal.signalObservedAt,
      leadReason: signal.leadReason,
    });

    persisted.push(result.signal);
  }

  return persisted;
}

function primarySignal(candidate: Candidate) {
  // Prefer competitor/founder comments over cold search hits so the lead stores
  // post+comment context for outreach instead of only a keyword query string.
  const typeStrength: Record<LeadSignalType, number> = {
    keyword_search: 4,
    profile_search: 3,
    post_comment: 2,
    post_reaction: 1,
  };
  return candidate.signals.reduce<ObservedSignal | undefined>(
    (best, signal) => {
      const strength = (value: ObservedSignal) => {
        if (value.signalSource.startsWith("Grounded ")) return 10;
        if (
          value.signalType === "post_comment" &&
          (value.signalSource.startsWith("competitor ") ||
            value.signalSource.startsWith("founder ") ||
            value.signalSource.startsWith("employee/founder ") ||
            value.signalSource.startsWith("connected account "))
        ) {
          return 12;
        }
        if (
          value.signalType === "post_reaction" &&
          (value.signalSource.startsWith("competitor ") ||
            value.signalSource.startsWith("founder ") ||
            value.signalSource.startsWith("employee/founder ") ||
            value.signalSource.startsWith("connected account "))
        ) {
          return 6;
        }
        return typeStrength[value.signalType];
      };
      return !best || strength(signal) > strength(best) ? signal : best;
    },
    undefined,
  );
}

function directSignalEvidence(signal: ObservedSignal) {
  if (signal.signalSource.startsWith("Grounded ")) return signal.signalText;
  if (
    signal.signalType === "keyword_search" &&
    signal.signalSource.endsWith("authored post")
  ) {
    return signal.signalText;
  }
  return "";
}

function candidatePriority(
  candidate: Candidate,
  targetTitles: string[],
  targetLocations: string[],
  roleVocabulary: string[],
  productKeywords: string[] = [],
) {
  // Location-scoped people search must outrank global keyword-post noise.
  const signalWeight = candidate.signals.reduce((total, signal) => {
    let weight = discoverySignalPriority(signal);
    if (
      weight > 0 &&
      signal.signalType === "post_comment" &&
      signal.engagementContext?.commentText
    ) {
      weight += commentBuyingIntentScore(
        signal.engagementContext.commentText,
        productKeywords,
      );
    }
    return total + weight;
  }, 0);
  // Stronger boost when title matches the agent's own configured titles.
  const titleWeight = matchesTargetTitle(candidate.lead.title || "", targetTitles, roleVocabulary)
    ? 8
    : 0;
  // Prefer candidates already known in-region so enrichment budget is not spent
  // guessing on blank-location post engagers.
  const locationWeight =
    candidate.lead.location && matchesTargetLocation(candidate.lead.location, targetLocations)
      ? 4
      : 0;
  const peopleSearchHits = candidate.signals.filter((signal) =>
    isLocationScopedPeopleSignal(signal),
  ).length;
  return signalWeight + titleWeight + locationWeight + Math.max(0, peopleSearchHits - 1) * 2;
}

/** Present wrong-country locations fail. Blank is kept only for people-search hits. */
function failsLocationGate(
  location: string | undefined,
  targetLocations: string[],
  signals: Array<{ signalType: string; signalSource: string }>,
  options?: { allowBlankForEnrichment?: boolean },
) {
  if (!targetLocations.length) return false;
  const trimmed = location?.trim() || "";
  if (!trimmed) {
    if (options?.allowBlankForEnrichment) return false;
    // Location-parameter / title search already scoped the pool. Blank profile
    // locations are common and should not burn the whole run as "out of region".
    return !signals.some((signal) => isLocationScopedPeopleSignal(signal));
  }
  return !matchesTargetLocation(trimmed, targetLocations);
}

function sourceKey(kind: PeopleEngineSource["kind"], value: string) {
  return `${kind}:${cleanId(value)}`;
}

export async function runPeopleEngineForAgent(input: {
  agent: Agent;
  account: LinkedInAccount;
  profile: ProductProfile | null;
  initialLeadTarget?: number;
  dailyLeadLimit?: number;
}) {
  const deadline = Date.now() + PEOPLE_ENGINE_RUN_MS;
  const dailyLeadLimit = Math.min(
    input.dailyLeadLimit ?? DEFAULT_DAILY_QUALIFIED_LEAD_CAP,
    DEFAULT_DAILY_QUALIFIED_LEAD_CAP,
  );
  const enrichmentLimit = DEFAULT_MAX_ENRICHMENTS_PER_RUN;
  // Steal-customers agents only harvest commenters under competitor/founder
  // posts. Other discovery agents use title/keyword search and never steal.
  const stealOnly = isStealCustomersAgent(input.agent);
  // Steal has no geo ICP form. Comment actors often ship blank location, and
  // falling back to My Product preferredLocations would hard-drop the whole
  // pool before product-fit scoring. Classic agents keep agent filters first,
  // then product preferred locations.
  const targetLocations = stealOnly
    ? []
    : agentTargetLocations(input.agent, input.profile);
  const candidates = new Map<string, Candidate>();
  const sources = input.agent.signalSources || {
    competitorUrls: [],
    founderUrls: [],
    keywords: [],
  };
  const existingLeads = await listLeads(input.agent.workspaceId, undefined, 5000);
  const existingLeadIds = new Set(existingLeads.map((lead) => lead.id));
  const existingLeadsById = new Map(existingLeads.map((lead) => [lead.id, lead]));
  // People searches page past leads already in this agent's group: LinkedIn
  // returns the same first page for the same query day after day, so without
  // this a mature agent re-reads yesterday's results and discovers nobody new.
  // Leads in OTHER groups are not excluded - surfacing them here is how they
  // get adopted into this agent's group.
  const groupLeadKeys = new Set(
    existingLeads
      .filter((lead) => lead.groupIds?.includes(input.agent.targetGroupId))
      .flatMap((lead) => profileSearchKeys(lead)),
  );
  const criteria = await planPeopleSearch(input.agent);

  const sourceKeywords = getSourceKeywords(input.agent, criteria);
  const searchTitles = getSearchTitles(input.agent, input.profile, criteria);
  const companySize = requestedCompanySize(input.agent);
  // Steal has no title ICP: My Product buyerTitles must not hard-drop commenters
  // before soft product-fit scoring runs.
  const matchTitles = stealOnly
    ? []
    : unique([
        ...searchTitles,
        ...expandedTargetTitles(input.agent, input.profile),
      ]);
  // The domain's own title words, so a lead whose title shares no wording with
  // the target list ("Dispatcher" against "Logistics Coordinator") is still
  // recognized as someone who performs the work.
  const roleVocabulary = criteria.roleVocabulary;
  // Keep one run below the LinkedIn Classic-search burst limit. Full source
  // lists are still retained and rotated via peopleEngineCursor, so narrow
  // criteria are covered over time without sacrificing the strongest
  // title-first searches in the current run.
  const sourceLimit = input.initialLeadTarget ? 6 : 8;
  const sourceQueue: PeopleEngineSource[] = stealOnly
    ? buildPeopleEngineSourceQueue({
        competitorUrls: sources.competitorUrls,
        founderUrls: sources.founderUrls,
        titles: [],
        keywords: [],
        titleLimit: 0,
        keywordLimit: 0,
        sourceKey,
      })
    : buildPeopleEngineSourceQueue({
        // Competitor comment stealing is a dedicated agent type now.
        competitorUrls: [],
        founderUrls: [],
        titles: searchTitles,
        keywords: sourceKeywords,
        titleLimit: searchTitles.length,
        keywordLimit: sourceKeywords.length,
        sourceKey,
      });
  const sourceRun = planPeopleEngineSourceRun(
    sourceQueue,
    input.agent.peopleEngineCursor?.sourceKey,
    sourceLimit,
  );
  // Steal Customers: rank posts with concrete product language from My Product
  // (features, pains, use cases, domain tokens) rather than the seller's brand
  // name or long marketing sentences that never appear on competitor threads.
  const relevanceKeywords = stealOnly
    ? buildStealProductTerms({
        profile: input.profile,
        agentPrompt: input.agent.prompt,
        extraPhrases: [
          ...criteria.keywords,
          ...criteria.postKeywords,
          ...input.agent.filters.keywords,
        ],
      })
    : unique([
        ...sourceKeywords,
        ...criteria.keywords,
        ...criteria.postKeywords,
        ...criteria.useCases,
        ...(input.profile?.keywords || []),
        ...(input.profile?.painPoints || []),
        input.profile?.companyName || "",
      ]);

  // People who recently engaged with the sender's own posts are warm,
  // provider-resolved, and provably active. They still pass every title,
  // location, enrichment, and fit gate below before becoming leads.
  if (!stealOnly && hasRunTime(deadline)) {
    await collectFromConnectedAccountPosts({
      agent: input.agent,
      account: input.account,
      candidates,
      productKeywords: relevanceKeywords,
      targetLocations,
    });
  }

  // When company size is binding, source inside companies that LinkedIn has
  // already filtered to that exact headcount band. These candidates are added
  // first so the limited profile-view budget is spent on the strongest pool.
  // Steal-customers agents skip this: their only pool is post engagers.
  if (!stealOnly && companySize && hasRunTime(deadline)) {
    await collectFromCompanyFilteredSearch({
      agent: input.agent,
      account: input.account,
      candidates,
      titles: searchTitles,
      industries: criteria.industries,
      targetLocations,
      companySize,
      excludeKeys: groupLeadKeys,
    });
  }

  let peopleSearchHits = 0;
  for (const { source, nextSource } of sourceRun) {
    if (!hasRunTime(deadline)) break;

    if (nextSource) {
      // false = agent doc gone (deleted mid-run). Stop discovery: further
      // cursor/status writes would also no-op, and leads would orphan to a
      // deleted sourceAgentId with no group owner left.
      const cursorSaved = await updateAgentPeopleEngineCursor(input.agent.id, nextSource.key);
      if (!cursorSaved) break;
    }

    if (source.kind === "title") {
      peopleSearchHits += await collectFromTitle({
        agent: input.agent,
        account: input.account,
        candidates,
        title: source.value,
        targetLocations,
        excludeKeys: groupLeadKeys,
      });
      continue;
    }

    if (source.kind === "keyword") {
      peopleSearchHits += await collectFromKeyword({
        agent: input.agent,
        account: input.account,
        candidates,
        keyword: source.value,
        targetLocations,
        excludeKeys: groupLeadKeys,
      });
      continue;
    }

    await collectFromLinkedInSource({
      agent: input.agent,
      account: input.account,
      candidates,
      sourceUrl: source.value,
      sourceKind: source.kind,
      relevanceKeywords,
      stealMode: stealOnly,
    });
  }

  // Fail loud when classic people search contributed nothing. That is the
  // primary geo-targeted path; silent empty runs previously hid behind post noise.
  if (!stealOnly && !peopleSearchHits) {
    await logAutomationRun({
      workspaceId: input.agent.workspaceId,
      kind: "people_engine",
      status: "error",
      message:
        `Agent ${input.agent.id}: people search returned 0 profiles across title/keyword sources` +
        `${targetLocations.length ? ` (locations: ${targetLocations.join(", ")})` : ""}. ` +
        `Trying title-matched post authors, then grounded/company sources.`,
    }).catch((error) => {
      console.error("[people-engine] failed to log empty people search:", error);
    });

    // Classic people search can return HTTP 200 with an empty set while posts
    // still work. Title-matched post authors carry real provider ids.
    if (hasRunTime(deadline) && matchTitles.length) {
      peopleSearchHits += await collectFromRolePostAuthors({
        agent: input.agent,
        account: input.account,
        candidates,
        titles: matchTitles,
        roleVocabulary,
        excludeKeys: groupLeadKeys,
        limit: input.initialLeadTarget ? 12 : 20,
      });
    }
  }

  // Steal agents also search recent product/competitor discussion posts (not
  // only the competitor company feed) so commenters on viral product threads
  // still surface when the company page itself is quiet.
  if (stealOnly && hasRunTime(deadline)) {
    const competitorLabels = unique(
      [...sources.competitorUrls, ...sources.founderUrls]
        .map((url) => parseLinkedInSource(url)?.label || "")
        .filter(Boolean),
    );
    const stealQueries = buildStealPostSearchQueries({
      competitorLabels,
      productKeywords: relevanceKeywords,
      limit: 10,
    });
    for (const query of stealQueries) {
      if (!hasRunTime(deadline)) break;
      try {
        const rawPosts = await searchLinkedInPosts({
          accountId: input.account.accountId,
          keywords: query,
          limit: STEAL_KEYWORD_POST_LIMIT,
        });
        const posts = selectStealPosts(rawPosts, {
          getText: (post) => getLinkedInPostText(post),
          getCreatedAt: (post) => getLinkedInPostCreatedAtRaw(post) || undefined,
          keywords: relevanceKeywords,
          limit: STEAL_KEYWORD_POST_LIMIT,
        });
        for (const post of posts) {
          if (!hasRunTime(deadline)) break;
          const postId = getLinkedInPostId(post);
          if (!postId) continue;
          await collectPostEngagers({
            agent: input.agent,
            account: input.account,
            candidates,
            postId,
            postText: getLinkedInPostText(post),
            postUrl: getLinkedInPostUrl(post) || "",
            sourceLabel: `competitor discussion "${query}"`,
            observedAt: getLinkedInPostCreatedAtRaw(post),
            stealMode: true,
            productKeywords: relevanceKeywords,
          });
        }
      } catch (error) {
        await logSourceError(input.agent, `steal keyword "${query}"`, error);
      }
    }
  }

  // Provider people results can be plentiful but noisy. Grounded search is an
  // independent exact-match source, so broad LinkedIn results must not suppress
  // it. Its evidence is still checked by the same deterministic and model gates.
  // Steal-customers agents stay on competitor post comments only.
  if (!stealOnly && hasRunTime(deadline)) {
    const groundedCandidates = await findGroundedAgentCandidates(
      input.agent,
      15,
      input.profile,
    );
    for (const lead of groundedCandidates) {
      addObservedSignal(candidates, {
        lead,
        signalType: "keyword_search",
        signalSource: "Grounded exact-agent web search",
        signalText: lead.evidence,
        signalUrl: lead.evidenceUrl || lead.linkedInUrl,
        signalObservedAt: nowIso(),
        leadReason: "Matched every agent requirement in grounded web search",
      });
    }
  }

  let leadsAdded = 0;
  let signalsObserved = 0;
  let existingQualifiedLeads = 0;
  let existingRejected = 0;
  let lowScoreCandidates = 0;
  let outOfRegionCandidates = 0;
  let skippedPostNoise = 0;
  let anonymousDropped = 0;
  let titleFiltered = 0;
  let enrichments = 0;
  let activeCandidates = 0;
  let inactiveCandidates = 0;
  let activityUnverifiable = 0;
  let activityChecks = 0;
  let activityBudgetSkipped = 0;
  let timeBudgetExpired = false;

  const qualifyExistingLead = async (
    existingLead: Lead,
    candidate: Candidate,
    firstSignal: ObservedSignal,
    persistedSignals: LeadSignal[],
  ) => {
    const mergedLead = mergeLead(existingLead, candidate.lead);
    if (
      failsLocationGate(mergedLead.location, targetLocations, candidate.signals)
    ) {
      outOfRegionCandidates += 1;
      return false;
    }
    let score: Awaited<ReturnType<typeof scoreLeadForProduct>>;
    try {
      score = await scoreLeadForProduct(
        {
          ...mergedLead,
          signalType: firstSignal.signalType,
          signalSource: firstSignal.signalSource,
          signalText: firstSignal.signalText,
          signalUrl: firstSignal.signalUrl,
          leadReason: firstSignal.leadReason,
          engagementContext: firstSignal.engagementContext,
        },
        input.profile,
        input.agent,
      );
    } catch (error) {
      // One Gemini blip must not mark the whole agent Error; skip this lead.
      console.error(
        `[people-engine] score failed for existing lead ${existingLead.id}:`,
        error instanceof Error ? error.message : error,
      );
      existingRejected += 1;
      return false;
    }

    if (score.fitScore < QUALIFIED_SCORE_THRESHOLD) {
      existingRejected += 1;
      return false;
    }

    const lead = await upsertLead(input.agent.workspaceId, input.agent.targetGroupId, {
      linkedInUrl: existingLead.linkedInUrl || candidate.lead.linkedInUrl,
      providerProfileId: existingLead.providerProfileId || candidate.lead.providerProfileId,
      // Refresh warm-signal context when we re-qualify someone already known.
      signalType: firstSignal.signalType,
      signalSource: firstSignal.signalSource,
      signalText: firstSignal.signalText,
      signalUrl: firstSignal.signalUrl,
      signalObservedAt: firstSignal.signalObservedAt,
      leadReason: firstSignal.leadReason,
      engagementContext: firstSignal.engagementContext,
      linkedinActivityAt: mergedLead.linkedinActivityAt,
      linkedinActivitySource: mergedLead.linkedinActivitySource,
      profileContext: mergedLead.profileContext,
      fitScore: score.fitScore,
    });

    await Promise.all(
      persistedSignals.map((signal) =>
        markLeadSignalPromoted(signal.id, {
          leadId: lead.id,
          fitScore: score.fitScore,
        }),
      ),
    );
    existingQualifiedLeads += 1;
    return true;
  };

  const allCandidates = Array.from(candidates.values());
  titleFiltered = allCandidates.filter(
    (candidate) =>
      candidate.lead.title &&
      matchTitles.length &&
      !matchesTargetTitle(candidate.lead.title, matchTitles, roleVocabulary),
  ).length;

  const rankedCandidates = allCandidates
    .filter(
      (candidate) =>
        // Missing title: keep and let enrichment + scoring decide.
        // Present title: accept any expanded buyer-function match, not only
        // the narrow titles the user typed on day one.
        !candidate.lead.title ||
        !matchTitles.length ||
        matchesTargetTitle(candidate.lead.title, matchTitles, roleVocabulary),
    )
    .filter((candidate) => {
      // Defense in depth: never enrich pure keyword-post reactors/authors.
      // Steal-customers only use competitor/founder engagers, which pass this.
      if (!stealOnly && isUnscopedKeywordPostEngagement(candidate.signals)) {
        skippedPostNoise += 1;
        return false;
      }
      return true;
    })
    .sort(
      (left, right) =>
        candidatePriority(
          right,
          matchTitles,
          targetLocations,
          roleVocabulary,
          relevanceKeywords,
        ) -
        candidatePriority(
          left,
          matchTitles,
          targetLocations,
          roleVocabulary,
          relevanceKeywords,
        ),
    );

  for (const candidate of rankedCandidates) {
    if (!hasRunTime(deadline)) {
      timeBudgetExpired = true;
      break;
    }

    let persistedSignals: LeadSignal[];
    try {
      persistedSignals = await persistCandidateSignals(input.agent, candidate);
    } catch (error) {
      // One bad signal payload (Firestore INVALID_ARGUMENT, etc.) must not
      // mark the whole agent Error and stop discovery for the day.
      console.error(
        "[people-engine] persist signals failed:",
        error instanceof Error ? error.message : error,
      );
      continue;
    }
    signalsObserved += persistedSignals.length;

    const firstSignal = primarySignal(candidate);
    if (!firstSignal) continue;

    // Apply location before both new-lead and existing-lead paths. Otherwise a
    // known lead could be adopted into a new group without passing the same
    // deterministic location requirement as a newly discovered person.
    if (
      failsLocationGate(candidate.lead.location, targetLocations, candidate.signals, {
        allowBlankForEnrichment: true,
      })
    ) {
      outOfRegionCandidates += 1;
      continue;
    }

    const hasGroundedEvidence = candidate.signals.some(
      (signal) => signal.signalSource.startsWith("Grounded "),
    );
    let preEnrichedGroundedIdentity = false;
    if (hasGroundedEvidence && !candidate.lead.providerProfileId) {
      if (enrichments >= enrichmentLimit) continue;
      enrichments += 1;
      const claimedName = candidate.lead.name;
      try {
        candidate.lead = await enrichLinkedInLead(input.account, candidate.lead);
      } catch (error) {
        console.error(
          "[people-engine] grounded identity resolution failed:",
          error instanceof Error ? error.message : error,
        );
        activityUnverifiable += 1;
        continue;
      }
      if (!candidate.lead.providerProfileId || isAnonymousLinkedInProfile(candidate.lead)) {
        anonymousDropped += 1;
        continue;
      }
      if (claimedName && candidate.lead.name && !namesAlign(claimedName, candidate.lead.name)) {
        anonymousDropped += 1;
        continue;
      }
      if (
        !stealOnly &&
        matchTitles.length &&
        candidate.lead.title &&
        !matchesTargetTitle(candidate.lead.title, matchTitles, roleVocabulary)
      ) {
        titleFiltered += 1;
        continue;
      }
      if (failsLocationGate(candidate.lead.location, targetLocations, candidate.signals)) {
        outOfRegionCandidates += 1;
        continue;
      }
      preEnrichedGroundedIdentity = true;
    }

    const signalActivity = recentLinkedInActivityFromSignals(candidate.signals);
    if (!signalActivity && activityChecks >= DEFAULT_MAX_ACTIVITY_CHECKS_PER_RUN) {
      activityBudgetSkipped += 1;
      continue;
    }
    if (!signalActivity) activityChecks += 1;
    const activity = await verifyRecentLinkedInActivity({
      account: input.account,
      lead: candidate.lead,
      signals: candidate.signals,
      nowMs: Date.now(),
    });
    if (activity.status === "inactive") {
      inactiveCandidates += 1;
      continue;
    }
    if (activity.status === "unknown") {
      activityUnverifiable += 1;
      continue;
    }
    activeCandidates += 1;
    candidate.lead = applyLinkedInActivity(
      candidate.lead,
      activity.evidence,
      activity.recentPosts,
    );

    const existingLeadId = expectedLeadId(input.agent.workspaceId, candidate.lead);
    if (existingLeadIds.has(existingLeadId)) {
      const existingLead = existingLeadsById.get(existingLeadId);
      if (!existingLead) continue;
      try {
        await qualifyExistingLead(existingLead, candidate, firstSignal, persistedSignals);
      } catch (error) {
        console.error(
          "[people-engine] qualify existing lead failed:",
          error instanceof Error ? error.message : error,
        );
        existingRejected += 1;
        continue;
      }
      if (
        input.initialLeadTarget &&
        leadsAdded + existingQualifiedLeads >= input.initialLeadTarget
      ) {
        break;
      }
      continue;
    }

    // Signals above are already persisted; bound the costly part (live profile
    // views) so a high-candidate run can't rack up account-risking view counts.
    let enrichedLead: Partial<Lead>;
    if (preEnrichedGroundedIdentity) {
      enrichedLead = candidate.lead;
    } else {
      if (enrichments >= enrichmentLimit) continue;
      enrichments += 1;
      try {
        enrichedLead = await enrichLinkedInLead(input.account, candidate.lead);
      } catch (error) {
        // Provider blips on one profile must not fail the whole agent run.
        console.error(
          "[people-engine] enrich failed:",
          error instanceof Error ? error.message : error,
        );
        continue;
      }
    }
    enrichedLead = applyLinkedInActivity(
      enrichedLead,
      activity.evidence,
      activity.recentPosts,
    );

    // Grounded web search can verify role and employer context, but a model can
    // still return a plausible-looking LinkedIn slug. Require Unipile to resolve
    // that profile to a provider identity before the lead becomes contactable.
    if (hasGroundedEvidence && !enrichedLead.providerProfileId) {
      anonymousDropped += 1;
      continue;
    }

    // Wrong-slug grounded hits often resolve to a different person. Drop when
    // the live profile name does not overlap the claimed candidate name.
    if (
      hasGroundedEvidence &&
      candidate.lead.name &&
      enrichedLead.name &&
      !namesAlign(candidate.lead.name, enrichedLead.name)
    ) {
      anonymousDropped += 1;
      continue;
    }

    // After live enrichment, re-check the current role against the agent titles
    // so a wrong slug that still returned some profile cannot pass on the
    // model-claimed title alone.
    if (
      !stealOnly &&
      matchTitles.length &&
      enrichedLead.title &&
      !matchesTargetTitle(enrichedLead.title, matchTitles, roleVocabulary)
    ) {
      titleFiltered += 1;
      continue;
    }

    // Enrichment can resolve a profile to the anonymized "LinkedIn Member"
    // placeholder; drop it here so an uncontactable lead is never saved.
    if (isAnonymousLinkedInProfile(enrichedLead)) {
      anonymousDropped += 1;
      continue;
    }

    // Present location must match targets. Blank location is allowed only for
    // people-search hits (LinkedIn often omits city on otherwise valid profiles).
    if (failsLocationGate(enrichedLead.location, targetLocations, candidate.signals)) {
      outOfRegionCandidates += 1;
      continue;
    }

    const leadId = expectedLeadId(input.agent.workspaceId, enrichedLead);
    const knownLead = existingLeadIds.has(leadId);

    if (knownLead) {
      const existingLead = existingLeadsById.get(leadId);
      if (!existingLead) continue;
      await qualifyExistingLead(
        existingLead,
        { ...candidate, lead: enrichedLead },
        firstSignal,
        persistedSignals,
      );
      if (
        input.initialLeadTarget &&
        leadsAdded + existingQualifiedLeads >= input.initialLeadTarget
      ) {
        break;
      }
      continue;
    }

    if (leadsAdded >= dailyLeadLimit) break;

    let score: Awaited<ReturnType<typeof scoreLeadForProduct>>;
    try {
      score = await scoreLeadForProduct(
        {
          ...enrichedLead,
          // A LinkedIn keyword query returning this person is only a sourcing
          // hint. It is not their profile text and must never masquerade as
          // direct evidence when profile enrichment is unavailable.
          summary: enrichedLead.summary || directSignalEvidence(firstSignal),
          signalType: firstSignal.signalType,
          signalSource: firstSignal.signalSource,
          signalText: firstSignal.signalText,
          signalUrl: firstSignal.signalUrl,
          leadReason: firstSignal.leadReason,
          engagementContext: firstSignal.engagementContext,
        },
        input.profile,
        input.agent,
      );
    } catch (error) {
      console.error(
        "[people-engine] score failed for new candidate:",
        error instanceof Error ? error.message : error,
      );
      lowScoreCandidates += 1;
      continue;
    }

    if (score.fitScore < QUALIFIED_SCORE_THRESHOLD) {
      lowScoreCandidates += 1;
      continue;
    }

    enrichedLead = mergeLead(enrichedLead, {
      summary:
        score.summary || enrichedLead.summary || directSignalEvidence(firstSignal),
    });

    let lead: Lead;
    try {
      lead = await upsertLead(input.agent.workspaceId, input.agent.targetGroupId, {
        ...enrichedLead,
        fitScore: score.fitScore,
        scoreReasons: [...score.scoreReasons, firstSignal.leadReason],
        sourceAgentId: input.agent.id,
        signalType: firstSignal.signalType,
        signalSource: firstSignal.signalSource,
        signalText: firstSignal.signalText,
        signalUrl: firstSignal.signalUrl,
        signalObservedAt: firstSignal.signalObservedAt,
        leadReason: firstSignal.leadReason,
        engagementContext: firstSignal.engagementContext,
      });
    } catch (error) {
      // Nested undefined / invalid profileContext from enrichment used to throw
      // Firestore INVALID_ARGUMENT and mark the agent Error with 0 leads saved.
      console.error(
        "[people-engine] upsert lead failed:",
        error instanceof Error ? error.message : error,
      );
      lowScoreCandidates += 1;
      continue;
    }

    existingLeadIds.add(lead.id);
    existingLeadsById.set(lead.id, lead);
    await Promise.all(
      persistedSignals.map((signal) =>
        markLeadSignalPromoted(signal.id, {
          leadId: lead.id,
          fitScore: score.fitScore,
        }).catch((error) => {
          console.error(
            "[people-engine] mark signal promoted failed:",
            error instanceof Error ? error.message : error,
          );
        }),
      ),
    );
    leadsAdded += 1;
    if (
      input.initialLeadTarget &&
      leadsAdded + existingQualifiedLeads >= input.initialLeadTarget
    ) {
      break;
    }
  }

  // Persist the funnel counters: "the agent finds no leads" is only
  // diagnosable when each run says where its candidates died.
  await logAutomationRun({
    workspaceId: input.agent.workspaceId,
    kind: "people_engine",
    status: "completed",
    message:
      `Agent ${input.agent.id}: ${candidates.size} candidates -> ${leadsAdded} new leads ` +
      `(${existingQualifiedLeads} existing leads requalified, ${existingRejected} existing leads rejected, ` +
      `${lowScoreCandidates} new leads rejected, ` +
      `${outOfRegionCandidates} out of region, ${enrichments} profile views spent` +
      `, people search hits: ${peopleSearchHits}` +
      `, skipped post noise: ${skippedPostNoise}` +
      `, title filtered: ${titleFiltered}` +
      `, anonymous/unresolved: ${anonymousDropped}` +
      `, active in last 30 days: ${activeCandidates}` +
      `, inactive: ${inactiveCandidates}` +
      `, activity unverifiable: ${activityUnverifiable}` +
      `, activity post checks: ${activityChecks}` +
      `, activity check budget skipped: ${activityBudgetSkipped}` +
      `${timeBudgetExpired ? ", stopped at time budget" : ""}).`,
  }).catch((error) => {
    console.error("[people-engine] failed to log run summary:", error);
  });

  return {
    candidates: candidates.size,
    signalsObserved,
    leadsAdded,
    existingQualifiedLeads,
    existingRejected,
    lowScoreCandidates,
    outOfRegionCandidates,
    activeCandidates,
    inactiveCandidates,
    activityUnverifiable,
    activityChecks,
    activityBudgetSkipped,
    timeBudgetExpired,
  };
}
