export type UseCaseWho = {
  who: string;
};

const WHO: Record<string, UseCaseWho> = {
  "replace-first-sdr": {
    who: "Founders and tiny teams delaying a first sales hire",
  },
  "book-linkedin-demos": {
    who: "Anyone with LinkedIn replies that die before a calendar link",
  },
  "prospect-commenters": {
    who: "Teams who want commenters on competitor posts, not a scraped employee list",
  },
  "outbound-for-founders": {
    who: "Founders who still take the calls",
  },
  "open-source-ai-sdr": {
    who: "Buyers who will read the repo or self-host",
  },
  "grok-bot-outbound": {
    who: "People who already have Grok Bot and want LinkedIn sales without a cloud browser driving the account",
  },
  "grok-bot-cold-messaging": {
    who: "People who want Grok Bot to draft cold LinkedIn notes overnight without sending them unsupervised",
  },
  "grok-bot-sales-navigator": {
    who: "People who already think in Sales Navigator searches and do not want that login on a Bot computer",
  },
  "claude-code-outbound": {
    who: "People who already live in Claude Code and want the same terminal session to inspect Omentir",
  },
  "cursor-outbound": {
    who: "People who already live in Cursor and want the editor agent to update My Product from the open file",
  },
  "codex-outbound": {
    who: "People who already run Codex and want MCP in config.toml, not the ChatGPT connector UI",
  },
  "chatgpt-outbound": {
    who: "People who already live in ChatGPT and want the connector, not a paste-only draft loop",
  },
  "claude-chat-outbound": {
    who: "People who already live in claude.com chat and do not need Claude Code",
  },
  "grok-chat-outbound": {
    who: "People who meant grok.com chat, not the Grok Bot app",
  },
  "openclaw-outbound": {
    who: "People who already run OpenClaw locally and can keep a Bearer token off disk",
  },
};

export function whoForUseCase(slug: string): UseCaseWho {
  const row = WHO[slug];
  if (!row) {
    throw new Error(`Missing use-case who row for ${slug}`);
  }
  return row;
}
