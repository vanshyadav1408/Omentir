# Omentir

Claude, Cursor, and Grok Bot plugin that connects agents to [Omentir](https://omentir.com) through the hosted [Model Context Protocol](https://modelcontextprotocol.io/) server.

Find LinkedIn prospects, draft outreach, run human-paced campaigns, and inspect replies. LinkedIn stays in Omentir. The agent never gets the user's LinkedIn password.

## Install in Claude

1. Open **Customize** in Claude and find **Omentir** in the directory.
2. Add the plugin, then sign in on Omentir and approve **Connect workspace**.

In Claude Code, run `/plugin` and search for **Omentir**. The plugin works in Claude chat, Cowork, and Claude Code.

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

You need an [Omentir](https://omentir.com) workspace with LinkedIn connected and **Workspace** filled in.

## What agents can do

| Category | Capabilities |
| --- | --- |
| Workspace | Read setup status, send allowance, and the product profile. Analyze a website into Workspace |
| Agents | Draft, list, create, pause, resume, or delete lead finders, Steal Customers, and outreach-only CSV agents. Custom sequences, tone, and campaign goal |
| Leads | List and export scored people, including comment-level context on Steal Customers leads. Import a LinkedIn CSV |
| Outreach | Inspect the planned send queue. Send a due action now. Stop one lead. Delete an unused group |
| Replies | List captured threads and the live inbox. Reply with text or attachments. Mark follow-up done |
| Workspaces | List the owner's workspaces. Rebind this token to another one they already created |

They cannot create an Omentir account, change billing, connect LinkedIn, create or delete a workspace, or mint API keys. LinkedIn stays on the account already connected in Omentir.

## What this plugin runs and sends

- It runs nothing on your computer. It has no hooks, scripts, or local servers.
- It adds one remote MCP server, `https://omentir.com/api/agent/v1/mcp`, and one skill, `linkedin-outreach`, that tells Claude which Omentir tools to call and in what order.
- Tool calls go only to omentir.com over HTTPS, signed with the OAuth token you approved. Omentir then acts on the LinkedIn account you already connected in Omentir: it reads leads and inbox threads, and sends invites or messages only through tools that write.
- Read tools (lists, stats, lead details, inbox) never change anything. Write tools (create, reply, send now, pause, delete) change your workspace or message people on LinkedIn. They are marked as writes, so Claude asks for your approval first by default.

## Privacy

Omentir stores your workspace, leads, conversations, and agent settings so campaigns can run. It doesn't read your Claude chat history or files, and it only receives what Claude passes into a tool call. Details on collection, storage, sharing, retention, and how to delete your data are in the [privacy policy](https://omentir.com/privacy-policy). Questions go to hi@omentir.com.

## Grok Bot notes

- Prefer this plugin over clicking through LinkedIn in the Bot browser.
- Tell the Bot this in chat and ask it to remember it: research and draft only. Never send. Never enroll. Never sign into LinkedIn.
- Overnight job prompts: https://omentir.com/integrations/grok-bot

## Docs

- MCP: https://omentir.com/integrations/mcp
- Grok Bot: https://omentir.com/integrations/grok-bot
- Cursor: https://omentir.com/integrations/cursor
- Claude: https://omentir.com/integrations/claude
- Agent guide: https://omentir.com/agents.md
- Privacy policy: https://omentir.com/privacy-policy
- Server URL: https://omentir.com/api/agent/v1/mcp

## License

MIT
