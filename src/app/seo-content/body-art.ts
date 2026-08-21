import type { BodyArt } from "./body-figure";
import type { SeoFamily } from "./types";

const FEATURE_ART: Record<string, BodyArt> = {
  "steal-customers": {
    src: "/seo/features/steal-customers.avif",
    alt: "Steal Customers path: competitor pages, comments from the last week, then scored leads",
    caption:
      "Employees are the source. The lead is the person who commented. Outreach can name the real post.",
  },
  "ai-linkedin-outreach": {
    src: "/seo/features/ai-linkedin-outreach.avif",
    alt: "Outreach steps: one lead group, review drafts, send in local-time windows, collect replies",
    caption:
      "One group, one promise. Review the first drafts. Campaigns stop when someone replies.",
  },
  "lead-finders": {
    src: "/seo/features/lead-finders.avif",
    alt: "Lead finder steps from writing the buyer to an ongoing LinkedIn list",
    caption:
      "Write the buyer in plain language, then turn titles and industries into a list you will actually message.",
  },
  "unified-inbox": {
    src: "/seo/features/unified-inbox.avif",
    alt: "Unified inbox: every agent reply in one place",
    caption: "Replies belong in one inbox. The next sentence continues theirs, not a new pitch.",
  },
  "agent-api-and-mcp": {
    src: "/seo/features/agent-api-and-mcp.avif",
    alt: "Agent API and MCP: your operator talks to Omentir, LinkedIn stays here",
    caption: "Your agent talks to Omentir over MCP or REST. LinkedIn stays on the Omentir side.",
  },
  "my-product": {
    src: "/seo/features/my-product.avif",
    alt: "My Product brief: who it is for, the result, what you will not claim",
    caption: "My Product is the brief every draft reads. If this page is vague, every note will be too.",
  },
  "campaigns-and-send-windows": {
    src: "/seo/features/campaigns-and-send-windows.avif",
    alt: "Send windows as a calendar of working hours, not a blast button",
    caption: "Pick hours a human in that timezone would type. Leave gaps. No 40-send burst at 9:01.",
  },
  "linkedin-account-safety": {
    src: "/seo/features/linkedin-account-safety.avif",
    alt: "Account safety: warm first, watch accepts, pause on a lock",
    caption: "A week of ignores is a targeting problem, not a reason to send more.",
  },
  "lead-groups-and-scoring": {
    src: "/seo/features/lead-groups-and-scoring.avif",
    alt: "Lead groups and scores deciding who is worth a note this week",
    caption: "One ICP per group. Only the keep pile gets a note this week.",
  },
  "open-source-self-hosting": {
    src: "/seo/features/open-source-self-hosting.avif",
    alt: "Self-hosting: same product on your machine",
    caption: "Self-host when you want the same motion on your own machine, not a different product.",
  },
  "demo-booking": {
    src: "/seo/features/demo-booking.avif",
    alt: "Turn replies into demos: a reply, a calendar slot, then a booked meeting",
    caption: "The calendar link goes out after they show interest. You still take the meeting.",
  },
  "linkedin-warmup": {
    src: "/seo/features/linkedin-warmup.avif",
    alt: "LinkedIn warmup as a five-week ramp, not a day-one blast",
    caption: "Daily caps stay on. You still look like a person for the first weeks.",
  },
  "reply-drafts": {
    src: "/seo/features/reply-drafts.avif",
    alt: "A reply draft with approve, pause, and send",
    caption: "The next sentence is a draft until you say it can send.",
  },
};

