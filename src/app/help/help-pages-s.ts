import type { HelpPageDraft } from "./types";

const DATE = "August 27, 2026";

export const HELP_PAGES_S: HelpPageDraft[] = [
  {
    slug: "how-do-i-connect-codex-to-omentir",
    question: "How do I connect Codex to Omentir?",
    description:
      "Add a streamable HTTP MCP server in ~/.codex/config.toml. Point url at the Omentir MCP endpoint. Put the token name in bearer_token_env_var, not the token itself. Then run /mcp.",
    keywords: [
      "connect Codex to Omentir",
      "Codex MCP config.toml",
      "Codex bearer_token_env_var",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Codex does not use the ChatGPT connector UI for this path. Configuration lives in ~/.codex/config.toml, or in a project .codex/config.toml if that repo is trusted. The table name is mcp_servers, with an underscore. mcp-servers is ignored.",
      "Create a revocable API key on the API keys page. Export it as an environment variable before you launch Codex. Add an mcp_servers.omentir table with url https://omentir.com/api/agent/v1/mcp and bearer_token_env_var set to OMENTIR_API_KEY. That field is the name of the variable. Do not paste the token, and do not write $OMENTIR_API_KEY.",
      "Finish Omentir first: LinkedIn connected, [My Product](/features/my-product) written. Start a Codex session and run /mcp. If the server is missing, the env var was empty at launch, the project file was not trusted, or the table name is wrong.",
      "The CLI and the IDE extension share the same config file. ChatGPT chat is still the connector product. Do not mix those. Fetch [agents.md](https://omentir.com/agents.md) before you let Codex create a finder.",
      "Codex should never sign into LinkedIn. Caps and send stay in Omentir. Longer walkthrough: [Codex for LinkedIn outreach](/blogs/codex-linkedin-outreach). Integration notes: [Codex integration](/integrations/codex).",
    ],
    faqItems: [
      {
        question: "Can I paste the token into config.toml?",
        answer:
          "You can. You should not. The file is easy to commit. Use bearer_token_env_var with the variable name.",
      },
      {
        question: "Is this the same as connecting ChatGPT?",
        answer:
          "No. ChatGPT chat uses Settings, Connectors, and workspace approval. Codex uses TOML and a Bearer env var.",
      },
      {
        question: "Does project-local config always load?",
        answer:
          "Only for trusted projects. If tools never appear, try the global ~/.codex/config.toml first.",
      },
      {
        question: "Does Codex get my LinkedIn password?",
        answer:
          "No. It calls Omentir tools. LinkedIn stays connected inside Omentir.",
      },
    ],
    relatedSlugs: [
      "can-i-use-codex-for-linkedin-outreach",
      "should-i-use-codex-or-chatgpt-for-sales",
      "how-do-i-connect-cursor-to-omentir",
    ],
  },
  {
    slug: "can-i-use-codex-for-linkedin-outreach",
    question: "Can I use Codex for LinkedIn outreach?",
    description:
      "Yes as a coding agent that researches and drafts through Omentir MCP. No as a LinkedIn client. Close the Codex session and the work stops.",
    keywords: [
      "Codex LinkedIn outreach",
      "OpenAI Codex sales",
      "Codex MCP LinkedIn",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Codex is useful when you already run OpenAI's coding agent against the repo. The same session can read My Product, pull a small batch, and leave drafts. That is a real job. Codex clicking Connect is not.",
      "Wire MCP in config.toml. Ask for get_context, then list_agents, then a scored list of twenty to thirty people. Keep send, enroll, and LinkedIn login off the session. You start the campaign in Omentir after you cut the junk.",
      "It will not leave a review list while you sleep. That is [Grok Bot](/help/can-i-use-grok-bot-for-linkedin-outreach). Codex stops when the session ends.",
      "If you are not already in Codex, skip it. Overview finds leads without a coding agent. Do not install Codex only to operate LinkedIn.",
      "Setup: [how to connect Codex](/help/how-do-i-connect-codex-to-omentir). Chat versus Codex: [should I use Codex or ChatGPT](/help/should-i-use-codex-or-chatgpt-for-sales).",
    ],
    faqItems: [
      {
        question: "Can it send without me?",
        answer:
          "Not if you keep send behind review, which you should. Omentir still enforces caps. It does not enforce taste.",
      },
      {
        question: "Is Codex the same as Cursor?",
        answer:
          "Both are coding agents with a Bearer key. Codex stores MCP in TOML and shares it with the Codex CLI and extension. Cursor has its own client. Pick the one you already open.",
      },
      {
        question: "What should the first job be?",
        answer:
          "Confirm /mcp sees Omentir, then up to 30 people, drafts only. See [Codex for LinkedIn outreach](/blogs/codex-linkedin-outreach).",
      },
      {
        question: "Is this allowed by LinkedIn?",
        answer:
          "Writing with a model is not the same as a bot clicking the site. The send path still has to look like you. See [is LinkedIn automation allowed](/help/is-linkedin-automation-allowed).",
      },
    ],
    relatedSlugs: [
      "how-do-i-connect-codex-to-omentir",
      "should-i-use-codex-or-chatgpt-for-sales",
      "can-i-use-cursor-for-linkedin-outreach",
    ],
  },
  {
    slug: "should-i-use-codex-or-chatgpt-for-sales",
    question: "Should I use Codex or ChatGPT for sales?",
    description:
      "ChatGPT is a connector session you sit with. Codex is a coding agent configured in TOML. Same Omentir tools. Different auth. Pick the surface you already use.",
    keywords: [
      "Codex vs ChatGPT sales",
      "Codex or ChatGPT LinkedIn",
      "ChatGPT connector vs Codex MCP",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "[ChatGPT](/integrations/chatgpt) is the chat product. Settings, Connectors, paste the MCP URL, approve Connect workspace. No API key for that path. Useful this afternoon. It stops when you close the tab.",
      "[Codex](/integrations/codex) is the coding agent. You create a key, export it, and add an mcp_servers table in config.toml. Useful when that agent is already in the repo. It also stops when the session ends. It does not get Grok Bot's cloud computer.",
      "They can share an OpenAI login and still be different machines. Do not paste a Bearer token into the ChatGPT connector UI. Do not wait for workspace approval inside Codex.",
      "Neither product should hold your LinkedIn password. LinkedIn stays in Omentir. If the work is already in Cursor, stay there. See [Cursor or ChatGPT](/help/should-i-use-cursor-or-chatgpt-for-sales).",
      "Most founders should start in Overview. Add Codex only if you already run it.",
    ],
    faqItems: [
      {
        question: "Can I use ChatGPT if I do not have Codex?",
        answer:
          "Yes. The connector is enough to operate Omentir in a session. You will not get the TOML coding-agent loop.",
      },
      {
        question: "Do Codex CLI and ChatGPT desktop share MCP config?",
        answer:
          "The Codex CLI and the Codex IDE extension share ~/.codex/config.toml. ChatGPT's connector list is a different store.",
      },
      {
        question: "Which one keeps working overnight?",
        answer:
          "Neither. Overnight on a persistent computer is [Grok Bot](/help/what-is-the-difference-between-grok-bot-and-grok-com).",
      },
      {
        question: "Should I run Codex and Cursor together?",
        answer:
          "You can. You should not on day one. Two coding agents creating finders is how you get duplicate ICPs.",
      },
    ],
    relatedSlugs: [
      "how-do-i-connect-codex-to-omentir",
      "can-i-use-codex-for-linkedin-outreach",
      "should-i-use-cursor-or-chatgpt-for-sales",
    ],
  },
];
