import type { SeoContentPage, SeoSection, SeoSetupStep } from "./types";

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

export const FEATURE_EXTRAS: Record<string, PageExtras> = {
  "steal-customers": {
    highlights: [
      "Competitor post commenters",
      "Post and comment context",
      "Same safety limits as other agents",
    ],
    sections: [
      {
        id: "first-week",
        heading: "How a first week with Steal Customers should look",
        paragraphs: [
          "Pick two or three competitors that actually post, not every logo in your category. Create one Steal Customers agent, let discovery run, and review the first batch of commenters by hand. If the comments are mostly vendors pitching each other, the signal is weak and you should change sources before you write outreach.",
          "Once a handful of commenters look like buyers, send a small campaign that names the post they touched. Measure replies, not how many commenters the agent found. Volume without a usable comment is just another cold list.",
        ],
      },
      {
        id: "not-for",
        heading: "What Steal Customers will not do",
        paragraphs: [
          "It will not invent buyer intent on a silent competitor page. It will not replace title and industry filters if your offer only works for a narrow role. And it will not stay useful if you treat every commenter as qualified. The motion works when you keep the source list short and throw away obvious noise.",
        ],
      },
    ],
  },
  "ai-linkedin-outreach": {
    highlights: ["Sends from your profile", "Follow-ups until a reply", "Daily invite and message limits"],
    sections: [
      {
        id: "first-week",
        heading: "How to run the first outreach week",
        paragraphs: [
          "Start with one lead group, one promise, and one campaign. Review the first twenty drafts even if you plan to automate later. That review is how you catch a product claim that My Product overstated, or a follow-up that sounds like a bump.",
          "Keep daily invite and message limits conservative for a new or recently warmed account. If replies stall, change the sentence you are selling before you raise volume. A higher send cap on a weak promise just disappoints more people.",
        ],
      },
      {
        id: "not-for",
        heading: "What this outreach motion is not",
        paragraphs: [
          "This is not a cold email inbox rotator and not a place to run five offers at once. Omentir is LinkedIn-first. If your only working channel is email, solve deliverability there first. If you need a CRM for every post-sale stage, keep that system and use Omentir for the conversation that happens before a deal exists.",
        ],
      },
    ],
  },
  "lead-finders": {
    highlights: ["ICP titles and industries", "Ongoing discovery", "Campaign-ready groups"],
    sections: [
      {
        id: "first-week",
        heading: "How to brief a lead finder so it stays useful",
        paragraphs: [
          "Write the buyer in plain language before you fill filters. Who feels the pain, which company size can pay, and which titles are a waste even if they look senior. Then translate that into titles, industries, locations, and keywords. If you cannot explain the buyer in two sentences, the agent will collect a pretty list that never replies.",
          "Review the first fifty leads as if you were going to message them tomorrow. Reject patterns, not individuals: agencies when you sell to in-house teams, students when you sell to operators, the wrong geography. Tighten the finder once, then let it run.",
        ],
      },
      {
        id: "not-for",
        heading: "When a classic lead finder is the wrong tool",
        paragraphs: [
          "If the only people who buy from you are people already arguing on a competitor post, start with Steal Customers. If you need phone numbers as the system of record, you want a contact database, not a LinkedIn finder. Lead finders are for turning a written ICP into a living LinkedIn list, not for replacing every data vendor in your stack.",
        ],
      },
    ],
  },
  "unified-inbox": {
    highlights: ["Replies next to campaigns", "Intent before volume", "Drafts you can approve"],
    sections: [
      {
        id: "first-week",
        heading: "How to work the inbox in the first week of replies",
        paragraphs: [
          "Check the inbox on the same cadence you send. A same-day answer to an interested reply is part of the product, not a support chore. Tag or sort by people who asked a question, people who said later, and people who are not a fit, so the next session does not start from zero.",
          "If an operator drafts a reply, read it against the original thread before it goes out. The draft should answer the last thing the buyer said. A generic booking link on a specific objection is how you lose a warm conversation.",
        ],
      },
      {
        id: "not-for",
        heading: "What the inbox is not replacing",
        paragraphs: [
          "It is not a company-wide CRM, a helpdesk, or a place to store every customer email. Use it for LinkedIn outbound conversations that started in Omentir. When a deal is real, move the context to whatever system your team already uses for revenue, and keep the inbox focused on the next reply.",
        ],
      },
    ],
  },
  "agent-api-and-mcp": {
    highlights: ["MCP for chat apps", "REST for coding agents", "Workspace safety limits stay on"],
    sections: [
      {
        id: "first-week",
        heading: "A first week with an operator connected",
        paragraphs: [
          "Connect one operator, not five. Ask it to read workspace context and stats before it creates anything. Then have it list existing agents. Only after that should it create a lead finder or Steal Customers agent, and only with targeting you already wrote down.",
          "Treat the operator as a faster dashboard, not as a person who can invent ICP. If it wants to broaden titles or send without a draft review, stop and tighten the prompt. The API will enforce quotas. It will not enforce taste.",
        ],
      },
      {
        id: "not-for",
        heading: "What the Agent API will refuse to be",
        paragraphs: [
          "It will not create an Omentir account, change billing, or accept a LinkedIn password. It will not let a chat app reach another workspace. If you need those things, they stay in the human product on purpose. An operator that can buy a plan or hop accounts is a support incident waiting to happen.",
        ],
      },
    ],
  },
  "my-product": {
    highlights: ["Grounds every draft", "Required before agents help", "One place to update the offer"],
    sections: [
      {
        id: "first-week",
        heading: "How to fill My Product so drafts stay honest",
        paragraphs: [
          "Write the offer the way you would say it on a call: who it is for, what result they get, and what you do not do. Avoid adjectives that a first customer cannot see. If onboarding still needs you on a Zoom, do not claim a two-minute start.",
          "Update My Product when the product changes. Agents and campaigns read this profile. A stale paragraph about a feature you removed will show up in twenty messages before you notice. Treat it like production copy, because it is.",
        ],
      },
      {
        id: "not-for",
        heading: "What My Product is not",
        paragraphs: [
          "It is not a public marketing site and not a substitute for a landing page. Prospects do not read it. Your agents do. Keep it specific enough to write a first message and short enough that you will actually maintain it.",
        ],
      },
    ],
  },
  "campaigns-and-send-windows": {
    highlights: ["Local-time send windows", "Daily caps", "One campaign, one promise"],
    sections: [
      {
        id: "first-week",
        heading: "How to set the first campaign without burning the account",
        paragraphs: [
          "Use one lead group and one send window that matches when those buyers are awake. Leave weekend sending off unless you have evidence those buyers answer then. Cap invites and messages below the workspace maximum for the first two weeks so a mistake stays small.",
          "Write the stop conditions before you launch: reply, book, or a hard follow-up count. A campaign that never stops is not persistence. It is a loop that trains people to ignore you.",
        ],
      },
      {
        id: "not-for",
        heading: "What send windows cannot fix",
        paragraphs: [
          "A perfect window will not save a generic opener. Limits will not save a brand new profile that jumps to full volume on day one. Campaigns and windows are pacing tools. They assume you already chose the right people and a sentence those people can answer.",
        ],
      },
    ],
  },
  "linkedin-account-safety": {
    highlights: ["Human pacing", "Ramp-ups for new profiles", "Workspace-level caps"],
    sections: [
      {
        id: "first-week",
        heading: "How to treat a new or recently restricted profile",
        paragraphs: [
          "Warm the account with normal use before you attach a campaign: profile complete, some real conversations, no sudden invite spike. Then start below the default daily cap and raise it only after a clean week. If the profile was restricted recently, wait and keep the first batch tiny.",
          "Do not connect an account you are not allowed to use for outbound. Safety features protect pacing. They do not make a borrowed or purchased account a good idea.",
        ],
      },
      {
        id: "not-for",
        heading: "What account safety does not promise",
        paragraphs: [
          "Omentir cannot guarantee that LinkedIn will never restrict a profile. Platform rules change, and people still report spam. The product keeps volume human and visible. You still own the copy, the targeting, and whether the account is yours to use.",
        ],
      },
    ],
  },
  "lead-groups-and-scoring": {
    highlights: ["Groups per motion", "Scores you can explain", "Review before send"],
    sections: [
      {
        id: "first-week",
        heading: "How to group and score the first lists",
        paragraphs: [
          "Keep groups boring and specific: one ICP, one Steal Customers source set, one experiment. Mixing every lead into a single pile makes it impossible to tell which motion produced the reply. Name groups after the buyer or the source, not after the week you created them.",
          "Use scores as a review order, not as a send trigger. A high score still needs a human glance for obvious mismatches. If you cannot explain why a lead scored well, the score is decoration.",
        ],
      },
      {
        id: "not-for",
        heading: "What scoring will not decide for you",
        paragraphs: [
          "A score is not permission to skip reading the profile. It is not a forecast of revenue. And it is not a reason to keep a bloated group you never prune. Groups and scores exist so you can send the next honest batch, then delete the rest.",
        ],
      },
    ],
  },
  "open-source-self-hosting": {
    highlights: ["MIT licensed app", "Docker-based setup", "You bring the providers"],
    sections: [
      {
        id: "first-week",
        heading: "How to decide hosted versus self-host in a week",
        paragraphs: [
          "If you want to test whether LinkedIn outbound works for your offer, use the hosted product. Self-hosting asks you to run Docker, Firebase, Unipile, and a model provider before you have learned anything about buyers. That is the right week-two or month-two project, not the first experiment.",
          "If you already know you need the code on your machines, clone the public repo, follow the self-host docs, and budget time for provider accounts. The MIT license lets you read and modify the app. It does not remove the external services the app still calls.",
        ],
      },
      {
        id: "not-for",
        heading: "What open source does not mean here",
        paragraphs: [
          "It does not mean offline, free of vendor cost, or a community edition with features removed. The public repository is the same application. Credentials, customer data, and production logs stay private. Forks should use their own name and logo.",
        ],
      },
    ],
  },
};

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
        description: "Give Cursor a written ICP or competitor list. Review the created agent in the dashboard before it sends.",
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
          "If nobody on the team writes code, skip this path. You do not need an editor to run LinkedIn outbound. Use the dashboard or a chat connector. Cursor is for people who already work in the repo and want Omentir as another tool in that loop.",
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
        description: "https://omentir.com/api/agent/v1/mcp is the MCP server. Do not scrape dashboard pages.",
      },
      {
        title: "Approve or authenticate",
        description: "Connector clients complete Connect workspace. Token clients send Authorization on every call.",
      },
      {
        title: "Read the tool catalog",
        description: "agents.md and the MCP Server page list what exists. If a tool is missing, it is unavailable on purpose.",
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
          "Have Grok show the agent configuration before you leave it running. Confirm send windows and daily limits in the dashboard after. Chat operators are fast. The LinkedIn account still pays for a sloppy config.",
        ],
      },
      {
        id: "wrong-path",
        heading: "When another client is a better fit",
        paragraphs: [
          "If your team already standardized on Claude or ChatGPT, do not add Grok just to have another connector. One operator you actually watch is better than three you forget. Use Grok when that is already the chat app where the work happens.",
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
        title: "Paste the operator prompt",
        description: "The /for-agents prompt tells OpenClaw to read context first and not to invent billing or signup flows.",
      },
      {
        title: "Watch the first writes",
        description: "List agents after any create or update. Confirm the dashboard matches what OpenClaw claims it did.",
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
          "Write the smallest script: authenticate, print context, list agents, exit. Check it twice. Then add one write. If a create call returns success, open that agent in the dashboard the same minute. Scripts that only look at their own JSON drift from the product.",
          "Store the token in the environment. Revoke it when the script is done or when someone leaves the team. There is no reason for a weekend experiment key to live forever.",
        ],
      },
      {
        id: "wrong-path",
        heading: "When REST is more than you need",
        paragraphs: [
          "If you are not writing code, use the dashboard or a chat connector. REST is for people who want Omentir inside an existing system. It is a worse first experience than clicking through the app if you only need one campaign this week.",
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
        title: "Review in the dashboard",
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
          "If you are not in a terminal already, the hosted dashboard or a chat connector is faster. Claude Code earns its place when the work is happening in a repo. It is a slow way to click 'create campaign' if that is the only job.",
        ],
      },
    ],
  },
};

export const COMPARISON_EXTRAS: Record<string, PageExtras> = {};