const FEATURE_FLOW: Record<string, { title: string; steps: Array<{ label: string; detail: string }> }> = {
  "steal-customers": {
    title: "How Steal Customers moves",
    steps: [
      { label: "Pick sources", detail: "Competitor company pages, plus a founder profile if they post." },
      { label: "Read the comments", detail: "Keep people who sound like buyers. Drop vendors pitching each other." },
      { label: "Write from the post", detail: "The first note names the comment. It does not sell the product yet." },
    ],
  },
  "ai-linkedin-outreach": {
    title: "How a campaign should run",
    steps: [
      { label: "One group", detail: "One buyer, one promise. Mixed lists make the replies unreadable." },
      { label: "Review drafts", detail: "Read the first twenty even if you plan to automate later." },
      { label: "Stay inside the window", detail: "Send during hours a person would type. Stop if ignores pile up." },
    ],
  },
  "lead-finders": {
    title: "How a finder stays useful",
    steps: [
      { label: "Write the buyer", detail: "Two sentences on who feels the pain and who can pay." },
      { label: "Translate to filters", detail: "Titles, industries, size, location. Reject patterns, not one-off names." },
      { label: "Hand it to a campaign", detail: "A pretty list that never gets a note is just a spreadsheet." },
    ],
  },
  "unified-inbox": {
    title: "How replies should be handled",
    steps: [
      { label: "Land in one inbox", detail: "Every agent reply in the same place." },
      { label: "Read the thread", detail: "The next sentence continues theirs, not a new pitch." },
      { label: "Book or stop", detail: "A meeting or a clean no. Do not bump forever." },
    ],
  },
  "agent-api-and-mcp": {
    title: "How an operator connects",
    steps: [
      { label: "Hold LinkedIn in Omentir", detail: "The session and limits stay here." },
      { label: "Point the agent at MCP or REST", detail: "Claude, Cursor, ChatGPT, or your own script." },
      { label: "Inspect what it did", detail: "Leads, drafts, and replies remain reviewable." },
    ],
  },
  "my-product": {
    title: "What belongs in My Product",
    steps: [
      { label: "Who it is for", detail: "The buyer, not every title in the industry." },
      { label: "The result they get", detail: "One promise you can keep in a first week." },
      { label: "What you will not claim", detail: "If the brief is honest, the notes stay honest." },
    ],
  },
  "campaigns-and-send-windows": {
    title: "How send windows work",
    steps: [
      { label: "Pick working hours", detail: "Days and hours a human in that timezone would type." },
      { label: "Cap the day", detail: "A conservative daily invite and message number." },
      { label: "Leave gaps", detail: "Random delays. No 40-send burst at 9:01." },
    ],
  },
  "linkedin-account-safety": {
    title: "What safety actually means",
    steps: [
      { label: "Warm first", detail: "New or quiet accounts do not start at full volume." },
      { label: "Watch accepts", detail: "A week of ignores is a targeting problem, not a reason to send more." },
      { label: "Pause on a lock", detail: "If invitations stop, wait. Do not test another browser." },
    ],
  },
  "lead-groups-and-scoring": {
    title: "How groups earn a campaign",
    steps: [
      { label: "Keep lists small", detail: "One ICP per group so you can read the replies." },
      { label: "Score the fit", detail: "Title, company, and a real reason to write." },
      { label: "Promote the top", detail: "Only the keep pile gets a note this week." },
    ],
  },
  "open-source-self-hosting": {
    title: "When to run it yourself",
    steps: [
      { label: "Clone the repo", detail: "Same product, your machine." },
      { label: "Connect your account", detail: "Limits and sessions still apply." },
      { label: "Keep the review queue", detail: "Self-host is not a reason to skip reading drafts." },
    ],
  },
};

