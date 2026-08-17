/**
 * Pure helpers for competitor-post commenter discovery.
 * Keeps post + comment context for leads and ranks warm engagers above cold search.
 *
 * Steal-customers agents only keep fresh, substantive comments under product-relevant
 * competitor posts. Stale engagement is low intent and wastes outreach quota.
 */

export type EngagementKind = "comment" | "reaction";

export type EngagementContext = {
  postText: string;
  postUrl: string;
  commentText?: string;
  commentUrl?: string;
  sourceLabel: string;
  kind: EngagementKind;
};

// Keep enough of the post body that outreach knows what the thread was about.
const POST_TEXT_MAX = 900;
const COMMENT_TEXT_MAX = 500;

/** Comments older than this are skipped for steal-customers agents (1 week max). */
export const STEAL_MAX_COMMENT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Competitor posts older than this are not scanned for steal agents. */
export const STEAL_MAX_POST_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function truncateForSignal(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Drop empty / emoji-only / single-word cheer comments that never convert. */
export function isNoiseEngagementComment(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return true;
  if (trimmed.length < 3) return true;

  // Strip emoji, punctuation, and whitespace; if nothing remains, it is noise.
  const withoutEmoji = trimmed
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\p{Emoji_Component}/gu, "")
    .replace(/[\p{P}\p{S}\s]/gu, "");
  if (!withoutEmoji) return true;

  // Common low-intent one-liners on product launch posts.
  if (
    /^(congrats|congratulations|great|awesome|amazing|love this|well done|nice|🔥+|👏+|💯+)[!?.]*$/i.test(
      trimmed,
    )
  ) {
    return true;
  }

  return false;
}

export function parseSignalTimestamp(value?: string | null) {
  if (!value?.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** True when the timestamp is known and within maxAgeMs of now (not in the future). */
export function isRecentEnough(
  value: string | undefined,
  maxAgeMs: number,
  now = Date.now(),
) {
  const parsed = parseSignalTimestamp(value);
  if (parsed === null) return false;
  const age = now - parsed;
  return age >= 0 && age <= maxAgeMs;
}

/**
 * Universal evaluation language that appears across industries (software, hardware,
 * insurance, agencies, manufacturing, etc.). Never hardcode a vertical (no SDR/CRM
 * tool names, no "outbound", etc.). Domain fit comes from productKeywords instead.
 */
const UNIVERSAL_EVALUATION_PATTERN =
  /\b(?:price|pricing|cost|how much|quote|quotes|budget|fee|fees|rate|rates|premium|premiums|plan|plans|package|packages|tier|tiers|license|licen[cs]e|subscription|demo|trial|sample|pilot|poc|proof of concept|alternative|alternatives|vs\.?|versus|looking for|searching for|need(?:ing)?|evaluat\w*|consider(?:ing)?|research(?:ing)?|switch(?:ing)?|migrat\w*|replac\w*|instead of|compare|comparison|recommend(?:ation)?|integrat\w*|compatible|compatibility|support(?:s|ed)?|work(?:s)? with|does (?:this|it)|how (?:does|do|can)|anyone (?:use|using|tried|recommend)|has anyone|where (?:can|do) i|is (?:this|it) (?:good|worth)|worth (?:it|the)|onboard(?:ing)?|implement(?:ation|ing)?|setup|set up|availability|available|coverage|warranty|lead time|moq|minimum order|wholesale|bulk|spec(?:s|ification)?s?|certif\w*|compliance|regulatory)\b/i;

function normalizeProductTerms(productKeywords: string[] = []) {
  return productKeywords
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length >= 3);
}

/**
 * Higher = more likely an evaluation / buying-intent commenter for *this* product.
 * Ranking uses:
 * 1) universal cross-industry evaluation language (questions, cost, alternatives),
 * 2) optional product/problem terms from the workspace agent + product profile,
 * 3) substance (length), never a fixed vertical list.
 */
export function commentBuyingIntentScore(
  text: string,
  productKeywords: string[] = [],
) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return 0;
  const lower = trimmed.toLowerCase();
  let score = 0;

  if (trimmed.includes("?")) score += 3;
  if (UNIVERSAL_EVALUATION_PATTERN.test(lower)) score += 4;

  const terms = normalizeProductTerms(productKeywords);
  let productHits = 0;
  for (const term of terms) {
    if (lower.includes(term)) productHits += 1;
  }
  // Cap so a keyword-heavy profile cannot dominate pure noise length.
  score += Math.min(productHits, 4) * 2;

  if (trimmed.length >= 40) score += 1;
  if (trimmed.length >= 100) score += 1;
  return score;
}

