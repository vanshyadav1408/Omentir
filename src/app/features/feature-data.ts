import type { SeoContentPage } from "../seo-content/types";

/**
 * Product feature pages. Curated only.
 * One TypeScript route renders these: `/features/[slug]/page.tsx`.
 */
export const ALL_FEATURES: SeoContentPage[] = [
  {
    "slug": "linkedin-account-safety",
    "title": "LinkedIn account safety",
    "description": "How Omentir protects LinkedIn outbound with daily invite and message limits, human pacing, ramp-ups, and workspace controls you can tighten.",
    "summary": "Safe defaults and explicit limits so outbound stays sustainable on your own profile.",
    "publishedDate": "August 12, 2026",
    "updatedDate": "August 12, 2026",
    "keywords": [
      "LinkedIn account safety",
      "LinkedIn outreach daily limits",
      "safe LinkedIn automation",
      "LinkedIn warm up outbound"
    ],
    "sections": [
      {
        "id": "why-safety",
        "heading": "Why safety is a product feature",
        "paragraphs": [
          "LinkedIn outbound fails in two ways: nobody replies, or the account gets restricted because volume looked robotic. Omentir targets the first problem without ignoring the second. Outreach runs from your profile with daily limits and human-paced sending rather than unlimited blast mode.",
          "No tool can promise zero risk. Platform rules change, and misuse still belongs to the operator. What Omentir can do is make the safe path the easy path."
        ]
      },
      {
        "id": "controls",
        "heading": "Controls you actually get",
        "paragraphs": [
          "Workspace settings cover invite and message ceilings, delays, and related outreach preferences. Campaigns respect those ceilings while still following send windows. New or cold accounts should ramp gradually instead of jumping to peak volume on day one."
        ],
        "bullets": [
          "Daily invite and message limits",
          "Human-paced automation rather than burst sends",
          "Send windows aligned to lead local time",
          "Settings you can tighten when risk tolerance is low"
        ]
      },
      {
        "id": "warmup",
        "heading": "Warm-up and account health habits",
        "paragraphs": [
          "A new LinkedIn presence that suddenly sends at full capacity is a common failure mode. Warm the account with normal profile activity and a gradual outbound curve. Keep personal branding intact. Automation that turns your profile into a spam billboard destroys trust even when the account stays open.",
          "If you use the Minimum Booking Guarantee on the managed product, active-agent and eligibility rules still assume a real outbound motion, not a paused or disconnected setup."
        ]
      },
      {
        "id": "what-you-own",
        "heading": "What you still own",
        "paragraphs": [
          "You own the accounts you connect, the claims in your messages, and compliance with LinkedIn rules and local law. Omentir is infrastructure for a careful motion. It is not a shield for reckless copy or purchased accounts you do not control."
        ]
      },
      {
        "id": "first-week",
        "heading": "How to treat a new or recently restricted profile",
        "paragraphs": [
          "Warm the account with normal use before you attach a campaign: profile complete, some real conversations, no sudden invite spike. Then start below the default daily cap and raise it only after a clean week. If the profile was restricted recently, wait and keep the first batch tiny.",
          "Do not connect an account you are not allowed to use for outbound. Safety features protect pacing. They do not make a borrowed or purchased account a good idea."
        ]
      },
      {
        "id": "not-for",
        "heading": "What account safety does not promise",
        "paragraphs": [
          "Omentir cannot guarantee that LinkedIn will never restrict a profile. Platform rules change, and people still report spam. The product keeps volume human and visible. You still own the copy, the targeting, and whether the account is yours to use."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Does Omentir guarantee my LinkedIn will never be restricted?",
        "answer": "No vendor can honestly guarantee that. Omentir enforces limits and pacing to reduce risky spikes. Platform enforcement still depends on many factors outside any single app."
      },
      {
        "question": "Can I raise limits myself?",
        "answer": "Within product and plan constraints, workspace settings let you control sending limits. Raising them is an explicit choice and should match account age and history."
      },
      {
        "question": "Is self-hosted Omentir unlimited?",
        "answer": "Self-hosted installs still ship with safety-minded ceilings so a leaked token or buggy integration cannot blast without bound. You run providers and infrastructure yourself."
      }
    ],
    "relatedLinks": [
      {
        "label": "Campaigns and send windows",
        "href": "/features/campaigns-and-send-windows",
        "description": "How scheduled outreach is constrained."
      },
      {
        "label": "LinkedIn outreach compliance",
        "href": "/blogs/linkedin-outreach-compliance-2026",
        "description": "Legal and platform checklist style guide."
      },
      {
        "label": "How to warm up a LinkedIn account",
        "href": "/blogs/how-to-warm-up-linkedin-account",
        "description": "Practical warm-up guidance."
      }
    ],
    "highlights": [
      "Human pacing",
      "Ramp-ups for new profiles",
      "Workspace-level caps"
    ]
  },
  {
    "slug": "my-product",
    "title": "My Product",
    "description": "How Omentir My Product captures what you sell so lead finders, Steal Customers, and AI LinkedIn outreach personalize from real product context instead of empty templates.",
    "summary": "Give Omentir a clear product profile so discovery and messaging stay aligned with the offer.",
    "publishedDate": "August 12, 2026",
    "updatedDate": "August 12, 2026",
    "keywords": [
      "Omentir My Product",
      "product profile for AI outreach",
      "ICP product context",
      "AI sales personalization context"
    ],
    "sections": [
      {
        "id": "what-my-product-is",
        "heading": "What My Product is for",
        "paragraphs": [
          "My Product is the workspace profile of what you sell, who it helps, and why someone should care. Omentir uses that context when agents discover leads, score fit, and draft outreach. Without it, personalization collapses into generic openers that sound the same as every other tool.",
          "Think of it as the brief you would hand a new SDR on day one: product story, buyer pains, proof points, and the language you actually use with customers. The difference is that every agent and campaign can read the same brief."
        ]
      },
      {
        "id": "what-to-write",
        "heading": "What to put in the profile",
        "paragraphs": [
          "Write for a smart stranger. Name the product, the job it does, the buyer it serves, and the outcomes you can defend. Include the phrases your best customers use. Avoid marketing fog that no prospect would recognize in a LinkedIn message.",
          "Website import can speed the first draft when you have a live product site. You still need to edit for accuracy. A polished homepage and a truthful sales pitch are not always the same document."
        ],
        "bullets": [
          "Clear one-sentence offer and category",
          "Buyer roles and situations that convert",
          "Pains and triggers worth mentioning in outreach",
          "Differentiators you can stand behind in a short DM"
        ]
      },
      {
        "id": "how-agents-use-it",
        "heading": "How agents and campaigns use it",
        "paragraphs": [
          "Classic lead finders use product context together with titles, industries, locations, and keywords. Steal Customers still needs My Product complete so outreach can explain your offer when commenting buyers get a first message. Operator tools on MCP and REST can read and update the profile so Claude, ChatGPT, or Cursor keep context current.",
          "If replies sound off-topic, fix My Product before you blame the model. Bad brief, bad copy."
        ]
      },
      {
        "id": "when-to-refresh",
        "heading": "When to refresh the profile",
        "paragraphs": [
          "Update My Product when you change pricing positioning, ship a new wedge feature, pivot ICP, or notice campaigns still pitching an old story. A stale product profile is a quiet way to burn a warm list with outdated claims."
        ]
      },
      {
        "id": "first-week",
        "heading": "How to fill My Product so drafts stay honest",
        "paragraphs": [
          "Write the offer the way you would say it on a call: who it is for, what result they get, and what you do not do. Avoid adjectives that a first customer cannot see. If onboarding still needs you on a Zoom, do not claim a two-minute start.",
          "Update My Product when the product changes. Agents and campaigns read this profile. A stale paragraph about a feature you removed will show up in twenty messages before you notice. Treat it like production copy, because it is."
        ]
      },
      {
        "id": "not-for",
        "heading": "What My Product is not",
        "paragraphs": [
          "It is not a public marketing site and not a substitute for a landing page. Prospects do not read it. Your agents do. Keep it specific enough to write a first message and short enough that you will actually maintain it."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Is My Product the same as a CRM account record?",
        "answer": "No. It is a product and offer brief for discovery and outreach, not a pipeline of company accounts."
      },
      {
        "question": "Do I need My Product for Steal Customers?",
        "answer": "Yes. Steal Customers needs product context so outreach can say what you sell after discovery finds competitor commenters."
      },
      {
        "question": "Can an AI operator update My Product?",
        "answer": "Yes. MCP and REST expose get and update product profile tools. Require human approval for material claim changes."
      }
    ],
    "relatedLinks": [
      {
        "label": "Lead finders",
        "href": "/features/lead-finders",
        "description": "How ICP discovery uses product context."
      },
      {
        "label": "AI LinkedIn outreach",
        "href": "/features/ai-linkedin-outreach",
        "description": "Where personalized copy shows up in campaigns."
      },
      {
        "label": "Extract ICP from website",
        "href": "/blogs/extract-icp-from-website",
        "description": "Longer guide on turning a site into targeting clarity."
      }
    ],
    "highlights": [
      "Grounds every draft",
      "Required before agents help",
      "One place to update the offer"
    ]
  },
  {
    "slug": "steal-customers",
    "title": "Steal Customers",
    "description": "How Omentir Steal Customers finds buyers who comment on competitor company and employee posts, scores them as leads, and runs AI LinkedIn outreach with real engagement context.",
    "summary": "Turn competitor post commenters into qualified LinkedIn leads with post context and automated outreach.",
    "publishedDate": "August 12, 2026",
    "updatedDate": "August 12, 2026",
    "keywords": [
      "Steal Customers Omentir",
      "competitor commenter leads",
      "LinkedIn competitor engagement",
      "AI sales agent competitor posts"
    ],
    "sections": [
      {
        "id": "what-it-is",
        "heading": "What Steal Customers does",
        "paragraphs": [
          "Steal Customers is an Omentir agent mode built for a specific outbound motion: people who already engage with your competitors are often warmer than cold ICP lists. Instead of starting from a static database, the agent uses competitor LinkedIn company pages and optional founder or employee profiles as signal sources.",
          "Discovery finds relevant employees, scans their posts, and promotes commenters as buyer leads. Each lead can carry engagement context such as post text, post URL, and the comment that made them interesting. That context is what makes the first message feel specific instead of generic."
        ]
      },
      {
        "id": "how-it-works",
        "heading": "How the workflow runs",
        "paragraphs": [
          "You configure a Steal Customers agent with competitor company LinkedIn URLs and, when useful, founder or employee profile URLs. Omentir treats those sources as the signal set. The agent does not ask you to rebuild a full ICP filter the way a classic lead finder does.",
          "Once discovery runs, commenters land in a lead group with the engagement context attached. AI outreach can then draft connection requests and follow-ups that reference the real post and comment, subject to your campaign settings, send windows, and daily safety limits."
        ],
        "bullets": [
          "Signal sources: competitor company pages plus optional founder or employee profiles",
          "Lead quality signal: public engagement with competitor content, not purchased contact rows",
          "Outreach input: post and comment context for personalization",
          "Safety: same LinkedIn pacing, send windows, and daily limits as other Omentir agents"
        ]
      },
      {
        "id": "when-to-use",
        "heading": "When Steal Customers is the right motion",
        "paragraphs": [
          "Use Steal Customers when your market has clear competitors with active LinkedIn presence, and buyers already leave comments, questions, or reactions on those posts. It is especially useful for founders and small teams who want intent-shaped leads without buying another contact database.",
          "It is less useful when competitors are silent on LinkedIn, when engagement is mostly spam, or when you need strict title and industry filters before any outreach. In those cases, start with a classic lead finder and use Steal Customers as a parallel signal, not the only one."
        ]
      },
      {
        "id": "setup",
        "heading": "What you need before you start",
        "paragraphs": [
          "Fill My Product so outreach understands what you sell. Connect a LinkedIn account you are allowed to use for outbound. Create a Steal Customers agent, add competitor URLs, and keep at least one agent active if you care about the Minimum Booking Guarantee measurement rules.",
          "You can also create and manage Steal Customers agents from Claude, ChatGPT, Grok, Grok Bot, Cursor, or other MCP and REST operators. Human setup lives on the Claude, ChatGPT, Grok Bot, Cursor, and MCP integration pages."
        ]
      },
      {
        "id": "first-week",
        "heading": "How a first week with Steal Customers should look",
        "paragraphs": [
          "Pick two or three competitors that actually post, not every logo in your category. Create one Steal Customers agent, let discovery run, and review the first batch of commenters by hand. If the comments are mostly vendors pitching each other, the signal is weak and you should change sources before you write outreach.",
          "Once a handful of commenters look like buyers, send a small campaign that names the post they touched. Measure replies, not how many commenters the agent found. Volume without a usable comment is just another cold list."
        ]
      },
      {
        "id": "not-for",
        "heading": "What Steal Customers will not do",
        "paragraphs": [
          "It will not invent buyer intent on a silent competitor page. It will not replace title and industry filters if your offer only works for a narrow role. And it will not stay useful if you treat every commenter as qualified. The motion works when you keep the source list short and throw away obvious noise."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Does Steal Customers replace ICP-based lead finders?",
        "answer": "No. Steal Customers is a separate agent mode focused on competitor engagement. Classic lead finders still use roles, industries, locations, and keywords. Many teams run both."
      },
      {
        "question": "What makes a Steal Customers lead different?",
        "answer": "Leads come from people who engaged with competitor posts, and Omentir can store post and comment context so outreach can reference a real signal instead of a template-only opener."
      },
      {
        "question": "Can my AI create a Steal Customers agent?",
        "answer": "Yes. After My Product is complete and LinkedIn is connected, an MCP or REST agent can create an agent with mode steal_customers and your competitor LinkedIn URLs."
      },
      {
        "question": "Is this safe for my LinkedIn account?",
        "answer": "Steal Customers uses the same workspace send windows, daily limits, and human-paced automation rules as other Omentir outreach. You remain responsible for platform rules and the accounts you connect."
      }
    ],
    "relatedLinks": [
      {
        "label": "Lead finders",
        "href": "/features/lead-finders",
        "description": "ICP-based discovery when you need role and industry filters."
      },
      {
        "label": "MCP integration",
        "href": "/integrations/mcp",
        "description": "Connect Claude, ChatGPT, or Cursor and create agents from chat."
      },
      {
        "label": "Agent API and MCP",
        "href": "/features/agent-api-and-mcp",
        "description": "Operator workflow and REST or OAuth connect paths."
      },
      {
        "label": "High-intent LinkedIn leads",
        "href": "/blogs/high-intent-linkedin-leads",
        "description": "Playbook on prioritizing intent over raw volume."
      }
    ],
    "primaryCta": {
      "label": "Try Steal Customers",
      "href": "/signup"
    },
    "secondaryCta": {
      "label": "See pricing",
      "href": "/pricing"
    },
    "highlights": [
      "Competitor post commenters",
      "Post and comment context",
      "Same safety limits as other agents"
    ]
  },
  {
    "slug": "demo-booking",
    "title": "Turn replies into demos",
    "description": "Omentir can share your Calendly or Cal.com link after a prospect shows interest, then email you when they confirm. It does not replace the call.",
    "summary": "Scheduling links on campaigns, not a calendar product.",
    "publishedDate": "August 17, 2026",
    "updatedDate": "August 17, 2026",
    "layout": "article",
    "keywords": [
      "LinkedIn demo booking",
      "AI SDR calendar link",
      "Calendly LinkedIn outreach"
    ],
    "highlights": [
      "Your Calendly or Cal.com",
      "Interest before the link",
      "You take the meeting"
    ],
    "setupSteps": [
      {
        "title": "Add a scheduling URL",
        "description": "Set schedulingLink on My Product, or bookingLink on the campaign. Only Calendly and Cal.com URLs are accepted for booking mode."
      },
      {
        "title": "Pick until-booked only if you mean it",
        "description": "If you still want to qualify by hand, use until interest or handoff. Booking mode continues the thread toward a time."
      },
      {
        "title": "Confirm in LinkedIn after they book",
        "description": "The invite email is not the whole handshake. A short confirmation in the thread ties the meeting to the conversation."
      }
    ],
    "sections": [
      {
        "id": "what-ships",
        "heading": "What actually ships",
        "paragraphs": [
          "Until-booked reply handling shares the scheduling link after interest and emails the workspace user when the lead confirms a meeting. There is no Omentir-native calendar. If you needed round-robin across ten AEs, keep the calendar tool you already have."
        ]
      },
      {
        "id": "when-not",
        "heading": "When not to turn this on",
        "paragraphs": [
          "High-ticket conversations where the next step is a custom security review, not a fifteen-minute slot. Also skip it on a brand-new LinkedIn account. Earn replies first. The guarantee has its own measurement rules; this feature is not that contract."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Does this sync to HubSpot?",
        "answer": "Not as a native booking integration described here. You still get an email when a meeting is confirmed. Wire CRM how you already wire it."
      },
      {
        "question": "Can I use Google Calendar links?",
        "answer": "Booking mode expects Calendly or Cal.com. A raw Google Calendar URL is not the documented path."
      }
    ],
    "relatedLinks": [
      {
        "label": "Reply drafts you approve",
        "href": "/features/reply-drafts",
        "description": "The modes that sit in front of booking."
      },
      {
        "label": "Book demos on LinkedIn",
        "href": "/use-cases/book-linkedin-demos",
        "description": "When to send the link at all."
      },
      {
        "label": "Minimum Booking Guarantee",
        "href": "/minimum-booking-guarantee",
        "description": "How hosted bookings are counted."
      }
    ]
  },
  {
    "slug": "linkedin-warmup",
    "title": "LinkedIn warmup and ramp",
    "description": "A quiet LinkedIn account that suddenly sends looks like a bot. Omentir keeps daily invite and message limits and send windows. Warmup is still your job for the first weeks.",
    "summary": "Pacing a new or cold account before you raise volume.",
    "publishedDate": "August 17, 2026",
    "updatedDate": "August 17, 2026",
    "layout": "phases",
    "keywords": [
      "LinkedIn warmup",
      "LinkedIn account ramp",
      "LinkedIn daily invite limits"
    ],
    "highlights": [
      "Daily caps stay on",
      "Local send windows",
      "Pause on a lock"
    ],
    "phases": [
      {
        "title": "Look like a person",
        "detail": "Use the account. Complete the profile. Browse. Do not start at your eventual cap. A week of human use is cheaper than a week of restriction."
      },
      {
        "title": "Low invites, real notes",
        "detail": "Keep connection volume conservative. Review drafts. If accepts are fine and replies are not, the copy is wrong. Raising the cap will not fix it."
      },
      {
        "title": "Step up only on health",
        "detail": "Increase limits when the account is clean and the ICP is answering. A restriction is a stop, not a retry. Warmth is not a PhantomBuster setting."
      },
      {
        "title": "Stay inside the window",
        "detail": "Business or extended send windows beat a 9:01 burst. Campaigns that share an account still honor their own windows."
      }
    ],
    "sections": [
      {
        "id": "product-vs-advice",
        "heading": "What the product enforces versus what you do",
        "paragraphs": [
          "Omentir enforces daily invite and message limits and optional send windows. It does not simulate browsing to fake a warmup. Anyone selling a magic LinkedIn warmup cloud is selling a different risk. Read the longer warmup blog if you want day-by-day numbers. This page is the product constraint."
        ]
      },
      {
        "id": "not-email-warmup",
        "heading": "This is not email warmup",
        "paragraphs": [
          "Instantly and Lemlist warm domains. That does not apply here. If you needed mailbox reputation, you are in the email aisle."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Will Omentir warm my account automatically?",
        "answer": "No. It will not exceed the daily limits you set. You still ramp a quiet profile. The account safety feature page covers what to do if LinkedIn locks invitations."
      },
      {
        "question": "Can I start at the maximum on day one?",
        "answer": "You can type a high number. You should not. Restrictions cost more than a slow first month."
      }
    ],
    "relatedLinks": [
      {
        "label": "LinkedIn account safety",
        "href": "/features/linkedin-account-safety",
        "description": "What to do when something looks off."
      },
      {
        "label": "How to warm up a LinkedIn account",
        "href": "/blogs/how-to-warm-up-linkedin-account",
        "description": "Day-by-day field notes."
      },
      {
        "label": "Campaigns and send windows",
        "href": "/features/campaigns-and-send-windows",
        "description": "Hours a human would type."
      }
    ]
  },
  {
    "slug": "open-source-self-hosting",
    "title": "Open source and self-hosting Omentir",
    "description": "What Omentir being MIT open source means for buyers: read the code, self-host with Docker, or use the managed product with providers and support included.",
    "summary": "Transparent codebase, self-host option, or managed Omentir at omentir.com. Same product family, different ops burden.",
    "publishedDate": "August 12, 2026",
    "updatedDate": "August 28, 2026",
    "keywords": [
      "Omentir open source",
      "self-host Omentir",
      "MIT AI sales software",
      "Omentir Docker"
    ],
    "sections": [
      {
        "id": "open-source",
        "heading": "Open source in plain terms",
        "paragraphs": [
          "Omentir's application code is public on GitHub under the MIT license. You can read how outreach, agents, and safety limits work instead of trusting a black box. That transparency matters when software sends messages from your personal LinkedIn identity.",
          "Open source does not mean every third-party service is free. Self-hosting still needs your own accounts for identity, data store, LinkedIn connectivity, and model providers as documented in the repository."
        ]
      },
      {
        "id": "self-host",
        "heading": "When self-hosting makes sense",
        "paragraphs": [
          "Self-host if you have ops capacity, want data residency under your control, or need to run inside your own infrastructure constraints. Docker-oriented setup exists for that path. You own uptime, upgrades, secrets, and provider failures.",
          "Self-host is a poor fit if you wanted a fully managed sales tool and hoped open source would remove all maintenance. Managed Omentir exists exactly so most teams do not have to run the stack."
        ]
      },
      {
        "id": "hosted",
        "heading": "When the hosted product is the better buy",
        "paragraphs": [
          "Choose hosted Omentir when you want the same product without operating Firebase, Unipile, model keys, and deploy pipelines yourself. Pricing covers the managed experience, support expectations, and commercial packaging such as the Minimum Booking Guarantee rules where eligible."
        ]
      },
      {
        "id": "trust",
        "heading": "Trust implications",
        "paragraphs": [
          "Auditable code helps technical buyers. It does not replace terms of service, privacy policy, or your responsibility for how you message people. Read both the repository and the public legal pages before you put production outbound on either path."
        ]
      },
      {
        "id": "first-week",
        "heading": "How to decide hosted versus self-host in a week",
        "paragraphs": [
          "If you want to test whether LinkedIn outbound works for your offer, use the hosted product. Self-hosting asks you to run Docker, Firebase, Unipile, and a model provider before you have learned anything about buyers. That is the right week-two or month-two project, not the first experiment.",
          "If you already know you need the code on your machines, clone the public repo, follow the self-host docs, and budget time for provider accounts. The MIT license lets you read and modify the app. It does not remove the external services the app still calls."
        ]
      },
      {
        "id": "not-for",
        "heading": "What open source does not mean here",
        "paragraphs": [
          "It does not mean offline, free of vendor cost, or a community edition with features removed. The public repository is the same application. Credentials, customer data, and production logs stay private. Forks should use their own name and logo."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Is the hosted product closed source?",
        "answer": "Hosted Omentir runs the open-source application as a managed service. You pay for operations, providers, and support packaging, not for a secret second codebase narrative."
      },
      {
        "question": "Where is the repository?",
        "answer": "https://github.com/vanshyadav1408/Omentir under the MIT license."
      },
      {
        "question": "Can I mix self-host for data and hosted for convenience?",
        "answer": "Teams usually pick one primary path. Evaluate based on who will operate LinkedIn connectivity, models, and uptime."
      }
    ],
    "relatedLinks": [
      {
        "label": "Self-Host vs Hosted Omentir",
        "href": "/comparisons/self-host-vs-hosted",
        "description": "Same MIT code. Different ops."
      },
      {
        "label": "Open source announcement",
        "href": "/blogs/omentir-is-now-open-source",
        "description": "Why the code went public."
      },
      {
        "label": "Pricing",
        "href": "/pricing",
        "description": "Managed plan options."
      },
      {
        "label": "GitHub repository",
        "href": "https://github.com/vanshyadav1408/Omentir",
        "description": "Source and self-host docs."
      }
    ],
    "primaryCta": {
      "label": "Try hosted Omentir",
      "href": "/signup"
    },
    "secondaryCta": {
      "label": "View on GitHub",
      "href": "https://github.com/vanshyadav1408/Omentir"
    },
    "highlights": [
      "MIT licensed app",
      "Docker-based setup",
      "You bring the providers"
    ]
  },
  {
    "slug": "reply-drafts",
    "title": "Reply drafts you approve",
    "description": "After someone replies on LinkedIn, Omentir can hand the thread to you, keep drafting until interest, or continue toward a booking link. The next sentence is a draft until you say otherwise.",
    "summary": "Reply modes with human approval instead of a silent agent.",
    "publishedDate": "August 17, 2026",
    "updatedDate": "August 17, 2026",
    "layout": "thread",
    "keywords": [
      "LinkedIn reply handling",
      "AI reply drafts",
      "human in the loop LinkedIn"
    ],
    "highlights": [
      "Handoff on first reply",
      "Until interest",
      "Until booked"
    ],
    "thread": [
      {
        "speaker": "them",
        "text": "Interesting. We already tried a sequencer last year and it burned the domain."
      },
      {
        "speaker": "draft",
        "text": "That is a deliverability problem, not a LinkedIn one. We run from your profile with daily caps. If you want, I can show how the first week is paced."
      },
      {
        "speaker": "you",
        "text": "Fair. We still got ignored. What would you change in the first note?"
      }
    ],
    "sections": [
      {
        "id": "three-modes",
        "heading": "Three stop conditions, not one personality",
        "paragraphs": [
          "Handoff means you own the conversation from the first reply. Until interest means the model can keep going until the prospect looks qualified, then you take it. Until booked means it can share the Calendly or Cal.com link you configured and email you when a time is confirmed.",
          "Legacy 'ai' behaves like until interest. Pick the mode on the campaign. Do not assume a global brain that always closes."
        ]
      },
      {
        "id": "why-drafts",
        "heading": "Why a draft exists",
        "paragraphs": [
          "The model will occasionally overclaim an integration or ask for a meeting too early. The Actions view can show the next message before it sends. If you never look, you bought autonomy you did not supervise."
        ]
      },
      {
        "id": "not-for",
        "heading": "What this is not",
        "paragraphs": [
          "It is not a chatbot on your website. It is not auto-reply on every LinkedIn notification including noise. It works on threads that already exist in the campaign. Operators calling reply_to_lead still need your approval of the draft."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Will Omentir reply while I sleep?",
        "answer": "Only inside the mode and send window you set, and only on campaign threads. Handoff mode will not. Until-booked still uses your calendar link, not a made-up scheduler."
      },
      {
        "question": "Can Claude send a reply?",
        "answer": "It can draft through MCP. Sending still follows workspace rules. Do not ask it to skip approval as a workaround."
      }
    ],
    "relatedLinks": [
      {
        "label": "Turn replies into demos",
        "href": "/features/demo-booking",
        "description": "The booking-mode path."
      },
      {
        "label": "Unified inbox",
        "href": "/features/unified-inbox",
        "description": "Where threads sit."
      },
      {
        "label": "Book demos on LinkedIn",
        "href": "/use-cases/book-linkedin-demos",
        "description": "Conversation design around the calendar."
      }
    ]
  },
  {
    "slug": "lead-groups-and-scoring",
    "title": "Lead groups and scoring",
    "description": "How Omentir organizes discovered prospects into lead groups, scores fit, and ranks who should get outreach first.",
    "summary": "Keep ICP-fit buyers organized, review quality before volume, and feed the right people into campaigns.",
    "publishedDate": "August 12, 2026",
    "updatedDate": "August 12, 2026",
    "keywords": [
      "LinkedIn lead scoring",
      "lead groups outbound",
      "ICP lead organization",
      "AI lead qualification"
    ],
    "sections": [
      {
        "id": "groups",
        "heading": "Why lead groups exist",
        "paragraphs": [
          "Discovery without organization becomes a pile. Lead groups hold the people an agent found so you can review, segment, and attach campaigns without mixing every experiment into one list. Separate groups by offer, geography, or motion such as classic ICP versus Steal Customers.",
          "Deleting an agent does not have to mean throwing away the people it already found. Groups and leads can outlive a single agent configuration when you keep them on purpose."
        ]
      },
      {
        "id": "scoring",
        "heading": "Scoring as prioritization, not prophecy",
        "paragraphs": [
          "Scores rank who looks closest to the buyer you described. That is a prioritization aid, not a guarantee that the top row will buy. Use scores to decide manual review order and campaign priority. Override them when you know the market better than the model.",
          "Weak ICP definitions produce confident but wrong scores. Fix targeting and My Product when the ranking feels consistently off."
        ]
      },
      {
        "id": "review",
        "heading": "Human review still wins early",
        "paragraphs": [
          "Early in a motion, skim leads before you open the fire hose. Ten minutes of review often saves a week of wrong outreach. Later, when patterns are stable, you can trust automation more on well-defined segments."
        ]
      },
      {
        "id": "operators",
        "heading": "Inspecting leads from agents",
        "paragraphs": [
          "MCP and REST tools can list and fetch leads, including engagement context for Steal Customers. Operators should report empty results honestly and check activity before inventing prospects that were never discovered."
        ]
      },
      {
        "id": "first-week",
        "heading": "How to group and score the first lists",
        "paragraphs": [
          "Keep groups boring and specific: one ICP, one Steal Customers source set, one experiment. Mixing every lead into a single pile makes it impossible to tell which motion produced the reply. Name groups after the buyer or the source, not after the week you created them.",
          "Use scores as a review order, not as a send trigger. A high score still needs a human glance for obvious mismatches. If you cannot explain why a lead scored well, the score is decoration."
        ]
      },
      {
        "id": "not-for",
        "heading": "What scoring will not decide for you",
        "paragraphs": [
          "A score is not permission to skip reading the profile. It is not a forecast of revenue. And it is not a reason to keep a bloated group you never prune. Groups and scores exist so you can send the next honest batch, then delete the rest."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Can one workspace have many lead groups?",
        "answer": "Yes. Teams commonly separate groups by segment, campaign goal, or agent mode."
      },
      {
        "question": "Does a high score mean I should always message immediately?",
        "answer": "Not always. Score is a fit signal. Timing, offer relevance, and account safety still matter."
      },
      {
        "question": "Where do groups feed next?",
        "answer": "Into campaigns for connection requests, messages, and follow-ups, then into the inbox when people reply."
      }
    ],
    "relatedLinks": [
      {
        "label": "Lead finders",
        "href": "/features/lead-finders",
        "description": "How prospects enter groups."
      },
      {
        "label": "Steal Customers",
        "href": "/features/steal-customers",
        "description": "Engagement-based discovery into groups."
      },
      {
        "label": "LinkedIn lead scoring blog",
        "href": "/blogs/linkedin-lead-scoring",
        "description": "Deeper scoring playbook."
      }
    ],
    "highlights": [
      "Groups per motion",
      "Scores you can explain",
      "Review before send"
    ]
  },
  {
    "slug": "ai-linkedin-outreach",
    "title": "AI LinkedIn outreach",
    "description": "How Omentir runs AI-assisted LinkedIn connection requests, messages, and follow-ups from your own profile with send windows, daily limits, and reply tracking.",
    "summary": "Personalized LinkedIn campaigns that send from your account, follow up automatically, and stay inside safe daily limits.",
    "publishedDate": "August 12, 2026",
    "updatedDate": "August 12, 2026",
    "keywords": [
      "AI LinkedIn outreach",
      "LinkedIn outreach automation",
      "personalized LinkedIn messages",
      "AI SDR LinkedIn"
    ],
    "sections": [
      {
        "id": "overview",
        "heading": "Outreach that still looks like you",
        "paragraphs": [
          "Omentir is built for LinkedIn-first outbound. Campaigns send connection requests, messages, and follow-ups from the LinkedIn account you connect, not from a black-box sender identity. AI helps draft and personalize copy using product context and lead signals, while you keep control over pacing and campaign goals.",
          "Do not optimize for blast volume. Send at a human pace, talk to fit buyers, and keep replies in one place."
        ]
      },
      {
        "id": "what-you-control",
        "heading": "What you control",
        "paragraphs": [
          "You choose the lead group, campaign goal, outreach mode, and send behavior. Send windows can follow each lead's local time. Daily invite and message limits protect account health. Workspace settings remain the place to tighten or relax allowances within provider and plan constraints."
        ],
        "bullets": [
          "Messages and invites send from your connected LinkedIn profile",
          "AI drafts use product profile and lead context, not empty templates alone",
          "Follow-ups continue until a reply or campaign stop condition",
          "Daily limits and human pacing reduce sudden volume spikes"
        ]
      },
      {
        "id": "replies",
        "heading": "From first touch to interested reply",
        "paragraphs": [
          "Outbound only works if replies are visible and actionable. Omentir tracks reply state and collects conversations so you can see who is interested, who needs a human answer, and who should get a scheduling link. You can also work existing threads through the Agent API or MCP tools with explicit draft approval rules for operators.",
          "This is why Omentir is closer to an AI sales workspace than a pure sequencer: discovery, send, and reply handling live together instead of living in three tools you reconcile by hand."
        ]
      },
      {
        "id": "who-it-is-for",
        "heading": "Who AI LinkedIn outreach is for",
        "paragraphs": [
          "Founders, solo operators, and small B2B teams who already know LinkedIn is where their buyers spend time, and who want consistency without hiring a full SDR bench. It is less of a fit if you only need cold email inbox rotation, or if you want a CRM to own every post-sale workflow."
        ]
      },
      {
        "id": "first-week",
        "heading": "How to run the first outreach week",
        "paragraphs": [
          "Start with one lead group, one promise, and one campaign. Review the first twenty drafts even if you plan to automate later. That review is how you catch a product claim that My Product overstated, or a follow-up that sounds like a bump.",
          "Keep daily invite and message limits conservative for a new or recently warmed account. If replies stall, change the sentence you are selling before you raise volume. A higher send cap on a weak promise just disappoints more people."
        ]
      },
      {
        "id": "not-for",
        "heading": "What this outreach motion is not",
        "paragraphs": [
          "This is not a cold email inbox rotator and not a place to run five offers at once. Omentir is LinkedIn-first. If your only working channel is email, solve deliverability there first. If you need a CRM for every post-sale stage, keep that system and use Omentir for the conversation that happens before a deal exists."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Does Omentir send LinkedIn messages as me?",
        "answer": "Yes. Outreach runs through the LinkedIn account you connect. Omentir does not replace your profile with a third-party sender brand."
      },
      {
        "question": "Can I edit AI-written messages?",
        "answer": "Yes. You can review, edit, or approve drafts depending on how you run the workspace. Operator tools that reply to existing threads are meant for draft approval, not silent unsupervised replies."
      },
      {
        "question": "How does Omentir stay within LinkedIn safety boundaries?",
        "answer": "Omentir enforces daily invite and message limits, supports gradual ramp-ups, and sends at a human pace. You still own compliance with LinkedIn rules and local law."
      },
      {
        "question": "Is email sequencing included?",
        "answer": "Omentir is LinkedIn-first. If your motion is multi-channel email rotation, explore Instantly or Smartlead alternatives and decide whether LinkedIn discovery and replies are the missing piece."
      }
    ],
    "relatedLinks": [
      {
        "label": "Unified inbox",
        "href": "/features/unified-inbox",
        "description": "Where replies land after outreach starts working."
      },
      {
        "label": "Instantly alternatives",
        "href": "/comparisons/omentir-vs-instantly",
        "description": "LinkedIn workspace versus cold email sequencing."
      },
      {
        "label": "AI LinkedIn prospecting guide",
        "href": "/blogs/ai-linkedin-prospecting",
        "description": "Deeper playbook for AI-assisted LinkedIn prospecting."
      },
      {
        "label": "Pricing",
        "href": "/pricing",
        "description": "Pro and Enterprise plans for managed Omentir."
      }
    ],
    "highlights": [
      "Sends from your profile",
      "Follow-ups until a reply",
      "Daily invite and message limits"
    ]
  },
  {
    "slug": "campaigns-and-send-windows",
    "title": "Campaigns, follow-ups, and send windows",
    "description": "How Omentir LinkedIn campaigns run connection requests, messages, and follow-ups with per-lead send windows and workspace daily limits.",
    "summary": "Control what sends, when it sends in the lead's local time, and how hard the workspace pushes each day.",
    "publishedDate": "August 12, 2026",
    "updatedDate": "August 12, 2026",
    "keywords": [
      "LinkedIn outreach campaigns",
      "LinkedIn send windows",
      "AI follow-up sequences",
      "human paced LinkedIn outreach"
    ],
    "sections": [
      {
        "id": "campaign-basics",
        "heading": "What a campaign does",
        "paragraphs": [
          "A campaign is the send plan for a lead group: connection requests, messages, and follow-ups tied to your goal and outreach mode. AI can draft personalized steps from product and lead context, while the campaign still runs through the LinkedIn account you connected.",
          "Campaigns are not a license to ignore account health. Daily limits, delays, and human pacing exist so volume spikes do not become the default strategy."
        ]
      },
      {
        "id": "send-windows",
        "heading": "Send windows in the lead's time zone",
        "paragraphs": [
          "Send windows decide when outreach is allowed to go out relative to each lead's local time. That matters when your buyers span cities and continents. A message that lands at a sane local hour is more likely to be read than a blast timed only for your office clock.",
          "Workspace settings still govern overall daily capacity. Campaign windows and workspace limits work together. They are not two independent unlimited systems."
        ]
      },
      {
        "id": "follow-ups",
        "heading": "Follow-ups without spam theater",
        "paragraphs": [
          "Most deals need more than one touch. Follow-ups should add a new angle, a clearer ask, or a lighter check-in, not the same pitch pasted three times. Omentir can keep the sequence moving until a reply or a stop condition. You decide how aggressive that motion is.",
          "When someone replies, the conversation belongs in the unified inbox so the sequence does not keep talking past a human answer."
        ]
      },
      {
        "id": "safety",
        "heading": "Safety and operator control",
        "paragraphs": [
          "Overview users and MCP operators can inspect scheduled actions and activity to see what is planned. Raising limits or widening windows should be an explicit choice, not a silent agent rewrite. LinkedIn provider rules and plan ceilings still apply."
        ]
      },
      {
        "id": "first-week",
        "heading": "How to set the first campaign without burning the account",
        "paragraphs": [
          "Use one lead group and one send window that matches when those buyers are awake. Leave weekend sending off unless you have evidence those buyers answer then. Cap invites and messages below the workspace maximum for the first two weeks so a mistake stays small.",
          "Write the stop conditions before you launch: reply, book, or a hard follow-up count. A campaign that never stops is not persistence. It is a loop that trains people to ignore you."
        ]
      },
      {
        "id": "not-for",
        "heading": "What send windows cannot fix",
        "paragraphs": [
          "A perfect window will not save a generic opener. Limits will not save a brand new profile that jumps to full volume on day one. Campaigns and windows are pacing tools. They assume you already chose the right people and a sentence those people can answer."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Can I pause a campaign without deleting leads?",
        "answer": "Yes. Agents and campaigns can be paused while lead groups remain available for later use."
      },
      {
        "question": "Are send windows global or per lead?",
        "answer": "Campaign send windows are measured in each lead's own time zone. Daily sending capacity is governed at the workspace level."
      },
      {
        "question": "Does Omentir send at midnight if I leave it open?",
        "answer": "Configured send windows and daily limits constrain when and how much can send. You should still set windows that match a human work pattern."
      }
    ],
    "relatedLinks": [
      {
        "label": "AI LinkedIn outreach",
        "href": "/features/ai-linkedin-outreach",
        "description": "The broader outreach product motion."
      },
      {
        "label": "LinkedIn account safety",
        "href": "/features/linkedin-account-safety",
        "description": "Limits, pacing, and account health habits."
      },
      {
        "label": "Human-paced outreach",
        "href": "/blogs/human-paced-outreach",
        "description": "Why volume spikes fail."
      }
    ],
    "highlights": [
      "Local-time send windows",
      "Daily caps",
      "One campaign, one promise"
    ]
  },
  {
    "slug": "lead-finders",
    "title": "Lead finders",
    "description": "How Omentir classic lead finders turn your ideal customer profile into ongoing LinkedIn prospect discovery, scored leads, and campaign-ready groups.",
    "summary": "Define roles, industries, locations, and keywords. Let agents find and organize buyers that match.",
    "publishedDate": "August 12, 2026",
    "updatedDate": "August 12, 2026",
    "keywords": [
      "LinkedIn lead finder",
      "ICP lead discovery",
      "AI prospecting agent",
      "B2B lead generation LinkedIn"
    ],
    "sections": [
      {
        "id": "what-lead-finders-are",
        "heading": "Classic lead finders in plain language",
        "paragraphs": [
          "A classic Omentir lead finder is an agent that searches for people who match the buyer you described. You give it titles, industries, locations, keywords, and product context from My Product. It returns leads you can review, group, and push into outreach campaigns.",
          "This is the default discovery path when you know who should buy, but do not want to live in LinkedIn search filters all day or buy a static list that goes stale after one export."
        ]
      },
      {
        "id": "icp-and-product",
        "heading": "Why My Product and ICP matter",
        "paragraphs": [
          "Discovery quality follows clarity. My Product tells the system what you sell and why it matters. ICP fields narrow who is worth contacting. Together they reduce the chance that the agent fills a group with plausible-looking but wrong people.",
          "If your offer or ICP is still fuzzy, fix that first. A lead finder will amplify the definition you give it. It will not invent product-market fit for you."
        ]
      },
      {
        "id": "from-leads-to-campaigns",
        "heading": "From discovered leads to campaigns",
        "paragraphs": [
          "Leads land in groups you can inspect. From there you launch campaigns for connection requests, messages, and follow-ups. Scoring and review steps help you prioritize who gets manual attention versus automated first touches.",
          "You can create, pause, resume, and inspect lead finders from Overview or from MCP and REST operators. That means a human or an AI operator can keep discovery running without rebuilding the whole stack."
        ],
        "bullets": [
          "Create agents with prompt plus targeting fields",
          "List and filter leads after discovery runs",
          "Attach outreach and reply handling when you are ready",
          "Pause or resume without deleting the lead group"
        ]
      },
      {
        "id": "lead-finders-vs-steal-customers",
        "heading": "Lead finders versus Steal Customers",
        "paragraphs": [
          "Lead finders start from ICP filters. Steal Customers starts from competitor engagement. Use lead finders when the job is 'find more people like our best customers.' Use Steal Customers when the job is 'talk to people already reacting to competitors.' Many workspaces run both."
        ]
      },
      {
        "id": "first-week",
        "heading": "How to brief a lead finder so it stays useful",
        "paragraphs": [
          "Write the buyer in plain language before you fill filters. Who feels the pain, which company size can pay, and which titles are a waste even if they look senior. Then translate that into titles, industries, locations, and keywords. If you cannot explain the buyer in two sentences, the agent will collect a pretty list that never replies.",
          "Review the first fifty leads as if you were going to message them tomorrow. Reject patterns, not individuals: agencies when you sell to in-house teams, students when you sell to operators, the wrong geography. Tighten the finder once, then let it run."
        ]
      },
      {
        "id": "not-for",
        "heading": "When a classic lead finder is the wrong tool",
        "paragraphs": [
          "If the only people who buy from you are people already arguing on a competitor post, start with Steal Customers. If you need phone numbers as the system of record, you want a contact database, not a LinkedIn finder. Lead finders are for turning a written ICP into a living LinkedIn list, not for replacing every data vendor in your stack."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Do I need a purchased lead database?",
        "answer": "No. Classic lead finders discover prospects from your ICP and product context inside Omentir. You may still use external research, but the product is not a static contact export tool."
      },
      {
        "question": "Can I run multiple lead finders?",
        "answer": "Yes. Teams often separate agents by segment, offer, or geography. Plan limits apply on the managed product; self-hosted installs use your own infrastructure ceilings."
      },
      {
        "question": "What happens when discovery returns weak leads?",
        "answer": "Tighten titles, industries, locations, and keywords, and refresh My Product so scoring and personalization match the real offer. Weak ICP definitions produce weak lists in every tool."
      },
      {
        "question": "Can agents create lead finders for me?",
        "answer": "Yes. MCP and REST tools support create, update, list, pause, resume, and delete for agents, including classic lead finders."
      }
    ],
    "relatedLinks": [
      {
        "label": "Steal Customers",
        "href": "/features/steal-customers",
        "description": "Competitor engagement as an alternative discovery mode."
      },
      {
        "label": "AI LinkedIn outreach",
        "href": "/features/ai-linkedin-outreach",
        "description": "What happens after leads are ready for campaigns."
      },
      {
        "label": "ICP-based lead discovery",
        "href": "/blogs/icp-based-lead-discovery",
        "description": "Longer guide on ICP-driven outbound."
      },
      {
        "label": "Agent API and MCP",
        "href": "/features/agent-api-and-mcp",
        "description": "Operate lead finders from Claude, ChatGPT, or Cursor."
      }
    ],
    "highlights": [
      "ICP titles and industries",
      "Ongoing discovery",
      "Campaign-ready groups"
    ]
  },
  {
    "slug": "agent-api-and-mcp",
    "title": "Agent API and MCP",
    "description": "How Omentir's hosted MCP server and REST Agent API let Claude, ChatGPT, Grok, Grok Bot, Cursor, and custom agents manage product context, lead finders, Steal Customers, leads, and conversations.",
    "summary": "Connect AI apps with OAuth or an API key. Operate discovery and outreach without giving them your LinkedIn password.",
    "publishedDate": "August 12, 2026",
    "updatedDate": "August 12, 2026",
    "keywords": [
      "Omentir MCP",
      "Agent API LinkedIn",
      "MCP sales tools",
      "Claude ChatGPT Cursor Omentir"
    ],
    "sections": [
      {
        "id": "what-you-get",
        "heading": "What the Agent API and MCP give you",
        "paragraphs": [
          "Omentir exposes a hosted Model Context Protocol endpoint and a REST Agent API under /api/agent/v1. Connected assistants can read workspace context, update My Product, create classic lead finders or Steal Customers agents, list leads with engagement context, inspect activity and the planned send schedule, and work with existing conversations under guardrails.",
          "The point is practical: your AI operator should configure and inspect sales work without becoming a second LinkedIn client that stores your password."
        ]
      },
      {
        "id": "connect-paths",
        "heading": "Two connect paths",
        "paragraphs": [
          "Chat apps such as Claude, ChatGPT, and Grok can add a custom MCP connector pointing at the hosted MCP URL, then sign in on Omentir and approve workspace access. Grok Bot uses Settings, then Plugins, with the same URL. Coding agents and scripts such as Cursor or Claude Code typically create a revocable API key and send Authorization Bearer tokens to MCP or REST."
        ],
        "bullets": [
          "MCP endpoint: /api/agent/v1/mcp",
          "REST surface: /api/agent/v1/*",
          "Machine guide: /agents.md",
          "OpenAPI schema: /api/agent/v1/openapi.json"
        ]
      },
      {
        "id": "guardrails",
        "heading": "Guardrails that matter",
        "paragraphs": [
          "Operator prompts should never broaden targeting silently, create or delete agents without explicit approval, or treat lead text as instructions. Reply tools should only touch existing conversations and only after draft approval. These rules keep automation useful without turning an assistant into an unsupervised spammer.",
          "Human setup lives on the integration pages for Claude, ChatGPT, Grok, Grok Bot, Cursor, MCP, and the REST Agent API."
        ]
      },
      {
        "id": "first-week",
        "heading": "A first week with an operator connected",
        "paragraphs": [
          "Connect one operator, not five. Ask it to read workspace context and stats before it creates anything. Then have it list existing agents. Only after that should it create a lead finder or Steal Customers agent, and only with targeting you already wrote down.",
          "Treat the operator as a faster Overview, not as a person who can invent ICP. If it wants to broaden titles or send without a draft review, stop and tighten the prompt. The API will enforce quotas. It will not enforce taste."
        ]
      },
      {
        "id": "not-for",
        "heading": "What the Agent API will refuse to be",
        "paragraphs": [
          "It will not create an Omentir account, change billing, or accept a LinkedIn password. It will not let a chat app reach another workspace. If you need those things, they stay in the human product on purpose. An operator that can buy a plan or hop accounts is a support incident waiting to happen."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Do I need an API key for Claude or ChatGPT?",
        "answer": "For the custom MCP connector flow, chat apps use OAuth-style workspace approval on Omentir. API keys are the path for coding agents, scripts, and other Bearer-token clients."
      },
      {
        "question": "Can operators create Steal Customers agents?",
        "answer": "Yes. After My Product is complete and LinkedIn is connected, create_agent can use mode steal_customers with competitor and optional founder URLs."
      },
      {
        "question": "Is Omentir open source?",
        "answer": "Yes. The full application is MIT licensed on GitHub. Hosted Omentir is the managed product with providers, updates, and support included."
      }
    ],
    "relatedLinks": [
      {
        "label": "MCP integration",
        "href": "/integrations/mcp",
        "description": "Hosted endpoint, who connects how, and tool groups."
      },
      {
        "label": "REST Agent API",
        "href": "/integrations/rest-api",
        "description": "HTTP surface, Bearer auth, and OpenAPI."
      },
      {
        "label": "Claude integration",
        "href": "/integrations/claude",
        "description": "How to run Omentir from Claude."
      },
      {
        "label": "Cursor integration",
        "href": "/integrations/cursor",
        "description": "API key path for coding agents."
      }
    ],
    "primaryCta": {
      "label": "Connect an agent",
      "href": "/integrations"
    },
    "secondaryCta": {
      "label": "MCP setup guide",
      "href": "/integrations/mcp"
    },
    "highlights": [
      "MCP for chat apps",
      "REST for coding agents",
      "Workspace safety limits stay on"
    ]
  },
  {
    "slug": "unified-inbox",
    "title": "Unified inbox",
    "description": "How Omentir collects LinkedIn outreach replies in one inbox so founders and small teams can prioritize interested conversations and move toward booked demos.",
    "summary": "See replies from campaigns in one place, sort by intent, and keep follow-up from getting lost.",
    "publishedDate": "August 12, 2026",
    "updatedDate": "August 12, 2026",
    "keywords": [
      "LinkedIn outreach inbox",
      "sales reply inbox",
      "outbound reply tracking",
      "unified sales inbox"
    ],
    "sections": [
      {
        "id": "why-inbox",
        "heading": "Why reply handling belongs next to outreach",
        "paragraphs": [
          "Many outbound stacks can send. Fewer make it easy to see who replied, what they said, and what should happen next. Omentir keeps reply tracking next to the same workspace that discovered the lead and ran the campaign, so you are not exporting CSV snapshots to find interested people.",
          "For a founder or lean team, that matters more than another personalization toggle. Pipeline dies in the gap between 'message sent' and 'human noticed the reply.'"
        ]
      },
      {
        "id": "what-you-see",
        "heading": "What the unified inbox is for",
        "paragraphs": [
          "The inbox is where conversations surface after outreach. You can work through interested replies, keep context with the lead, and decide whether to answer, schedule, or stop. Sort by intent so you spend time on people who are actually engaging.",
          "Operator tooling can list conversations and draft replies for existing threads, with the expectation that a human approves drafts before anything goes out through reply tools."
        ]
      },
      {
        "id": "booking",
        "heading": "From reply to booked conversation",
        "paragraphs": [
          "Interested replies are only useful if they turn into meetings or clear next steps. The rest of the product is for turning a first touch into a demo. The Minimum Booking Guarantee on eligible managed plans measures real booked conversations, not vanity send counts.",
          "Your booking link, offer clarity, and response speed still matter. Software can collect replies. It cannot invent a reason for someone to meet."
        ]
      },
      {
        "id": "first-week",
        "heading": "How to work the inbox in the first week of replies",
        "paragraphs": [
          "Check the inbox on the same cadence you send. A same-day answer to an interested reply is part of the product, not a support chore. Tag or sort by people who asked a question, people who said later, and people who are not a fit, so the next session does not start from zero.",
          "If an operator drafts a reply, read it against the original thread before it goes out. The draft should answer the last thing the buyer said. A generic booking link on a specific objection is how you lose a warm conversation."
        ]
      },
      {
        "id": "not-for",
        "heading": "What the inbox is not replacing",
        "paragraphs": [
          "It is not a company-wide CRM, a helpdesk, or a place to store every customer email. Use it for LinkedIn outbound conversations that started in Omentir. When a deal is real, move the context to whatever system your team already uses for revenue, and keep the inbox focused on the next reply."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Is the unified inbox a full CRM?",
        "answer": "No. It is a reply and conversation surface for LinkedIn outbound. Use your CRM for broader pipeline stages if you need company-wide deal management."
      },
      {
        "question": "Can AI reply for me automatically?",
        "answer": "Omentir can draft and assist, and operator tools are designed for approved replies on existing threads. Unsupervised blasting into every reply is not the intended safety model."
      },
      {
        "question": "Do replies stay tied to the original lead?",
        "answer": "Yes. Conversations sit with the lead and campaign context so you can see who was contacted and what they said without rebuilding the thread from memory."
      }
    ],
    "relatedLinks": [
      {
        "label": "AI LinkedIn outreach",
        "href": "/features/ai-linkedin-outreach",
        "description": "How messages and follow-ups are sent before replies arrive."
      },
      {
        "label": "Minimum Booking Guarantee",
        "href": "/minimum-booking-guarantee",
        "description": "How eligible weeks and qualifying bookings are measured."
      },
      {
        "label": "Pricing",
        "href": "/pricing",
        "description": "Managed plan options for the hosted product."
      }
    ],
    "highlights": [
      "Replies next to campaigns",
      "Intent before volume",
      "Drafts you can approve"
    ]
  }
];

export function getFeature(slug: string) {
  return ALL_FEATURES.find((page) => page.slug === slug);
}
