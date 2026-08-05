import { describe, expect, test } from "bun:test";
import {
  buildEngagementContext,
  buildPeopleEngineSourceQueue,
  buildStealPostSearchQueries,
  commentBuyingIntentScore,
  discoverySignalPriority,
  engagementLeadReason,
  engagementSignalWeight,
  formatEngagementForDrafting,
  formatEngagementSignalText,
  isLocationScopedPeopleSignal,
  isNoiseEngagementComment,
  isRecentEnough,
  isStealWorthyComment,
  isUnscopedKeywordPostEngagement,
  selectStealPosts,
  shouldKeepStealComment,
  STEAL_MAX_COMMENT_AGE_MS,
  sortPostsByRelevance,
} from "../src/lib/competitor-engagement";

describe("competitor engagement: comment quality", () => {
  test("drops empty, emoji-only, and cheer comments", () => {
    expect(isNoiseEngagementComment("")).toBe(true);
    expect(isNoiseEngagementComment("🔥")).toBe(true);
    expect(isNoiseEngagementComment("👏👏")).toBe(true);
    expect(isNoiseEngagementComment("Congrats!")).toBe(true);
    expect(isNoiseEngagementComment("Love this")).toBe(true);
    expect(isNoiseEngagementComment("ok")).toBe(true);
  });

  test("keeps substantive buying-intent comments", () => {
    expect(
      isNoiseEngagementComment("How does pricing work for a 20 person sales team?"),
    ).toBe(false);
    expect(
      isNoiseEngagementComment("We are evaluating tools like this for outbound."),
    ).toBe(false);
    expect(isNoiseEngagementComment("Does this integrate with HubSpot?")).toBe(false);
  });
});

describe("competitor engagement: post + comment context", () => {
  test("stores both the comment and the post for outreach context", () => {
    const text = formatEngagementSignalText({
      kind: "comment",
      commentText: "Does this support multi-seat pricing?",
      postText: "We launched our AI SDR that books demos automatically.",
    });
    expect(text).toContain("Their comment: Does this support multi-seat pricing?");
    expect(text).toContain("On this post: We launched our AI SDR");
  });

  test("buildEngagementContext keeps structured post and comment fields", () => {
    const context = buildEngagementContext({
      kind: "comment",
      postText: "Product launch post about outbound automation",
      postUrl: "https://linkedin.com/feed/update/1",
      sourceLabel: "competitor gojiberry",
      commentText: "Looking for something like this for our team",
      commentUrl: "https://linkedin.com/feed/update/1?comment=2",
    });
    expect(context.kind).toBe("comment");
    expect(context.commentText).toContain("Looking for something like this");
    expect(context.postText).toContain("Product launch post");
    expect(context.postUrl).toContain("linkedin.com");
    expect(context.sourceLabel).toBe("competitor gojiberry");
  });

  test("lead reason names the competitor source", () => {
    expect(engagementLeadReason("competitor heyreach", "comment")).toBe(
      "Commented on competitor heyreach post",
    );
  });

  test("drafting context includes post and comment for the sequence", () => {
    const draft = formatEngagementForDrafting({
      kind: "comment",
      postText: "We help teams book more demos",
      postUrl: "https://example.com/post",
      sourceLabel: "competitor artisan",
      commentText: "What does onboarding look like?",
    });
    expect(draft).toContain("commented on a competitor artisan");
    expect(draft).toContain("What does onboarding look like?");
    expect(draft).toContain("We help teams book more demos");
    expect(draft).toContain("What the post was about:");
    expect(draft).toContain("What they commented:");
  });
});

