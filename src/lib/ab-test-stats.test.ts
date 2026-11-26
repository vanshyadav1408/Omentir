import { expect, test } from "bun:test";
import { buildAbResults } from "./ab-test-stats";

// The comparison decides which message a user keeps, so it must count only
// leads who were actually sent a tested version, per side, in this campaign.
test("counts replies per side among leads who received a tested message", () => {
  const results = buildAbResults(
    [
      { campaignId: "c1", leadId: "l1", abVariant: "A" },
      { campaignId: "c1", leadId: "l2", abVariant: "A" },
      { campaignId: "c1", leadId: "l3", abVariant: "B" },
      // Not sent a tested step yet: left out of both sides.
      { campaignId: "c1", leadId: "l4" },
      // Another campaign's test.
      { campaignId: "c2", leadId: "l5", abVariant: "B" },
    ],
    "c1",
    new Set(["l1", "l4", "l5"]),
  );
  expect(results).toEqual({
    A: { sent: 2, replied: 1, replyRate: 50 },
    B: { sent: 1, replied: 0, replyRate: 0 },
  });
});

test("an empty side has no rate rather than 0%", () => {
  expect(buildAbResults([], "c1", new Set()).B).toEqual({ sent: 0, replied: 0, replyRate: null });
});
