import type { HelpPageDraft } from "./types";

const DATE = "August 27, 2026";

export const HELP_PAGES_T: HelpPageDraft[] = [
  {
    slug: "how-do-i-connect-chatgpt-to-omentir",
    question: "How do I connect ChatGPT to Omentir?",
    description:
      "Add a custom MCP connector in ChatGPT. Paste the Omentir MCP URL. Sign in and approve Connect workspace. No API key for that path. ChatGPT should not hold LinkedIn.",
    keywords: [
      "connect ChatGPT to Omentir",
      "ChatGPT MCP connector",
      "ChatGPT LinkedIn Omentir",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "ChatGPT talks to Omentir as a chat app, not as a coding agent. In ChatGPT, open Settings, then Connectors, and add a custom connector with [https://omentir.com/api/agent/v1/mcp](https://omentir.com/api/agent/v1/mcp). Sign in on Omentir when prompted. Approve Connect workspace. Enable tools in the conversation if ChatGPT asks.",
      "Finish Omentir first: LinkedIn connected inside Omentir, [My Product](/features/my-product) written in two sentences a stranger would understand. Then ask ChatGPT to run get_context and list_agents before it creates a finder.",
      "There is no API key on this path. Cursor, Claude Code, and Codex use a Bearer token instead. Pasting a key into ChatGPT's connector UI is the wrong path. Editor setup: [how to connect Cursor](/help/how-do-i-connect-cursor-to-omentir).",
      "This session ends when you close the tab. Overnight on a shared computer is [Grok Bot](/help/what-is-the-difference-between-grok-bot-and-grok-com), a different product.",
      "ChatGPT should never sign into LinkedIn. Caps and send stay in Omentir. If you only needed copy, see [can I use ChatGPT to write LinkedIn messages](/help/can-i-use-chatgpt-to-write-linkedin-messages).",
    ],
    faqItems: [
      {
        question: "Do I need an API key for ChatGPT?",
        answer:
          "No. Chat connectors use workspace approval. Coding agents use a revocable key.",
      },
      {
        question: "Does ChatGPT get my LinkedIn password?",
        answer:
          "No. It calls Omentir tools. LinkedIn stays connected inside Omentir.",
      },
      {
        question: "Is this the same as Codex?",
        answer:
          "No. Codex stores MCP in config.toml. See [Codex or ChatGPT](/help/should-i-use-codex-or-chatgpt-for-sales).",
      },
      {
        question: "Can it send without me?",
        answer:
          "Not if you keep send behind review, which you should. Close the tab and the session stops.",
      },
    ],
    relatedSlugs: [
      "can-i-use-chatgpt-to-write-linkedin-messages",
      "should-i-use-cursor-or-chatgpt-for-sales",
      "should-i-use-codex-or-chatgpt-for-sales",
    ],
  },
  {
    slug: "how-do-i-connect-claude-to-omentir",
    question: "How do I connect Claude to Omentir?",
    description:
      "Add a custom MCP connector in Claude. Paste the Omentir MCP URL. Approve Connect workspace. This is claude.com chat, not Claude Code, and it should not hold LinkedIn.",
    keywords: [
      "connect Claude to Omentir",
      "Claude MCP connector",
      "Claude LinkedIn Omentir",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Claude chat talks to Omentir through Settings, Connectors, and workspace approval. Add a custom connector with [https://omentir.com/api/agent/v1/mcp](https://omentir.com/api/agent/v1/mcp). Sign in on Omentir. Approve Connect workspace. Enable tools in the conversation if Claude asks.",
      "Finish Omentir first. Ask Claude to run get_context and list_agents before it creates a finder. Give it the ICP in the same message. Guessing is how you message the wrong titles at full pace.",
      "This is not [Claude Code](/help/how-do-i-connect-claude-code-to-omentir). Claude Code uses a Bearer key in a terminal. Mixing those paths is how people wait for an OAuth screen in the CLI, or paste a token into the chat connector UI.",
      "The chat ends when you close the tab. Overnight research is Grok Bot. A repo-native loop is Claude Code. Pick one.",
      "Claude should never sign into LinkedIn. Caps and send stay in Omentir. Integration notes: [Claude integration](/integrations/claude).",
    ],
    faqItems: [
      {
        question: "Do I need Claude Code for this?",
        answer:
          "No. The chat connector is enough to operate Omentir this afternoon. Claude Code is for a repo session.",
      },
      {
        question: "Does Claude get my LinkedIn password?",
        answer:
          "No. It calls Omentir tools. LinkedIn stays connected inside Omentir.",
      },
      {
        question: "Can I run Claude chat and Claude Code together?",
        answer:
          "You can. You should not on day one. Two review lists you never read are worse than one you finish.",
      },
      {
        question: "Where is the longer page?",
        answer:
          "See [Claude chat for LinkedIn outreach](/blogs/claude-chat-linkedin-outreach).",
      },
    ],
    relatedSlugs: [
      "should-i-use-claude-code-or-claude-chat-for-sales",
      "how-do-i-connect-claude-code-to-omentir",
      "how-do-i-connect-chatgpt-to-omentir",
    ],
  },
  {
    slug: "can-i-use-grok-com-for-linkedin-outreach",
    question: "Can I use grok.com for LinkedIn outreach?",
    description:
      "Yes as a chat connector session you sit with. No as Grok Bot, and no as a LinkedIn client. grok.com does not have a cloud computer. Close the tab and the work stops.",
    keywords: [
      "grok.com LinkedIn outreach",
      "Grok chat LinkedIn",
      "Grok connector Omentir",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "grok.com can operate Omentir the same way Claude and ChatGPT do: Settings, Connectors, paste [https://omentir.com/api/agent/v1/mcp](https://omentir.com/api/agent/v1/mcp), approve Connect workspace. That is a session you sit with. It is not [Grok Bot](/help/what-is-the-difference-between-grok-bot-and-grok-com).",
      "Ask for get_context, then list_agents, then a scored list of twenty to thirty people. Keep send behind review. Do not take over for a LinkedIn password. Grok Bot is the product with a computer. grok.com is not.",
      "If you wanted overnight research, that is Grok Bot, and only if you already pay for a plan that includes it. If you wanted a chat this afternoon, grok.com is enough.",
      "If you do not already live in Grok, skip it. Overview finds leads without another operator. Do not add grok.com only to have a third connector you never open.",
      "Setup: [Grok integration](/integrations/grok). The Bot version is [can I use Grok Bot for LinkedIn outreach](/help/can-i-use-grok-bot-for-linkedin-outreach).",
    ],
    faqItems: [
      {
        question: "Does grok.com keep working after I close the tab?",
        answer:
          "No. That is Grok Bot. grok.com is a chat session.",
      },
      {
        question: "Can I use Plugins on grok.com?",
        answer:
          "Plugins and the shared computer belong to Grok Bot. grok.com uses a custom connector, like Claude.",
      },
      {
        question: "Should I pick Grok Bot instead?",
        answer:
          "Only if you already pay for it and you will read the morning list. Most founders should start in Overview or a chat they already open.",
      },
      {
        question: "Does Grok get my LinkedIn password?",
        answer:
          "It should not. Keep LinkedIn inside Omentir. If chat Grok asks you to take over for a login, refuse.",
      },
    ],
    relatedSlugs: [
      "what-is-the-difference-between-grok-bot-and-grok-com",
      "can-i-use-grok-bot-for-linkedin-outreach",
      "how-do-i-connect-chatgpt-to-omentir",
    ],
  },
  {
    slug: "how-do-i-connect-openclaw-to-omentir",
    question: "How do I connect OpenClaw to Omentir?",
    description:
      "Create a revocable API key. Put it in OpenClaw's secret storage, never in a skill file you commit. Call MCP or REST. Fetch agents.md. OpenClaw is a local runtime, not a chat connector.",
    keywords: [
      "connect OpenClaw to Omentir",
      "OpenClaw MCP",
      "OpenClaw API key LinkedIn",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "OpenClaw talks to Omentir like other local operators: a key, not a hosted connector. Create the key on the API keys page. Store it in OpenClaw's secret storage. Send Authorization Bearer on [https://omentir.com/api/agent/v1/mcp](https://omentir.com/api/agent/v1/mcp), or use REST at https://omentir.com/api/agent/v1.",
      "A leaked token is a leaked workspace. Do not put the key in a skill file you might commit. Rotate it if the machine is shared.",
      "Finish Omentir first. Fetch [agents.md](https://omentir.com/agents.md). Start with get_context and list_agents. If you want a new finder, show the config and wait.",
      "OpenClaw is extra surface if you do not already run it. Claude, ChatGPT, and Grok are faster if you only wanted a hosted chat. Local setup: [OpenClaw integration](/integrations/openclaw).",
      "OpenClaw should never sign into LinkedIn. Caps and send stay in Omentir. Longer walkthrough: [OpenClaw for LinkedIn outreach](/blogs/openclaw-linkedin-leads).",
    ],
    faqItems: [
      {
        question: "Is OpenClaw a chat connector?",
        answer:
          "No. It is a local runtime with a Bearer key. ChatGPT and Claude use workspace approval instead.",
      },
      {
        question: "Does OpenClaw get my LinkedIn password?",
        answer:
          "No. It calls Omentir tools. LinkedIn stays connected inside Omentir.",
      },
      {
        question: "Should I run OpenClaw if I already use Cursor?",
        answer:
          "Not on day one. One coding agent you actually watch is better than two you forget.",
      },
      {
        question: "Where do I put the key?",
        answer:
          "In OpenClaw's secret storage. Never in a committed skill file.",
      },
    ],
    relatedSlugs: [
      "can-i-use-openclaw-for-linkedin-outreach",
      "how-do-i-connect-cursor-to-omentir",
      "how-do-i-connect-chatgpt-to-omentir",
    ],
  },
  {
    slug: "can-i-use-openclaw-for-linkedin-outreach",
    question: "Can I use OpenClaw for LinkedIn outreach?",
    description:
      "Yes as a local operator that researches and drafts through Omentir. No as a LinkedIn client. Close the runtime and the work stops. A leaked token is a leaked workspace.",
    keywords: [
      "OpenClaw LinkedIn outreach",
      "can I use OpenClaw for sales",
      "OpenClaw MCP sales",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "OpenClaw is useful when you already run an operator on your machine. The same runtime can read My Product, pull a small batch, and leave drafts. That is a real job. A local agent clicking Connect is not.",
      "Connect with a Bearer key. Ask for get_context, then list_agents, then a scored list of twenty to thirty people. Keep send, enroll, and LinkedIn login off the session.",
      "It will not leave a review list while you sleep unless you leave the process running and never read it. That is still your problem. Overnight on a shared cloud computer is [Grok Bot](/help/can-i-use-grok-bot-for-linkedin-outreach).",
      "If you are not already in OpenClaw, skip it. Overview finds leads without a local runtime. Do not install OpenClaw only to operate LinkedIn.",
      "Setup: [how to connect OpenClaw](/help/how-do-i-connect-openclaw-to-omentir).",
    ],
    faqItems: [
      {
        question: "Can it send without me?",
        answer:
          "Not if you keep send behind review, which you should. Omentir still enforces caps.",
      },
      {
        question: "Is this the same as Cursor?",
        answer:
          "Both use a Bearer key. Cursor is the editor. OpenClaw is a local runtime you operate. Pick the one you already run.",
      },
      {
        question: "What should the first job be?",
        answer:
          "Read context, list agents, then up to 30 people, drafts only. See [OpenClaw LinkedIn leads](/blogs/openclaw-linkedin-leads).",
      },
      {
        question: "Is this allowed by LinkedIn?",
        answer:
          "Writing with a model is not the same as a bot clicking the site. The send path still has to look like you. See [is LinkedIn automation allowed](/help/is-linkedin-automation-allowed).",
      },
    ],
    relatedSlugs: [
      "how-do-i-connect-openclaw-to-omentir",
      "can-i-use-cursor-for-linkedin-outreach",
      "can-i-use-grok-bot-for-linkedin-outreach",
    ],
  },
];