/** Steal agents keep substantive or intent-bearing comments only. */
export function isStealWorthyComment(
  text: string,
  productKeywords: string[] = [],
) {
  if (isNoiseEngagementComment(text)) return false;
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length < 12) return false;
  const intent = commentBuyingIntentScore(trimmed, productKeywords);
  // Prefer evaluation language or product-term hits. Long cheerleading on a
  // competitor launch is not a buyer signal just because it is wordy.
  if (intent >= 3) return true;
  if (intent > 0 && trimmed.length >= 20) return true;
  // Fallback: long, specific comments without keywords still sometimes convert.
  return trimmed.length >= 50 && trimmed.includes("?");
}

/**
 * Keep a steal comment only when the words are useful and the engagement is fresh.
 * Prefer the comment's own timestamp; if missing, fall back to a very recent post.
 * productKeywords should come from the agent's filters + product profile (any industry).
 */
export function shouldKeepStealComment(input: {
  commentText: string;
  commentCreatedAt?: string;
  postCreatedAt?: string;
  productKeywords?: string[];
  now?: number;
}) {
  if (!isStealWorthyComment(input.commentText, input.productKeywords || [])) {
    return false;
  }
  const now = input.now ?? Date.now();
  if (input.commentCreatedAt) {
    return isRecentEnough(input.commentCreatedAt, STEAL_MAX_COMMENT_AGE_MS, now);
  }
  // No comment date: only keep if the post itself is still inside the comment window.
  if (input.postCreatedAt) {
    return isRecentEnough(input.postCreatedAt, STEAL_MAX_COMMENT_AGE_MS, now);
  }
  // Unipile often omits timestamps. The post picker already limited the thread,
  // so dropping every undated comment emptied Steal Customers.
  return true;
}

/**
 * Score how closely a public post matches what the seller offers.
 * Higher = commenters on this thread are more likely to care about the product.
 *
 * Design:
 * - Multi-word product phrases beat single tokens (less brand fluff noise).
 * - Hiring / culture / celebration posts are heavily penalized even on competitor pages.
 * - Product/problem discussion language gets a small bonus independent of keywords.
 */
export function scoreStealPostRelevance(text: string, keywords: string[] = []) {
  const body = text.replace(/\s+/g, " ").trim();
  if (!body) return 0;
  const lower = body.toLowerCase();

  let score = 0;
  const terms = keywords
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length >= 3);

  // Prefer longer phrases first so "cold email" is not double-counted only as "email".
  const ordered = [...terms].sort((a, b) => b.length - a.length);
  const matched = new Set<string>();
  for (const term of ordered) {
    if (!lower.includes(term)) continue;
    // Skip tokens already covered by a longer matched phrase.
    let covered = false;
    for (const prior of matched) {
      if (prior.includes(term)) {
        covered = true;
        break;
      }
    }
    if (covered) continue;
    matched.add(term);
    const wordCount = term.split(/\s+/).filter(Boolean).length;
    score += wordCount >= 2 ? 4 : 2;
  }

  // Discussion of problems/solutions is where buyers hang out.
  if (
    /\b(?:launch(?:ing|ed)?|introducing|built|building|how (?:we|to)|playbook|workflow|automat\w*|alternative|vs\.?|versus|migrat\w*|switch(?:ing)?|replac\w*|pricing|demo|trial|customer|pipeline|outbound|inbound|prospect|lead gen|book(?:ing)? demo)\b/i.test(
      lower,
    )
  ) {
    score += 2;
  }
  if (lower.includes("?")) score += 1;

  // Competitor company pages are full of recruiting and culture noise. Those
  // threads attract job-seekers and employees, not buyers of similar products.
  if (
    /\b(?:we(?:'re| are) hiring|hiring|join (?:our|the) team|open role|job open|careers?|culture|offsite|team dinner|happy friday|congratulations to|congrats to|welcome to the team|employee spotlight|proud of our team)\b/i.test(
      lower,
    )
  ) {
    score -= 6;
  }

  return score;
}

/** Minimum score for a post to be scanned in Steal Customers (product-close threads only). */
export const STEAL_POST_MIN_RELEVANCE = 2;

/**
 * For steal agents: keep recent posts that actually discuss something close to
 * the seller's product, then rank by product fit. Weak brand/hiring fluff is
 * dropped when better posts exist so commenters are more likely to be buyers.
 *
 * If the provider omits dates, fall back to relevance-only ranking.
 * If nothing clears the bar, keep the single best-scoring recent post so the
 * run is not empty on quiet company pages.
 */
