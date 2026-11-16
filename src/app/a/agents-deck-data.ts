import { siteUrl } from "@/app/seo";

/** Copy for /a, the "Omentir for AI agents" landing page. The page and its
 *  markdown twin (/a.md, built in public-page-markdown.ts) both read from
 *  here so the two never drift. Every claim matches /agents.md; check it
 *  before adding a new one. Keep it short: visitors skim. */

export const DECK_PATH = "/a";

export const MCP_URL = `${siteUrl}/api/agent/v1/mcp`;

export const DECK_META = {
  title: "Turn ChatGPT or Claude into a sales agent - Omentir",
  description:
    "Connect Omentir to ChatGPT, Claude or Grok. Your assistant finds LinkedIn buyers that fit your customer profile and messages them from your own account.",
};

export const DECK_HERO = {
  title: "Turn ChatGPT or Claude into a sales agent.",
  sub: "It finds buyers on LinkedIn and messages them from your account.",
};

/** A centered two-tone statement: `lead` in ink, `rest` muted. */
export type Statement = { lead: string; rest: string };

/** Lights up word by word as you scroll. */
export const WHY = "Your AI can write the message. Omentir lets it hit send.";

export const STEPS_HEADING: Statement = {
  lead: "Three steps.",
  rest: "Then you just ask.",
};

export const STEPS = [
  { where: "In Omentir", word: "Connect", note: "Your LinkedIn account" },
  { where: "In your AI app", word: "Paste", note: "This URL into ChatGPT, Claude or Grok" },
  { where: "In any chat", word: "Ask", note: "Find buyers and message them" },
];

export type Feature = {
  title: string;
  note: string;
  /** The sample card: a label, then rows of [name, detail, value]. */
  label: string;
  rows: Array<[string, string, string]>;
};

export const FEATURES: Feature[] = [
  {
    title: "Find buyers",
    note: "It searches LinkedIn for people who fit your customer profile and scores each one.",
    label: "Fintech growth leads",
    rows: [
      ["Priya Shah", "Hiring two SDRs", "5/5"],
      ["Marcus Lee", "Wrote about CAC", "4/5"],
      ["Ana Costa", "Raised a Series A", "4/5"],
    ],
  },
  {
    title: "Message them",
    note: "Invites and follow-ups go out from your own LinkedIn account, at a human pace.",
    label: "Default sequence",
    rows: [
      ["Connection request", "No note", "1"],
      ["First message", "Written by AI", "2"],
      ["Two follow-ups", "Written by AI", "3"],
    ],
  },
  {
    title: "Handle replies",
    note: "You choose how far the AI goes once someone writes back.",
    label: "Reply mode",
    rows: [
      ["Hand off", "Stops at the first reply", "You"],
      ["Until interest", "Emails you when they're keen", "AI"],
      ["Until booked", "Shares your calendar link", "AI"],
    ],
  },
  {
    title: "Find competitor commenters",
    note: "Name a competitor. It finds people asking buying questions under their posts.",
    label: "Competitor post, 2 days ago",
    rows: [
      ["Elena Park", "Does it handle follow-ups?", "Buyer"],
      ["Sam Ortiz", "Congrats team!", "Skip"],
      ["Ravi Menon", "Comparing tools right now", "Buyer"],
    ],
  },
];

export const ALWAYS_ON: Statement & { facts: Array<{ word: string; note: string }> } = {
  lead: "Close the tab.",
  rest: "It keeps working.",
  facts: [
    { word: "Finds", note: "New leads every day" },
    { word: "Sends", note: "Invites and follow-ups, inside daily limits" },
    { word: "Tells you", note: "An email when a lead replies or shows interest" },
  ],
};

export const SAFETY: Statement = {
  lead: "It never sees your password.",
  rest: "Billing, API keys and connecting LinkedIn stay with you.",
};

export const SOURCE_LINK = {
  label: "The MCP server is open source",
  href: "https://github.com/vanshyadav1408/Omentir",
};

export const DECK_CLOSE = {
  title: "Hand your AI the outreach.",
  sub: "$49/month. Three bookings a week or you pay nothing.",
};

export const SETUP_GUIDES = [
  { name: "ChatGPT", href: "/integrations/chatgpt" },
  { name: "Claude", href: "/integrations/claude" },
  { name: "Grok", href: "/integrations/grok" },
  { name: "Claude Code", href: "/integrations/claude-code" },
  { name: "Cursor", href: "/integrations/cursor" },
  { name: "Codex", href: "/integrations/codex" },
];
