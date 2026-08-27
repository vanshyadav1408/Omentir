import type { HelpPageDraft } from "./types";

const DATE = "August 27, 2026";

export const HELP_PAGES_Q: HelpPageDraft[] = [
  {
    slug: "how-do-i-connect-claude-code-to-omentir",
    question: "How do I connect Claude Code to Omentir?",
    description:
      "Create a revocable API key. Point Claude Code at the MCP URL with Bearer auth. Fetch agents.md. Do not use the Claude chat connector path, and do not put LinkedIn on the terminal.",
    keywords: [
      "connect Claude Code to Omentir",
      "Claude Code MCP",
      "Claude Code API key LinkedIn",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Claude Code talks to Omentir like other coding agents: a key, not a chat connector. Create the key on the API keys page. Store it in the environment Claude Code already uses for secrets. Send Authorization Bearer on [https://omentir.com/api/agent/v1/mcp](https://omentir.com/api/agent/v1/mcp). REST lives at https://omentir.com/api/agent/v1 if you prefer HTTP.",
      "Finish Omentir first: LinkedIn connected inside Omentir, [My Product](/features/my-product) written in two sentences a stranger would understand. Then fetch [agents.md](https://omentir.com/agents.md) before you let the session create a finder.",
      "This is not Claude on claude.com. Chat Claude uses Settings, Connectors, and workspace approval. Pasting a Bearer token into that UI, or waiting for an OAuth screen in Claude Code, is the wrong path. Chat setup: [Claude integration](/integrations/claude). Terminal setup: [Claude Code integration](/integrations/claude-code).",
      "Start with get_context and list_agents. If you want a new finder, ask it to show the config and wait. Creating an agent should be a named request, the same way merging a pull request is a named request.",
      "Claude Code should never sign into LinkedIn. Caps and send stay in Omentir. The longer walkthrough is [Claude Code for LinkedIn outreach](/blogs/claude-code-linkedin-outreach).",
    ],
    faqItems: [
      {
        question: "Can I use the same MCP URL as Claude chat?",
        answer:
          "The hosted endpoint is the same. Auth is not. Chat uses workspace approval. Claude Code uses a revocable key.",
      },
      {
        question: "Where do I put the key?",
        answer:
          "In the environment Claude Code already uses for secrets. Do not commit it. Do not paste it into a group chat.",
      },
      {
        question: "Does Claude Code get my LinkedIn password?",
        answer:
          "No. It calls Omentir tools. LinkedIn stays connected inside Omentir.",
      },
      {
        question: "Is Cursor the same setup?",
        answer:
          "Same key pattern, different window. See [Claude Code versus Cursor for outbound](/blogs/claude-code-vs-cursor-for-outbound).",
      },
    ],
    relatedSlugs: [
      "can-i-use-claude-code-for-linkedin-outreach",
      "should-i-use-claude-code-or-claude-chat-for-sales",
      "can-i-use-chatgpt-to-write-linkedin-messages",
    ],
  },
  {
    slug: "can-i-use-claude-code-for-linkedin-outreach",
    question: "Can I use Claude Code for LinkedIn outreach?",
    description:
      "Yes as a terminal operator that researches and drafts through Omentir. No as a LinkedIn client, and no as an overnight Bot. Close the session and the work stops.",
    keywords: [
      "Claude Code LinkedIn outreach",
      "can I use Claude Code for sales",
      "Claude Code cold LinkedIn",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Claude Code is useful when the product already lives in a repo. The same session can read My Product, compare it with a README, pull a small batch, and write two-sentence drafts. That is a real job. A terminal clicking Connect is not.",
      "Connect with a Bearer key. Ask for get_context, then list_agents, then a scored list of twenty to thirty people. Keep send, enroll, and LinkedIn login off the session. You start the campaign in Omentir after you cut the junk.",
      "It will not leave a review list while you sleep. That is [Grok Bot](/help/can-i-use-grok-bot-for-linkedin-outreach), a different app. Claude Code stops when you close the terminal.",
      "If you are not already in Claude Code, skip it. Overview finds leads without a coding agent. Do not install Claude Code only to operate LinkedIn.",
      "Setup: [how to connect Claude Code](/help/how-do-i-connect-claude-code-to-omentir). The chat product is [should I use Claude Code or Claude chat](/help/should-i-use-claude-code-or-claude-chat-for-sales).",
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
          "Diff My Product against the repo, then up to 30 people, drafts only. See [Claude Code for LinkedIn outreach](/blogs/claude-code-linkedin-outreach).",
      },
    ],
    relatedSlugs: [
      "how-do-i-connect-claude-code-to-omentir",
      "should-i-use-claude-code-or-claude-chat-for-sales",
      "can-i-use-grok-bot-for-linkedin-outreach",
    ],
  },
  {
    slug: "should-i-use-claude-code-or-claude-chat-for-sales",
    question: "Should I use Claude Code or Claude chat for sales?",
    description:
      "Claude chat is a connector session you sit with. Claude Code is a terminal agent with an API key. Same Omentir tools. Different auth. Pick the window you already have open.",
    keywords: [
      "Claude Code vs Claude chat sales",
      "Claude Code or Claude for LinkedIn",
      "Claude connector vs Claude Code",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Omentir has two Claude pages on purpose. [Claude](/integrations/claude) is the chat product: Settings, Connectors, paste the MCP URL, approve Connect workspace. No API key for that path. Useful this afternoon. It stops when you close the tab.",
      "[Claude Code](/integrations/claude-code) is the terminal product. You create a key, put it in the environment, and call the same MCP URL with Bearer. Useful when the repo is already open. It also stops when you close the session. It does not get Grok Bot's cloud computer.",
      "Do not run both plus Cursor on day one. Two review lists you never read are worse than one you finish. If you only needed a conversation, use chat. If you only needed the terminal, use Claude Code.",
      "Neither product should hold your LinkedIn password. LinkedIn stays in Omentir. The coding-agent comparison is [Claude Code versus Cursor](/blogs/claude-code-vs-cursor-for-outbound).",
      "Most founders should start in Overview with no extra operator. Add the Claude you already pay for. Do not buy Claude Code only to send LinkedIn notes.",
    ],
    faqItems: [
      {
        question: "Can I use chat if I do not have Claude Code?",
        answer:
          "Yes. The connector is enough to operate Omentir in a session. You will not get a repo-native loop.",
      },
      {
        question: "Does Claude Code include claude.com chat?",
        answer:
          "They are separate products. A Max or Team plan that includes Claude Code is not the same as opening claude.com.",
      },
      {
        question: "Which one keeps working overnight?",
        answer:
          "Neither. Overnight on a persistent computer is [Grok Bot](/help/what-is-the-difference-between-grok-bot-and-grok-com).",
      },
      {
        question: "Do they share MCP login with Cursor?",
        answer:
          "Claude Code and Cursor both use a Bearer key. Claude chat uses connector approval. Grok Bot shares MCP login with Cursor on its plugin path, which is a different product.",
      },
    ],
    relatedSlugs: [
      "how-do-i-connect-claude-code-to-omentir",
      "can-i-use-claude-code-for-linkedin-outreach",
      "what-is-the-difference-between-grok-bot-and-grok-com",
    ],
  },
];