export function selectStealPosts<T>(
  posts: T[],
  input: {
    getText: (post: T) => string;
    getCreatedAt: (post: T) => string | undefined;
    keywords: string[];
    limit: number;
    now?: number;
    /** Override the product-fit floor (default STEAL_POST_MIN_RELEVANCE). */
    minScore?: number;
  },
) {
  const now = input.now ?? Date.now();
  const minScore = input.minScore ?? STEAL_POST_MIN_RELEVANCE;
  const datedRecent = posts.filter((post) =>
    isRecentEnough(input.getCreatedAt(post), STEAL_MAX_POST_AGE_MS, now),
  );
  const pool = datedRecent.length ? datedRecent : posts;
  if (!pool.length) return [];

  const ranked = [...pool].sort(
    (left, right) =>
      scoreStealPostRelevance(input.getText(right), input.keywords) -
      scoreStealPostRelevance(input.getText(left), input.keywords),
  );

  const strong = ranked.filter(
    (post) => scoreStealPostRelevance(input.getText(post), input.keywords) >= minScore,
  );
  if (strong.length) return strong.slice(0, input.limit);

  // No clear product match: take at most one least-bad recent post (score > 0)
  // rather than flooding discovery with culture threads.
  const weakPositive = ranked.filter(
    (post) => scoreStealPostRelevance(input.getText(post), input.keywords) > 0,
  );
  if (weakPositive.length) return weakPositive.slice(0, 1);

  // Completely empty keyword set or unreadable posts: keep newest one only.
  return ranked.slice(0, 1);
}

/** Short search queries used to find product-relevant competitor discussion posts. */
export function buildStealPostSearchQueries(input: {
  competitorLabels: string[];
  productKeywords: string[];
  limit?: number;
}) {
  const labels = input.competitorLabels
    .map((value) => value.trim())
    .filter((value) => value.length >= 2);
  const keywords = input.productKeywords
    .map((value) => value.trim())
    .filter((value) => value.length >= 3);
  const queries: string[] = [];
  for (const label of labels.slice(0, 4)) {
    queries.push(label);
    for (const keyword of keywords.slice(0, 3)) {
      queries.push(`${label} ${keyword}`);
    }
  }
  for (const keyword of keywords.slice(0, 4)) {
    queries.push(keyword);
  }
  return Array.from(new Set(queries)).slice(0, input.limit ?? 12);
}

export function formatEngagementSignalText(input: {
  kind: EngagementKind;
  postText: string;
  commentText?: string;
  reactionType?: string;
}) {
  const post = truncateForSignal(input.postText || "", POST_TEXT_MAX);
  if (input.kind === "comment") {
    const comment = truncateForSignal(input.commentText || "", COMMENT_TEXT_MAX);
    if (comment && post) {
      return `Their comment: ${comment}\n\nOn this post: ${post}`;
    }
    return comment || post || "";
  }

  const reaction = (input.reactionType || "reaction").trim() || "reaction";
  if (post) return `Reacted (${reaction}) to this post: ${post}`;
  return `Reacted (${reaction})`;
}

export function buildEngagementContext(input: {
  kind: EngagementKind;
  postText: string;
  postUrl: string;
  sourceLabel: string;
  commentText?: string;
  commentUrl?: string;
}): EngagementContext {
  return {
    kind: input.kind,
    postText: truncateForSignal(input.postText || "", POST_TEXT_MAX),
    postUrl: input.postUrl || "",
    sourceLabel: input.sourceLabel,
    ...(input.kind === "comment" && input.commentText
      ? {
          commentText: truncateForSignal(input.commentText, COMMENT_TEXT_MAX),
          commentUrl: input.commentUrl || "",
        }
      : {}),
  };
}

export function engagementLeadReason(sourceLabel: string, kind: EngagementKind) {
  return kind === "comment"
    ? `Commented on ${sourceLabel} post`
    : `Reacted to ${sourceLabel} post`;
}

/**
 * Prefer posts that mention product/problem language, but never drop the rest.
 * Warm commenters on any competitor post still beat cold title search.
 * Steal Customers uses selectStealPosts (harder product-fit floor) instead.
 */
export function sortPostsByRelevance<T>(
  posts: T[],
  getText: (post: T) => string,
  keywords: string[],
): T[] {
  if (!keywords.length || posts.length <= 1) return posts;

  return [...posts].sort(
    (left, right) =>
      scoreStealPostRelevance(getText(right), keywords) -
      scoreStealPostRelevance(getText(left), keywords),
  );
}

export type PeopleEngineSourceKind = "competitor" | "founder" | "keyword" | "title";

export type PeopleEngineSourceItem = {
  kind: PeopleEngineSourceKind;
  value: string;
  key: string;
};

/**
 * Competitor and founder post engagers first: they already look at similar products.
 * Cold title/keyword search fills remaining budget.
 */
