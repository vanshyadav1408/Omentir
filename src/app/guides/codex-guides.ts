import type { GuidePage } from "./types";
import { CODEX_CONFIG_TOML, CODEX_FIRST_JOB_PROMPT } from "../codex-setup";

const DATE = "August 27, 2026";

export const CODEX_GUIDES: GuidePage[] = [
  {
    slug: "codex-sales-outreach",
    title: "Codex for sales outreach",
    description:
      "Use OpenAI Codex as a coding agent on Omentir. Put MCP in config.toml. Keep the token in an env var. Draft in the session. Send from the workspace. Codex is not ChatGPT chat.",
    query: "codex sales outreach",
    kicker: "TOML",
    cluster: "linkedin",
    publishedDate: DATE,
    updatedDate: DATE,
    keywords: [
      "Codex sales",
      "OpenAI Codex LinkedIn",
      "Codex MCP Omentir",
      "Codex config.toml",
    ],
    sections: [
      {
        heading: "The job",
        paragraphs: [
          "Codex is OpenAI's coding agent. The CLI and the IDE extension share ~/.codex/config.toml. That file is the connect path. ChatGPT's connector list is not.",
        ],
        bullets: [
          "Add mcp_servers.omentir with the hosted MCP URL.",
          "Set bearer_token_env_var to the variable name, not the token.",
          "Run /mcp before you ask for a finder.",
          "Send from Omentir. Do not sign into LinkedIn from Codex.",
        ],
      },
      {
        heading: "The config",
        paragraphs: [
          "Export OMENTIR_API_KEY before you launch Codex. A project-local .codex/config.toml only loads for trusted projects. If tools never appear, start with the global file. The table name needs an underscore: mcp_servers.",
        ],
        code: CODEX_CONFIG_TOML,
      },
      {
        heading: "Paste this into Codex",
        paragraphs: [
          "Finish Omentir first. Fetch [agents.md](https://omentir.com/agents.md). Replace the brackets. Keep the last two sentences.",
        ],
        code: CODEX_FIRST_JOB_PROMPT,
      },
    ],
    faqItems: [
      {
        question: "Is Codex the same as ChatGPT?",
        answer:
          "No. ChatGPT chat uses Connectors and workspace approval. Codex uses TOML and a Bearer env var. See [Codex or ChatGPT](/help/should-i-use-codex-or-chatgpt-for-sales).",
      },
      {
        question: "Can I put the API key in the TOML file?",
        answer:
          "You can. You should not. bearer_token_env_var wants the variable name.",
      },
      {
        question: "Does Codex keep working after I close it?",
        answer:
          "No. Overnight on a shared computer is [Grok Bot](/help/what-is-the-difference-between-grok-bot-and-grok-com).",
      },
      {
        question: "Should I pick Cursor instead?",
        answer:
          "Pick the agent you already open. Cursor has its own MCP client. Codex shares config.toml across CLI and extension.",
      },
    ],
    related: [
      { label: "Codex outbound", href: "/use-cases/codex-outbound" },
      { label: "Codex integration", href: "/integrations/codex" },
      { label: "Codex for LinkedIn outreach", href: "/blogs/codex-linkedin-outreach" },
    ],
    relatedHeading: "More on Codex",
  },
];
