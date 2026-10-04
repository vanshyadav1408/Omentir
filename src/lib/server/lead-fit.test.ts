import { describe, expect, test } from "bun:test";
import { buildLeadFitQuestions, leadFitFromAnswers } from "./lead-fit";

// Discovery keeps a lead only when fitScore >= 65 (QUALIFIED_SCORE_THRESHOLD).
const QUALIFIES = 65;

const score = (value: number) => ({ type: "score" as const, score: value, confidence: 0.9 });
const noul = (value: number) => ({ type: "noul" as const, noul: value });
const choice = (value: string) => ({ type: "choice" as const, choice: value, confidence: 0.9 });

describe("leadFitFromAnswers", () => {
  test("a role match qualifies and an unclear role does not, so leads are contacted only when Jev leans toward a match", () => {
    expect(leadFitFromAnswers({ fit: score(3) }, "agent").fitScore).toBeGreaterThanOrEqual(QUALIFIES);
    expect(leadFitFromAnswers({ fit: score(2) }, "agent").fitScore).toBeLessThan(QUALIFIES);
  });

  test("maps Jev's 0-4 level onto the 0-100 scale the rest of the product stores and thresholds on", () => {
    expect(leadFitFromAnswers({ fit: score(0) }, "agent").fitScore).toBe(0);
    expect(leadFitFromAnswers({ fit: score(4) }, "agent").fitScore).toBe(100);
    // A probability-weighted answer between levels keeps its position.
    expect(leadFitFromAnswers({ fit: score(2.8) }, "agent").fitScore).toBe(70);
  });

  test("a competitor never qualifies, however well their role matches, because messaging them pitches our product to a rival", () => {
    for (const result of [
      leadFitFromAnswers({ fit: score(4), company: choice("rival") }, "agent"),
      leadFitFromAnswers({ fit: score(4), competitor: noul(0.9) }, "product"),
    ]) {
      expect(result.fitScore).toBeLessThan(QUALIFIES);
      expect(result.scoreReasons[0]).toContain("competes");
    }
  });

  test("the right role at the wrong kind of company never qualifies, so an agent asking for fintech SDRs does not get healthcare SDRs", () => {
    const result = leadFitFromAnswers({ fit: score(4), company: choice("wrong_kind") }, "agent");
    expect(result.fitScore).toBeLessThan(QUALIFIES);
    expect(result.scoreReasons[0]).toContain("company");
  });

  test("a lead outside the places the agent asked for never qualifies, even when the location was only written in the prompt", () => {
    const result = leadFitFromAnswers({ fit: score(4), wrongLocation: noul(0.8) }, "agent");
    expect(result.fitScore).toBeLessThan(QUALIFIES);
    expect(result.scoreReasons[0]).toContain("places");
  });

  test("low probabilities on the yes/no checks do not hold back a strong match", () => {
    const answers = { fit: score(4), company: choice("fits"), wrongLocation: noul(0.3) };
    expect(leadFitFromAnswers(answers, "agent").fitScore).toBe(100);
    expect(leadFitFromAnswers({ fit: score(4), competitor: noul(0.1) }, "product").fitScore).toBe(100);
  });

  test("reasons follow the basis, since steal-customers and empty agents are judged against the product, not an agent's request", () => {
    expect(leadFitFromAnswers({ fit: score(3) }, "steal").scoreReasons[0]).toContain("your buyers");
    expect(leadFitFromAnswers({ fit: score(3) }, "product").scoreReasons[0]).toContain("your product");
    expect(leadFitFromAnswers({ fit: score(3) }, "agent").scoreReasons[0]).toContain("this agent");
  });

  test("throws on a response without the fit score so the caller skips the lead instead of saving a made-up number", () => {
    expect(() => leadFitFromAnswers({}, "agent")).toThrow();
    expect(() => leadFitFromAnswers({ fit: noul(1) }, "agent")).toThrow();
  });
});

describe("buildLeadFitQuestions", () => {
  test("only offers a rival answer when there is a product profile to compete with", () => {
    const company = (hasProduct: boolean) =>
      (buildLeadFitQuestions({ basis: "agent", hasProduct, askLocation: false }).company as { criteria: object }).criteria;
    expect(company(true)).toHaveProperty("rival");
    expect(company(false)).not.toHaveProperty("rival");
    expect(buildLeadFitQuestions({ basis: "product", hasProduct: false, askLocation: false })).not.toHaveProperty("competitor");
  });

  test("only checks company against an agent's request, because product and steal leads have no request to break", () => {
    expect(buildLeadFitQuestions({ basis: "agent", hasProduct: true, askLocation: false })).toHaveProperty("company");
    expect(buildLeadFitQuestions({ basis: "product", hasProduct: true, askLocation: false })).not.toHaveProperty("company");
    expect(buildLeadFitQuestions({ basis: "steal", hasProduct: true, askLocation: false })).not.toHaveProperty("company");
  });

  test("asks about location only when told to, since location filters are already enforced in code and every question is billed", () => {
    expect(buildLeadFitQuestions({ basis: "agent", hasProduct: true, askLocation: true })).toHaveProperty("wrongLocation");
    expect(buildLeadFitQuestions({ basis: "agent", hasProduct: true, askLocation: false })).not.toHaveProperty("wrongLocation");
  });

  test("uses one score level per stored reason, so every answer maps to a reason", () => {
    for (const basis of ["agent", "product", "steal"] as const) {
      const fit = buildLeadFitQuestions({ basis, hasProduct: true, askLocation: false }).fit as { criteria: string[] };
      for (let level = 0; level < fit.criteria.length; level += 1) {
        expect(leadFitFromAnswers({ fit: score(level) }, basis).scoreReasons[0]).toBeTruthy();
      }
    }
  });
});
