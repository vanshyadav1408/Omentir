# Changelog

All notable changes to this plugin will be documented here.

## 1.1.0 - workspace switch

- Agents can list the owner's workspaces and rebind the same token with `omentir_switch_workspace`.
- They still cannot create or delete a workspace, change billing, connect LinkedIn, or mint API keys.

## 1.0.0 - initial release

- Added the `omentir` MCP server pointing at `https://omentir.com/api/agent/v1/mcp`.
- Auth uses OAuth 2.1 with dynamic client registration and PKCE. No API key or client ID to configure.
- Added the `linkedin-outreach` skill so Grok Bot works through Omentir instead of signing into LinkedIn on the Bot computer.
