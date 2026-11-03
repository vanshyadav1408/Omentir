import { describe, expect, test } from "bun:test";
import { agentPasteTarget } from "./agent-paste-target";

describe("agentPasteTarget", () => {
  test("labels Cue pages for Cue so the copy button names the app the prompt is written for", () => {
    expect(agentPasteTarget("manus-cue-speed-to-lead")).toBe("Cue");
    expect(agentPasteTarget("manus-cue")).toBe("Cue");
  });

  test("labels main Manus app guides for Manus, not Cue, because Automations and Studio only exist in Manus", () => {
    expect(agentPasteTarget("manus-automations-for-linkedin-outreach")).toBe("Manus");
  });

  test("labels Gemini, Claude and Microsoft agent pages so they never show Grok Bot setup steps", () => {
    expect(agentPasteTarget("can-i-use-gemini-spark-for-linkedin-outreach")).toBe("Gemini Spark");
    expect(agentPasteTarget("can-a-gemini-coworker-agent-run-sales-outreach")).toBe("your Gemini agent");
    expect(agentPasteTarget("can-i-use-claude-duet-for-linkedin-outreach")).toBe("Claude Duet");
    expect(agentPasteTarget("how-do-i-connect-claude-cowork-to-omentir")).toBe("Cowork");
    expect(agentPasteTarget("can-microsoft-autopilot-run-lead-research-on-a-schedule")).toBe("Autopilot");
    expect(agentPasteTarget("can-chatgpt-workspace-agents-run-linkedin-outreach")).toBe("your workspace agent");
  });

  test("keeps the Grok Bot default for unrelated pages", () => {
    expect(agentPasteTarget("grok-bot-sales-outreach")).toBeUndefined();
  });
});
