// The agent surface is four things that must describe the same product: the MCP
// tool definitions, the operations router behind them, the REST routes, and the
// docs agents and buyers read (/agents.md, /for-agents, /mcp-server, OpenAPI).
// Each drifted independently before this - a tool would ship without a REST
// route, or a docs page would keep advertising a tool count from two releases
// ago - so the alignment is asserted rather than reviewed by eye.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const agentTools = source("../src/lib/agent-tools.ts");
const operations = source("../src/lib/server/agent-api-operations.ts");
const openapi = source("../src/app/api/agent/v1/openapi.json/route.ts");
const mcpRoute = source("../src/app/api/agent/v1/mcp/route.ts");
const agentsGuide = source("../src/app/agents.md/route.ts");
const forAgentsPage = source("../src/app/for-agents/page.tsx");
const mcpServerPage = source("../src/app/mcp-server/page.tsx");

// Tool names as the MCP server advertises them in tools/list.
const toolNames = [
  ...agentTools.matchAll(/^\s{4}name: "(omentir_[a-z_]+)",$/gm),
].map((match) => match[1]);

test("every advertised MCP tool is routed and documented", () => {
  assert.ok(toolNames.length >= 19, `expected the full tool catalog, saw ${toolNames.length}`);

  for (const name of toolNames) {
    // Reachable: callAgentTool dispatches on the literal name, so a tool that
    // is listed but not dispatched fails only when a client finally calls it.
    assert.match(
      operations,
      new RegExp(`name === "${name}"`),
      `${name} is advertised but callAgentTool never dispatches it`,
    );
    // Its input schema exists (the definitions reference it by key).
    assert.match(
      agentTools,
      new RegExp(`^\\s{2}${name}: \\{$`, "m"),
      `${name} has no input schema`,
    );
    // Named in the machine-readable guide the tools tell agents to read first.
    assert.ok(
      agentsGuide.includes(name),
      `${name} is missing from /agents.md`,
    );
    // Named in both human tool catalogs.
    assert.ok(forAgentsPage.includes(name), `${name} is missing from /for-agents`);
    assert.ok(mcpServerPage.includes(name), `${name} is missing from /mcp-server`);
  }
});

test("the marketing pages state the real tool count", () => {
  const spelled = {
    16: "Sixteen",
    17: "Seventeen",
    18: "Eighteen",
    19: "Nineteen",
    20: "Twenty",
  }[toolNames.length];
  assert.ok(spelled, `add ${toolNames.length} to this test's number words`);

  for (const [name, page] of [
    ["/for-agents", forAgentsPage],
    ["/mcp-server", mcpServerPage],
  ]) {
    assert.ok(
      page.includes(spelled) || page.includes(spelled.toLowerCase()),
      `${name} does not say there are ${toolNames.length} tools`,
    );
  }
  // The MCP server FAQ counts them in prose too, in lower case.
  assert.ok(
    mcpServerPage.includes(spelled.toLowerCase()),
    `the /mcp-server FAQ does not say there are ${toolNames.length} tools`,
  );
});

test("every REST resource advertised by /context exists as a route", () => {
  const resources = operations
    .slice(operations.indexOf("resources: {"))
    .split("},")[0]
    .matchAll(/"(\/api\/agent\/v1\/[a-z.\-/]+)"/g);

  // The schema document is deliberately unauthenticated so a client can read it
  // during setup, before a token exists.
  const publicPaths = new Set(["/api/agent/v1/openapi.json"]);

  for (const [, path] of resources) {
    const segment = path.replace("/api/agent/v1/", "");
    const route = new URL(`../src/app/api/agent/v1/${segment}/route.ts`, import.meta.url);
    assert.ok(existsSync(route), `${path} is advertised by /context but has no route file`);
    if (publicPaths.has(path)) continue;
    // Advertised paths are token-authenticated, never session-authenticated:
    // /api/agent/v1 also hosts one app-internal route, and pointing an agent
    // at that would hand it a 401 it cannot fix.
    assert.match(
      readFileSync(route, "utf8"),
      /requireAgentApiContext/,
      `${path} does not authenticate with an agent token`,
    );
  }
});

test("the OpenAPI schema documents the send schedule and scheduling controls", () => {
  // The planner's committed send times are the only correct answer to "when
  // does this go out", so the REST surface has to expose them.
  assert.match(openapi, /"\/api\/agent\/v1\/scheduled-actions"/);
  assert.ok(existsSync(new URL("../src/app/api/agent/v1/scheduled-actions/route.ts", import.meta.url)));

  // Fields the app's own agent and settings forms own; without them an API
  // caller cannot reproduce what a human can configure.
  assert.match(openapi, /runAtHour/);
  assert.match(openapi, /sendWindow/);
  assert.match(openapi, /timeZone/);
  assert.match(operations, /runAtHourSchema/);
  assert.match(operations, /setSendWindowForGroup/);
  assert.match(operations, /updateWorkspaceTimezone/);

  // Version stamps move together: clients cache both documents by version.
  const openapiVersion = openapi.match(/version: "(\d+\.\d+\.\d+)"/)?.[1];
  const mcpVersion = mcpRoute.match(/version: "(\d+\.\d+\.\d+)"/)?.[1];
  assert.equal(openapiVersion, mcpVersion);
});

test("agents are told which zone the timestamps they read are in", () => {
  // Every stored instant is UTC while the app renders and counts in the
  // workspace zone, so an agent that skips the conversion quotes the wrong
  // hour back to the customer.
  assert.match(operations, /timeZone: resolveTimeZone\(context\.workspace\.timezone\)/);
  assert.ok(agentsGuide.includes("workspace.timeZone"));
  assert.match(mcpRoute, /instructions:[\s\S]{0,400}time zone/);
});
