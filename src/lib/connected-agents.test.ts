import { describe, expect, test } from "bun:test";
import { groupConnectedAgents } from "./connected-agents";

const key = (id: string, label: string, createdAt: string, lastUsedAt?: string) => ({
  id,
  label,
  tokenPrefix: `omt_${id}`,
  createdAt,
  ...(lastUsedAt ? { lastUsedAt } : {}),
});

describe("groupConnectedAgents", () => {
  test("an app that reconnected shows once, and its row holds every key it was issued", () => {
    // Each reconnect issues a new key and the old ones stay active. Disconnect
    // has to revoke all of them: revoking only the newest would leave the app
    // connected through an older key while the page said it was gone.
    const agents = groupConnectedAgents([
      key("a", "Grok", "2026-08-03T00:00:00.000Z", "2026-08-14T00:00:00.000Z"),
      key("b", "Grok", "2026-08-14T00:00:00.000Z", "2026-08-24T00:00:00.000Z"),
      key("c", "Grok", "2026-08-25T00:00:00.000Z", "2026-11-25T00:00:00.000Z"),
      key("d", "Claude", "2026-11-04T00:00:00.000Z"),
    ]);
    expect(agents.map((agent) => agent.name)).toEqual(["Grok", "Claude"]);
    expect(agents[0].keys.map((item) => item.id).sort()).toEqual(["a", "b", "c"]);
  });

  test("the row reports when the agent first connected and when it was last active on any key", () => {
    const [grok] = groupConnectedAgents([
      key("b", "Grok", "2026-08-14T00:00:00.000Z", "2026-11-25T00:00:00.000Z"),
      key("a", "Grok", "2026-08-03T00:00:00.000Z", "2026-08-14T00:00:00.000Z"),
    ]);
    expect(grok.connectedAt).toBe("2026-08-03T00:00:00.000Z");
    expect(grok.lastUsedAt).toBe("2026-11-25T00:00:00.000Z");
  });

  test("names that differ only by case or spacing are one agent, so a retyped label cannot hide a live key", () => {
    const agents = groupConnectedAgents([
      key("a", "Cursor", "2026-08-03T00:00:00.000Z"),
      key("b", " cursor ", "2026-08-04T00:00:00.000Z"),
    ]);
    expect(agents).toHaveLength(1);
    expect(agents[0].keys).toHaveLength(2);
  });

  test("the agent used most recently comes first and ones never used go last", () => {
    const agents = groupConnectedAgents([
      key("a", "Never used", "2026-11-20T00:00:00.000Z"),
      key("b", "Old", "2026-07-01T00:00:00.000Z", "2026-07-23T00:00:00.000Z"),
      key("c", "Recent", "2026-08-01T00:00:00.000Z", "2026-11-25T00:00:00.000Z"),
    ]);
    expect(agents.map((agent) => agent.name)).toEqual(["Recent", "Old", "Never used"]);
    expect(agents[2].lastUsedAt).toBeUndefined();
  });
});