describe("competitor engagement: discovery priority", () => {
  test("steal customers queue is competitor and founder only", () => {
    const stealQueue = buildPeopleEngineSourceQueue({
      competitorUrls: ["https://linkedin.com/company/competitor-y"],
      founderUrls: ["https://linkedin.com/in/y-founder"],
      titles: [],
      keywords: [],
      titleLimit: 0,
      keywordLimit: 0,
      sourceKey: (kind, value) => `${kind}:${value}`,
    });
    expect(stealQueue.map((item) => item.kind)).toEqual(["competitor", "founder"]);
    expect(stealQueue[0].value).toContain("competitor-y");
  });

  test("non-steal discovery queue has no competitor sources", () => {
    const queue = buildPeopleEngineSourceQueue({
      competitorUrls: [],
      founderUrls: [],
      titles: ["Head of Sales", "SDR Manager"],
      keywords: ["outbound tool"],
      titleLimit: 12,
      keywordLimit: 16,
      sourceKey: (kind, value) => `${kind}:${value}`,
    });
    expect(queue.map((item) => item.kind)).toEqual(["title", "title", "keyword"]);
    expect(queue.every((item) => item.kind !== "competitor")).toBe(true);
  });

  test("weights competitor commenters above cold reactions", () => {
    const commentWeight = engagementSignalWeight({
      signalType: "post_comment",
      signalSource: "competitor gojiberry",
    });
    expect(commentWeight).toBeGreaterThan(
      engagementSignalWeight({
        signalType: "post_reaction",
        signalSource: "competitor gojiberry",
      }),
    );
    // Generic keyword-post engagers get zero weight so they cannot steal budget.
    expect(
      engagementSignalWeight({
        signalType: "post_reaction",
        signalSource: 'LinkedIn keyword "hiring SDR"',
      }),
    ).toBe(0);
  });

  test("people search outranks keyword-post noise for enrichment priority", () => {
    expect(
      discoverySignalPriority({
        signalType: "profile_search",
        signalSource: 'LinkedIn title "SDR"',
      }),
    ).toBeGreaterThan(
      discoverySignalPriority({
        signalType: "post_reaction",
        signalSource: 'LinkedIn keyword "hiring SDR"',
      }),
    );
    expect(
      discoverySignalPriority({
        signalType: "keyword_search",
        signalSource: 'LinkedIn keyword "outbound sales"',
      }),
    ).toBeGreaterThan(
      discoverySignalPriority({
        signalType: "keyword_search",
        signalSource: 'LinkedIn keyword "outbound sales" authored post',
      }),
    );
  });

  test("classifies location-scoped people search vs unscoped post engagers", () => {
    expect(
      isLocationScopedPeopleSignal({
        signalType: "profile_search",
        signalSource: 'LinkedIn title "Founder"',
      }),
    ).toBe(true);
    expect(
      isLocationScopedPeopleSignal({
        signalType: "keyword_search",
        signalSource: 'LinkedIn keyword "cold outreach"',
      }),
    ).toBe(true);
    expect(
      isLocationScopedPeopleSignal({
        signalType: "keyword_search",
        signalSource: 'LinkedIn keyword "cold outreach" authored post',
      }),
    ).toBe(false);
    expect(
      isUnscopedKeywordPostEngagement([
        {
          signalType: "post_reaction",
          signalSource: 'LinkedIn keyword "hiring SDR"',
        },
      ]),
    ).toBe(true);
    expect(
      isUnscopedKeywordPostEngagement([
        {
          signalType: "post_comment",
          signalSource: "competitor gojiberry",
        },
      ]),
    ).toBe(false);
    expect(
      isUnscopedKeywordPostEngagement([
        {
          signalType: "profile_search",
          signalSource: 'LinkedIn title "SDR"',
        },
      ]),
    ).toBe(false);
  });

  test("ranks product-related competitor posts ahead of brand fluff", () => {
    const posts = [
      { text: "Proud of our team culture and offsite!" },
      { text: "Launching our AI outbound sales agent for B2B teams" },
      { text: "Happy Friday everyone" },
    ];
    const ranked = sortPostsByRelevance(
      posts,
      (post) => post.text,
      ["outbound", "sales", "AI"],
    );
    expect(ranked[0].text).toContain("AI outbound sales agent");
  });
});

