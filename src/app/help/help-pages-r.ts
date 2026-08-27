import type { HelpPageDraft } from "./types";

const DATE = "August 27, 2026";

export const HELP_PAGES_R: HelpPageDraft[] = [
  {
    slug: "how-do-i-connect-cursor-to-omentir",
    question: "How do I connect Cursor to Omentir?",
    description:
      "Create a revocable API key. Point Cursor at the MCP URL with Bearer auth. Fetch agents.md. Do not use the ChatGPT connector path, and do not put LinkedIn in the editor.",
    keywords: [
      "connect Cursor to Omentir",
      "Cursor MCP",
      "Cursor API key LinkedIn",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Cursor talks to Omentir like other coding agents: a key, not a chat connector. Create the key on the API keys page. Store it in Cursor's secret store. Send Authorization Bearer on [https://omentir.com/api/agent/v1/mcp](https://omentir.com/api/agent/v1/mcp). REST lives at https://omentir.com/api/agent/v1 if you prefer HTTP.",
      "Finish Omentir first: LinkedIn connected inside Omentir, [My Product](/features/my-product) written in two sentences a stranger would understand. Then fetch [agents.md](https://omentir.com/agents.md) before you let the session create a finder.",
      "This is not ChatGPT. ChatGPT uses Settings, Connectors, and workspace approval. Pasting a Bearer token into that UI, or waiting for an OAuth screen in Cursor, is the wrong path. Chat setup: [ChatGPT integration](/integrations/chatgpt). Editor setup: [Cursor integration](/integrations/cursor).",
      "Start with get_context and list_agents. If you want a new finder, ask Cursor to show the config next to the file and wait. Creating an agent should be a named request, the same way merging a pull request is a named request.",
      "Cursor should never sign into LinkedIn. Caps and send stay in Omentir. The longer walkthrough is [Cursor for LinkedIn outreach](/blogs/cursor-linkedin-outreach).",
    ],
    faqItems: [
      {
        question: "Can I use the same MCP URL as ChatGPT?",
        answer:
          "The hosted endpoint is the same. Auth is not. Chat uses workspace approval. Cursor uses a revocable key.",
      },
      {
        question: "Where do I put the key?",
        answer:
          "In Cursor's secret store or an environment variable the editor already reads. Do not commit it.",
      },
      {
        question: "Does Cursor get my LinkedIn password?",
        answer:
          "No. It calls Omentir tools. LinkedIn stays connected inside Omentir.",
      },
      {
        question: "Is Claude Code the same setup?",
        answer:
          "Same key pattern, different window. See [Claude Code versus Cursor for outbound](/blogs/claude-code-vs-cursor-for-outbound).",
      },
    ],
    relatedSlugs: [
      "can-i-use-cursor-for-linkedin-outreach",
      "should-i-use-cursor-or-chatgpt-for-sales",
      "how-do-i-connect-claude-code-to-omentir",
    ],
  },
  {
    slug: "can-i-use-cursor-for-linkedin-outreach",
    question: "Can I use Cursor for LinkedIn outreach?",
    description:
      "Yes as an editor operator that researches and drafts through Omentir. No as a LinkedIn client, and no as an overnight Bot. Close the editor and the work stops.",
    keywords: [
      "Cursor LinkedIn outreach",
      "can I use Cursor for sales",
      "Cursor cold LinkedIn",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Cursor is useful when the product already lives in the editor. Highlight a landing paragraph. Ask the agent to update My Product. Then pull a small batch and write two-sentence drafts. That is a real job. An editor clicking Connect is not.",
      "Connect with a Bearer key. Ask for get_context, then list_agents, then a scored list of twenty to thirty people. Keep send, enroll, and LinkedIn login off the session. You start the campaign in Omentir after you cut the junk.",
      "It will not leave a review list while you sleep. That is [Grok Bot](/help/can-i-use-grok-bot-for-linkedin-outreach), a different app. Cursor stops when you close the window.",
      "If you are not already in Cursor, skip it. Overview finds leads without a coding agent. Do not install Cursor only to operate LinkedIn.",
      "Setup: [how to connect Cursor](/help/how-do-i-connect-cursor-to-omentir). Chat versus editor: [should I use Cursor or ChatGPT](/help/should-i-use-cursor-or-chatgpt-for-sales).",
    ],
    faqItems: [
      {
        question: "Can it send without me?",
        answer:
          "Not if you keep send behind review, which you should. Omentir still enforces caps. It does not enforce taste.",
      },
      {
        question: "Should I let it create a campaign during a coding session?",
        answer:
          "No. Name the outreach request. A refactor that also spins up a finder is how targeting drifts.",
      },
      {
        question: "Is this allowed by LinkedIn?",
        answer:
          "Writing with a model is not the same as a bot clicking the site. The send path still has to look like you. See [is LinkedIn automation allowed](/help/is-linkedin-automation-allowed).",
      },
      {
        question: "What should the first job be?",
        answer:
          "Update My Product from the open file, then up to 30 people, drafts only. See [Cursor for LinkedIn outreach](/blogs/cursor-linkedin-outreach).",
      },
    ],
    relatedSlugs: [
      "how-do-i-connect-cursor-to-omentir",
      "should-i-use-cursor-or-chatgpt-for-sales",
      "can-i-use-claude-code-for-linkedin-outreach",
    ],
  },
  {
    slug: "should-i-use-cursor-or-chatgpt-for-sales",
    question: "Should I use Cursor or ChatGPT for sales?",
    description:
      "ChatGPT is a connector session you sit with. Cursor is an editor agent with an API key. Same Omentir tools. Different auth. Pick the window you already have open.",
    keywords: [
      "Cursor vs ChatGPT sales",
      "Cursor or ChatGPT for LinkedIn",
      "ChatGPT connector vs Cursor",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Omentir has two OpenAI-adjacent pages on purpose. [ChatGPT](/integrations/chatgpt) is the chat product: Settings, Connectors, paste the MCP URL, approve Connect workspace. No API key for that path. Useful this afternoon. It stops when you close the tab.",
      "[Cursor](/integrations/cursor) is the editor. You create a key, put it in the secret store, and call the same MCP URL with Bearer. Useful when the repo is already open. It also stops when you close the session. It does not get Grok Bot's cloud computer.",
      "Do not run Cursor plus Claude Code plus ChatGPT on day one. Two review lists you never read are worse than one you finish. If you only needed a conversation, use ChatGPT. If you only needed the editor, use Cursor.",
      "Neither product should hold your LinkedIn password. LinkedIn stays in Omentir. The terminal comparison is [Claude Code versus Cursor](/blogs/claude-code-vs-cursor-for-outbound).",
      "Most founders should start in Overview with no extra operator. Add the surface you already pay for. Do not buy Cursor only to send LinkedIn notes.",
    ],
    faqItems: [
      {
        question: "Can I use ChatGPT if I do not have Cursor?",
        answer:
          "Yes. The connector is enough to operate Omentir in a session. You will not get an editor-native loop.",
      },
      {
        question: "Is Codex the same as Cursor?",
        answer:
          "No. Codex stores MCP in ~/.codex/config.toml and shares that file with the Codex CLI and extension. Cursor has its own MCP client. See [how to connect Codex](/help/how-do-i-connect-codex-to-omentir).",
      },
      {
        question: "Which one keeps working overnight?",
        answer:
          "Neither. Overnight on a persistent computer is [Grok Bot](/help/what-is-the-difference-between-grok-bot-and-grok-com).",
      },
      {
        question: "Do they share login with Claude chat?",
        answer:
          "No. Claude chat uses connector approval. Cursor uses a Bearer key. Claude Code uses a Bearer key too, in a terminal.",
      },
    ],
    relatedSlugs: [
      "how-do-i-connect-cursor-to-omentir",
      "can-i-use-cursor-for-linkedin-outreach",
      "can-i-use-chatgpt-to-write-linkedin-messages",
    ],
  },
];
