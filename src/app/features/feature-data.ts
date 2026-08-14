import { applyPageExtras, FEATURE_EXTRAS } from "../seo-content/page-extras";
import type { SeoContentPage } from "../seo-content/types";

/**
 * Product feature pages. Curated only. Do not mass-generate feature slugs
 * for keyword coverage. Each page should answer a real buyer question about
 * what Omentir does and when to use it.
 */
const FEATURE_PAGES: SeoContentPage[] = [
  {
    slug: "steal-customers",
    title: "Steal Customers",
    description:
      "How Omentir Steal Customers finds buyers who comment on competitor company and employee posts, scores them as leads, and runs AI LinkedIn outreach with real engagement context.",
    summary:
      "Turn competitor post commenters into qualified LinkedIn leads with post context and automated outreach.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "Steal Customers Omentir",
      "competitor commenter leads",
      "LinkedIn competitor engagement",
      "AI sales agent competitor posts",
    ],
    sections: [
      {
        id: "what-it-is",
        heading: "What Steal Customers does",
        paragraphs: [
          "Steal Customers is an Omentir agent mode built for a specific outbound motion: people who already engage with your competitors are often warmer than cold ICP lists. Instead of starting from a static database, the agent uses competitor LinkedIn company pages and optional founder or employee profiles as signal sources.",
          "Discovery finds relevant employees, scans their posts, and promotes commenters as buyer leads. Each lead can carry engagement context such as post text, post URL, and the comment that made them interesting. That context is what makes the first message feel specific instead of generic.",
        ],
      },
      {
        id: "how-it-works",
        heading: "How the workflow runs",
        paragraphs: [
          "You configure a Steal Customers agent with competitor company LinkedIn URLs and, when useful, founder or employee profile URLs. Omentir treats those sources as the signal set. The agent does not ask you to rebuild a full ICP filter the way a classic lead finder does.",
          "Once discovery runs, commenters land in a lead group with the engagement context attached. AI outreach can then draft connection requests and follow-ups that reference the real post and comment, subject to your campaign settings, send windows, and daily safety limits.",
        ],
        bullets: [
          "Signal sources: competitor company pages plus optional founder or employee profiles",
          "Lead quality signal: public engagement with competitor content, not purchased contact rows",
          "Outreach input: post and comment context for personalization",
          "Safety: same LinkedIn pacing, send windows, and daily limits as other Omentir agents",
        ],
      },
      {
        id: "when-to-use",
        heading: "When Steal Customers is the right motion",
        paragraphs: [
          "Use Steal Customers when your market has clear competitors with active LinkedIn presence, and buyers already leave comments, questions, or reactions on those posts. It is especially useful for founders and small teams who want intent-shaped leads without buying another contact database.",
          "It is less useful when competitors are silent on LinkedIn, when engagement is mostly spam, or when you need strict title and industry filters before any outreach. In those cases, start with a classic lead finder and use Steal Customers as a parallel signal, not the only one.",
        ],
      },
      {
        id: "setup",
        heading: "What you need before you start",
        paragraphs: [
          "Fill My Product so outreach understands what you sell. Connect a LinkedIn account you are allowed to use for outbound. Create a Steal Customers agent, add competitor URLs, and keep at least one agent active if you care about the Minimum Booking Guarantee measurement rules.",
          "You can also create and manage Steal Customers agents from Claude, ChatGPT, Grok, Cursor, or other MCP and REST operators. Human setup lives on the MCP Server and For Agents pages.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Does Steal Customers replace ICP-based lead finders?",
        answer:
          "No. Steal Customers is a separate agent mode focused on competitor engagement. Classic lead finders still use roles, industries, locations, and keywords. Many teams run both.",
      },
      {
        question: "What makes a Steal Customers lead different?",
        answer:
          "Leads come from people who engaged with competitor posts, and Omentir can store post and comment context so outreach can reference a real signal instead of a template-only opener.",
      },
      {
        question: "Can my AI create a Steal Customers agent?",
        answer:
          "Yes. After My Product is complete and LinkedIn is connected, an MCP or REST agent can create an agent with mode steal_customers and your competitor LinkedIn URLs.",
      },
      {
        question: "Is this safe for my LinkedIn account?",
        answer:
          "Steal Customers uses the same workspace send windows, daily limits, and human-paced automation rules as other Omentir outreach. You remain responsible for platform rules and the accounts you connect.",
      },
    ],
    relatedLinks: [
      {
        label: "Lead finders",
        href: "/features/lead-finders",
        description: "ICP-based discovery when you need role and industry filters.",
      },
      {
        label: "MCP Server",
        href: "/mcp-server",
        description: "Connect Claude, ChatGPT, or Cursor and create agents from chat.",
      },
      {
        label: "For AI Agents",
        href: "/for-agents",
        description: "Operator prompt and REST or OAuth connect paths.",
      },
      {
        label: "High-intent LinkedIn leads",
        href: "/blogs/high-intent-linkedin-leads",
        description: "Playbook on prioritizing intent over raw volume.",
      },
    ],
    primaryCta: { label: "Try Steal Customers", href: "/signup" },
    secondaryCta: { label: "See pricing", href: "/pricing" },
  },
  {
    slug: "ai-linkedin-outreach",
    title: "AI LinkedIn outreach",
    description:
      "How Omentir runs AI-assisted LinkedIn connection requests, messages, and follow-ups from your own profile with send windows, daily limits, and reply tracking.",
    summary:
      "Personalized LinkedIn campaigns that send from your account, follow up automatically, and stay inside safe daily limits.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "AI LinkedIn outreach",
      "LinkedIn outreach automation",
      "personalized LinkedIn messages",
      "AI SDR LinkedIn",
    ],
    sections: [
      {
        id: "overview",
        heading: "Outreach that still looks like you",
        paragraphs: [
          "Omentir is built for LinkedIn-first outbound. Campaigns send connection requests, messages, and follow-ups from the LinkedIn account you connect, not from a black-box sender identity. AI helps draft and personalize copy using product context and lead signals, while you keep control over pacing and campaign goals.",
          "The goal is not maximum blast volume. The goal is a steady, human-paced motion that finds fit buyers, says something relevant, and captures replies in one place.",
        ],
      },
      {
        id: "what-you-control",
        heading: "What you control",
        paragraphs: [
          "You choose the lead group, campaign goal, outreach mode, and send behavior. Send windows can follow each lead's local time. Daily invite and message limits protect account health. Workspace settings remain the place to tighten or relax allowances within provider and plan constraints.",
        ],
        bullets: [
          "Messages and invites send from your connected LinkedIn profile",
          "AI drafts use product profile and lead context, not empty templates alone",
          "Follow-ups continue until a reply or campaign stop condition",
          "Daily limits and human pacing reduce sudden volume spikes",
        ],
      },
      {
        id: "replies",
        heading: "From first touch to interested reply",
        paragraphs: [
          "Outbound only works if replies are visible and actionable. Omentir tracks reply state and collects conversations so you can see who is interested, who needs a human answer, and who should get a scheduling link. You can also work existing threads through the Agent API or MCP tools with explicit draft approval rules for operators.",
          "This is why Omentir is closer to an AI sales workspace than a pure sequencer: discovery, send, and reply handling live together instead of living in three tools you reconcile by hand.",
        ],
      },
      {
        id: "who-it-is-for",
        heading: "Who AI LinkedIn outreach is for",
        paragraphs: [
          "Founders, solo operators, and small B2B teams who already know LinkedIn is where their buyers spend time, and who want consistency without hiring a full SDR bench. It is less of a fit if you only need cold email inbox rotation, or if you want a CRM to own every post-sale workflow.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Does Omentir send LinkedIn messages as me?",
        answer:
          "Yes. Outreach runs through the LinkedIn account you connect. Omentir does not replace your profile with a third-party sender brand.",
      },
      {
        question: "Can I edit AI-written messages?",
        answer:
          "Yes. Campaigns are designed so drafts can be reviewed, edited, or approved according to how you run the workspace. Operator tools that reply to existing threads are intended for draft approval, not silent unsupervised replies.",
      },
      {
        question: "How does Omentir stay within LinkedIn safety boundaries?",
        answer:
          "Omentir enforces daily invite and message limits, supports gradual ramp-ups, and sends at a human pace. You still own compliance with LinkedIn rules and local law.",
      },
      {
        question: "Is email sequencing included?",
        answer:
          "Omentir is LinkedIn-first. If your motion is multi-channel email rotation, explore Instantly or Smartlead alternatives and decide whether LinkedIn discovery and replies are the missing piece.",
      },
    ],
    relatedLinks: [
      {
        label: "Unified inbox",
        href: "/features/unified-inbox",
        description: "Where replies land after outreach starts working.",
      },
      {
        label: "Instantly alternatives",
        href: "/comparisons/omentir-vs-instantly",
        description: "LinkedIn workspace versus cold email sequencing.",
      },
      {
        label: "AI LinkedIn prospecting guide",
        href: "/blogs/ai-linkedin-prospecting",
        description: "Deeper playbook for AI-assisted LinkedIn prospecting.",
      },
      {
        label: "Pricing",
        href: "/pricing",
        description: "Pro and Enterprise plans for managed Omentir.",
      },
    ],
  },
  {
    slug: "lead-finders",
    title: "Lead finders",
    description:
      "How Omentir classic lead finders turn your ideal customer profile into ongoing LinkedIn prospect discovery, scored leads, and campaign-ready groups.",
    summary:
      "Define roles, industries, locations, and keywords. Let agents find and organize buyers that match.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "LinkedIn lead finder",
      "ICP lead discovery",
      "AI prospecting agent",
      "B2B lead generation LinkedIn",
    ],
    sections: [
      {
        id: "what-lead-finders-are",
        heading: "Classic lead finders in plain language",
        paragraphs: [
          "A classic Omentir lead finder is an agent that searches for people who match the buyer you described. You give it titles, industries, locations, keywords, and product context from My Product. It returns leads you can review, group, and push into outreach campaigns.",
          "This is the default discovery path when you know who should buy, but do not want to live in LinkedIn search filters all day or buy a static list that goes stale after one export.",
        ],
      },
      {
        id: "icp-and-product",
        heading: "Why My Product and ICP matter",
        paragraphs: [
          "Discovery quality follows clarity. My Product tells the system what you sell and why it matters. ICP fields narrow who is worth contacting. Together they reduce the chance that the agent fills a group with plausible-looking but wrong people.",
          "If your offer or ICP is still fuzzy, fix that first. A lead finder will amplify the definition you give it. It will not invent product-market fit for you.",
        ],
      },
      {
        id: "from-leads-to-campaigns",
        heading: "From discovered leads to campaigns",
        paragraphs: [
          "Leads land in groups you can inspect. From there you launch campaigns for connection requests, messages, and follow-ups. Scoring and review steps help you prioritize who gets manual attention versus automated first touches.",
          "You can create, pause, resume, and inspect lead finders from the dashboard or from MCP and REST operators. That means a human or an AI operator can keep discovery running without rebuilding the whole stack.",
        ],
        bullets: [
          "Create agents with prompt plus targeting fields",
          "List and filter leads after discovery runs",
          "Attach outreach and reply handling when you are ready",
          "Pause or resume without deleting the lead group",
        ],
      },
      {
        id: "lead-finders-vs-steal-customers",
        heading: "Lead finders versus Steal Customers",
        paragraphs: [
          "Lead finders start from ICP filters. Steal Customers starts from competitor engagement. Use lead finders when the job is 'find more people like our best customers.' Use Steal Customers when the job is 'talk to people already reacting to competitors.' Many workspaces run both.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Do I need a purchased lead database?",
        answer:
          "No. Classic lead finders discover prospects from your ICP and product context inside Omentir. You may still use external research, but the product is not a static contact export tool.",
      },
      {
        question: "Can I run multiple lead finders?",
        answer:
          "Yes. Teams often separate agents by segment, offer, or geography. Plan limits apply on the managed product; self-hosted installs use your own infrastructure ceilings.",
      },
      {
        question: "What happens when discovery returns weak leads?",
        answer:
          "Tighten titles, industries, locations, and keywords, and refresh My Product so scoring and personalization match the real offer. Weak ICP definitions produce weak lists in every tool.",
      },
      {
        question: "Can agents create lead finders for me?",
        answer:
          "Yes. MCP and REST tools support create, update, list, pause, resume, and delete for agents, including classic lead finders.",
      },
    ],
    relatedLinks: [
      {
        label: "Steal Customers",
        href: "/features/steal-customers",
        description: "Competitor engagement as an alternative discovery mode.",
      },
      {
        label: "AI LinkedIn outreach",
        href: "/features/ai-linkedin-outreach",
        description: "What happens after leads are ready for campaigns.",
      },
      {
        label: "ICP-based lead discovery",
        href: "/blogs/icp-based-lead-discovery",
        description: "Longer guide on ICP-driven outbound.",
      },
      {
        label: "Agent API and MCP",
        href: "/features/agent-api-and-mcp",
        description: "Operate lead finders from Claude, ChatGPT, or Cursor.",
      },
    ],
  },
  {
    slug: "unified-inbox",
    title: "Unified inbox",
    description:
      "How Omentir collects LinkedIn outreach replies in one inbox so founders and small teams can prioritize interested conversations and move toward booked demos.",
    summary:
      "See replies from campaigns in one place, sort by intent, and keep follow-up from getting lost.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "LinkedIn outreach inbox",
      "sales reply inbox",
      "outbound reply tracking",
      "unified sales inbox",
    ],
    sections: [
      {
        id: "why-inbox",
        heading: "Why reply handling belongs next to outreach",
        paragraphs: [
          "Many outbound stacks can send. Fewer make it easy to see who replied, what they said, and what should happen next. Omentir keeps reply tracking next to the same workspace that discovered the lead and ran the campaign, so you are not exporting CSV snapshots to find interested people.",
          "For a founder or lean team, that matters more than another personalization toggle. Pipeline dies in the gap between 'message sent' and 'human noticed the reply.'",
        ],
      },
      {
        id: "what-you-see",
        heading: "What the unified inbox is for",
        paragraphs: [
          "The inbox is where conversations surface after outreach. You can work through interested replies, keep context with the lead, and decide whether to answer, schedule, or stop. Intent-oriented organization helps you spend time on people who are actually engaging.",
          "Operator tooling can list conversations and draft replies for existing threads, with the expectation that a human approves drafts before anything goes out through reply tools.",
        ],
      },
      {
        id: "booking",
        heading: "From reply to booked conversation",
        paragraphs: [
          "Interested replies are only useful if they turn into meetings or clear next steps. Omentir's broader product motion is built to move from personalized first touches to demos. The Minimum Booking Guarantee on eligible managed plans measures real booked conversations, not vanity send counts.",
          "Your booking link, offer clarity, and response speed still matter. Software can collect replies. It cannot invent a reason for someone to meet.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is the unified inbox a full CRM?",
        answer:
          "No. It is a reply and conversation surface for LinkedIn outbound. Use your CRM for broader pipeline stages if you need company-wide deal management.",
      },
      {
        question: "Can AI reply for me automatically?",
        answer:
          "Omentir can draft and assist, and operator tools are designed for approved replies on existing threads. Unsupervised blasting into every reply is not the intended safety model.",
      },
      {
        question: "Do replies stay tied to the original lead?",
        answer:
          "Yes. Conversations sit with the lead and campaign context so you can see who was contacted and what they said without rebuilding the thread from memory.",
      },
    ],
    relatedLinks: [
      {
        label: "AI LinkedIn outreach",
        href: "/features/ai-linkedin-outreach",
        description: "How messages and follow-ups are sent before replies arrive.",
      },
      {
        label: "Minimum Booking Guarantee",
        href: "/minimum-booking-guarantee",
        description: "How eligible weeks and qualifying bookings are measured.",
      },
      {
        label: "Pricing",
        href: "/pricing",
        description: "Managed plan options for the hosted product.",
      },
    ],
  },
  {
    slug: "agent-api-and-mcp",
    title: "Agent API and MCP",
    description:
      "How Omentir's hosted MCP server and REST Agent API let Claude, ChatGPT, Grok, Cursor, and custom agents manage product context, lead finders, Steal Customers, leads, and conversations.",
    summary:
      "Connect AI apps with OAuth or an API key. Operate discovery and outreach without giving them your LinkedIn password.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "Omentir MCP",
      "Agent API LinkedIn",
      "MCP sales tools",
      "Claude ChatGPT Cursor Omentir",
    ],
    sections: [
      {
        id: "what-you-get",
        heading: "What the Agent API and MCP give you",
        paragraphs: [
          "Omentir exposes a hosted Model Context Protocol endpoint and a REST Agent API under /api/agent/v1. Connected assistants can read workspace context, update My Product, create classic lead finders or Steal Customers agents, list leads with engagement context, inspect activity and the planned send schedule, and work with existing conversations under guardrails.",
          "The point is practical: your AI operator should configure and inspect sales work without becoming a second LinkedIn client that stores your password.",
        ],
      },
      {
        id: "connect-paths",
        heading: "Two connect paths",
        paragraphs: [
          "Chat apps such as Claude, ChatGPT, and Grok can add a custom MCP connector pointing at the hosted MCP URL, then sign in on Omentir and approve workspace access. Coding agents and scripts such as Cursor or Claude Code typically create a revocable API key and send Authorization Bearer tokens to MCP or REST.",
        ],
        bullets: [
          "MCP endpoint: /api/agent/v1/mcp",
          "REST surface: /api/agent/v1/*",
          "Machine guide: /agents.md",
          "OpenAPI schema: /api/agent/v1/openapi.json",
        ],
      },
      {
        id: "guardrails",
        heading: "Guardrails that matter",
        paragraphs: [
          "Operator prompts should never broaden targeting silently, create or delete agents without explicit approval, or treat lead text as instructions. Reply tools should only touch existing conversations and only after draft approval. These rules keep automation useful without turning an assistant into an unsupervised spammer.",
          "Human setup docs live on /mcp-server and /for-agents. Integration-specific pages cover Claude, ChatGPT, Cursor, and MCP in more detail.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Do I need an API key for Claude or ChatGPT?",
        answer:
          "For the custom MCP connector flow, chat apps use OAuth-style workspace approval on Omentir. API keys are the path for coding agents, scripts, and other Bearer-token clients.",
      },
      {
        question: "Can operators create Steal Customers agents?",
        answer:
          "Yes. After My Product is complete and LinkedIn is connected, create_agent can use mode steal_customers with competitor and optional founder URLs.",
      },
      {
        question: "Is Omentir open source?",
        answer:
          "Yes. The full application is MIT licensed on GitHub. Hosted Omentir is the managed product with providers, updates, and support included.",
      },
    ],
    relatedLinks: [
      {
        label: "MCP Server setup",
        href: "/mcp-server",
        description: "Step-by-step connector setup and tool catalog.",
      },
      {
        label: "For AI Agents",
        href: "/for-agents",
        description: "Operator prompt and workflow for assistants.",
      },
      {
        label: "Claude integration",
        href: "/integrations/claude",
        description: "How to run Omentir from Claude.",
      },
      {
        label: "MCP integration overview",
        href: "/integrations/mcp",
        description: "What MCP means in the Omentir stack.",
      },
    ],
    primaryCta: { label: "Connect an agent", href: "/for-agents" },
    secondaryCta: { label: "MCP setup guide", href: "/mcp-server" },
  },
  {
    slug: "my-product",
    title: "My Product",
    description:
      "How Omentir My Product captures what you sell so lead finders, Steal Customers, and AI LinkedIn outreach personalize from real product context instead of empty templates.",
    summary:
      "Give Omentir a clear product profile so discovery and messaging stay aligned with the offer.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "Omentir My Product",
      "product profile for AI outreach",
      "ICP product context",
      "AI sales personalization context",
    ],
    sections: [
      {
        id: "what-my-product-is",
        heading: "What My Product is for",
        paragraphs: [
          "My Product is the workspace profile of what you sell, who it helps, and why someone should care. Omentir uses that context when agents discover leads, score fit, and draft outreach. Without it, personalization collapses into generic openers that sound the same as every other tool.",
          "Think of it as the brief you would hand a new SDR on day one: product story, buyer pains, proof points, and the language you actually use with customers. The difference is that every agent and campaign can read the same brief.",
        ],
      },
      {
        id: "what-to-write",
        heading: "What to put in the profile",
        paragraphs: [
          "Write for a smart stranger. Name the product, the job it does, the buyer it serves, and the outcomes you can defend. Include the phrases your best customers use. Avoid marketing fog that no prospect would recognize in a LinkedIn message.",
          "Website import can speed the first draft when you have a live product site. You still need to edit for accuracy. A polished homepage and a truthful sales pitch are not always the same document.",
        ],
        bullets: [
          "Clear one-sentence offer and category",
          "Buyer roles and situations that convert",
          "Pains and triggers worth mentioning in outreach",
          "Differentiators you can stand behind in a short DM",
        ],
      },
      {
        id: "how-agents-use-it",
        heading: "How agents and campaigns use it",
        paragraphs: [
          "Classic lead finders use product context together with titles, industries, locations, and keywords. Steal Customers still needs My Product complete so outreach can explain your offer when commenting buyers get a first message. Operator tools on MCP and REST can read and update the profile so Claude, ChatGPT, or Cursor keep context current.",
          "If replies sound off-topic, fix My Product before you blame the model. Bad brief, bad copy.",
        ],
      },
      {
        id: "when-to-refresh",
        heading: "When to refresh the profile",
        paragraphs: [
          "Update My Product when you change pricing positioning, ship a new wedge feature, pivot ICP, or notice campaigns still pitching an old story. A stale product profile is a quiet way to burn a warm list with outdated claims.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is My Product the same as a CRM account record?",
        answer:
          "No. It is a product and offer brief for discovery and outreach, not a pipeline of company accounts.",
      },
      {
        question: "Do I need My Product for Steal Customers?",
        answer:
          "Yes. Steal Customers needs product context so outreach can say what you sell after discovery finds competitor commenters.",
      },
      {
        question: "Can an AI operator update My Product?",
        answer:
          "Yes. MCP and REST expose get and update product profile tools. Require human approval for material claim changes.",
      },
    ],
    relatedLinks: [
      {
        label: "Lead finders",
        href: "/features/lead-finders",
        description: "How ICP discovery uses product context.",
      },
      {
        label: "AI LinkedIn outreach",
        href: "/features/ai-linkedin-outreach",
        description: "Where personalized copy shows up in campaigns.",
      },
      {
        label: "Extract ICP from website",
        href: "/blogs/extract-icp-from-website",
        description: "Longer guide on turning a site into targeting clarity.",
      },
    ],
  },
  {
    slug: "campaigns-and-send-windows",
    title: "Campaigns, follow-ups, and send windows",
    description:
      "How Omentir LinkedIn campaigns run connection requests, messages, and follow-ups with per-lead send windows and workspace daily limits.",
    summary:
      "Control what sends, when it sends in the lead's local time, and how hard the workspace pushes each day.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "LinkedIn outreach campaigns",
      "LinkedIn send windows",
      "AI follow-up sequences",
      "human paced LinkedIn outreach",
    ],
    sections: [
      {
        id: "campaign-basics",
        heading: "What a campaign does",
        paragraphs: [
          "A campaign is the send plan for a lead group: connection requests, messages, and follow-ups tied to your goal and outreach mode. AI can draft personalized steps from product and lead context, while the campaign still runs through the LinkedIn account you connected.",
          "Campaigns are not a license to ignore account health. Daily limits, delays, and human pacing exist so volume spikes do not become the default strategy.",
        ],
      },
      {
        id: "send-windows",
        heading: "Send windows in the lead's time zone",
        paragraphs: [
          "Send windows decide when outreach is allowed to go out relative to each lead's local time. That matters when your buyers span cities and continents. A message that lands at a sane local hour is more likely to be read than a blast timed only for your office clock.",
          "Workspace settings still govern overall daily capacity. Campaign windows and workspace limits work together. They are not two independent unlimited systems.",
        ],
      },
      {
        id: "follow-ups",
        heading: "Follow-ups without spam theater",
        paragraphs: [
          "Most deals need more than one touch. Follow-ups should add a new angle, a clearer ask, or a lighter check-in, not the same pitch pasted three times. Omentir can keep the sequence moving until a reply or a stop condition. You decide how aggressive that motion is.",
          "When someone replies, the conversation belongs in the unified inbox so the sequence does not keep talking past a human answer.",
        ],
      },
      {
        id: "safety",
        heading: "Safety and operator control",
        paragraphs: [
          "Dashboard users and MCP operators can inspect scheduled actions and activity to see what is planned. Raising limits or widening windows should be an explicit choice, not a silent agent rewrite. LinkedIn provider rules and plan ceilings still apply.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Can I pause a campaign without deleting leads?",
        answer:
          "Yes. Agents and campaigns can be paused while lead groups remain available for later use.",
      },
      {
        question: "Are send windows global or per lead?",
        answer:
          "Campaign send windows are measured in each lead's own time zone. Daily sending capacity is governed at the workspace level.",
      },
      {
        question: "Does Omentir send at midnight if I leave it open?",
        answer:
          "Configured send windows and daily limits constrain when and how much can send. You should still set windows that match a human work pattern.",
      },
    ],
    relatedLinks: [
      {
        label: "AI LinkedIn outreach",
        href: "/features/ai-linkedin-outreach",
        description: "The broader outreach product motion.",
      },
      {
        label: "LinkedIn account safety",
        href: "/features/linkedin-account-safety",
        description: "Limits, pacing, and account health habits.",
      },
      {
        label: "Human-paced outreach",
        href: "/blogs/human-paced-outreach",
        description: "Why volume spikes fail.",
      },
    ],
  },
  {
    slug: "linkedin-account-safety",
    title: "LinkedIn account safety",
    description:
      "How Omentir protects LinkedIn outbound with daily invite and message limits, human pacing, ramp-ups, and workspace controls you can tighten.",
    summary:
      "Safe defaults and explicit limits so outbound stays sustainable on your own profile.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "LinkedIn account safety",
      "LinkedIn outreach daily limits",
      "safe LinkedIn automation",
      "LinkedIn warm up outbound",
    ],
    sections: [
      {
        id: "why-safety",
        heading: "Why safety is a product feature",
        paragraphs: [
          "LinkedIn outbound fails in two ways: nobody replies, or the account gets restricted because volume looked robotic. Omentir is designed for the first problem without ignoring the second. Outreach runs from your profile with daily limits and human-paced sending rather than unlimited blast mode.",
          "No tool can promise zero risk. Platform rules change, and misuse still belongs to the operator. What Omentir can do is make the safe path the easy path.",
        ],
      },
      {
        id: "controls",
        heading: "Controls you actually get",
        paragraphs: [
          "Workspace settings cover invite and message ceilings, delays, and related outreach preferences. Campaigns respect those ceilings while still following send windows. New or cold accounts should ramp gradually instead of jumping to peak volume on day one.",
        ],
        bullets: [
          "Daily invite and message limits",
          "Human-paced automation rather than burst sends",
          "Send windows aligned to lead local time",
          "Settings you can tighten when risk tolerance is low",
        ],
      },
      {
        id: "warmup",
        heading: "Warm-up and account health habits",
        paragraphs: [
          "A new LinkedIn presence that suddenly sends at full capacity is a common failure mode. Warm the account with normal profile activity and a gradual outbound curve. Keep personal branding intact. Automation that turns your profile into a spam billboard destroys trust even when the account stays open.",
          "If you use the Minimum Booking Guarantee on the managed product, active-agent and eligibility rules still assume a real outbound motion, not a paused or disconnected setup.",
        ],
      },
      {
        id: "what-you-own",
        heading: "What you still own",
        paragraphs: [
          "You own the accounts you connect, the claims in your messages, and compliance with LinkedIn rules and local law. Omentir is infrastructure for a careful motion. It is not a shield for reckless copy or purchased accounts you do not control.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Does Omentir guarantee my LinkedIn will never be restricted?",
        answer:
          "No vendor can honestly guarantee that. Omentir enforces limits and pacing to reduce risky spikes. Platform enforcement still depends on many factors outside any single app.",
      },
      {
        question: "Can I raise limits myself?",
        answer:
          "Within product and plan constraints, workspace settings let you control sending limits. Raising them is an explicit choice and should match account age and history.",
      },
      {
        question: "Is self-hosted Omentir unlimited?",
        answer:
          "Self-hosted installs still ship with safety-minded ceilings so a leaked token or buggy integration cannot blast without bound. You run providers and infrastructure yourself.",
      },
    ],
    relatedLinks: [
      {
        label: "Campaigns and send windows",
        href: "/features/campaigns-and-send-windows",
        description: "How scheduled outreach is constrained.",
      },
      {
        label: "LinkedIn outreach compliance",
        href: "/blogs/linkedin-outreach-compliance-2026",
        description: "Legal and platform checklist style guide.",
      },
      {
        label: "How to warm up a LinkedIn account",
        href: "/blogs/how-to-warm-up-linkedin-account",
        description: "Practical warm-up guidance.",
      },
    ],
  },
  {
    slug: "lead-groups-and-scoring",
    title: "Lead groups and scoring",
    description:
      "How Omentir organizes discovered prospects into lead groups, scores fit, and helps you decide who gets outreach first.",
    summary:
      "Keep ICP-fit buyers organized, review quality before volume, and feed the right people into campaigns.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "LinkedIn lead scoring",
      "lead groups outbound",
      "ICP lead organization",
      "AI lead qualification",
    ],
    sections: [
      {
        id: "groups",
        heading: "Why lead groups exist",
        paragraphs: [
          "Discovery without organization becomes a pile. Lead groups hold the people an agent found so you can review, segment, and attach campaigns without mixing every experiment into one list. Separate groups by offer, geography, or motion such as classic ICP versus Steal Customers.",
          "Deleting an agent does not have to mean throwing away the people it already found. Groups and leads can outlive a single agent configuration when you keep them on purpose.",
        ],
      },
      {
        id: "scoring",
        heading: "Scoring as prioritization, not prophecy",
        paragraphs: [
          "Scoring helps you rank who looks closest to the buyer you described. It is a prioritization aid, not a guarantee that the top row will buy. Use scores to decide manual review order and campaign priority. Override them when you know the market better than the model.",
          "Weak ICP definitions produce confident but wrong scores. Fix targeting and My Product when the ranking feels consistently off.",
        ],
      },
      {
        id: "review",
        heading: "Human review still wins early",
        paragraphs: [
          "Early in a motion, skim leads before you open the fire hose. Ten minutes of review often saves a week of wrong outreach. Later, when patterns are stable, you can trust automation more on well-defined segments.",
        ],
      },
      {
        id: "operators",
        heading: "Inspecting leads from agents",
        paragraphs: [
          "MCP and REST tools can list and fetch leads, including engagement context for Steal Customers. Operators should report empty results honestly and check activity before inventing prospects that were never discovered.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Can one workspace have many lead groups?",
        answer:
          "Yes. Teams commonly separate groups by segment, campaign goal, or agent mode.",
      },
      {
        question: "Does a high score mean I should always message immediately?",
        answer:
          "Not always. Score is a fit signal. Timing, offer relevance, and account safety still matter.",
      },
      {
        question: "Where do groups feed next?",
        answer:
          "Into campaigns for connection requests, messages, and follow-ups, then into the inbox when people reply.",
      },
    ],
    relatedLinks: [
      {
        label: "Lead finders",
        href: "/features/lead-finders",
        description: "How prospects enter groups.",
      },
      {
        label: "Steal Customers",
        href: "/features/steal-customers",
        description: "Engagement-based discovery into groups.",
      },
      {
        label: "LinkedIn lead scoring blog",
        href: "/blogs/linkedin-lead-scoring",
        description: "Deeper scoring playbook.",
      },
    ],
  },
  {
    slug: "open-source-self-hosting",
    title: "Open source and self-hosting Omentir",
    description:
      "What Omentir being MIT open source means for buyers: read the code, self-host with Docker, or use the managed product with providers and support included.",
    summary:
      "Transparent codebase, self-host option, or managed Omentir at omentir.com. Same product family, different ops burden.",
    publishedDate: "August 12, 2026",
    updatedDate: "August 12, 2026",
    keywords: [
      "Omentir open source",
      "self-host Omentir",
      "MIT AI sales software",
      "Omentir Docker",
    ],
    sections: [
      {
        id: "open-source",
        heading: "Open source in plain terms",
        paragraphs: [
          "Omentir's application code is public on GitHub under the MIT license. You can read how outreach, agents, and safety limits work instead of trusting a black box. That transparency matters when software sends messages from your personal LinkedIn identity.",
          "Open source does not mean every third-party service is free. Self-hosting still needs your own accounts for identity, data store, LinkedIn connectivity, and model providers as documented in the repository.",
        ],
      },
      {
        id: "self-host",
        heading: "When self-hosting makes sense",
        paragraphs: [
          "Self-host if you have ops capacity, want data residency under your control, or need to run inside your own infrastructure constraints. Docker-oriented setup exists for that path. You own uptime, upgrades, secrets, and provider failures.",
          "Self-host is a poor fit if you wanted a fully managed sales tool and hoped open source would remove all maintenance. Managed Omentir exists exactly so most teams do not have to run the stack.",
        ],
      },
      {
        id: "hosted",
        heading: "When the hosted product is the better buy",
        paragraphs: [
          "Choose hosted Omentir when you want the same product without operating Firebase, Unipile, model keys, and deploy pipelines yourself. Pricing covers the managed experience, support expectations, and commercial packaging such as the Minimum Booking Guarantee rules where eligible.",
        ],
      },
      {
        id: "trust",
        heading: "Trust implications",
        paragraphs: [
          "Auditable code helps technical buyers. It does not replace terms of service, privacy policy, or your responsibility for how you message people. Read both the repository and the public legal pages before you put production outbound on either path.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is the hosted product closed source?",
        answer:
          "Hosted Omentir runs the open-source application as a managed service. You pay for operations, providers, and support packaging, not for a secret second codebase narrative.",
      },
      {
        question: "Where is the repository?",
        answer:
          "https://github.com/vanshyadav1408/Omentir under the MIT license.",
      },
      {
        question: "Can I mix self-host for data and hosted for convenience?",
        answer:
          "Teams usually pick one primary path. Evaluate based on who will operate LinkedIn connectivity, models, and uptime.",
      },
    ],
    relatedLinks: [
      {
        label: "Open source announcement",
        href: "/blogs/omentir-is-now-open-source",
        description: "Why the code went public.",
      },
      {
        label: "Pricing",
        href: "/pricing",
        description: "Managed plan options.",
      },
      {
        label: "GitHub repository",
        href: "https://github.com/vanshyadav1408/Omentir",
        description: "Source and self-host docs.",
      },
    ],
    primaryCta: { label: "Try hosted Omentir", href: "/signup" },
    secondaryCta: { label: "View on GitHub", href: "https://github.com/vanshyadav1408/Omentir" },
  },
];

export const ALL_FEATURES: SeoContentPage[] = applyPageExtras(FEATURE_PAGES, FEATURE_EXTRAS);

export function getFeature(slug: string) {
  return ALL_FEATURES.find((page) => page.slug === slug);
}
