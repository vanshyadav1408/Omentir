export type IntegrationConnect = {
  surface: string;
  auth: string;
  bestFor: string;
};

const CONNECT: Record<string, IntegrationConnect> = {
  claude: {
    surface: "MCP",
    auth: "Workspace approval",
    bestFor: "Chat operator",
  },
  chatgpt: {
    surface: "MCP",
    auth: "Workspace approval",
    bestFor: "Chat operator",
  },
  cursor: {
    surface: "MCP or REST",
    auth: "API key",
    bestFor: "Coding agent",
  },
  mcp: {
    surface: "MCP",
    auth: "Approval or API key",
    bestFor: "Protocol",
  },
  grok: {
    surface: "MCP",
    auth: "Workspace approval",
    bestFor: "Chat operator",
  },
  openclaw: {
    surface: "MCP or REST",
    auth: "API key",
    bestFor: "Local agent",
  },
  "rest-api": {
    surface: "REST",
    auth: "API key",
    bestFor: "Scripts",
  },
  "claude-code": {
    surface: "MCP or REST",
    auth: "API key",
    bestFor: "Terminal agent",
  },
};

export function integrationConnect(slug: string): IntegrationConnect {
  const row = CONNECT[slug];
  if (!row) {
    throw new Error(`Missing connect matrix row for ${slug}`);
  }
  return row;
}
