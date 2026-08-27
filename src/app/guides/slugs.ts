export const GUIDE_SLUGS = [
  "grok-bot-sales-outreach",
  "grok-bot-cold-messages",
  "grok-bot-linkedin-automation",
  "overnight-outbound-with-grok-bot",
  "grok-bot-lead-generation",
  "grok-bot-follow-up-messages",
  "claude-code-sales-outreach",
  "cursor-sales-outreach",
  "codex-sales-outreach",
  "chatgpt-sales-outreach",
  "claude-chat-sales-outreach",
  "grok-chat-sales-outreach",
  "openclaw-sales-outreach",
] as const;

export const GUIDE_PATHS = new Set(GUIDE_SLUGS.map((slug) => `/${slug}`));
