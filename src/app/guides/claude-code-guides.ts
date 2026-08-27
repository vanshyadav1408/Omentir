import type { GuidePage } from "./types";
import { CLAUDE_CODE_FIRST_JOB_PROMPT } from "../claude-code-setup";

const DATE = "August 27, 2026";

export const CLAUDE_CODE_GUIDES: GuidePage[] = [
  {
    slug: "claude-code-sales-outreach",
    title: "Claude Code for sales outreach",
    description:
      "Use Claude Code as a terminal operator on Omentir. Diff My Product against the repo. Draft in the session. Send from the workspace. Close the terminal and the job stops.",
    query: "claude code sales outreach",
    kicker: "Terminal",
    cluster: "linkedin",
    publishedDate: DATE,
    updatedDate: DATE,
    keywords: [
      "Claude Code sales",
      "Claude Code LinkedIn outreach",
      "Claude Code Omentir",
      "Claude Code MCP sales",
    ],
    sections: [
      {
        heading: "The job",
        paragraphs: [
          "[Claude Code](https://claude.com/product/claude-code) is a repo session, not an overnight Bot. The same terminal that is editing the landing page can read Omentir over MCP, score a batch, and leave drafts.",
        ],
        bullets: [
          "Diff: compare My Product with the README you just changed.",
          "Read: get_context, then list_agents, before create.",
          "Draft: up to 30 people, fit notes, two sentences that cite a real trigger.",
          "Stop: do not send, do not enroll, do not sign into LinkedIn.",
        ],
      },
      {
        heading: "Who does what",
        paragraphs: [
          "Claude Code owns the repo-native check and the first scored list. You own the review, the campaign, and the meeting. Auth is a revocable API key, not the Claude chat connector.",
        ],
      },
      {
        heading: "Paste this into Claude Code",
        paragraphs: [
          "Finish Omentir first. Put the key in the environment Claude Code already uses for secrets. Point it at https://omentir.com/api/agent/v1/mcp with Bearer auth. Fetch [agents.md](https://omentir.com/agents.md). Replace the brackets. Keep the last two sentences.",
        ],
        code: CLAUDE_CODE_FIRST_JOB_PROMPT,
      },
    ],
    faqItems: [
      {
        question: "Does Claude Code keep working after I close the terminal?",
        answer:
          "No. That is [Grok Bot](/help/what-is-the-difference-between-grok-bot-and-grok-com). Claude Code is a session in the repo.",
      },
      {
        question: "Is this the same as Claude on claude.com?",
        answer:
          "No. Chat Claude uses Settings, Connectors, and workspace approval. Claude Code uses a Bearer key. See [Claude Code or Claude chat](/help/should-i-use-claude-code-or-claude-chat-for-sales).",
      },
      {
        question: "Can Claude Code send LinkedIn messages?",
        answer:
          "It can call Omentir tools under your campaign and safety settings. It should not type in LinkedIn. Keep send behind review.",
      },
      {
        question: "Should I pick Cursor instead?",
        answer:
          "Pick the window you already live in. Cursor is the editor. Claude Code is the terminal. Same key pattern. See [Claude Code versus Cursor](/blogs/claude-code-vs-cursor-for-outbound).",
      },
      {
        question: "Do I need Claude Code if I already use Omentir?",
        answer:
          "No. Overview already finds people and drafts notes. Add Claude Code if that terminal is already open.",
      },
    ],
    related: [
      { label: "Claude Code outbound", href: "/use-cases/claude-code-outbound" },
      { label: "Claude Code integration", href: "/integrations/claude-code" },
      { label: "Claude Code for LinkedIn outreach", href: "/blogs/claude-code-linkedin-outreach" },
    ],
    relatedHeading: "More on Claude Code",
  },
];
