export const GUIDE_SLUGS = [
  "grok-bot-sales-outreach",
  "grok-bot-cold-messages",
  "grok-bot-linkedin-automation",
  "overnight-outbound-with-grok-bot",
] as const;

export const GUIDE_PATHS = new Set(GUIDE_SLUGS.map((slug) => `/${slug}`));
