import { applyPageExtras, INTEGRATION_EXTRAS } from "../seo-content/page-extras";
import type { SeoContentPage } from "../seo-content/types";

/**
 * Integration pages for real operator paths. Not a directory of every SaaS
 * logo. Each page should teach a concrete connect path and limits.
 */
const INTEGRATION_PAGES: SeoContentPage[] = [
  {
    slug: "claude",
    title: "Claude integration",
    description:
      "Connect Claude to Omentir with a custom MCP connector. Create lead finders or Steal Customers agents, inspect leads, and operate LinkedIn outbound from chat without sharing your LinkedIn password.",
    summary:
      "Add the Omentir MCP connector in Claude, approve workspace access, and run discovery from chat.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "Omentir Claude",
      "Claude MCP LinkedIn",
      "Claude sales agent",
      "Claude connector Omentir",
    ],
    sections: [
      {
        id: "what-you-can-do",
        heading: "What Claude can do with Omentir",
        paragraphs: [
          "After Claude is connected to the Omentir MCP server, it can use Omentir tools to read workspace readiness, update My Product, create classic lead finders or Steal Customers agents, list leads with engagement context, check activity and the planned send schedule, and work with existing conversations under draft approval rules.",
          "Claude does not receive your LinkedIn password. It operates through Omentir's workspace tools, with the same daily safety limits and campaign rules as the dashboard.",
        ],
      },
      {
        id: "setup",
        heading: "Setup steps",
        paragraphs: [
          "Create an Omentir account, connect LinkedIn, and complete My Product. In Claude, open Settings, go to Connectors, and add a custom connector with the Omentir MCP URL. Sign in on Omentir when prompted and approve Connect workspace. Enable Omentir tools in the conversation if Claude asks.",
        ],
        bullets: [
          "MCP URL: https://omentir.com/api/agent/v1/mcp",
          "No API key required for the chat connector path",
          "Approve workspace access on Omentir before tools work",
          "Optional: paste the operator prompt from /for-agents as the first message",
        ],
      },
      {
        id: "good-prompts",
        heading: "Good first requests",
        paragraphs: [
          "Ask Claude to run get_context and get_stats, confirm My Product is complete, list existing agents before creating new ones, and only create a lead finder or Steal Customers agent after you explicitly approve the targeting. Never ask it to broaden ICP silently or reply to threads without showing you the draft.",
        ],
      },
      {
        id: "limits",
        heading: "Limits and responsibilities",
        paragraphs: [
          "You remain responsible for LinkedIn rules, the accounts you connect, and the offers you send. Claude is an operator interface. Omentir enforces product limits; it does not replace your judgment about who to contact or what to claim.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Do I need an Omentir API key for Claude?",
        answer:
          "Not for the custom MCP connector flow. Claude uses the connector URL and workspace approval. API keys are for coding agents and scripts.",
      },
      {
        question: "Can Claude create Steal Customers agents?",
        answer:
          "Yes, after My Product is complete and LinkedIn is connected. Provide competitor LinkedIn company URLs and optional founder or employee profile URLs.",
      },
      {
        question: "Where is the full tool list?",
        answer:
          "See the MCP Server page for the human-readable tool catalog, and agents.md for the machine guide.",
      },
    ],
    relatedLinks: [
      {
        label: "MCP Server",
        href: "/mcp-server",
        description: "Full connector setup and tool groups.",
      },
      {
        label: "For AI Agents",
        href: "/for-agents",
        description: "Operator prompt and workflow.",
      },
      {
        label: "Agent API and MCP feature",
        href: "/features/agent-api-and-mcp",
        description: "Product overview of operator access.",
      },
      {
        label: "ChatGPT integration",
        href: "/integrations/chatgpt",
        description: "Same MCP idea for ChatGPT.",
      },
    ],
    primaryCta: { label: "Read MCP setup", href: "/mcp-server" },
    secondaryCta: { label: "Operator prompt", href: "/for-agents" },
  },
  {
    slug: "chatgpt",
    title: "ChatGPT integration",
    description:
      "Connect ChatGPT to Omentir with a custom MCP connector. Configure LinkedIn lead discovery, Steal Customers agents, and campaign inspection from chat with workspace approval.",
    summary:
      "Point ChatGPT at the Omentir MCP endpoint, approve access, and operate outbound tools from conversation.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "Omentir ChatGPT",
      "ChatGPT MCP sales",
      "ChatGPT LinkedIn outreach",
      "ChatGPT connector Omentir",
    ],
    sections: [
      {
        id: "overview",
        heading: "Why connect ChatGPT to Omentir",
        paragraphs: [
          "ChatGPT is useful as an operator when it can call real tools instead of only drafting copy you paste elsewhere. Connected to Omentir, it can configure product context, create agents, inspect leads, and check send schedules while Omentir keeps LinkedIn credentials and safety limits in the workspace.",
        ],
      },
      {
        id: "setup",
        heading: "How to connect",
        paragraphs: [
          "Finish Omentir setup: account, LinkedIn connection, My Product. In ChatGPT, add a custom connector with the hosted MCP URL. Complete the Omentir sign-in and Connect workspace approval. Enable tools in the chat when prompted, then ask ChatGPT to read context before creating anything.",
        ],
        bullets: [
          "Connector URL: https://omentir.com/api/agent/v1/mcp",
          "Use workspace approval for chat apps",
          "Prefer list_agents before create_agent to avoid duplicates",
          "Keep reply tools limited to existing threads with draft approval",
        ],
      },
      {
        id: "practical-uses",
        heading: "Practical uses",
        paragraphs: [
          "Typical sessions: refresh ICP language in My Product, spin up a classic lead finder for a new segment, start a Steal Customers agent against a short competitor list, or audit why discovery returned empty results by checking activity tools before inventing leads.",
        ],
      },
      {
        id: "not-for",
        heading: "What this is not for",
        paragraphs: [
          "Do not treat ChatGPT as a place to store LinkedIn passwords or to bypass daily limits. Do not paste API tokens into chats you share. For scripts and local coding agents, create a revocable key on the API keys page instead of reusing a chat connector session.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is an API key required for ChatGPT?",
        answer:
          "The custom connector path uses Omentir workspace approval. Bearer API keys are for non-chat clients such as scripts and some coding agents.",
      },
      {
        question: "Can ChatGPT send LinkedIn messages directly?",
        answer:
          "ChatGPT operates Omentir tools. Outreach still runs through your connected LinkedIn account inside Omentir under campaign and safety settings.",
      },
      {
        question: "Where do I learn the tool names?",
        answer:
          "The MCP Server page lists tool groups. agents.md is the machine-readable guide to paste or fetch for operators.",
      },
    ],
    relatedLinks: [
      {
        label: "MCP Server",
        href: "/mcp-server",
        description: "Human setup and FAQs.",
      },
      {
        label: "Claude integration",
        href: "/integrations/claude",
        description: "Same pattern for Claude.",
      },
      {
        label: "For AI Agents",
        href: "/for-agents",
        description: "Shared operator prompt.",
      },
      {
        label: "MCP LinkedIn outreach blog",
        href: "/blogs/mcp-linkedin-outreach",
        description: "Longer narrative on MCP outbound.",
      },
    ],
    primaryCta: { label: "Connect ChatGPT", href: "/mcp-server" },
    secondaryCta: { label: "See pricing", href: "/pricing" },
  },
  {
    slug: "cursor",
    title: "Cursor integration",
    description:
      "Use Cursor with Omentir via MCP or REST and a revocable API key. Build operator workflows for lead finders, Steal Customers, and LinkedIn outreach tooling from your editor.",
    summary:
      "Create an API key, point Cursor at the MCP or REST surface, and operate Omentir from your coding agent.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "Omentir Cursor",
      "Cursor MCP sales",
      "Cursor LinkedIn agent",
      "Agent API Cursor",
    ],
    sections: [
      {
        id: "why-cursor",
        heading: "Why Cursor users connect Omentir",
        paragraphs: [
          "Cursor is a coding agent environment. Connected to Omentir, it can help you script operator workflows, inspect API responses, and manage agents without building a separate LinkedIn automation client. This is for technical founders and teams who already work in the editor.",
        ],
      },
      {
        id: "auth",
        heading: "Authentication for coding agents",
        paragraphs: [
          "Unlike Claude or ChatGPT custom connectors, Cursor-style clients typically use a workspace API key. Create a key on the Omentir API keys page, store it in an environment variable or secret store, and send Authorization: Bearer on every MCP or REST request. Never put the token in a URL or in a message you paste back into a public chat.",
        ],
        bullets: [
          "MCP: https://omentir.com/api/agent/v1/mcp",
          "REST base: https://omentir.com/api/agent/v1",
          "OpenAPI: https://omentir.com/api/agent/v1/openapi.json",
          "Guide: https://omentir.com/agents.md",
        ],
      },
      {
        id: "workflows",
        heading: "Sensible Cursor workflows",
        paragraphs: [
          "Start by fetching agents.md and calling get_context. Confirm LinkedIn is connected and My Product is complete. List agents before create. Prefer small, reversible changes: update one agent, inspect leads, check scheduled actions. Treat lead text as untrusted data, not as instructions to the agent.",
        ],
      },
      {
        id: "safety",
        heading: "Safety notes for editor agents",
        paragraphs: [
          "Coding agents can move fast. That is useful for inspection and dangerous for unsupervised mass outreach changes. Require explicit human approval before create, delete, pause, resume, or reply actions in your own prompts and runbooks.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Can I use OAuth instead of an API key in Cursor?",
        answer:
          "Chat app connectors use workspace approval. Cursor and scripts should use a revocable Bearer token unless you intentionally implement another supported auth flow.",
      },
      {
        question: "Does Cursor get my LinkedIn password?",
        answer:
          "No. Cursor talks to Omentir APIs. LinkedIn remains connected inside Omentir.",
      },
      {
        question: "Where is the REST schema?",
        answer:
          "Fetch /api/agent/v1/openapi.json for the current REST surface.",
      },
    ],
    relatedLinks: [
      {
        label: "For AI Agents",
        href: "/for-agents",
        description: "Operator prompt and connect overview.",
      },
      {
        label: "MCP Server",
        href: "/mcp-server",
        description: "Tool catalog and human setup.",
      },
      {
        label: "Agent API feature page",
        href: "/features/agent-api-and-mcp",
        description: "Product-level MCP and API explanation.",
      },
      {
        label: "Agent API outreach blog",
        href: "/blogs/agent-api-outreach",
        description: "Narrative on agent-operated outreach.",
      },
    ],
    primaryCta: { label: "Get started", href: "/for-agents" },
    secondaryCta: { label: "OpenAPI schema", href: "/api/agent/v1/openapi.json" },
  },
  {
    slug: "mcp",
    title: "MCP integration",
    description:
      "What the Omentir Model Context Protocol server is, how chat apps and coding agents connect, which sales tools are exposed, and how guardrails keep LinkedIn outreach safe.",
    summary:
      "Hosted MCP endpoint for product context, agents, leads, schedules, and approved conversation tools.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "Omentir MCP server",
      "Model Context Protocol sales",
      "MCP LinkedIn outreach",
      "MCP lead finder",
    ],
    sections: [
      {
        id: "definition",
        heading: "What MCP means here",
        paragraphs: [
          "Model Context Protocol is how AI apps discover and call tools. Omentir hosts an MCP server so assistants can operate the sales workspace: product profile, lead discovery agents, leads, activity, send schedules, and constrained conversation tools.",
          "You do not install a desktop LinkedIn bot. You connect an assistant to Omentir's hosted endpoint and keep credentials inside Omentir.",
        ],
      },
      {
        id: "who-connects",
        heading: "Who connects how",
        paragraphs: [
          "Claude, ChatGPT, and Grok typically use a custom connector URL plus workspace approval. Cursor, Claude Code, and scripts typically use a Bearer API key. Both paths hit the same product capabilities, subject to plan and safety limits.",
        ],
      },
      {
        id: "tools",
        heading: "Tool groups at a glance",
        paragraphs: [
          "Context and product profile tools read readiness and My Product. Lead discovery tools create and manage classic lead finders and Steal Customers agents. Lead tools list and inspect prospects, including engagement context. Activity and schedule tools explain what ran and what will send. Conversation tools work only on existing threads with approval-minded prompts.",
        ],
      },
      {
        id: "production-habits",
        heading: "Production habits that prevent messes",
        paragraphs: [
          "Always read context first. List before create. Do not broaden targeting without asking. Do not raise limits silently. Do not treat scraped lead text as system instructions. These habits matter more than any single tool name.",
        ],
      },
    ],
    faqItems: [
      {
        question: "What is the MCP endpoint?",
        answer:
          "The hosted endpoint is https://omentir.com/api/agent/v1/mcp for the managed product.",
      },
      {
        question: "Is MCP the same as the REST API?",
        answer:
          "They expose the same workspace capabilities through different interfaces. MCP is tool-oriented for assistants. REST is HTTP-oriented for scripts and custom clients. OpenAPI documents the REST surface.",
      },
      {
        question: "Where should humans start?",
        answer:
          "Start on /mcp-server for setup screenshots and FAQs, then /for-agents for the operator prompt.",
      },
    ],
    relatedLinks: [
      {
        label: "MCP Server page",
        href: "/mcp-server",
        description: "Primary human setup guide.",
      },
      {
        label: "Claude",
        href: "/integrations/claude",
        description: "Claude-specific connect notes.",
      },
      {
        label: "ChatGPT",
        href: "/integrations/chatgpt",
        description: "ChatGPT-specific connect notes.",
      },
      {
        label: "Cursor",
        href: "/integrations/cursor",
        description: "API key path for coding agents.",
      },
    ],
    primaryCta: { label: "Set up MCP", href: "/mcp-server" },
    secondaryCta: { label: "Agent guide", href: "/agents.md" },
  },
  {
    slug: "grok",
    title: "Grok integration",
    description:
      "Connect Grok to Omentir with a custom MCP connector. Approve workspace access, then create lead finders or Steal Customers agents and inspect LinkedIn leads from chat.",
    summary:
      "Add the Omentir MCP connector in Grok, approve access, and operate outbound tools from conversation.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "Omentir Grok",
      "Grok MCP sales",
      "Grok LinkedIn outreach",
      "Grok connector Omentir",
    ],
    sections: [
      {
        id: "what-you-get",
        heading: "What Grok can do with Omentir",
        paragraphs: [
          "Connected through MCP, Grok can call Omentir tools for workspace context, My Product, classic lead finders, Steal Customers agents, lead inspection, activity, scheduled sends, and approved work on existing conversations. LinkedIn credentials stay inside Omentir.",
          "This is the same hosted MCP surface Claude and ChatGPT use for chat-style connectors, with workspace approval instead of pasting a long-lived token into the chat transcript.",
        ],
      },
      {
        id: "setup",
        heading: "Setup path",
        paragraphs: [
          "Finish Omentir basics: account, LinkedIn connection, My Product. In Grok, add a custom connector with the Omentir MCP URL. Sign in on Omentir and approve Connect workspace. Enable tools in the conversation if prompted.",
        ],
        bullets: [
          "MCP URL: https://omentir.com/api/agent/v1/mcp",
          "No API key required for the chat connector path",
          "List agents before create_agent to avoid duplicates",
          "Optional operator prompt from /for-agents as the first message",
        ],
      },
      {
        id: "good-use",
        heading: "Good first session",
        paragraphs: [
          "Ask Grok to run get_context and get_stats, confirm readiness, then propose a single agent configuration for your approval. Prefer one clear segment over a broad autonomous expansion of titles and geographies.",
        ],
      },
      {
        id: "limits",
        heading: "Limits",
        paragraphs: [
          "Daily send limits and campaign rules still apply. Grok is an operator interface, not a bypass around safety settings. You remain responsible for what gets sent from your LinkedIn account.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is Grok support the same as Claude?",
        answer:
          "Chat apps share the custom MCP connector pattern. UI labels differ by product. The Omentir endpoint and workspace approval model are the same idea.",
      },
      {
        question: "Can Grok create Steal Customers agents?",
        answer:
          "Yes, after My Product is complete and LinkedIn is connected, using competitor LinkedIn URLs and optional founder or employee profiles.",
      },
      {
        question: "Where is the full tool list?",
        answer:
          "See /mcp-server for humans and /agents.md for machine-readable guidance.",
      },
    ],
    relatedLinks: [
      {
        label: "MCP Server",
        href: "/mcp-server",
        description: "Human setup and tool groups.",
      },
      {
        label: "Claude integration",
        href: "/integrations/claude",
        description: "Same connector pattern on Claude.",
      },
      {
        label: "For AI Agents",
        href: "/for-agents",
        description: "Shared operator prompt.",
      },
    ],
    primaryCta: { label: "MCP setup", href: "/mcp-server" },
    secondaryCta: { label: "Operator prompt", href: "/for-agents" },
  },
  {
    slug: "openclaw",
    title: "OpenClaw integration",
    description:
      "Use OpenClaw with Omentir over MCP or REST and a revocable API key for LinkedIn lead discovery, Steal Customers, and outreach operations from a custom agent stack.",
    summary:
      "Point OpenClaw at Omentir's agent APIs with a Bearer token and run sales operator workflows under guardrails.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "Omentir OpenClaw",
      "OpenClaw LinkedIn outreach",
      "OpenClaw MCP sales",
      "OpenClaw agent API",
    ],
    sections: [
      {
        id: "fit",
        heading: "Why OpenClaw users connect Omentir",
        paragraphs: [
          "OpenClaw-style agent stacks want tools that do real work. Omentir supplies hosted MCP and REST tools for product context, lead finders, Steal Customers, leads, schedules, and constrained conversation actions so your agent is not inventing a LinkedIn client from scratch.",
        ],
      },
      {
        id: "auth",
        heading: "Auth model",
        paragraphs: [
          "Create a workspace API key on the Omentir API keys page. Store it as a secret. Send Authorization: Bearer on MCP or REST calls. Never embed the token in public prompts or git commits. Rotate keys if a runner environment is compromised.",
        ],
        bullets: [
          "MCP: https://omentir.com/api/agent/v1/mcp",
          "REST: https://omentir.com/api/agent/v1",
          "OpenAPI: https://omentir.com/api/agent/v1/openapi.json",
          "Guide: https://omentir.com/agents.md",
        ],
      },
      {
        id: "runbooks",
        heading: "Recommended runbooks",
        paragraphs: [
          "Fetch agents.md first. Call get_context. Refuse to create agents until the human confirms targeting. On empty lead lists, check list_activity before claiming discovery worked. Reply tools only on existing threads with draft approval.",
        ],
      },
      {
        id: "risks",
        heading: "Risks unique to autonomous runners",
        paragraphs: [
          "Background agents can loop. Cap retries, require approvals for create and delete, and log every outbound-affecting tool call. Autonomy without an audit trail is how silent targeting drift happens.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is OpenClaw a first-party Omentir product?",
        answer:
          "No. OpenClaw is an external agent stack. Omentir exposes APIs that OpenClaw can call like any other operator client.",
      },
      {
        question: "Chat connector or API key?",
        answer:
          "Use a revocable API key for custom runners. Chat connector OAuth is for consumer chat apps with that UI.",
      },
      {
        question: "Related reading?",
        answer:
          "See OpenClaw LinkedIn leads and OpenClaw outreach flows on the blog, plus /for-agents for the operator prompt.",
      },
    ],
    relatedLinks: [
      {
        label: "For AI Agents",
        href: "/for-agents",
        description: "Operator prompt and connect overview.",
      },
      {
        label: "OpenClaw LinkedIn leads",
        href: "/blogs/openclaw-linkedin-leads",
        description: "Narrative on OpenClaw lead workflows.",
      },
      {
        label: "OpenClaw outreach flows",
        href: "/blogs/openclaw-outreach-flows",
        description: "Outreach-oriented OpenClaw reading.",
      },
      {
        label: "REST API integration",
        href: "/integrations/rest-api",
        description: "HTTP surface details.",
      },
    ],
    primaryCta: { label: "Agent setup", href: "/for-agents" },
    secondaryCta: { label: "OpenAPI", href: "/api/agent/v1/openapi.json" },
  },
  {
    slug: "rest-api",
    title: "REST Agent API integration",
    description:
      "How to use Omentir's REST Agent API under /api/agent/v1 for product profile, agents, leads, activity, schedules, and conversations with Bearer auth.",
    summary:
      "HTTP API for scripts and custom backends that need the same workspace powers as MCP tools.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "Omentir REST API",
      "Omentir Agent API",
      "LinkedIn outreach API",
      "sales agent API",
    ],
    sections: [
      {
        id: "overview",
        heading: "What the REST Agent API is",
        paragraphs: [
          "The Agent API is the HTTP interface for workspace-scoped sales operations. It covers context, stats, product profile, agents, groups, leads, activity, scheduled actions, settings, and conversations. MCP exposes the same capabilities as tools for assistants that prefer tool calling.",
          "OpenAPI lives at /api/agent/v1/openapi.json so clients can generate types and see current paths without scraping docs by hand.",
        ],
      },
      {
        id: "auth",
        heading: "Authentication",
        paragraphs: [
          "Create a revocable key in the workspace API keys UI. Send Authorization: Bearer on every request. Treat the key like a password. Scope is the workspace, not a single agent, so protect it accordingly.",
        ],
      },
      {
        id: "common-flows",
        heading: "Common integration flows",
        paragraphs: [
          "Readiness check: context plus stats. Segment launch: update product profile if needed, create agent, poll leads and activity. Ops dashboard: list scheduled actions and conversations. Always prefer read-before-write and human approval for destructive changes.",
        ],
        bullets: [
          "Base path: /api/agent/v1",
          "Machine guide: /agents.md",
          "Human MCP story: /mcp-server",
          "Capability map: /agent.json",
        ],
      },
      {
        id: "not-for",
        heading: "What not to build",
        paragraphs: [
          "Do not use the API to create Omentir accounts or buy subscriptions. Do not scrape the dashboard HTML for data the API already returns. Do not store LinkedIn passwords in your integration. Omentir holds the LinkedIn connection.",
        ],
      },
    ],
    faqItems: [
      {
        question: "MCP or REST?",
        answer:
          "Use MCP when the client is an assistant with tool calling. Use REST when you own the HTTP client in a script, backend, or automation runner. Capabilities align.",
      },
      {
        question: "Is there rate limiting?",
        answer:
          "Yes. Product and infrastructure limits apply. Design for retries with backoff and avoid tight poll loops.",
      },
      {
        question: "Where do I see the schema?",
        answer:
          "Fetch https://omentir.com/api/agent/v1/openapi.json for the current REST surface.",
      },
    ],
    relatedLinks: [
      {
        label: "Agent API feature page",
        href: "/features/agent-api-and-mcp",
        description: "Product overview of operator access.",
      },
      {
        label: "OpenAPI schema",
        href: "/api/agent/v1/openapi.json",
        description: "Machine-readable REST schema.",
      },
      {
        label: "Cursor integration",
        href: "/integrations/cursor",
        description: "Coding agent path using the same auth model.",
      },
      {
        label: "Agent API outreach blog",
        href: "/blogs/agent-api-outreach",
        description: "Narrative on API-led outreach.",
      },
    ],
    primaryCta: { label: "Read for-agents", href: "/for-agents" },
    secondaryCta: { label: "OpenAPI", href: "/api/agent/v1/openapi.json" },
  },
  {
    slug: "claude-code",
    title: "Claude Code integration",
    description:
      "Connect Claude Code to Omentir with a Bearer API key over MCP or REST. Configure lead finders, inspect leads, and operate LinkedIn outbound from the terminal agent workflow.",
    summary:
      "Terminal-native operator path: API key, agents.md, and the same workspace tools as other coding agents.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "Omentir Claude Code",
      "Claude Code MCP",
      "Claude Code sales agent",
      "Claude Code LinkedIn outreach",
    ],
    sections: [
      {
        id: "why",
        heading: "Why Claude Code users connect Omentir",
        paragraphs: [
          "Claude Code is built for agentic work in a repo and terminal. Connected to Omentir, it can operate sales workspace tools while you keep reviewing diffs, logs, and approvals in a developer-native loop.",
        ],
      },
      {
        id: "setup",
        heading: "Setup",
        paragraphs: [
          "Create an Omentir API key. Configure Claude Code's MCP or HTTP tooling with the MCP endpoint or REST base URL and Bearer auth. Point the agent at agents.md so it learns guardrails before it creates agents.",
        ],
        bullets: [
          "Prefer environment variables for secrets",
          "Start with get_context and get_stats",
          "Require explicit approval for create, delete, and reply",
          "Do not commit API keys to the repository",
        ],
      },
      {
        id: "workflows",
        heading: "Useful workflows",
        paragraphs: [
          "Refresh My Product from a README or landing page draft you trust, spin up a single test lead finder, dump lead JSON for offline review, or audit scheduled actions before a campaign weekend. Keep production changes small and reversible.",
        ],
      },
      {
        id: "vs-claude-chat",
        heading: "Claude Code versus Claude chat connector",
        paragraphs: [
          "Claude's chat product can use a custom connector with workspace approval. Claude Code typically uses a key like other coding agents. Pick the path that matches the client. Do not reuse chat OAuth assumptions in a headless runner.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Can Claude Code use the same MCP URL as Claude chat?",
        answer:
          "The hosted MCP endpoint is the same product surface. Auth differs: chat connectors use workspace approval UI, Claude Code should use a revocable API key unless you implement another supported flow.",
      },
      {
        question: "Will Claude Code send LinkedIn messages by itself?",
        answer:
          "Only through Omentir tools under your campaign and safety settings. Your prompts should still require approval for replies and agent lifecycle changes.",
      },
      {
        question: "Where is the operator prompt?",
        answer:
          "https://omentir.com/for-agents contains a paste-ready operator prompt you can adapt for Claude Code instructions.",
      },
    ],
    relatedLinks: [
      {
        label: "Cursor integration",
        href: "/integrations/cursor",
        description: "Similar coding-agent auth pattern.",
      },
      {
        label: "REST API",
        href: "/integrations/rest-api",
        description: "HTTP details and OpenAPI.",
      },
      {
        label: "Claude chat integration",
        href: "/integrations/claude",
        description: "Connector path for Claude chat apps.",
      },
      {
        label: "MCP Server",
        href: "/mcp-server",
        description: "Tool catalog and human FAQs.",
      },
    ],
    primaryCta: { label: "For AI Agents", href: "/for-agents" },
    secondaryCta: { label: "MCP setup", href: "/mcp-server" },
  },
];

export const ALL_INTEGRATIONS: SeoContentPage[] = applyPageExtras(
  INTEGRATION_PAGES,
  INTEGRATION_EXTRAS
);

export function getIntegration(slug: string) {
  return ALL_INTEGRATIONS.find((page) => page.slug === slug);
}