describe("competitor engagement: steal recency and intent", () => {
  const now = Date.parse("2026-08-05T12:00:00.000Z");

  test("rejects comments older than one week", () => {
    const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(isRecentEnough(eightDaysAgo, STEAL_MAX_COMMENT_AGE_MS, now)).toBe(false);
    expect(isRecentEnough(threeDaysAgo, STEAL_MAX_COMMENT_AGE_MS, now)).toBe(true);
    expect(
      shouldKeepStealComment({
        commentText: "How does pricing work for a sales team?",
        commentCreatedAt: eightDaysAgo,
        now,
      }),
    ).toBe(false);
    expect(
      shouldKeepStealComment({
        commentText: "How does pricing work for a sales team?",
        commentCreatedAt: threeDaysAgo,
        now,
      }),
    ).toBe(true);
  });

  test("scores evaluation comments above cheers without vertical hardcoding", () => {
    expect(commentBuyingIntentScore("How much does coverage cost for a 20 person team?")).toBeGreaterThan(
      commentBuyingIntentScore("This looks interesting for our team."),
    );
    // Insurance-style evaluation language scores without sales-tool keywords.
    expect(commentBuyingIntentScore("Anyone comparing alternatives for commercial policies?")).toBeGreaterThan(0);
    // Manufacturing-style evaluation language.
    expect(commentBuyingIntentScore("What is the lead time and MOQ on this part?")).toBeGreaterThan(0);
    // Product keywords from the workspace boost domain-relevant comments.
    expect(
      commentBuyingIntentScore("We need better scheduling for client posts", [
        "scheduling",
        "social media",
      ]),
    ).toBeGreaterThan(
      commentBuyingIntentScore("We need better scheduling for client posts", []),
    );
    expect(isStealWorthyComment("Congrats!")).toBe(false);
    expect(isStealWorthyComment("Does this integrate with our existing stack?")).toBe(true);
  });

  test("selectStealPosts prefers recent product posts over old fluff for any category", () => {
    const posts = [
      {
        text: "Proud of our culture offsite",
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        text: "New CNC machine line for mid-size manufacturers",
        createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        text: "Old product launch from last month",
        createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    const selected = selectStealPosts(posts, {
      getText: (post) => post.text,
      getCreatedAt: (post) => post.createdAt,
      keywords: ["CNC", "manufacturers", "machine"],
      limit: 2,
      now,
    });
    expect(selected[0].text).toContain("CNC machine");
    expect(selected.every((post) => !post.text.includes("last month"))).toBe(true);
  });

  test("buildStealPostSearchQueries mixes competitor labels and product keywords", () => {
    const queries = buildStealPostSearchQueries({
      competitorLabels: ["acme-insurance"],
      productKeywords: ["commercial policy", "claims"],
      limit: 8,
    });
    expect(queries).toContain("acme-insurance");
    expect(queries.some((query) => query.includes("claims"))).toBe(true);
  });
});

describe("competitor engagement: end-to-end outcome contract", () => {
  test("a real commenter becomes a lead-shaped payload with outreach context", () => {
    // Simulates what people-engine stores after scanning a competitor post.
    const postText =
      "Introducing our LinkedIn outreach automation that finds buyers and books demos.";
    const commentText =
      "We're comparing options for LinkedIn outreach. Does this handle follow-ups?";
    const signalText = formatEngagementSignalText({
      kind: "comment",
      postText,
      commentText,
    });
    const engagementContext = buildEngagementContext({
      kind: "comment",
      postText,
      postUrl: "https://linkedin.com/posts/competitor-y-launch",
      sourceLabel: "competitor competitor-y",
      commentText,
      commentUrl: "https://linkedin.com/posts/competitor-y-launch#comment-9",
    });

    const leadPayload = {
      name: "Alex Buyer",
      title: "Head of Growth",
      company: "Acme SaaS",
      signalType: "post_comment" as const,
      signalSource: "competitor competitor-y",
      signalText,
      signalUrl: engagementContext.commentUrl || engagementContext.postUrl,
      leadReason: engagementLeadReason("competitor competitor-y", "comment"),
      engagementContext,
      fitScore: 78,
      outreachStatus: "new" as const,
    };

    // Discovery outcome: person who commented under a similar product post.
    expect(leadPayload.signalType).toBe("post_comment");
    expect(leadPayload.leadReason).toContain("competitor");
    expect(leadPayload.engagementContext.commentText).toContain("follow-ups");
    expect(leadPayload.engagementContext.postText).toContain("LinkedIn outreach");

    // Outreach outcome: existing sequence can read post+comment+profile context.
    const draftContext = formatEngagementForDrafting(
      leadPayload.engagementContext,
      leadPayload.signalText,
    );
    expect(draftContext).toContain("follow-ups");
    expect(draftContext).toContain("LinkedIn outreach automation");
    expect(leadPayload.outreachStatus).toBe("new");
    expect(leadPayload.fitScore).toBeGreaterThanOrEqual(65);
  });
});
