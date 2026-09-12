# Omentir

Cursor and Grok Bot plugin that connects agents to [Omentir](https://omentir.com) through the hosted [Model Context Protocol](https://modelcontextprotocol.io/) server.

Find LinkedIn prospects, draft outreach, run human-paced campaigns, and inspect replies. LinkedIn stays in Omentir. The agent never gets the user's LinkedIn password.

## Install in Grok Bot

Grok Bot is the always-on teammate app at [x.ai/bot](https://x.ai/bot), not grok.com chat.

1. Open **Settings → Plugins**.
2. Search Marketplace for **Omentir** and add it.
3. If it is not in Marketplace yet, add a custom MCP server named Omentir with URL `https://omentir.com/api/agent/v1/mcp`.
4. Sign in on Omentir and approve **Connect workspace**.
5. In chat, type `@omentir` to attach it.

Do not sign LinkedIn into the Bot computer. If it asks you to take over for a LinkedIn password, passkey, two-factor code, or CAPTCHA, refuse.

## Install in Cursor

1. Open **Cursor Settings → Plugins**.
2. Search for **Omentir**.
3. Click **Install**, then complete the Omentir sign-in prompt.

Or run `/add-plugin omentir` in chat.

## MCP

```json
{
  "mcpServers": {
    "omentir": {
      "type": "http",
      "url": "https://omentir.com/api/agent/v1/mcp"
    }
  }
}
```

Auth is OAuth 2.1 against Omentir with Dynamic Client Registration and PKCE. The client registers itself and prompts for Omentir sign-in. There is no API key or client ID to configure.

## Before you connect

You need an [Omentir](https://omentir.com) workspace with LinkedIn connected and **My Product** filled in.

## What agents can do

| Category | Capabilities |
| --- | --- |
| Workspace | Read setup status, send allowance, and My Product |
| Agents | List, create, pause, resume, or delete lead finders and Steal Customers agents |
| Leads | List scored people, including comment-level context on Steal Customers leads |
| Outreach | Inspect the planned send queue. Draft notes. Send only when the user asks |
| Replies | List existing threads and reply in those threads |

They cannot create an Omentir account, change billing, or use LinkedIn outside the account already connected in Omentir.

## Grok Bot notes

- Prefer this plugin over clicking through LinkedIn in the Bot browser.
- Put this in the Bot description and leave it there: research and draft only. Never send. Never enroll. Never sign into LinkedIn.
- Overnight job prompts: https://omentir.com/integrations/grok-bot

## Docs

- MCP: https://omentir.com/integrations/mcp
- Grok Bot: https://omentir.com/integrations/grok-bot
- Cursor: https://omentir.com/integrations/cursor
- Agent guide: https://omentir.com/agents.md
- Server URL: https://omentir.com/api/agent/v1/mcp

## License

MIT