export function buildPeopleEngineSourceQueue(input: {
  competitorUrls: string[];
  founderUrls: string[];
  titles: string[];
  keywords: string[];
  titleLimit: number;
  keywordLimit: number;
  sourceKey: (kind: PeopleEngineSourceKind, value: string) => string;
}): PeopleEngineSourceItem[] {
  const unique = (values: string[]) =>
    Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

  return [
    ...unique(input.competitorUrls).map((value) => ({
      kind: "competitor" as const,
      value,
      key: input.sourceKey("competitor", value),
    })),
    ...unique(input.founderUrls).map((value) => ({
      kind: "founder" as const,
      value,
      key: input.sourceKey("founder", value),
    })),
    ...input.titles.slice(0, input.titleLimit).map((value) => ({
      kind: "title" as const,
      value,
      key: input.sourceKey("title", value),
    })),
    ...input.keywords.slice(0, input.keywordLimit).map((value) => ({
      kind: "keyword" as const,
      value,
      key: input.sourceKey("keyword", value),
    })),
  ];
}

/** Higher weight for competitor commenters so enrichment budget is not spent on cold search first. */
export function engagementSignalWeight(input: {
  signalType: string;
  signalSource: string;
}) {
  const fromCompetitor =
    input.signalSource.startsWith("competitor ") ||
    input.signalSource.startsWith("founder ") ||
    input.signalSource.startsWith("employee/founder ");

  if (input.signalType === "post_comment") {
    // Generic keyword-post comments are not harvested for discovery agents.
    // Only competitor/founder threads keep warm-comment weight.
    return fromCompetitor ? 18 : 0;
  }
  if (input.signalType === "post_reaction") {
    return fromCompetitor ? 5 : 0;
  }
  return 0;
}

/** True when the signal came from classic people search (title or keyword), not posts. */
export function isLocationScopedPeopleSignal(signal: {
  signalType: string;
  signalSource: string;
}) {
  if (signal.signalType === "profile_search") return true;
  if (signal.signalType !== "keyword_search") return false;
  if (signal.signalSource === "Grounded exact-agent web search") return false;
  if (signal.signalSource.endsWith("authored post")) return false;
  return true;
}

/**
 * Keyword-post reactors/commenters (not competitor/founder pages) are global noise.
 * They burn enrichment budget and almost never pass geo gates.
 */
export function isUnscopedKeywordPostEngagement(signals: Array<{
  signalType: string;
  signalSource: string;
}>) {
  if (!signals.length) return false;
  const fromCompetitorOrFounder = (source: string) =>
    source.startsWith("competitor ") ||
    source.startsWith("founder ") ||
    source.startsWith("employee/founder ") ||
    source.startsWith("connected account ");

  return signals.every((signal) => {
    if (fromCompetitorOrFounder(signal.signalSource)) return false;
    return (
      signal.signalType === "post_reaction" ||
      signal.signalType === "post_comment" ||
      signal.signalSource.endsWith("authored post")
    );
  });
}

/**
 * Ranking weight for discovery signals. People search must outrank keyword-post
 * noise so geo-targeted agents spend profile views on location-scoped results.
 */
export function discoverySignalPriority(signal: {
  signalType: string;
  signalSource: string;
}) {
  if (signal.signalSource.startsWith("LinkedIn companies with ")) return 50;
  if (signal.signalSource === "Grounded exact-agent web search") return 25;
  if (signal.signalType === "profile_search") return 20;
  if (isLocationScopedPeopleSignal(signal)) return 18;
  if (signal.signalSource.endsWith("authored post")) return 2;
  const engagement = engagementSignalWeight(signal);
  if (engagement) return engagement;
  return 0;
}

export function formatEngagementForDrafting(context: EngagementContext | undefined, signalText?: string) {
  if (context?.kind === "comment" && context.commentText) {
    const parts = [
      `Warm engagement: they commented on a ${context.sourceLabel} LinkedIn post.`,
      context.postText ? `What the post was about: ${context.postText}` : "",
      context.postUrl ? `Post URL: ${context.postUrl}` : "",
      `What they commented: ${context.commentText}`,
      context.commentUrl ? `Comment URL: ${context.commentUrl}` : "",
    ];
    return parts.filter(Boolean).join("\n");
  }
  if (context?.kind === "reaction") {
    return [
      `Warm engagement: they reacted to a ${context.sourceLabel} LinkedIn post.`,
      context.postText ? `What the post was about: ${context.postText}` : "",
      context.postUrl ? `Post URL: ${context.postUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (signalText?.trim()) {
    return `Buying signal: ${signalText.trim()}`;
  }
  return "";
}
