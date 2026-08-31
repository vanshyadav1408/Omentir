import { describe, expect, test } from "bun:test";
import { gscAiOverviewEvent, parseGscAiOverviewCsv } from "./gsc-ai-overview";

describe("parseGscAiOverviewCsv", () => {
  test("maps Search Console generative AI exports so PostHog can store citation impressions Google never sends to the site", () => {
    const rows = parseGscAiOverviewCsv(
      [
        "Date,Landing page,Search appearance,Impressions,Clicks,CTR,Average position",
        "2026-08-20,https://omentir.com/pricing,AI Overviews,41,3,7.32%,8.1",
        "2026-08-21,https://omentir.com/blogs/grok-bot-linkedin-sales,AI Mode,12,0,0%,4",
      ].join("\n"),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      date: "2026-08-20",
      page: "https://omentir.com/pricing",
      appearance: "AI Overviews",
      impressions: 41,
      clicks: 3,
      ctr: 7.32,
      position: 8.1,
    });
    expect(rows[1]?.appearance).toBe("AI Mode");
    expect(gscAiOverviewEvent(rows[0]!).properties.gsc_impressions).toBe(41);
  });

  test("rejects a CSV that is not a Search Console performance export", () => {
    expect(() => parseGscAiOverviewCsv("Name,Value\nfoo,1")).toThrow(/Impressions and Clicks/);
  });
});
