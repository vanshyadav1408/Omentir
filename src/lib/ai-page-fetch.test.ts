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

  test("labels Claude Code even when the UA also contains Claude-User", () => {
    expect(
      matchAiUserAgent("Claude-User (claude-code/2.1.83; +https://support.anthropic.com/)"),
    ).toEqual({ name: "Claude Code", kind: "assistant" });
    expect(matchAiUserAgent("Claude-Code/1.0")).toEqual({ name: "Claude Code", kind: "assistant" });
    expect(matchAiUserAgent("ClaudeCode/1.0 (Anthropic)")).toEqual({ name: "Claude Code", kind: "assistant" });
  });

  test("labels coding agents that identify themselves", () => {
    expect(matchAiUserAgent("Cursor/2.4.28")).toEqual({ name: "Cursor", kind: "assistant" });
    expect(matchAiUserAgent("Mozilla/5.0 (compatible; Devin/1.0; +https://devin.ai)")).toEqual({
      name: "Devin",
      kind: "assistant",
    });
    expect(matchAiUserAgent("OpenClaw/1.0 (+https://openclaw.ai)")).toEqual({ name: "OpenClaw", kind: "assistant" });
    expect(matchAiUserAgent("Clawdbot/1.0")).toEqual({ name: "OpenClaw", kind: "assistant" });
    expect(matchAiUserAgent("Hermes-Agent/1.0 (+https://nousresearch.com)")).toEqual({
      name: "Hermes",
      kind: "assistant",
    });
    expect(matchAiUserAgent("opencode/1.2.5")).toEqual({ name: "OpenCode", kind: "assistant" });
    expect(matchAiUserAgent("Codex/260203.1501")).toEqual({ name: "Codex", kind: "assistant" });
  });

  test("does not treat search engines, browsers, or link previews as an AI fetch", () => {
    expect(matchAiUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBeNull();
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
    expect(matchAiUserAgent("GrokBot/1.0 (+https://x.ai)")).toEqual({ name: "Grok", kind: "crawler" });
    expect(matchAiUserAgent("Grok-User/1.0 (+https://x.ai)")).toEqual({ name: "Grok", kind: "assistant" });
    expect(matchAiUserAgent("xAI-Grok/1.0 (+https://grok.com)")).toEqual({ name: "Grok", kind: "crawler" });
    expect(matchAiUserAgent("SarvamBot/1.0 (+https://www.sarvam.ai)")).toEqual({ name: "Sarvam", kind: "crawler" });
    expect(matchAiUserAgent("Sarvam-User/1.0")).toEqual({ name: "Sarvam", kind: "assistant" });
  });

  test("labels Chinese consumer AIs instead of dumping them as generic bots", () => {
    expect(matchAiUserAgent("Mozilla/5.0 (compatible; DeepSeekBot/1.0)")).toEqual({ name: "DeepSeek", kind: "crawler" });
    expect(matchAiUserAgent("TongyiBot/1.0 (+https://tongyi.aliyun.com)")).toEqual({ name: "Qwen", kind: "assistant" });
    expect(matchAiUserAgent("Kimi-User/1.0 (+https://kimi.moonshot.cn)")).toEqual({ name: "Kimi", kind: "assistant" });
    expect(matchAiUserAgent("Mozilla/5.0 (compatible; Bytespider; +https://zhanzhang.toutiao.com)")).toEqual({
      name: "Doubao",
      kind: "crawler",
    });
    expect(matchAiUserAgent("ChatGLM-Spider/1.0")).toEqual({ name: "GLM", kind: "crawler" });
    expect(matchAiUserAgent("YiyanBot/1.0")).toEqual({ name: "Ernie", kind: "assistant" });
    expect(matchAiUserAgent("PanguBot/1.0")).toEqual({ name: "Pangu", kind: "crawler" });
  });

  test("labels other commonly used assistants that identify in User-Agent", () => {
    expect(matchAiUserAgent("YouBot/1.0 (+https://you.com)")).toEqual({ name: "You.com", kind: "crawler" });
    expect(matchAiUserAgent("PhindBot/1.0")).toEqual({ name: "Phind", kind: "crawler" });
    expect(matchAiUserAgent("MistralAI-User/1.0 (+https://mistral.ai)")).toEqual({ name: "Mistral", kind: "assistant" });
    expect(matchAiUserAgent("DuckAssistBot/1.0")).toEqual({ name: "DuckDuckGo", kind: "search" });
    expect(matchAiUserAgent("cohere-ai")).toEqual({ name: "Cohere", kind: "assistant" });
  });
});
