import { describe, expect, test } from "bun:test";
import { matchAiUserAgent } from "./ai-page-fetch";

describe("matchAiUserAgent", () => {
  test("labels ChatGPT assistant fetches separately from the training crawler", () => {
    expect(
      matchAiUserAgent("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot"),
    ).toEqual({ name: "ChatGPT", kind: "assistant" });
    expect(
      matchAiUserAgent("Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)"),
    ).toEqual({ name: "ChatGPT", kind: "crawler" });
    expect(
      matchAiUserAgent("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)"),
    ).toEqual({ name: "ChatGPT", kind: "search" });
  });

  test("labels Claude assistant fetches separately from ClaudeBot", () => {
    expect(matchAiUserAgent("Mozilla/5.0; Claude-User")).toEqual({ name: "Claude", kind: "assistant" });
    expect(matchAiUserAgent("ClaudeBot/1.0")).toEqual({ name: "Claude", kind: "crawler" });
    expect(matchAiUserAgent("Claude-SearchBot")).toEqual({ name: "Claude", kind: "search" });
  });

  test("does not treat Googlebot or Chrome as an AI fetch", () => {
    expect(matchAiUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBeNull();
    expect(
      matchAiUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      ),
    ).toBeNull();
  });
});
