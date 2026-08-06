import type { ProductProfile } from "@/lib/server/types";

/**
 * Steal-customers agents do not collect an ICP in setup. Buyers are people who
 * comment under competitor posts; fit is judged against My Product.
 * This builds the stored prompt/keywords used for post relevance and scoring
 * from the workspace product profile only.
 */
export function targetingFromProductProfile(profile: ProductProfile | null) {
  const company = profile?.companyName?.trim() || "our product";
  const description = profile?.description?.trim() || "";
  const pain = profile?.painPointsText?.trim() || "";
  const useCases = (profile?.useCases || []).map((value) => value.trim()).filter(Boolean);
  const painPoints = (profile?.painPoints || []).map((value) => value.trim()).filter(Boolean);
  // Store richer product language on the agent so discovery can re-rank posts
  // without re-reading every profile field on each run.
  const keywords = buildStealProductTerms({
    profile,
    extraPhrases: [],
  });

  const promptParts = [
    description
      ? `Find people who would buy ${company}: ${description}`
      : `Find people who would buy ${company} based on public interest in similar products.`,
    pain ? `Problems it solves: ${pain}` : "",
    useCases.length ? `Use cases: ${useCases.join("; ")}` : "",
    (profile?.targetBuyers || []).length
      ? `Typical buyers: ${(profile?.targetBuyers || []).join("; ")}`
      : "",
  ].filter(Boolean);

  return {
    prompt: promptParts.join("\n").slice(0, 4000),
    // Empty titles/industries/locations on purpose: commenters are the ICP.
    // Keywords drive product-relevant post ranking only.
    filters: {
      titles: [] as string[],
      industries: [] as string[],
      locations: [] as string[],
      keywords,
    },
  };
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "their",
  "this",
  "to",
  "we",
  "with",
  "your",
  "you",
  "using",
  "use",
  "used",
  "help",
  "helps",
  "make",
  "makes",
  "get",
  "gets",
  "more",
  "most",
  "better",
  "best",
  "via",
  "than",
  "then",
  "also",
  "just",
  "like",
  "can",
  "will",
  "able",
  "over",
  "under",
  "about",
  "into",
  "when",
  "while",
  "without",
  "within",
  "every",
  "each",
  "all",
  "any",
  "own",
  "new",
  "first",
  "one",
  "two",
  "way",
  "ways",
]);

/**
 * Concrete product language for ranking competitor posts in Steal Customers.
 * Long marketing sentences rarely appear verbatim on LinkedIn; multi-word
 * features/pains and domain tokens do. Company name is omitted on purpose so
 * competitor posts are not scored against the seller's brand.
 */
export function buildStealProductTerms(input: {
  profile: ProductProfile | null;
  extraPhrases?: string[];
  agentPrompt?: string;
}) {
  const profile = input.profile;
  const phrases: string[] = [
    ...(profile?.keywords || []),
    ...(profile?.keyFeatures || []),
    ...(profile?.useCases || []),
    ...(profile?.painPoints || []),
    ...(profile?.targetBuyers || []),
    profile?.industry || "",
    profile?.painPointsText || "",
    profile?.description || "",
    input.agentPrompt || "",
    ...(input.extraPhrases || []),
  ];

  const company = profile?.companyName?.trim().toLowerCase() || "";
  const multiWord: string[] = [];
  const tokens: string[] = [];

  for (const raw of phrases) {
    const phrase = raw.replace(/\s+/g, " ").trim();
    if (!phrase) continue;
    const lower = phrase.toLowerCase();
    if (company && lower === company) continue;

    // Keep short multi-word product phrases as-is (e.g. "cold email", "fleet insurance").
    const words = lower.split(/[^a-z0-9+/]+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 4 && phrase.length <= 48) {
      const cleaned = words.filter((word) => !STOP_WORDS.has(word) && word.length >= 2);
      if (cleaned.length >= 2) multiWord.push(cleaned.join(" "));
    }

    for (const word of words) {
      if (STOP_WORDS.has(word)) continue;
      if (word.length < 4) continue;
      if (company && company.includes(word)) continue;
      tokens.push(word);
    }
  }

  // Multi-word phrases first: they are higher precision for post matching.
  return unique([...multiWord, ...tokens]).slice(0, 36);
}

function unique(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length >= 2)),
  ).slice(0, 36);
}

export function productProfileIsReadyForSteal(profile: ProductProfile | null) {
  return Boolean(
    profile?.description?.trim() ||
      profile?.painPointsText?.trim() ||
      profile?.companyName?.trim() ||
      (profile?.keywords || []).some((value) => value.trim()) ||
      (profile?.useCases || []).some((value) => value.trim()),
  );
}
