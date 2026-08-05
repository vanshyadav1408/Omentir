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
  searchLinkedInPosts,
  searchLinkedInProfiles,
  searchLinkedInProfilesAtCompanies,
} from "./unipile";
import type {
  Agent,
  Lead,
  LeadSignal,
  LeadSignalType,
  LinkedInAccount,
  ProductProfile,
} from "./types";

// 65 matches scoreLeadForProduct's "clear functional buyer" band so people
// whose job needs the product are not discarded for imperfect title wording.
const QUALIFIED_SCORE_THRESHOLD = 65;
const DEFAULT_DAILY_QUALIFIED_LEAD_CAP = 75;
// Each enrichment is a live LinkedIn profile view through the user's account,
// drawn from the same 75/day account-wide budget that outreach (first-degree
// checks) and inbox loads use. Capping the engine below the full budget keeps
// those flows from starving; unenriched candidates are still scored on their
// search data, so this cap bounds enrichment quality, not lead discovery.
const DEFAULT_MAX_ENRICHMENTS_PER_RUN = 50;
const PEOPLE_ENGINE_RUN_MS = 15 * 60 * 1000;
const STOP_BUFFER_MS = 15 * 1000;
const SOURCE_POST_LIMIT = 5;
const POST_ENGAGER_LIMIT = 25;
const KEYWORD_PROFILE_LIMIT = 40;
const KEYWORD_POST_LIMIT = 4;
const TITLE_PROFILE_LIMIT = 25;
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
  leadReason: string;
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

export function agentHasSignalSources(agent: Agent) {
  const sources = agent.signalSources;
  return Boolean(
    agent.mode === "signals" ||
      sources?.competitorUrls.length ||
      sources?.founderUrls.length ||
      sources?.keywords.length,
  );
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
  const roleContextQueries = criteria.keywords.slice(0, 4).flatMap((keyword) =>
    criteria.titles.slice(0, 4).map((title) => `${keyword} ${title}`),
  );

  // Prefer short, high-recall queries. Do NOT only search "Title + Industry"
  // AND-pairs - LinkedIn classic search is too strict and returns almost nobody.
  // Title searches are queued separately as kind "title"; keywords here are
  // problem/intent/context phrases that surface people whose jobs need the product.
  return unique([
    ...(agent.signalSources?.keywords || []),
    ...agent.filters.keywords,
    // Named technology or required context plus a target role produces fewer
    // anonymous and adjacent profiles than either term alone, while the short
    // standalone queries below preserve recall.
    ...roleContextQueries,
    ...criteria.keywords,
    ...criteria.postKeywords,
    // The work itself, in the words the people who do it use. Titles find the
    // ones who named their role conventionally; this finds the rest.
    ...criteria.roleVocabulary.slice(0, 8),
    // A few title+industry pairs as optional high-precision queries only.
    ...criteria.titles.slice(0, 4).flatMap((title) =>
      criteria.industries.slice(0, 2).map((industry) => `${title} ${industry}`),
    ),
  ]).slice(0, 20);
}

function getSearchTitles(agent: Agent, profile: ProductProfile | null, criteria: SearchCriteria) {
  // Balanced before the slice, not after: only the first 6-12 titles are ever
  // searched, so an exec-heavy head of the list means every run comes back with
  // nothing but founders and VPs even when the tail held the practitioners.
  return balanceTitleSeniority(
    unique([...criteria.titles, ...expandedTargetTitles(agent, profile), ...agent.filters.titles]),
  ).slice(0, 15);
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
      label:
        url.hostname === "linkedin.com" || url.hostname.endsWith(".linkedin.com")
          ? value
          : url.toString(),
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
}) {
  const [comments, reactions] = await Promise.all([
    listLinkedInPostComments({
      accountId: input.account.accountId,
      postId: input.postId,
      limit: POST_ENGAGER_LIMIT,
    }),
    listLinkedInPostReactions({
      accountId: input.account.accountId,
      postId: input.postId,
      limit: POST_ENGAGER_LIMIT,
    }),
  ]);

  for (const comment of comments) {
    const lead = normalizeLinkedInActor(comment.profile);
    if (!lead) continue;

    addObservedSignal(input.candidates, {
      lead,
      signalType: "post_comment",
      signalSource: input.sourceLabel,
      signalText: comment.text || input.postText,
      signalUrl: comment.url || input.postUrl,
      signalObservedAt: comment.createdAt || input.observedAt,
      leadReason: `Commented on ${input.sourceLabel} post`,
    });
  }

  for (const reaction of reactions) {
    const lead = normalizeLinkedInActor(reaction.profile);
    if (!lead) continue;

    addObservedSignal(input.candidates, {
      lead,
      signalType: "post_reaction",
      signalSource: input.sourceLabel,
      signalText: reaction.type || input.postText,
      signalUrl: reaction.url || input.postUrl,
      signalObservedAt: reaction.createdAt || input.observedAt,
      leadReason: `Reacted to ${input.sourceLabel} post`,
    });
  }
}

