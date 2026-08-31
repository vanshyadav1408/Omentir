import { describe, expect, test } from "bun:test";
import { aiNameFromReferrer, classifyVisit, googleClickSignals } from "./referral-channel";
import { mergeAttribution, parseStoredAttribution, rememberVisit } from "./referral-attribution";
import { revenueFromWhopPayment } from "./posthog-server";

describe("classifyVisit", () => {
  test("labels Grok DeepSeek Qwen and Kimi citation clicks as AI so they are not dumped into Referral", () => {
    expect(classifyVisit("https://omentir.com/pricing", "https://grok.com/chat")).toMatchObject({
      channel: "ai",
      referring_domain: "grok.com",
    });
    expect(classifyVisit("https://omentir.com/", "https://chat.deepseek.com/a/chat")).toMatchObject({
      channel: "ai",
      referring_domain: "chat.deepseek.com",
    });
    expect(classifyVisit("https://omentir.com/blogs/x", "https://chat.qwen.ai/")).toMatchObject({
      channel: "ai",
      referring_domain: "chat.qwen.ai",
    });
    expect(classifyVisit("https://omentir.com/", "https://kimi.ai/chat")).toMatchObject({
      channel: "ai",
      referring_domain: "kimi.ai",
    });
  });

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

  test("labels utm_medium=ai_search as AI even when the referrer was stripped to Direct", () => {
    expect(
      classifyVisit("https://omentir.com/blogs/x?utm_medium=ai_search&utm_source=chatgpt", ""),
    ).toMatchObject({ channel: "ai", utm_source: "chatgpt" });
  });

  test("treats the Google app referrer as Organic Search so Android hits are not dumped into Referral", () => {
    expect(
      classifyVisit("https://omentir.com/pricing", "android-app://com.google.android.googlequicksearchbox/"),
    ).toMatchObject({ channel: "organic_search", referring_domain: "google.com" });
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

describe("aiNameFromReferrer", () => {
  test("maps Grok DeepSeek Qwen and Kimi hosts to one label so dashboard filters group them", () => {
    expect(aiNameFromReferrer("https://grok.com/chat")).toBe("Grok");
    expect(aiNameFromReferrer("https://chat.deepseek.com/")).toBe("DeepSeek");
    expect(aiNameFromReferrer("https://www.qwen.ai/")).toBe("Qwen");
    expect(aiNameFromReferrer("https://chat.qwen.ai/c/1")).toBe("Qwen");
    expect(aiNameFromReferrer("https://kimi.com/")).toBe("Kimi");
    expect(aiNameFromReferrer("https://kimi.ai/chat")).toBe("Kimi");
    expect(aiNameFromReferrer("https://kimi.moonshot.cn/")).toBe("Kimi");
  });
});

describe("googleClickSignals", () => {
  test("does not invent an AI Overview label for a stripped google.com referrer", () => {
    expect(googleClickSignals("https://omentir.com/pricing", "https://www.google.com/")).toEqual({
      google_click: "true",
    });
  });

  test("keeps Gemini citation clicks out of the Google search flag so they stay on the AI channel", () => {
    expect(googleClickSignals("https://omentir.com/", "https://gemini.google.com/app")).toEqual({});
  });

  test("records a text fragment from a Google landing so AI Overview and snippet jumps can be counted later", () => {
    expect(
      googleClickSignals(
        "https://omentir.com/blogs/x#:~:text=Grok%20bot%20LinkedIn",
        "https://www.google.com/",
      ),
    ).toMatchObject({
      google_click: "true",
      google_text_fragment: "Grok bot LinkedIn",
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
