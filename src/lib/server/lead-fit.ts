// Lead qualification questions for Typesafe's Jev model, and the code that
// turns its typed answers into a 0-100 fit score. Jev does the judgment; the
// arithmetic, caps, and reason text stay here where they are deterministic.

export type JevNoulAnswer = { type: "noul"; noul: number };
export type JevScoreAnswer = { type: "score"; score: number; confidence: number };
export type JevAnswers = Record<string, JevNoulAnswer | JevScoreAnswer | undefined>;

export type LeadFitBasis = "agent" | "product" | "steal";

// A failed yes/no check caps the lead below the 65 qualification threshold,
// however well the role matches. Matches the cap the old scorer applied.
const DISQUALIFIED_CAP = 40;

// Each judgment is its own question. Jev's score is a probability-weighted mean
// across levels, so mixing role and company on one scale let a lead split
// between "adjacent role" and "match" average out to "wrong company".
// Jev also reads literally, so every level spells out its condition.
const AGENT_FIT_LEVELS = [
  "Unrelated: the lead's role has nothing to do with the roles `agent_request` asks for.",
  "Adjacent: a related function, but not one of the roles `agent_request` asks for.",
  "Unclear: the profile is too vague to tell whether the lead's role is one `agent_request` asks for.",
  "Match: the lead's role is one `agent_request` asks for, or a close variant of it at a similar level.",
  "Exact match: the lead's title is one `agent_request` asks for, and the profile shows they do that job now.",
];

// Agents with no prompt or filters are judged against the product profile.
const PRODUCT_FIT_LEVELS = [
  "Not a buyer: the lead's role and company have nothing to do with what `sender_product` does.",
  "Unlikely: a related field, but not a role that buys or uses `sender_product`.",
  "Unclear: the role could buy or use `sender_product`, but the profile is too thin to tell.",
  "Likely buyer: the role is one that buys or uses `sender_product`.",
  "Strong buyer: the role buys or uses `sender_product`, and the company or industry is one it targets.",
];

const STEAL_FIT_LEVELS = [
  "Not a buyer: wrong field, spam, or an employee of the company whose post they engaged with.",
  "Unlikely buyer: the lead's role or company has little to do with what `sender_product` solves.",
  "Unclear: the role could fit, but nothing shows the lead needs what `sender_product` solves.",
  "Plausible buyer: the role matches who buys `sender_product`, and the engagement shows interest in the problem it solves.",
  "Strong buyer: the role matches who buys `sender_product`, and the engagement shows the lead is evaluating or asking for a product like it.",
];

const FIT_QUESTIONS: Record<LeadFitBasis, { instructions: string; criteria: string[] }> = {
  agent: {
    // Agent prompts mix who to find ("SDRs at fintech companies") with the pain
    // the product solves ("who struggle with manual prospecting"). A profile
    // never proves the pain, so Jev is told to judge the role alone here.
    instructions:
      "Is the lead's current role one of the roles `agent_request` asks for? Judge only the job title and function. Ignore company, industry, and location here. Parts of `agent_request` about what these people need, struggle with, or do day to day are not requirements.",
    criteria: AGENT_FIT_LEVELS,
  },
  product: {
    instructions:
      "Is `lead` someone who would buy or use `sender_product`? Judge the lead's role and company against who `sender_product` is for (its buyerTitles, targetBuyers, and industries).",
    criteria: PRODUCT_FIT_LEVELS,
  },
  steal: {
    instructions:
      "How likely is `lead` to buy `sender_product`? Judge from the lead's role and company, and from their comment or reaction in `lead.engagementContext` on a post about a similar product.",
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

export function buildLeadFitQuestions(input: { basis: LeadFitBasis; hasProduct: boolean }) {
  const questions: Record<string, unknown> = {
    fit: { type: "score", ...FIT_QUESTIONS[input.basis] },
  };

  if (input.basis === "agent") {
    questions.wrongCompany = {
      type: "noul",
      instructions:
        "Does `agent_request` ask for a specific kind of company or industry, and does the lead's company or industry clearly differ from it?",
      criteria: {
        true: "`agent_request` names a company type or industry, and the lead clearly works somewhere else.",
        false: "`agent_request` names no company type or industry, or the lead's company fits it, or the profile does not say.",
      },
    };
    // Location filters are enforced in code before scoring. This catches a
    // place named only in the prompt ("SDRs in Asia-Pacific").
    questions.wrongLocation = {
      type: "noul",
      instructions:
        "Does `agent_request` ask for people in specific places, and is `lead.location` clearly somewhere else?",
      criteria: {
        true: "`agent_request` names countries or regions, and the lead is based outside all of them.",
        false: "`agent_request` names no place, or the lead is based in one of them, or `lead.location` is missing.",
      },
    };
  }

  // Without a product profile there is nothing to compete with.
  if (input.hasProduct) {
    questions.competitor = {
      type: "noul",
      instructions:
        "Does the lead's own company offer the same kind of product or service as `sender_product`, making the lead a rival rather than a customer?",
      criteria: {
        true: "The lead's company sells what `sender_product` sells, either the same kind of product or an agency doing that same work for clients.",
        false: "The lead's company does something else, even if it also uses AI or software.",
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

  if (said(answers.competitor)) {
    return { fitScore: Math.min(fitScore, DISQUALIFIED_CAP), scoreReasons: [COMPETITOR_REASON] };
  }
  if (said(answers.wrongCompany)) {
    return { fitScore: Math.min(fitScore, DISQUALIFIED_CAP), scoreReasons: [WRONG_COMPANY_REASON] };
  }
  if (said(answers.wrongLocation)) {
    return { fitScore: Math.min(fitScore, DISQUALIFIED_CAP), scoreReasons: [WRONG_LOCATION_REASON] };
  }

  return { fitScore, scoreReasons: [FIT_REASONS[basis][Math.round(level)]] };
}
