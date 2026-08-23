import type { SeoContentPage, SeoSection, SeoSetupStep } from "./types";
import { GROK_BOT_FIRST_JOB_PROMPT } from "../grok-bot-setup";

type PageExtras = {
  highlights?: string[];
  setupSteps?: SeoSetupStep[];
  sections: SeoSection[];
};

export function applyPageExtras(
  pages: SeoContentPage[],
  extras: Record<string, PageExtras>
): SeoContentPage[] {
  return pages.map((page) => {
    const extra = extras[page.slug];
    if (!extra) return page;
    return {
      ...page,
      updatedDate: page.updatedDate,
      highlights: extra.highlights ?? page.highlights,
      setupSteps: extra.setupSteps ?? page.setupSteps,
      sections: [...page.sections, ...extra.sections],
    };
  });
}

export const INTEGRATION_EXTRAS: Record<string, PageExtras> = {
  claude: {
    highlights: ["Custom MCP connector", "No API key in Claude", "Workspace approval required"],
    setupSteps: [
      {
        title: "Finish Omentir setup",
        description: "Create an account, connect LinkedIn, and fill My Product so tools have something true to say.",
      },
      {
        title: "Add the connector in Claude",
        description: "Settings, Connectors, custom connector. Use https://omentir.com/api/agent/v1/mcp.",
      },
      {
        title: "Approve the workspace",
        description: "Sign in on Omentir and allow Connect workspace. Enable tools in the conversation if Claude asks.",
      },
      {
        title: "Read context first",
        description: "Ask Claude to run get_context and get_stats, then list agents, before it creates anything.",
      },
    ],
    sections: [
      {
        id: "first-session",
        heading: "A first Claude session that stays safe",
        paragraphs: [
          "Start with a question Claude can answer from tools: is My Product complete, how many agents exist, what is scheduled to send. Then give it one job, such as creating a lead finder for a written ICP, and make it show the targeting before it saves.",
          "Do not ask Claude to invent a broader market or to reply to threads without showing the draft. The connector is powerful because it can change a real workspace. Treat it like a teammate with admin access, not like a chatbot that only talks.",
        ],
      },
      {
        id: "wrong-path",
        heading: "When Claude is the wrong operator",
        paragraphs: [
          "If you need scripts, CI, or a coding agent in the repo, use an API key with Cursor, Claude Code, or REST. Claude's connector path is for conversational operation. It is a poor fit if you want headless jobs or if you are not willing to approve what it creates.",
        ],
      },
    ],
  },
  chatgpt: {
    highlights: ["Custom MCP connector", "Workspace-scoped tools", "Same safety limits as the app"],
    setupSteps: [
      {
        title: "Prepare the workspace",
        description: "Account, LinkedIn, and My Product need to be done before ChatGPT can do useful work.",
      },
      {
        title: "Add the Omentir connector",
        description: "In ChatGPT, add a custom connector pointed at https://omentir.com/api/agent/v1/mcp.",
      },
      {
        title: "Approve access",
        description: "Complete the Omentir sign-in and Connect workspace step, then enable tools in the chat.",
      },
      {
        title: "Inspect before you create",
        description: "Ask ChatGPT to read context and list agents. Only then create a finder or Steal Customers agent.",
      },
    ],
    sections: [
      {
        id: "first-session",
        heading: "A first ChatGPT session worth keeping",
        paragraphs: [
          "Have ChatGPT explain the workspace back to you: product summary, connected account, existing agents. If that summary is wrong, fix My Product before you let it create outreach. A confident draft from a wrong profile wastes a week.",
          "When you do create an agent, give ChatGPT the ICP or competitor URLs in the same message. Do not ask it to guess the market. Guessing is how you end up messaging the wrong titles at full pace.",
        ],
      },
      {
        id: "wrong-path",
        heading: "When to skip ChatGPT and use a key instead",
        paragraphs: [
          "ChatGPT is the right surface if you already live in that chat app and want to operate Omentir in language. If you want a coding agent to call REST from a repo, or you need a token you can revoke per script, create an API key and leave ChatGPT out of that path.",
        ],
      },
    ],
  },
  cursor: {
    highlights: ["API key in Cursor", "MCP or REST from the editor", "Good for repo-side operators"],
    setupSteps: [
      {
        title: "Create an Omentir API key",
        description: "Open API keys in Omentir, create a token, and store it in Cursor's secret store. Never paste it into a prompt.",
      },
      {
        title: "Point Cursor at MCP or REST",
        description: "MCP: POST https://omentir.com/api/agent/v1/mcp with Authorization Bearer. REST: /api/agent/v1/*.",
      },
      {
        title: "Confirm the workspace",
        description: "Ask Cursor to call get_context. If the product profile is empty, fill My Product in the app first.",
      },
      {
        title: "Create one agent on purpose",
        description: "Give Cursor a written ICP or competitor list. Review the created agent in Overview before it sends.",
      },
    ],
    sections: [
      {
        id: "first-session",
        heading: "Using Cursor without leaking the token",
        paragraphs: [
          "Keep the Omentir token in environment or Cursor secrets. If it lands in a chat transcript, revoke it. The key can list leads and create agents. That is enough to cause damage if it leaks into a commit.",
          "Use Cursor when the operator should sit next to your codebase: updating prompts, checking OpenAPI, or scripting a review of today's leads. For a one-off campaign from the couch, Claude or ChatGPT is less ceremony.",
        ],
      },
      {
        id: "wrong-path",
        heading: "When Cursor is extra weight",
        paragraphs: [
          "If nobody on the team writes code, skip this path. You do not need an editor to run LinkedIn outbound. Use Overview or a chat connector. Cursor is for people who already work in the repo and want Omentir as another tool in that loop.",
        ],
      },
    ],
  },
  mcp: {
    highlights: ["One MCP URL", "OAuth for chat apps", "Bearer tokens for agents"],
    setupSteps: [
      {
        title: "Choose the client path",
        description: "Chat apps use the connector URL and OAuth. Coding agents use a Bearer token from the API page.",
      },
      {
        title: "Use the hosted endpoint",
        description: "https://omentir.com/api/agent/v1/mcp is the MCP server. Do not scrape Overview pages.",
      },
      {
        title: "Approve or authenticate",
        description: "Connector clients complete Connect workspace. Token clients send Authorization on every call.",
      },
      {
        title: "Read the tool catalog",
        description: "agents.md and the MCP integration page list what exists. If a tool is missing, it is unavailable on purpose.",
      },
    ],
    sections: [
      {
        id: "first-session",
        heading: "How to prove MCP works in fifteen minutes",
        paragraphs: [
          "Connect one client and call get_context plus get_stats. If those return workspace data, the plumbing works. Then list agents. Stop there on the first pass. Creating finders before you can read them back is how people lose track of what the operator did.",
          "Keep a note of which client you connected. A Claude connector and a Cursor token are different credentials. Revoking one does not revoke the other.",
        ],
      },
      {
        id: "wrong-path",
        heading: "What MCP is not for",
        paragraphs: [
          "It is not a way to automate account creation, billing, or LinkedIn login. It is not a public scrape of other people's workspaces. If a flow is missing from the tool list, assume it is a human-only page and stay there.",
        ],
      },
    ],
  },
  grok: {
    highlights: ["Custom MCP connector", "Same tool map as other chat apps", "Workspace approval"],
    setupSteps: [
      {
        title: "Prepare Omentir",
        description: "Connect LinkedIn and complete My Product so Grok has a real offer to work from.",
      },
      {
        title: "Add the custom connector",
        description: "In Grok, add a connector with https://omentir.com/api/agent/v1/mcp.",
      },
      {
        title: "Approve Connect workspace",
        description: "Sign in to Omentir when prompted and allow the workspace. Enable tools in the conversation.",
      },
      {
        title: "Start with read tools",
        description: "Ask Grok for context and stats, then list agents, before you let it create a finder.",
      },
    ],
    sections: [
      {
        id: "first-session",
        heading: "A first Grok session that does not invent targeting",
        paragraphs: [
          "Give Grok the same written ICP you would give a teammate. If you only say 'find me SaaS founders,' you will get a wide, noisy list. If you name the role, the company size, and the trigger, the agent it creates will be easier to review.",
          "Have Grok show the agent configuration before you leave it running. Confirm send windows and daily limits in Overview after. Chat operators are fast. The LinkedIn account still pays for a sloppy config.",
        ],
      },
      {
        id: "wrong-path",
        heading: "When another client is a better fit",
        paragraphs: [
          "If your team already standardized on Claude or ChatGPT, do not add Grok just to have another connector. One operator you actually watch is better than three you forget. Use Grok when that is already the chat app where the work happens.",
          "If you meant the new Grok Bot app (persistent Bots with their own computer), that is a different page. Chat Grok does not get a cloud VM. Grok Bot does, which is why LinkedIn should stay in Omentir.",
        ],
      },
    ],
  },
  "grok-bot": {
    highlights: [
      "Plugins MCP path",
      "LinkedIn stays in Omentir",
      "Stop at a review list",
    ],
    setupSteps: [
      {
        title: "Prepare Omentir",
        description: "Connect LinkedIn and complete My Product before the Bot has anything true to say.",
      },
      {
        title: "Install Grok Bot",
        description: "Desktop on macOS or Windows, or iOS. Sign in with the Cursor or SuperGrok Heavy plan that includes Grok Bot.",
      },
      {
        title: "Add Omentir as a plugin",
        description: "Settings, Plugins, custom MCP at https://omentir.com/api/agent/v1/mcp. Approve Connect workspace.",
      },
      {
        title: "Forbid LinkedIn on the Bot computer",
        description: "If it asks you to take over for a LinkedIn password or CAPTCHA, refuse. Point it at MCP tools.",
      },
    ],
    sections: [
      {
        id: "first-session",
        heading: "A first Grok Bot session that does not invent targeting",
        paragraphs: [
          "Write the ICP the way you would brief a contractor: role, company size, geography, trigger, and who to skip. Then ask the Bot to run get_context and list_agents before create_agent. Have it show the finder config. Start a campaign only after you have read twenty leads.",
          "SpaceXAI's own outbound prompt tells the Bot not to send and not to enroll. Keep that sentence in the Bot description. Overnight research is useful. Overnight sending from a new account is how you buy a restriction. Paste this, replace the brackets, keep the last two sentences.",
        ],
        code: GROK_BOT_FIRST_JOB_PROMPT,
      },
      {
        id: "wrong-path",
        heading: "When Grok Bot is the wrong operator",
        paragraphs: [
          "Skip Grok Bot if you do not already pay for Cursor Ultra, Cursor Teams Premium, or SuperGrok Heavy. The product is in beta and the plans are not cheap. A founder who only needed a hosted LinkedIn workspace can use Omentir from Overview without an extra agent layer.",
          "Skip it if you wanted grok.com chat. That is the Grok integration. Skip it if you cannot sit with the review list in the morning. An always-running Bot you never read is just a more expensive way to ignore your pipeline.",
        ],
      },
    ],
  },
  openclaw: {
    highlights: ["Local operator", "Bearer token", "Same REST and MCP contracts"],
    setupSteps: [
      {
        title: "Create a token",
        description: "Make an Omentir API key and put it in OpenClaw's secret storage, never in a skill file you commit.",
      },
      {
        title: "Call MCP or REST",
        description: "Use the hosted MCP endpoint or the REST routes under /api/agent/v1 with Authorization Bearer.",
      },
      {
        title: "Fetch agents.md first",
        description: "The machine guide tells OpenClaw to read context first and not to invent billing or signup flows.",
      },
      {
        title: "Watch the first writes",
        description: "List agents after any create or update. Confirm Overview matches what OpenClaw claims it did.",
      },
    ],
    sections: [
      {
        id: "first-session",
        heading: "Running OpenClaw against a live workspace",
        paragraphs: [
          "OpenClaw is useful when you want an operator that already lives on your machine. That also means a leaked token is a leaked workspace. Rotate the key if the machine is shared, and start with read-only habits: context, stats, lead lists.",
          "When you let it create a finder, give it a file or message with the ICP. Do not ask it to crawl your whole disk for 'ideas.' The workspace should change because you asked, not because the agent got bored.",
        ],
      },
      {
        id: "wrong-path",
        heading: "When OpenClaw is the wrong layer",
        paragraphs: [
          "If you just want to talk to Omentir from a hosted chat app, use Claude, ChatGPT, or Grok. OpenClaw adds a local runtime you have to operate. That is worth it for people who already run it. It is extra surface for everyone else.",
        ],
      },
    ],
  },
  "rest-api": {
    highlights: ["OpenAPI documented", "Bearer tokens", "Workspace-scoped routes"],
    setupSteps: [
      {
        title: "Create a token on the API page",
        description: "Keys are never accepted in URLs. Send Authorization: Bearer on every request.",
      },
      {
        title: "Read OpenAPI",
        description: "https://omentir.com/api/agent/v1/openapi.json is the contract. Do not guess path names.",
      },
      {
        title: "Start with GET context",
        description: "If get_context fails, fix auth before you write a create-agent script.",
      },
      {
        title: "Create with an explicit body",
        description: "Pass the ICP or Steal Customers URLs you actually want. Log the returned id and open it in the app.",
      },
    ],
    sections: [
      {
        id: "first-session",
        heading: "A first REST script that you can trust",
        paragraphs: [
          "Write the smallest script: authenticate, print context, list agents, exit. Check it twice. Then add one write. If a create call returns success, open that agent in Overview the same minute. Scripts that only look at their own JSON drift from the product.",
          "Store the token in the environment. Revoke it when the script is done or when someone leaves the team. There is no reason for a weekend experiment key to live forever.",
        ],
      },
      {
        id: "wrong-path",
        heading: "When REST is more than you need",
        paragraphs: [
          "If you are not writing code, use Overview or a chat connector. REST is for people who want Omentir inside an existing system. It is a worse first experience than clicking through the app if you only need one campaign this week.",
        ],
      },
    ],
  },
  "claude-code": {
    highlights: ["API key", "Works in the terminal", "Same MCP and REST tools"],
    setupSteps: [
      {
        title: "Create and store a token",
        description: "Generate an Omentir API key and keep it in the environment Claude Code already uses for secrets.",
      },
      {
        title: "Call the hosted MCP server",
        description: "POST https://omentir.com/api/agent/v1/mcp with the Bearer token, or use the REST routes.",
      },
      {
        title: "Read before write",
        description: "Have Claude Code fetch context and list agents from the repo session before it creates a finder.",
      },
      {
        title: "Review in Overview",
        description: "After any write, open Omentir and confirm the agent, limits, and targeting match the session.",
      },
    ],
    sections: [
      {
        id: "first-session",
        heading: "Using Claude Code next to the product repo",
        paragraphs: [
          "Claude Code is a good operator when the same session is already editing prompts, docs, or scripts. Ask it to compare My Product with what the landing page claims. If those disagree, fix the profile before you let it launch outreach.",
          "Do not let a long coding session casually 'also spin up a campaign.' Creating agents should be a named request, the same way merging a pull request is a named request.",
        ],
      },
      {
        id: "wrong-path",
        heading: "When to stay in the browser",
        paragraphs: [
          "If you are not in a terminal already, Overview or a chat connector is faster. Claude Code earns its place when the work is happening in a repo. It is a slow way to click 'create campaign' if that is the only job.",
        ],
      },
    ],
  },
};
