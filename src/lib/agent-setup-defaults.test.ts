import { describe, expect, test } from "bun:test";
import {
  EXISTING_AGENT_MESSAGE_TONE_FALLBACK,
  EXISTING_AGENT_SEND_WINDOW_FALLBACK,
  NEW_AGENT_MESSAGE_TONE,
  NEW_AGENT_SEND_WINDOW,
  messageToneForAgentForm,
  sendWindowForAgentForm,
} from "./agent-setup-defaults";

describe("sendWindowForAgentForm", () => {
  test("new agents default to extended hours so leaving the picker alone sends every day 7am-10pm instead of weekday business hours", () => {
    expect(NEW_AGENT_SEND_WINDOW).toBe("extended");
    expect(sendWindowForAgentForm(undefined, false)).toBe("extended");
  });

  test("editing an agent without a stored window keeps always so old 24/7 campaigns are not silently narrowed on save", () => {
    expect(EXISTING_AGENT_SEND_WINDOW_FALLBACK).toBe("always");
    expect(sendWindowForAgentForm(undefined, true)).toBe("always");
  });

  test("editing an agent keeps the campaign's stored window even when it is not the new default", () => {
    expect(sendWindowForAgentForm("business", true)).toBe("business");
    expect(sendWindowForAgentForm("always", true)).toBe("always");
    expect(sendWindowForAgentForm("extended", true)).toBe("extended");
  });
});

describe("messageToneForAgentForm", () => {
  test("new agents default to conversational so leaving the picker alone does not launch in professional", () => {
    expect(NEW_AGENT_MESSAGE_TONE).toBe("conversational");
    expect(messageToneForAgentForm(undefined, false)).toBe("conversational");
  });

  test("editing an agent without a stored tone keeps professional so Gemini's existing fallback voice does not change on save", () => {
    expect(EXISTING_AGENT_MESSAGE_TONE_FALLBACK).toBe("professional");
    expect(messageToneForAgentForm(undefined, true)).toBe("professional");
  });

  test("editing an agent keeps the campaign's stored tone even when it is not the new default", () => {
    expect(messageToneForAgentForm("professional", true)).toBe("professional");
    expect(messageToneForAgentForm("direct", true)).toBe("direct");
    expect(messageToneForAgentForm("conversational", true)).toBe("conversational");
  });
});
