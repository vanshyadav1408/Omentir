import type { GuidePage } from "./types";
import { CURSOR_FIRST_JOB_PROMPT } from "../cursor-setup";

const DATE = "August 27, 2026";

export const CURSOR_GUIDES: GuidePage[] = [
  {
    slug: "cursor-sales-outreach",
    title: "Cursor for sales outreach",
    description:
      "Use Cursor as the editor operator on Omentir. Update My Product from the file you have open. Inspect before you create. Send from the workspace. Close the editor and the session stops.",
    query: "cursor sales outreach",
    kicker: "Editor",
    cluster: "linkedin",
    publishedDate: DATE,
    updatedDate: DATE,
    keywords: [
      "Cursor sales",
      "Cursor LinkedIn outreach",
      "Cursor MCP Omentir",
      "Cursor coding agent sales",
    ],
    sections: [
      {
        heading: "The job",
        paragraphs: [
          "[Cursor](https://cursor.com) is the editor. The agent sits next to the landing page, the README, and the diff. That is useful for outbound only if you use that context. A vague pipeline request wastes the window.",
        ],
        bullets: [
          "Update My Product from the file you have highlighted.",
          "Fetch agents.md. Call get_context. List agents.",
          "Ask for a create_agent config in the chat before you say yes.",
          "Send from Omentir. Do not sign into LinkedIn from Cursor.",
        ],
      },
      {
        heading: "Who does what",
        paragraphs: [
          "Cursor owns the editor-native check and a scored list you can read. You own the campaign and the meeting. Auth is a Bearer key. ChatGPT and Claude chat use workspace approval instead.",
        ],
      },
      {
        heading: "Paste this into Cursor",
        paragraphs: [
          "Finish Omentir first. Put the key in Cursor's secret store. Point MCP at https://omentir.com/api/agent/v1/mcp. Fetch [agents.md](https://omentir.com/agents.md). Replace the brackets. Keep the last two sentences.",
        ],
        code: CURSOR_FIRST_JOB_PROMPT,
      },
    ],
    faqItems: [
      {
        question: "Is Cursor the same as Claude Code for sales?",
        answer:
          "Same key pattern. Different window. Cursor is the editor. Claude Code is the terminal. See [Claude Code versus Cursor](/blogs/claude-code-vs-cursor-for-outbound).",
      },
      {
        question: "Does Cursor keep working after I close the app?",
        answer:
          "No. Overnight on a shared computer is [Grok Bot](/help/what-is-the-difference-between-grok-bot-and-grok-com), a different product.",
      },
      {
        question: "Can Cursor send LinkedIn messages?",
        answer:
          "It can call Omentir tools under your campaign and safety settings. It should not type in LinkedIn. Keep send behind review.",
      },
      {
        question: "Do I need Cursor if I already use Omentir?",
        answer:
          "No. Overview already finds people and drafts notes. Add Cursor if the product already lives in that editor.",
      },
    ],
    related: [
      { label: "Cursor outbound", href: "/use-cases/cursor-outbound" },
      { label: "Cursor integration", href: "/integrations/cursor" },
      { label: "Cursor for LinkedIn outreach", href: "/blogs/cursor-linkedin-outreach" },
    ],
    relatedHeading: "More on Cursor",
  },
];
