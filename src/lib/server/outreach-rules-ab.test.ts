import { expect, test } from "bun:test";
import { abVariantFor, writtenSequenceMessage } from "./outreach-rules";

const lead = { name: "Jane Doe", company: "Acme", title: "CTO" };
const step = { id: "m1", messageTemplate: "Hi {{firstName}}, A", variantTemplate: "Hey {{firstName}}, B" };

// A lead must get the same side on every call (send, preview, pre-draft),
// or the Actions page would show one version and LinkedIn would get the other.
test("a lead's side is stable and leads split across both sides", () => {
  expect(abVariantFor("c1-lead1")).toBe(abVariantFor("c1-lead1"));
  const sides = Array.from({ length: 400 }, (_, i) => abVariantFor(`c1-lead${i}`));
  const bShare = sides.filter((side) => side === "B").length / sides.length;
  expect(bShare).toBeGreaterThan(0.4);
  expect(bShare).toBeLessThan(0.6);
});

test("side B sends version B, side A and untested steps send the template", () => {
  expect(writtenSequenceMessage(step, lead, undefined, "B")?.text).toBe("Hey Jane, B");
  expect(writtenSequenceMessage(step, lead, undefined, "A")?.text).toBe("Hi Jane, A");
  expect(writtenSequenceMessage({ id: "m2", messageTemplate: "Hi {{firstName}}" }, lead, undefined, "B")?.text).toBe("Hi Jane");
});

test("a message the user edited for this lead wins over either version", () => {
  expect(writtenSequenceMessage(step, lead, { m1: "Custom" }, "B")).toEqual({ text: "Custom", edited: true });
});
