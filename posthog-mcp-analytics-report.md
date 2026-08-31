# MCP analytics

Path C: custom Streamable HTTP dispatcher at `src/app/api/agent/v1/mcp/route.ts` (no `@modelcontextprotocol/sdk` server object). Instrumented with `PostHogMCP` from `@posthog/mcp@0.12.0` (beta, pinned).

## What changed

- `src/lib/posthog-mcp.ts`: module-scoped client, workspace identity, session token mint/decode, `prepareToolList` / `prepareToolCall`.
- `src/app/api/agent/v1/mcp/route.ts`: `captureInitialize`, `captureToolsList`, `captureToolCall`, `captureMissingCapability`, flush at end of each POST.
- `src/lib/posthog-mcp.test.ts`: identity, session token, intent strip.

## Credentials

Reuses existing `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` (US Cloud `https://us.i.posthog.com`). Optional overrides: `POSTHOG_PROJECT_TOKEN`, `POSTHOG_HOST`. Distinct id is the workspace id so MCP events join the same person as signup and checkout.

## After deploy

Connect an MCP client and call a tool. Events land as `$mcp_initialize`, `$mcp_tools_list`, `$mcp_tool_call` (and `$mcp_missing_capability` if the agent reports a gap). Dashboard: https://posthog.com/docs/mcp-analytics
