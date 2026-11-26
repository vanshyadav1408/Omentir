import { expect, test } from "bun:test";
import { normalizeOwnerRequest } from "./reply-automation-policy";

// The owner gets an email whenever this returns text. A model that answers
// "None" for "they asked for nothing" must not turn into an email saying a
// lead asked for "None".
test("the classifier's ways of saying nothing was asked for all mean no request", () => {
  for (const value of ["", "  ", "none", "None.", "N/A", "n/a", "nothing", "null", "no", "-", undefined, null, 0, {}]) {
    expect(normalizeOwnerRequest(value)).toBe("");
  }
});

test("a real request is kept as one tidy line that fits an email subject", () => {
  expect(normalizeOwnerRequest("  A demo video. ")).toBe("A demo video");
  expect(normalizeOwnerRequest("The pricing PDF,\n sent to their email")).toBe(
    "The pricing PDF, sent to their email",
  );
  expect(normalizeOwnerRequest("No-code integration guide")).toBe("No-code integration guide");
  expect(normalizeOwnerRequest("x".repeat(400))).toHaveLength(120);
});
