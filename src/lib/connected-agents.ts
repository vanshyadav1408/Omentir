// One row per agent on the Agents page.
//
// Every sign-in from an AI app issues a fresh key named after the app and
// leaves the earlier ones active, so the raw key list shows "Grok" three
// times. Grouping by name gives one row to read and one Disconnect that really
// cuts the app off: revoking a single key would leave its older keys working.

import type { AgentApiKey } from "@/lib/server/types";

type AgentKey = Pick<AgentApiKey, "id" | "label" | "tokenPrefix" | "createdAt" | "lastUsedAt">;

export type ConnectedAgent = {
  name: string;
  keys: AgentKey[];
  // First time this agent connected.
  connectedAt: string;
  // Newest use across all of its keys. Unset when none was ever used.
  lastUsedAt?: string;
};

export function groupConnectedAgents(keys: AgentKey[]): ConnectedAgent[] {
  const byName = new Map<string, ConnectedAgent>();
  for (const key of keys) {
    const name = key.label.trim() || "AI agent";
    const id = name.toLowerCase();
    const agent = byName.get(id);
    if (!agent) {
      byName.set(id, { name, keys: [key], connectedAt: key.createdAt, lastUsedAt: key.lastUsedAt });
      continue;
    }
    agent.keys.push(key);
    if (key.createdAt < agent.connectedAt) agent.connectedAt = key.createdAt;
    if (key.lastUsedAt && (!agent.lastUsedAt || key.lastUsedAt > agent.lastUsedAt)) {
      agent.lastUsedAt = key.lastUsedAt;
    }
  }
  // Most recently active first. Agents never used go last, newest first.
  return [...byName.values()].sort(
    (a, b) =>
      (b.lastUsedAt || "").localeCompare(a.lastUsedAt || "") || b.connectedAt.localeCompare(a.connectedAt),
  );
}