async function collectFromLinkedInSource(input: {
  agent: Agent;
  account: LinkedInAccount;
  candidates: Map<string, Candidate>;
  sourceUrl: string;
  sourceKind: "competitor" | "founder";
}) {
  const parsed = parseLinkedInSource(input.sourceUrl);
  if (!parsed) {
    await logSourceError(input.agent, input.sourceUrl, new Error("Invalid LinkedIn source URL."));
    return;
  }

  const sourceLabel =
    input.sourceKind === "competitor"
      ? `competitor ${parsed.label}`
      : `founder ${parsed.label}`;

  try {
    const posts = await listLinkedInPostsForProfile({
      accountId: input.account.accountId,
      identifier: parsed.identifier,
      isCompany: parsed.isCompany,
      limit: SOURCE_POST_LIMIT,
    });

    for (const post of posts) {
      const postId = getLinkedInPostId(post);
      if (!postId) continue;

      await collectPostEngagers({
        agent: input.agent,
        account: input.account,
        candidates: input.candidates,
        postId,
        postText: getLinkedInPostText(post),
        postUrl: getLinkedInPostUrl(post) || input.sourceUrl,
        sourceLabel,
        observedAt: getLinkedInPostCreatedAt(post),
      });
    }
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
  includePosts?: boolean;
}) {
  const sourceLabel = `LinkedIn keyword "${input.keyword}"`;

  try {
    const profiles = await searchLinkedInProfiles({
      accountId: input.account.accountId,
      criteria: {
        titles: [],
        industries: [],
        // Scope the search itself to the agent's target locations; without
        // this LinkedIn returns results biased to the account's own network.
        locations: input.targetLocations,
        keywords: [input.keyword],
      },
      limit: KEYWORD_PROFILE_LIMIT,
      agent: input.agent,
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
    }
  } catch (error) {
    await logSourceError(input.agent, sourceLabel, error);
  }

  if (input.includePosts === false) return;

  try {
    const posts = await searchLinkedInPosts({
      accountId: input.account.accountId,
      keywords: input.keyword,
      limit: KEYWORD_POST_LIMIT,
    });

    for (const post of posts) {
      const postId = getLinkedInPostId(post);
      if (!postId) continue;

      const author = normalizeLinkedInActor(post.author || post.user);
      const postText = getLinkedInPostText(post);
      const postUrl = getLinkedInPostUrl(post);
      if (author && !author.linkedInUrl?.includes("/company/")) {
        addObservedSignal(input.candidates, {
          lead: author,
          signalType: "keyword_search",
          signalSource: `${sourceLabel} authored post`,
          signalText: postText,
          signalUrl: postUrl,
          signalObservedAt: getLinkedInPostCreatedAt(post),
          leadReason: `Authored a post matching ${sourceLabel}`,
        });
      }

      await collectPostEngagers({
        agent: input.agent,
        account: input.account,
        candidates: input.candidates,
        postId,
        postText,
        postUrl,
        sourceLabel,
        observedAt: getLinkedInPostCreatedAt(post),
      });
    }
  } catch (error) {
    await logSourceError(input.agent, `${sourceLabel} posts`, error);
  }
}

async function collectFromTitle(input: {
  agent: Agent;
  account: LinkedInAccount;
  candidates: Map<string, Candidate>;
  title: string;
  targetLocations: string[];
  excludeKeys?: Set<string>;
}) {
  const sourceLabel = `LinkedIn title "${input.title}"`;

  try {
    // Search the job title as its own people query so discovery is not
    // dependent on signal keywords alone. This is the primary path for
    // "find jobs that need the user's product".
    const profiles = await searchLinkedInProfiles({
      accountId: input.account.accountId,
      criteria: {
        titles: [input.title],
        industries: [],
        locations: input.targetLocations,
        keywords: [],
      },
      limit: TITLE_PROFILE_LIMIT,
      agent: input.agent,
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
    }
  } catch (error) {
    await logSourceError(input.agent, sourceLabel, error);
  }
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
  const typeStrength: Record<LeadSignalType, number> = {
    keyword_search: 4,
    profile_search: 3,
    post_comment: 2,
    post_reaction: 1,
  };
  return candidate.signals.reduce<ObservedSignal | undefined>(
    (best, signal) => {
      const strength = (value: ObservedSignal) =>
        value.signalSource === "Grounded exact-agent web search"
          ? 10
          : typeStrength[value.signalType];
      return !best || strength(signal) > strength(best) ? signal : best;
    },
    undefined,
  );
}

function directSignalEvidence(signal: ObservedSignal) {
  if (signal.signalSource === "Grounded exact-agent web search") return signal.signalText;
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
) {
  const signalWeight = candidate.signals.reduce((total, signal) => {
    if (signal.signalSource.startsWith("LinkedIn companies with ")) return total + 50;
    if (signal.signalSource === "Grounded exact-agent web search") return total + 25;
    if (signal.signalType === "keyword_search") return total + 10;
    if (signal.signalType === "profile_search") return total + 3;
    if (signal.signalType === "post_comment") return total + 2;
    return total;
  }, 0);
  const titleWeight = matchesTargetTitle(candidate.lead.title || "", targetTitles, roleVocabulary)
    ? 5
    : 0;
  // A location we can already see in-region outranks an unknown one: post
  // engagers from global posts mostly enrich into out-of-region rejects, and
  // every such enrichment wastes a profile view from the daily budget.
  const locationWeight =
    candidate.lead.location && matchesTargetLocation(candidate.lead.location, targetLocations)
      ? 4
      : 0;
  const corroboratingSearches = candidate.signals.filter(
    (signal) => signal.signalType === "keyword_search" || signal.signalType === "profile_search",
  ).length;
  return signalWeight + titleWeight + locationWeight + Math.max(0, corroboratingSearches - 1) * 2;
}

function sourceKey(kind: PeopleEngineSource["kind"], value: string) {
  return `${kind}:${cleanId(value)}`;
}

function rotateSources(sources: PeopleEngineSource[], cursorKey?: string) {
  const startIndex = cursorKey ? sources.findIndex((source) => source.key === cursorKey) : -1;
  if (startIndex <= 0) return sources;
  return [...sources.slice(startIndex), ...sources.slice(0, startIndex)];
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
  const enrichmentLimit = Math.min(dailyLeadLimit, DEFAULT_MAX_ENRICHMENTS_PER_RUN);
  const targetLocations = agentTargetLocations(input.agent, input.profile);
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
  const matchTitles = unique([
    ...searchTitles,
    ...expandedTargetTitles(input.agent, input.profile),
  ]);
  // The domain's own title words, so a lead whose title shares no wording with
  // the target list ("Dispatcher" against "Logistics Coordinator") is still
  // recognized as someone who performs the work.
  const roleVocabulary = criteria.roleVocabulary;
  // Title searches first so "jobs that need the product" are always attempted
  // even when signal keywords are sparse or competitor URLs are empty.
  const titleLimit = input.initialLeadTarget ? 6 : 12;
  const keywordLimit = input.initialLeadTarget ? 6 : 16;
  const sourceQueue: PeopleEngineSource[] = [
    ...searchTitles.slice(0, titleLimit).map((value) => ({
      kind: "title" as const,
      value,
      key: sourceKey("title", value),
    })),
    ...unique(sources.competitorUrls).map((value) => ({
      kind: "competitor" as const,
      value,
      key: sourceKey("competitor", value),
    })),
    ...unique(sources.founderUrls).map((value) => ({
      kind: "founder" as const,
      value,
      key: sourceKey("founder", value),
    })),
    ...sourceKeywords.slice(0, keywordLimit).map((value) => ({
      kind: "keyword" as const,
      value,
      key: sourceKey("keyword", value),
    })),
  ];
  const orderedSources = rotateSources(sourceQueue, input.agent.peopleEngineCursor?.sourceKey);

  // When company size is binding, source inside companies that LinkedIn has
  // already filtered to that exact headcount band. These candidates are added
  // first so the limited profile-view budget is spent on the strongest pool.
  if (companySize && hasRunTime(deadline)) {
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

  for (let index = 0; index < orderedSources.length; index += 1) {
    if (!hasRunTime(deadline)) break;
    const source = orderedSources[index];
    const nextSource = orderedSources[(index + 1) % orderedSources.length];

    if (nextSource) {
      await updateAgentPeopleEngineCursor(input.agent.id, nextSource.key).catch((error) => {
        console.error("[people-engine] failed to update source cursor:", error);
      });
    }

    if (source.kind === "title") {
      await collectFromTitle({
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
      await collectFromKeyword({
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
    });
  }

  // Provider people results can be plentiful but noisy. Grounded search is an
  // independent exact-match source, so broad LinkedIn results must not suppress
  // it. Its evidence is still checked by the same deterministic and model gates.
  if (hasRunTime(deadline)) {
    const groundedCandidates = await findGroundedAgentCandidates(input.agent);
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
  let enrichments = 0;
  let timeBudgetExpired = false;

  const qualifyExistingLead = async (
    existingLead: Lead,
    candidate: Candidate,
    firstSignal: ObservedSignal,
    persistedSignals: LeadSignal[],
  ) => {
    const mergedLead = mergeLead(existingLead, candidate.lead);
    if (
      targetLocations.length &&
      (!mergedLead.location?.trim() ||
        !matchesTargetLocation(mergedLead.location, targetLocations))
    ) {
      outOfRegionCandidates += 1;
      return false;
    }
    const score = await scoreLeadForProduct(
      {
        ...mergedLead,
        signalType: firstSignal.signalType,
        signalSource: firstSignal.signalSource,
        signalText: firstSignal.signalText,
        signalUrl: firstSignal.signalUrl,
        leadReason: firstSignal.leadReason,
      },
      input.profile,
      input.agent,
    );

    if (score.fitScore < QUALIFIED_SCORE_THRESHOLD) {
      existingRejected += 1;
      return false;
    }

    const lead = await upsertLead(input.agent.workspaceId, input.agent.targetGroupId, {
      linkedInUrl: existingLead.linkedInUrl || candidate.lead.linkedInUrl,
      providerProfileId: existingLead.providerProfileId || candidate.lead.providerProfileId,
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

  const rankedCandidates = Array.from(candidates.values())
    .filter(
      (candidate) =>
        // Missing title: keep and let enrichment + scoring decide.
        // Present title: accept any expanded buyer-function match, not only
        // the narrow titles the user typed on day one.
        !candidate.lead.title ||
        !matchTitles.length ||
        matchesTargetTitle(candidate.lead.title, matchTitles, roleVocabulary),
    )
    .sort(
      (left, right) =>
        candidatePriority(right, matchTitles, targetLocations, roleVocabulary) -
        candidatePriority(left, matchTitles, targetLocations, roleVocabulary),
    );

  for (const candidate of rankedCandidates) {
    if (!hasRunTime(deadline)) {
      timeBudgetExpired = true;
      break;
    }

    const persistedSignals = await persistCandidateSignals(input.agent, candidate);
    signalsObserved += persistedSignals.length;

    const firstSignal = primarySignal(candidate);
    if (!firstSignal) continue;

    // Apply location before both new-lead and existing-lead paths. Otherwise a
    // known lead could be adopted into a new group without passing the same
    // deterministic location requirement as a newly discovered person.
    if (!matchesTargetLocation(candidate.lead.location, targetLocations)) {
      outOfRegionCandidates += 1;
      continue;
    }

    const existingLeadId = expectedLeadId(input.agent.workspaceId, candidate.lead);
    if (existingLeadIds.has(existingLeadId)) {
      const existingLead = existingLeadsById.get(existingLeadId);
      if (!existingLead) continue;
      await qualifyExistingLead(existingLead, candidate, firstSignal, persistedSignals);
      if (
        input.initialLeadTarget &&
        leadsAdded + existingQualifiedLeads >= input.initialLeadTarget
      ) {
        break;
      }
      continue;
    }

    const hasGroundedEvidence = candidate.signals.some(
      (signal) => signal.signalSource === "Grounded exact-agent web search",
    );
    // Signals above are already persisted; bound the costly part (live profile
    // views) so a high-candidate run can't rack up account-risking view counts.
    if (enrichments >= enrichmentLimit) continue;
    enrichments += 1;
    let enrichedLead = await enrichLinkedInLead(input.account, candidate.lead);

    // Grounded web search can verify role and employer context, but a model can
    // still return a plausible-looking LinkedIn slug. Require Unipile to resolve
    // that profile to a provider identity before the lead becomes contactable.
    if (hasGroundedEvidence && !enrichedLead.providerProfileId) continue;

    // Enrichment can resolve a profile to the anonymized "LinkedIn Member"
    // placeholder; drop it here so an uncontactable lead is never saved.
    if (isAnonymousLinkedInProfile(enrichedLead)) continue;

    // Search results often omit location; enrichment fills the real profile
    // location. Drop now if that location is outside the agent's targets so
    // wrong-region leads never get scored or saved.
    if (
      targetLocations.length &&
      (!enrichedLead.location?.trim() ||
        !matchesTargetLocation(enrichedLead.location, targetLocations))
    ) {
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

    const score = await scoreLeadForProduct(
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
      },
      input.profile,
      input.agent,
    );

    if (score.fitScore < QUALIFIED_SCORE_THRESHOLD) {
      lowScoreCandidates += 1;
      continue;
    }

    enrichedLead = mergeLead(enrichedLead, {
      summary:
        score.summary || enrichedLead.summary || directSignalEvidence(firstSignal),
    });

    const lead = await upsertLead(input.agent.workspaceId, input.agent.targetGroupId, {
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
    });

    existingLeadIds.add(lead.id);
    existingLeadsById.set(lead.id, lead);
    await Promise.all(
      persistedSignals.map((signal) =>
        markLeadSignalPromoted(signal.id, {
          leadId: lead.id,
          fitScore: score.fitScore,
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
    timeBudgetExpired,
  };
}
