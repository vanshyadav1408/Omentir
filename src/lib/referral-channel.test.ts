import { describe, expect, test } from "bun:test";
import { classifyVisit } from "./referral-channel";
import { mergeAttribution, parseStoredAttribution, rememberVisit } from "./referral-attribution";
import { revenueFromWhopPayment } from "./posthog-server";

describe("classifyVisit", () => {
  test("labels ChatGPT citation clicks as AI so they are not dumped into Referral", () => {
    expect(
      classifyVisit("https://omentir.com/pricing", "https://chatgpt.com/c/abc"),
    ).toMatchObject({ channel: "ai", referring_domain: "chatgpt.com", channel_name: "AI" });
    expect(
      classifyVisit("https://omentir.com/blogs/x", "https://www.perplexity.ai/search?q=omentir"),
    ).toMatchObject({ channel: "ai", referring_domain: "perplexity.ai" });
    expect(
      classifyVisit("https://omentir.com/", "https://gemini.google.com/app"),
    ).toMatchObject({ channel: "ai", referring_domain: "gemini.google.com" });
  });

  test("keeps Google search separate from Gemini so SEO and AI conversion are not mixed", () => {
    expect(
      classifyVisit("https://omentir.com/", "https://www.google.com/search?q=omentir"),
    ).toMatchObject({ channel: "organic_search", referring_domain: "google.com" });
    expect(
      classifyVisit("https://omentir.com/", "https://www.bing.com/search?q=omentir"),
    ).toMatchObject({ channel: "organic_search", referring_domain: "bing.com" });
  });

  test("treats empty and first-party referrers as Direct so internal clicks do not look like acquisition", () => {
    expect(classifyVisit("https://omentir.com/pricing", "")).toMatchObject({
      channel: "direct",
      referring_domain: "(direct)",
    });
    expect(classifyVisit("https://omentir.com/pricing", "https://omentir.com/blogs")).toMatchObject({
      channel: "direct",
      referring_domain: "(direct)",
    });
  });

  test("lets paid and email UTMs win over the referrer because ads are an explicit buy", () => {
    expect(
      classifyVisit("https://omentir.com/?utm_medium=cpc&utm_source=google", "https://www.google.com/"),
    ).toMatchObject({ channel: "paid", utm_source: "google" });
    expect(
      classifyVisit("https://omentir.com/?utm_medium=email&utm_campaign=welcome", "https://mail.google.com/"),
    ).toMatchObject({ channel: "email", utm_campaign: "welcome" });
  });

  test("labels LinkedIn and X as Social", () => {
    expect(
      classifyVisit("https://omentir.com/", "https://www.linkedin.com/feed/"),
    ).toMatchObject({ channel: "social", referring_domain: "linkedin.com" });
    expect(classifyVisit("https://omentir.com/", "https://t.co/abc")).toMatchObject({
      channel: "social",
      referring_domain: "t.co",
    });
  });
});

describe("mergeAttribution", () => {
  test("keeps the first visit and overwrites Direct with a later real source for last-click revenue", () => {
    const first = rememberVisit("https://omentir.com/", "");
    expect(first.initial_channel).toBe("direct");
    const later = mergeAttribution(
      first,
      classifyVisit("https://omentir.com/pricing", "https://chatgpt.com/"),
    );
    expect(later.initial_channel).toBe("direct");
    expect(later.channel).toBe("ai");
    expect(later.referring_domain).toBe("chatgpt.com");
    const bounce = mergeAttribution(later, classifyVisit("https://omentir.com/checkout", ""));
    expect(bounce.channel).toBe("ai");
  });

  test("rejects a cookie that is not attribution JSON so a forged cookie cannot invent a channel", () => {
    expect(parseStoredAttribution("not-json")).toBeNull();
    expect(parseStoredAttribution(encodeURIComponent(JSON.stringify({ channel: "bot" })))).toBeNull();
  });
});

describe("revenueFromWhopPayment", () => {
  test("converts Whop cent amounts so revenue by channel is dollars not 4900", () => {
    expect(revenueFromWhopPayment({ amount: 4900 }, "solo")).toBe(49);
    expect(revenueFromWhopPayment({}, "solo")).toBe(49);
    expect(revenueFromWhopPayment({ amount: 0 }, "lifetime")).toBeUndefined();
  });
});
