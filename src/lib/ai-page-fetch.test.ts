import { describe, expect, test } from "bun:test";
import { matchAiFetch, matchAiUserAgent } from "./ai-page-fetch";

describe("matchAiUserAgent", () => {
  test("labels ChatGPT assistant fetches separately from the training crawler", () => {
    expect(
      matchAiUserAgent("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot"),
    ).toMatchObject({ name: "ChatGPT", kind: "assistant" });
    expect(
      matchAiUserAgent("Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)"),
    ).toMatchObject({ name: "ChatGPT", kind: "crawler" });
    expect(
      matchAiUserAgent("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)"),
    ).toMatchObject({ name: "ChatGPT", kind: "search" });
  });

  test("labels Claude assistant fetches separately from ClaudeBot", () => {
    expect(matchAiUserAgent("Mozilla/5.0; Claude-User")).toMatchObject({ name: "Claude", kind: "assistant" });
    expect(matchAiUserAgent("ClaudeBot/1.0")).toMatchObject({ name: "Claude", kind: "crawler" });
    expect(matchAiUserAgent("Claude-SearchBot")).toMatchObject({ name: "Claude", kind: "search" });
  });

  test("labels Claude Code even when the UA also contains Claude-User", () => {
    expect(
      matchAiUserAgent("Claude-User (claude-code/2.1.83; +https://support.anthropic.com/)"),
    ).toMatchObject({ name: "Claude Code", kind: "assistant" });
    expect(matchAiUserAgent("Claude-Code/1.0")).toMatchObject({ name: "Claude Code", kind: "assistant" });
    expect(matchAiUserAgent("ClaudeCode/1.0 (Anthropic)")).toMatchObject({ name: "Claude Code", kind: "assistant" });
  });

  test("labels coding agents that identify themselves", () => {
    expect(matchAiUserAgent("Cursor/2.4.28")).toMatchObject({ name: "Cursor", kind: "assistant" });
    expect(matchAiUserAgent("Mozilla/5.0 (compatible; Devin/1.0; +https://devin.ai)")).toMatchObject({
      name: "Devin",
      kind: "assistant",
    });
    expect(matchAiUserAgent("OpenClaw/1.0 (+https://openclaw.ai)")).toMatchObject({ name: "OpenClaw", kind: "assistant" });
    expect(matchAiUserAgent("Clawdbot/1.0")).toMatchObject({ name: "OpenClaw", kind: "assistant" });
    expect(matchAiUserAgent("Hermes-Agent/1.0 (+https://nousresearch.com)")).toMatchObject({
      name: "Hermes",
      kind: "assistant",
    });
    expect(matchAiUserAgent("opencode/1.2.5")).toMatchObject({ name: "OpenCode", kind: "assistant" });
    expect(matchAiUserAgent("Codex/260203.1501")).toMatchObject({ name: "Codex", kind: "assistant" });
  });

  test("labels Googlebot because it feeds AI Overviews, and still ignores other search crawlers", () => {
    expect(
      matchAiUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"),
    ).toMatchObject({ name: "Googlebot", kind: "search", match: "ua" });
    expect(matchAiUserAgent("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBeNull();
    expect(matchAiUserAgent("Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)")).toBeNull();
    expect(matchAiUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15")).toBeNull();
    expect(matchAiUserAgent("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBeNull();
    expect(matchAiUserAgent("Mozilla/5.0 (compatible; Applebot/0.3; +http://www.apple.com/go/applebot)")).toBeNull();
    expect(
      matchAiUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      ),
    ).toBeNull();
  });

  test("labels Grok and Sarvam when they identify themselves", () => {
    expect(matchAiUserAgent("GrokBot/1.0 (+https://x.ai)")).toMatchObject({ name: "Grok", kind: "crawler" });
    expect(matchAiUserAgent("Grok-User/1.0 (+https://x.ai)")).toMatchObject({ name: "Grok", kind: "assistant" });
    expect(matchAiUserAgent("Grok-DeepSearch/1.0")).toMatchObject({ name: "Grok", kind: "search" });
    expect(matchAiUserAgent("xAI-Grok/1.0 (+https://grok.com)")).toMatchObject({ name: "Grok", kind: "crawler" });
    expect(matchAiUserAgent("SarvamBot/1.0 (+https://www.sarvam.ai)")).toMatchObject({ name: "Sarvam", kind: "crawler" });
    expect(matchAiUserAgent("Sarvam-User/1.0")).toMatchObject({ name: "Sarvam", kind: "assistant" });
  });

  test("labels Chinese consumer AIs instead of dumping them as generic bots", () => {
    expect(matchAiUserAgent("Mozilla/5.0 (compatible; DeepSeekBot/1.0)")).toMatchObject({ name: "DeepSeek", kind: "crawler" });
    expect(matchAiUserAgent("DeepSeek-User/1.0")).toMatchObject({ name: "DeepSeek", kind: "assistant" });
    expect(matchAiUserAgent("TongyiBot/1.0 (+https://tongyi.aliyun.com)")).toMatchObject({ name: "Qwen", kind: "assistant" });
    expect(matchAiUserAgent("Qwen-User/1.0")).toMatchObject({ name: "Qwen", kind: "assistant" });
    expect(matchAiUserAgent("Kimi-User/1.0 (+https://kimi.moonshot.cn)")).toMatchObject({ name: "Kimi", kind: "assistant" });
    expect(matchAiUserAgent("Mozilla/5.0 (compatible; Bytespider; +https://zhanzhang.toutiao.com)")).toMatchObject({
      name: "Doubao",
      kind: "crawler",
    });
    expect(matchAiUserAgent("ChatGLM-Spider/1.0")).toMatchObject({ name: "GLM", kind: "crawler" });
    expect(matchAiUserAgent("YiyanBot/1.0")).toMatchObject({ name: "Ernie", kind: "assistant" });
    expect(matchAiUserAgent("PanguBot/1.0")).toMatchObject({ name: "Pangu", kind: "crawler" });
  });

  test("labels other commonly used assistants that identify in User-Agent", () => {
    expect(matchAiUserAgent("YouBot/1.0 (+https://you.com)")).toMatchObject({ name: "You.com", kind: "crawler" });
    expect(matchAiUserAgent("PhindBot/1.0")).toMatchObject({ name: "Phind", kind: "crawler" });
    expect(matchAiUserAgent("MistralAI-User/1.0 (+https://mistral.ai)")).toMatchObject({ name: "Mistral", kind: "assistant" });
    expect(matchAiUserAgent("DuckAssistBot/1.0")).toMatchObject({ name: "DuckDuckGo", kind: "search" });
    expect(matchAiUserAgent("cohere-ai")).toMatchObject({ name: "Cohere", kind: "assistant" });
  });
});

describe("matchAiFetch", () => {
  test("labels Grok DeepSeek Qwen and Kimi citation clicks from referrer when the UA is a normal browser", () => {
    const chrome =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    expect(matchAiFetch({ userAgent: chrome, referrer: "https://grok.com/chat" })).toEqual({
      name: "Grok",
      kind: "assistant",
      match: "referrer",
    });
    expect(matchAiFetch({ userAgent: chrome, referrer: "https://chat.deepseek.com/a/chat" })).toEqual({
      name: "DeepSeek",
      kind: "assistant",
      match: "referrer",
    });
    expect(matchAiFetch({ userAgent: chrome, referrer: "https://chat.qwen.ai/" })).toEqual({
      name: "Qwen",
      kind: "assistant",
      match: "referrer",
    });
    expect(matchAiFetch({ userAgent: chrome, referrer: "https://kimi.ai/chat" })).toEqual({
      name: "Kimi",
      kind: "assistant",
      match: "referrer",
    });
  });

  test("does not treat a stripped google.com referrer as Gemini so organic search stays organic", () => {
    const chrome =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    expect(matchAiFetch({ userAgent: chrome, referrer: "https://www.google.com/" })).toBeNull();
  });

  test("labels a Google-Agent IP plus a Chrome UA as Gemini because that is how Gemini grounding fetches", () => {
    const chrome =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    expect(
      matchAiFetch({
        userAgent: chrome,
        ip: "66.249.90.1",
        googleAgentCidrs: ["66.249.90.0/24"],
      }),
    ).toEqual({ name: "Gemini", kind: "assistant", match: "google_agent_ip" });
  });
});
