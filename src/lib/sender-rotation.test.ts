import { expect, test } from "bun:test";
import { assignSenders, campaignSenderIds, enrollmentSenderId, rotatesSenders } from "./sender-rotation";

// Rotation exists to spread volume so no one LinkedIn account carries it all.
test("new leads split evenly across senders", () => {
  const assigned = assignSenders(6, ["a", "b", "c"]);
  expect(assigned.filter((id) => id === "a")).toHaveLength(2);
  expect(assigned.filter((id) => id === "b")).toHaveLength(2);
  expect(assigned.filter((id) => id === "c")).toHaveLength(2);
});

test("a sender added to a running campaign gets the next leads until it catches up", () => {
  expect(assignSenders(3, ["a", "b"], { a: 10, b: 8 })).toEqual(["b", "b", "a"]);
});

test("no senders means nobody is assigned", () => {
  expect(assignSenders(3, [])).toEqual([]);
});

// A lead's sequence must stay on one account: a follow-up from a different
// person than the one who sent the invite reads as spam and breaks the thread.
test("an enrollment keeps its own sender; old enrollments keep the campaign's", () => {
  const campaign = { linkedInAccountId: "a", senderAccountIds: ["a", "b"] };
  expect(enrollmentSenderId(campaign, { linkedInAccountId: "b" })).toBe("b");
  expect(enrollmentSenderId(campaign, {})).toBe("a");
});

test("a campaign without a sender list sends from its one account", () => {
  expect(campaignSenderIds({ linkedInAccountId: "a" })).toEqual(["a"]);
  expect(rotatesSenders({ linkedInAccountId: "a" })).toBe(false);
  expect(rotatesSenders({ linkedInAccountId: "a", senderAccountIds: ["a", "b", "a"] })).toBe(true);
  expect(campaignSenderIds({ senderAccountIds: ["a", "b", "a"] })).toEqual(["a", "b"]);
});
