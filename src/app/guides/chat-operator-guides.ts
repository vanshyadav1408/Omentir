import type { GuidePage } from "./types";
import { CHATGPT_FIRST_JOB_PROMPT } from "../chatgpt-setup";
import { CLAUDE_CHAT_FIRST_JOB_PROMPT } from "../claude-chat-setup";
import { GROK_CHAT_FIRST_JOB_PROMPT } from "../grok-chat-setup";
import { OPENCLAW_FIRST_JOB_PROMPT } from "../openclaw-setup";

const DATE = "August 27, 2026";

export const CHAT_OPERATOR_GUIDES: GuidePage[] = [
  {
    slug: "chatgpt-sales-outreach",
    title: "ChatGPT for sales outreach",
    description:
      "Connect ChatGPT to Omentir with a custom MCP connector. No API key. Draft in the tab. Send from the workspace. Close the tab and the session stops.",
    query: "chatgpt sales outreach omentir",
    kicker: "Connector",
    cluster: "linkedin",
    publishedDate: DATE,
    updatedDate: DATE,
    keywords: ["ChatGPT sales outreach", "ChatGPT MCP LinkedIn", "ChatGPT Omentir connector"],
    sections: [
      {
        heading: "The job",
        paragraphs: [
          "ChatGPT is a session you sit with. Settings, Connectors, paste https://omentir.com/api/agent/v1/mcp, approve Connect workspace. That is not Codex and it is not an overnight Bot.",
        ],
        bullets: [
          "No API key on this path.",
          "Ask it to explain the workspace back before it creates a finder.",
          "Keep send behind review.",
        ],
      },
      {
        heading: "Paste this into ChatGPT",
        paragraphs: [
          "Finish Omentir first. Enable tools in the chat. Replace the brackets. Keep the last two sentences.",
        ],
        code: CHATGPT_FIRST_JOB_PROMPT,
      },
    ],
    faqItems: [
      {
        question: "Do I need Codex for this?",
        answer: "No. Codex uses config.toml. ChatGPT uses workspace approval.",
      },
      {
        question: "Does the tab keep working after I close it?",
        answer: "No. Overnight is [Grok Bot](/help/what-is-the-difference-between-grok-bot-and-grok-com).",
      },
    ],
    related: [
      { label: "How do I connect ChatGPT to Omentir?", href: "/help/how-do-i-connect-chatgpt-to-omentir" },
      { label: "ChatGPT integration", href: "/integrations/chatgpt" },
      { label: "ChatGPT connector for LinkedIn outreach", href: "/blogs/chatgpt-connector-linkedin-outreach" },
    ],
    relatedHeading: "More on ChatGPT",
  },
  {
    slug: "claude-chat-sales-outreach",
    title: "Claude chat for sales outreach",
    description:
      "Use Claude on claude.com as a connector session. This is not Claude Code. Draft in the tab. Send from Omentir. Close the tab and the work stops.",
    query: "claude sales outreach",
    kicker: "Connector",
    cluster: "linkedin",
    publishedDate: DATE,
    updatedDate: DATE,
    keywords: ["Claude sales outreach", "Claude MCP LinkedIn", "claude.com Omentir"],
    sections: [
      {
        heading: "The job",
        paragraphs: [
          "Claude chat uses Settings, Connectors, and workspace approval. Claude Code uses a Bearer key in a terminal. Pick one window.",
        ],
      },
      {
        heading: "Paste this into Claude",
        paragraphs: [
          "Finish Omentir first. Fetch [agents.md](https://omentir.com/agents.md). Replace the brackets.",
        ],
        code: CLAUDE_CHAT_FIRST_JOB_PROMPT,
      },
    ],
    faqItems: [
      {
        question: "Is this Claude Code?",
        answer: "No. See [Claude Code or Claude chat](/help/should-i-use-claude-code-or-claude-chat-for-sales).",
      },
      {
        question: "Do I need an API key?",
        answer: "Not for claude.com.",
      },
    ],
    related: [
      { label: "How do I connect Claude to Omentir?", href: "/help/how-do-i-connect-claude-to-omentir" },
      { label: "Claude integration", href: "/integrations/claude" },
      { label: "Claude chat for LinkedIn outreach", href: "/blogs/claude-chat-linkedin-outreach" },
    ],
    relatedHeading: "More on Claude chat",
  },
  {
    slug: "grok-chat-sales-outreach",
    title: "grok.com for sales outreach",
    description:
      "Use grok.com as a chat connector. It is not Grok Bot. There is no cloud computer. Draft in the tab. Send from Omentir.",
    query: "grok.com sales outreach",
    kicker: "Connector",
    cluster: "linkedin",
    publishedDate: DATE,
    updatedDate: DATE,
    keywords: ["grok.com sales", "Grok chat LinkedIn", "Grok connector Omentir"],
    sections: [
      {
        heading: "The job",
        paragraphs: [
          "grok.com is a custom connector, like Claude. Grok Bot is Plugins plus a computer. If chat Grok asks you to take over for LinkedIn, refuse.",
        ],
      },
      {
        heading: "Paste this into grok.com",
        paragraphs: [
          "Finish Omentir first. Approve Connect workspace. Replace the brackets.",
        ],
        code: GROK_CHAT_FIRST_JOB_PROMPT,
      },
    ],
    faqItems: [
      {
        question: "Is this Grok Bot?",
        answer: "No. See [Grok Bot versus grok.com](/help/what-is-the-difference-between-grok-bot-and-grok-com).",
      },
      {
        question: "Can I use Plugins here?",
        answer: "Plugins belong to Grok Bot.",
      },
    ],
    related: [
      { label: "Can I use grok.com for LinkedIn outreach?", href: "/help/can-i-use-grok-com-for-linkedin-outreach" },
      { label: "Grok integration", href: "/integrations/grok" },
      { label: "grok.com for LinkedIn outreach", href: "/blogs/grok-com-linkedin-outreach" },
    ],
    relatedHeading: "More on grok.com",
  },
  {
    slug: "openclaw-sales-outreach",
    title: "OpenClaw for sales outreach",
    description:
      "Use OpenClaw as a local operator with a Bearer key. A leaked token is a leaked workspace. Draft on the machine. Send from Omentir.",
    query: "openclaw sales outreach",
    kicker: "Local",
    cluster: "linkedin",
    publishedDate: DATE,
    updatedDate: DATE,
    keywords: ["OpenClaw sales", "OpenClaw MCP LinkedIn", "OpenClaw Omentir"],
    sections: [
      {
        heading: "The job",
        paragraphs: [
          "OpenClaw is a local runtime. Store the key in secret storage, never in a skill file you commit. Fetch [agents.md](https://omentir.com/agents.md). Call get_context before create.",
        ],
      },
      {
        heading: "Paste this into OpenClaw",
        paragraphs: [
          "Finish Omentir first. Point MCP at https://omentir.com/api/agent/v1/mcp with Bearer auth.",
        ],
        code: OPENCLAW_FIRST_JOB_PROMPT,
      },
    ],
    faqItems: [
      {
        question: "Is this a chat connector?",
        answer: "No. ChatGPT and Claude use workspace approval. OpenClaw uses a key.",
      },
      {
        question: "Is this the same as Hermes?",
        answer: "Hermes here is a local paste. OpenClaw can call Omentir tools.",
      },
    ],
    related: [
      { label: "How do I connect OpenClaw to Omentir?", href: "/help/how-do-i-connect-openclaw-to-omentir" },
      { label: "OpenClaw integration", href: "/integrations/openclaw" },
      { label: "OpenClaw LinkedIn leads", href: "/blogs/openclaw-linkedin-leads" },
    ],
    relatedHeading: "More on OpenClaw",
  },
];
