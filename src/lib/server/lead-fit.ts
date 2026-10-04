// Lead qualification questions for Typesafe's Jev model, and the code that
// turns its typed answers into a 0-100 fit score. Jev does the judgment; the
// arithmetic, caps, and reason text stay here where they are deterministic.

export type JevNoulAnswer = { type: "noul"; noul: number };
export type JevScoreAnswer = { type: "score"; score: number; confidence: number };
export type JevChoiceAnswer = { type: "choice"; choice: string; confidence: number };
export type JevAnswers = Record<string, JevNoulAnswer | JevScoreAnswer | JevChoiceAnswer | undefined>;

export type LeadFitBasis = "agent" | "product" | "steal";

// A failed yes/no check caps the lead below the 65 qualification threshold,
// however well the role matches. Matches the cap the old scorer applied.
const DISQUALIFIED_CAP = 40;

// Each judgment is its own question. Jev's score is a probability-weighted mean
// across levels, so mixing role and company on one scale let a lead split
// between "adjacent role" and "match" average out to "wrong company".
// Wording is kept short on purpose: every token of it is billed on every call.
const AGENT_FIT_LEVELS = [
  "Unrelated role",
  "Related function, but not a requested role",
  "Too vague to tell",
  "A requested role, or a close variant at a similar level",
  "Exactly a requested title, doing that job now",
];

// Agents with no prompt or filters are judged against the product profile.
// These keep full sentences: the short version lost real buyers whose fit is a
// situation rather than a title (job seekers for a resume tool).
const PRODUCT_FIT_LEVELS = [
  "Not a buyer: the lead's role and company have nothing to do with what `sender_product` does.",
  "Unlikely: a related field, but not a role that buys or uses `sender_product`.",
  "Unclear: the role could buy or use `sender_product`, but the profile is too thin to tell.",
  "Likely buyer: the role is one that buys or uses `sender_product`.",
  "Strong buyer: the role buys or uses `sender_product`, and the company or industry is one it targets.",
];

const STEAL_FIT_LEVELS = [
  "Not a buyer: spam, unrelated, or works at the post's company",
  "Role unrelated to what `sender_product` solves",
  "Role could fit, but no sign of need",
  "Buyer role, and the engagement shows interest in the problem",
  "Buyer role, and the engagement shows they want a product like it",
];

const FIT_QUESTIONS: Record<LeadFitBasis, { instructions: string; criteria: string[] }> = {
  agent: {
    // Agent prompts mix who to find ("SDRs at fintech companies") with the pain
    // the product solves ("who struggle with manual prospecting"). A profile
    // never proves the pain, so Jev is told to judge the role alone here.
    instructions:
      "Is the lead's current role one `agent_request` asks for? Judge title and function only; ignore company, location, and needs.",
    criteria: AGENT_FIT_LEVELS,
  },
  product: {
    instructions:
      "Is `lead` someone who would buy or use `sender_product`? Judge the lead's role and company against who `sender_product` is for (its buyerTitles, targetBuyers, and industries).",
    criteria: PRODUCT_FIT_LEVELS,
  },
  steal: {
    instructions:
      "Would `lead` buy `sender_product`? Judge their role and company, and their engagement in `lead.engagementContext`.",
    criteria: STEAL_FIT_LEVELS,
  },
};

// Stored as lead.scoreReasons: shown in CSV exports and the API, and fed to
// message drafting as fit notes. One per level above.
const FIT_REASONS: Record<LeadFitBasis, string[]> = {
  agent: [
    "Role is unrelated to what this agent was set up to find.",
    "Related role, but not one this agent was set up to find.",
    "Not clear the role matches what this agent was set up to find.",
    "Role matches what this agent was set up to find.",
    "Title and current work match exactly what this agent was set up to find.",
  ],
  product: [
    "Role and company have nothing to do with your product.",
    "Related field, but not a role that buys or uses your product.",
    "Role could fit your product, but the profile is too thin to tell.",
    "Role is one that buys or uses your product.",
    "Role buys or uses your product, at a company you target.",
  ],
  steal: [
    "Not a likely buyer of your product.",
    "Role has little to do with what your product solves.",
    "Role could fit, but nothing shows they need your product.",
    "Role matches your buyers and their engagement shows interest in the problem.",
    "Role matches your buyers and their engagement shows they are shopping for a product like yours.",
  ],
};

const COMPETITOR_REASON = "Works on a product or service that competes with yours.";
const WRONG_COMPANY_REASON = "Right role, but the company or industry does not fit this agent.";
const WRONG_LOCATION_REASON = "Based outside the places this agent was set up to target.";

export function buildLeadFitQuestions(input: {
  basis: LeadFitBasis;
  hasProduct: boolean;
  // Location filters are enforced in code before scoring, so Jev only checks
  // location for an agent whose places live in its prompt alone.
  askLocation: boolean;
}) {
  const questions: Record<string, unknown> = {
    fit: { type: "score", ...FIT_QUESTIONS[input.basis] },
  };

  if (input.basis === "agent") {
    // Fits, wrong kind of company, and rival seller are mutually exclusive, so
    // one choice covers what used to be two yes/no questions for fewer tokens.
    questions.company = {
      type: "choice",
      instructions: "Which describes the lead's company?",
      criteria: {
        fits: "Fits `agent_request`, or is not stated",
        wrong_kind: "Clearly a different industry or company type than `agent_request` names",
        ...(input.hasProduct
          ? { rival: "Sells what `sender_product` sells, as a product or as a service for clients" }
          : {}),
      },
    };
    if (input.askLocation) {
      questions.wrongLocation = {
        type: "noul",
        instructions: "Does `agent_request` name places that `lead.location` is clearly outside of?",
        criteria: { true: "Names places, and the lead is outside all of them", false: "Names none, the lead is inside, or unknown" },
      };
    }
  } else if (input.hasProduct) {
    // Without a product profile there is nothing to compete with.
    questions.competitor = {
      type: "noul",
      instructions:
        "Does the lead's own company sell the same kind of product or service as `sender_product`, including an agency doing that work for clients?",
      criteria: {
        true: "The lead's company sells what `sender_product` sells, as a product or as a service for clients",
        false: "The lead's company does something else, even if the lead does this work in-house",
      },
    };
  }

  return questions;
}

function said(answer: JevAnswers[string]) {
  return answer?.type === "noul" && answer.noul > 0.5;
}

export function leadFitFromAnswers(answers: JevAnswers, basis: LeadFitBasis) {
  const fit = answers.fit;
  if (fit?.type !== "score" || !Number.isFinite(fit.score)) {
    throw new Error("Jev response is missing the fit score.");
  }

  const topLevel = AGENT_FIT_LEVELS.length - 1;
  const level = Math.min(topLevel, Math.max(0, fit.score));
  const fitScore = Math.round((level / topLevel) * 100);

  const company = answers.company?.type === "choice" ? answers.company.choice : "";
  if (said(answers.competitor) || company === "rival") {
    return { fitScore: Math.min(fitScore, DISQUALIFIED_CAP), scoreReasons: [COMPETITOR_REASON] };
  }
  if (company === "wrong_kind") {
    return { fitScore: Math.min(fitScore, DISQUALIFIED_CAP), scoreReasons: [WRONG_COMPANY_REASON] };
  }
  if (said(answers.wrongLocation)) {
    return { fitScore: Math.min(fitScore, DISQUALIFIED_CAP), scoreReasons: [WRONG_LOCATION_REASON] };
  }

  return { fitScore, scoreReasons: [FIT_REASONS[basis][Math.round(level)]] };
}
