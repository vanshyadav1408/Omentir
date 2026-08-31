import { describe, expect, test } from "bun:test";
import { decodeSessionId, PostHogMCP } from "@posthog/mcp";
import {
  mcpIdentity,
  mintMcpSession,
  parseMcpClientInfo,
  toolArguments,
} from "./posthog-mcp";

describe("mcpIdentity", () => {
  test("uses the workspace id as distinctId so MCP tool calls join the same person as signup and checkout", () => {
    expect(
      mcpIdentity({
        id: "user_abc",
        name: "Acme",
        notificationEmail: "founder@acme.test",
        billing: { plan: "solo" },
      }),
    ).toEqual({
      distinctId: "user_abc",
      setProperties: {
        name: "Acme",
        email: "founder@acme.test",
        plan: "solo",
      },
    });
  });

  test("omits unset person fields so a workspace without email does not stamp email: undefined onto $set", () => {
    expect(mcpIdentity({ id: "user_abc", name: "Acme" }).setProperties).toEqual({ name: "Acme" });
  });
});

describe("parseMcpClientInfo", () => {
  test("reads clientInfo from initialize params so later $mcp_tool_call events can keep the client name", () => {
    expect(
      parseMcpClientInfo({
        protocolVersion: "2025-11-25",
        clientInfo: { name: "claude-code", version: "1.2.3" },
      }),
    ).toEqual({ clientName: "claude-code", clientVersion: "1.2.3" });
  });

  test("returns empty fields when initialize omitted clientInfo rather than inventing a client name", () => {
    expect(parseMcpClientInfo({})).toEqual({ clientName: undefined, clientVersion: undefined });
  });
});

describe("toolArguments", () => {
  test("rejects arrays so a malformed tools/call body is not treated as named arguments", () => {
    expect(toolArguments(["oops"])).toBeUndefined();
    expect(toolArguments({ groupName: "SaaS founders" })).toEqual({ groupName: "SaaS founders" });
  });
});

describe("mintMcpSession", () => {
  test("encodes client metadata into Mcp-Session-Id so a later serverless invocation can recover $session_id", () => {
    const { token, session } = mintMcpSession({
      clientName: "claude-code",
      clientVersion: "1.2.3",
      protocolVersion: "2025-11-25",
    });
    expect(session.sessionId.startsWith("ses_")).toBe(true);
    expect(decodeSessionId(token)).toEqual(session);
  });
});

describe("PostHogMCP prepareToolList / prepareToolCall", () => {
  test("injects required context and strips it before dispatch so closed tool schemas still accept the call", async () => {
    const posthog = new PostHogMCP("disabled", { disabled: true });
    try {
      const advertised = posthog.prepareToolList(
        [
          {
            name: "omentir_list_leads",
            inputSchema: {
              type: "object",
              properties: { groupId: { type: "string" } },
              additionalProperties: false,
            },
          },
        ],
        { reportMissing: true },
      );

      expect(advertised.some((tool) => tool.name === "get_more_tools")).toBe(true);
      const schema = advertised[0]?.inputSchema as {
        properties?: { context?: unknown };
        required?: string[];
      };
      expect(schema.properties?.context).toEqual({
        type: "string",
        description: expect.any(String),
      });
      expect(schema.required).toContain("context");

      const prepared = posthog.prepareToolCall("omentir_list_leads", {
        groupId: "g1",
        context: "Show me the newest Steal Customers leads",
      });
      expect(prepared.intent).toBe("Show me the newest Steal Customers leads");
      expect(prepared.intentSource).toBe("context_parameter");
      expect(prepared.args).toEqual({ groupId: "g1" });
      expect(prepared.isMissingCapability).toBe(false);

      expect(posthog.prepareToolCall("get_more_tools", { context: "Need a send-now tool" }).isMissingCapability).toBe(
        true,
      );
    } finally {
      await posthog.shutdown();
    }
  });
});