const INTEGRATION_FLOW: Record<string, { title: string; steps: Array<{ label: string; detail: string }> }> = {
  claude: {
    title: "Claude to a live sales workspace",
    steps: [
      { label: "Open Claude", detail: "A normal chat. No LinkedIn password in the prompt." },
      { label: "Add the Omentir MCP", detail: "https://omentir.com/api/agent/v1/mcp" },
      { label: "Ask it to inspect, not blast", detail: "List agents, read a group, draft. You still send." },
    ],
  },
  chatgpt: {
    title: "ChatGPT as the operator",
    steps: [
      { label: "Create a custom GPT or MCP client", detail: "Point it at the Omentir endpoints." },
      { label: "Give it My Product", detail: "The brief is what keeps drafts from sounding generic." },
      { label: "Review the first batch", detail: "ChatGPT writes. You decide what leaves the account." },
    ],
  },
  cursor: {
    title: "Cursor as the control room",
    steps: [
      { label: "Add the MCP server", detail: "Same URL as every other operator." },
      { label: "Keep a short prompt file", detail: "ICP, promise, and what not to claim." },
      { label: "Run one job at a time", detail: "Find, draft, or inspect. Not all three in one blast." },
    ],
  },
  grok: {
    title: "Grok talking to Omentir",
    steps: [
      { label: "Connect MCP", detail: "Grok holds the conversation. Omentir holds LinkedIn." },
      { label: "Ask for a status", detail: "Agents, groups, and unread replies first." },
      { label: "Then a small write", detail: "One group, one draft set, then you read it." },
    ],
  },
  "grok-bot": {
    title: "Grok Bot talking to Omentir",
    steps: [
      { label: "Add the MCP plugin", detail: "The Bot holds the overnight job. Omentir holds LinkedIn." },
      { label: "Research, then stop", detail: "Scored list and drafts. No send from the Bot computer." },
      { label: "You approve in Omentir", detail: "Campaigns, limits, and replies stay in the workspace." },
    ],
  },
  openclaw: {
    title: "OpenClaw on top of Omentir",
    steps: [
      { label: "Wire the connector", detail: "OpenClaw orchestrates. Omentir executes on LinkedIn." },
      { label: "Give it a narrow job", detail: "A finder, or a reply pass, not the whole company." },
      { label: "Log what it did", detail: "If you cannot replay the actions, do not let it send." },
    ],
  },
  mcp: {
    title: "The MCP path",
    steps: [
      { label: "Copy the MCP URL", detail: "https://omentir.com/api/agent/v1/mcp" },
      { label: "Paste it into the client", detail: "Claude, Cursor, or anything that speaks MCP." },
      { label: "Auth with your workspace", detail: "The agent never sees your LinkedIn password." },
    ],
  },
  "rest-api": {
    title: "The REST path",
    steps: [
      { label: "Create an API key", detail: "Workspace settings, not a scraped cookie." },
      { label: "Call one job", detail: "Leads, campaigns, or inbox. Keep the surface small." },
      { label: "Read the response", detail: "If the payload is wrong, stop before you send." },
    ],
  },
  "claude-code": {
    title: "Claude Code as the operator",
    steps: [
      { label: "Add the MCP server in the CLI", detail: "Same endpoint as the desktop clients." },
      { label: "Keep the brief in the repo", detail: "My Product and ICP live next to the prompts." },
      { label: "Finish with a review pass", detail: "A local agent can still write a bad note." },
    ],
  },
};

export function featureFlow(slug: string) {
  return FEATURE_FLOW[slug] ?? null;
}

export function integrationFlow(slug: string) {
  return INTEGRATION_FLOW[slug] ?? INTEGRATION_FLOW.mcp;
}

export function bodyArtFor(family: SeoFamily, slug: string): BodyArt[] {
  if (family === "features" && FEATURE_ART[slug]) {
    return [FEATURE_ART[slug]];
  }

  if (family === "integrations") {
    return [
      {
        src: `/seo/integrations/${slug}-body.png`,
        alt: `${slug.replace(/-/g, " ")} connect path: operator to Omentir to LinkedIn`,
        caption:
          "The operator holds the conversation. Omentir holds LinkedIn, the limits, and the review queue.",
      },
    ];
  }

  if (family === "comparisons") {
    return [
      {
        src: "/seo/comparisons/choose-body.avif",
        alt: "How to choose: name the job, check the channel, run a two-week test",
        caption:
          "A database, an email rotator, and a LinkedIn agent are not the same purchase. Name the job first.",
      },
    ];
  }

  return [];
}

export function blogSceneFor(category: string): BodyArt | null {
  const key = category.toLowerCase().replace(/\s+/g, "-");
  const known: Record<string, string> = {
    guides: "Most of these pages are field notes, not frameworks. Read the part you will use this week.",
    outreach: "A connection request is a reason, written short enough to read on a phone.",
    copywriting: "Cut the paragraph. Keep the one sentence only that person would recognize.",
    playbooks: "A playbook is a calendar and a list, not a slogan.",
    automation: "Automation is pacing. If the account cannot survive next month, the script is wrong.",
    comparisons: "Two tools can both be good. They are rarely good at the same job.",
    "case-studies": "A case study should name the list, the note, and the number of meetings. Everything else is atmosphere.",
    updates: "Product notes when something actually changed.",
  };
  if (!known[key]) return null;
  return {
    src: `/blogs/scenes/${key}.avif`,
    alt: `${category} diagram for this article`,
    caption: known[key],
  };
}

export function comparisonFlow() {
  return {
    title: "How to read this matchup",
    steps: [
      { label: "Name the job", detail: "Discovery, email send, or LinkedIn conversations." },
      { label: "Check the channel", detail: "If the work happens on LinkedIn, a cold-email engine will not do it." },
      { label: "Run a two-week test", detail: "One segment. Measure replies and meetings, not vanity sends." },
    ],
  };
}
