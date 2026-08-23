import type { SeoContentPage } from "../seo-content/types";
import { GROK_BOT_COLD_DM_PROMPT, GROK_BOT_FIRST_JOB_PROMPT } from "../grok-bot-setup";

/**
 * Use-case pages. One motion per slug.
 * One TypeScript route renders these: `/use-cases/[slug]/page.tsx`.
 */
export const ALL_USE_CASES: SeoContentPage[] = [
  {
    "slug": "replace-first-sdr",
    "title": "Replace the first SDR",
    "description": "When an AI LinkedIn workspace can delay a first sales hire, and when that hire is still the cheaper move.",
    "summary": "AI outbound versus hiring the first SDR, with honest limits.",
    "publishedDate": "August 17, 2026",
    "updatedDate": "August 17, 2026",
    "layout": "timeline",
    "keywords": [
      "replace SDR with AI",
      "AI SDR versus hiring",
      "first sales hire LinkedIn"
    ],
    "highlights": [
      "Delay the hire, do not skip judgment",
      "One account to start",
      "Human on replies"
    ],
    "verdict": "Omentir can cover discovery, first-touch LinkedIn, and draft replies for a founder or a tiny team. It does not replace a person who runs a territory, a CRM, and a forecast.",
    "phases": [
      {
        "title": "Prove the offer gets replies",
        "detail": "If no one answers a careful founder note, an SDR will not save you. Run one ICP for two weeks. If the promise is wrong, hiring multiplies the mistake."
      },
      {
        "title": "Automate the list, not the close",
        "detail": "Let a finder or Steal Customers refill the group. Keep send windows and daily limits conservative. The person who takes the meeting still writes the interesting replies."
      },
      {
        "title": "Hire when the inbox is the bottleneck",
        "detail": "When qualified threads wait a day because you are building product, hire. Software that drafts is cheaper than a full-time SDR. Software that you ignore is more expensive than either."
      }
    ],
    "sections": [
      {
        "id": "the-math",
        "heading": "The hire is a calendar, not a logo",
        "paragraphs": [
          "A first SDR costs salary, ramp, tools, and management. An AI workspace costs a subscription and your review time. The comparison is only honest if you count the hours you will still spend on replies. Omentir does not attend the demo.",
          "Keep the SDR motion if you need phone, email sequences at domain scale, or a multi-seat team with a manager. Those are different jobs. This page is about LinkedIn conversations before a pipeline exists."
        ]
      },
      {
        "id": "what-not-to-automate",
        "heading": "What you should not hand to an agent",
        "paragraphs": [
          "Pricing exceptions, custom security answers, and anything you would not put in writing on your own profile. Draft approval exists because the model will occasionally overclaim. If you turn that off and walk away, you bought a risk, not a hire."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Will this replace an SDR team of five?",
        "answer": "No. It can remove the first-list-and-first-note work for a small team. Coordinated territories, CRM hygiene, and live calls stay human."
      },
      {
        "question": "What if I already hired an SDR?",
        "answer": "Give them the workspace instead of a CSV plus a sequencer. The useful split is: software finds and drafts, the SDR takes threads that matter."
      }
    ],
    "relatedLinks": [
      {
        "label": "Outbound for founders",
        "href": "/use-cases/outbound-for-founders",
        "description": "The version where you are still the closer."
      },
      {
        "label": "Open source AI SDR",
        "href": "/use-cases/open-source-ai-sdr",
        "description": "When inspectable code is part of the hire decision."
      },
      {
        "label": "AI LinkedIn outreach",
        "href": "/features/ai-linkedin-outreach",
        "description": "How sends and follow-ups actually run."
      }
    ],
    "ctaTitle": "Run the two-week test before you post the job",
    "ctaBody": "If the ICP replies, you know what the hire would scale. If it does not, rewrite the offer."
  },
  {
    "slug": "book-linkedin-demos",
    "title": "Book demos on LinkedIn",
    "description": "How Omentir turns a LinkedIn reply into a booked call without dropping a calendar link in the first note.",
    "summary": "Reply handling and calendar handoff for LinkedIn conversations.",
    "publishedDate": "August 17, 2026",
    "updatedDate": "August 17, 2026",
    "layout": "timeline",
    "keywords": [
      "book demos from LinkedIn",
      "LinkedIn demo booking",
      "LinkedIn calendar handoff"
    ],
    "highlights": [
      "Interest before the link",
      "Calendly or Cal.com",
      "You still own the call"
    ],
    "verdict": "A booked demo is the third or fourth message, not the connection request. Omentir can continue a thread until interest, or until a time is confirmed, if you set that mode on purpose.",
    "phases": [
      {
        "title": "Earn a real reply",
        "detail": "The first note names a specific reason: a role, a post, a comment on a competitor. It does not ask for thirty minutes. If the only CTA is a calendar, you skipped the conversation."
      },
      {
        "title": "Classify the reply before you schedule",
        "detail": "Interesting is not intent. A question about pricing is closer. A 'not now' is a nurture, not a bump. Omentir can stop at qualified interest so you take the thread, or continue toward a booking link you already trust."
      },
      {
        "title": "Send the link once, then confirm in the thread",
        "detail": "Use a Calendly or Cal.com URL from My Product or the campaign. After they pick a time, say so in LinkedIn. Do not rely on the invite email alone. The thread is how they remember why they said yes."
      }
    ],
    "sections": [
      {
        "id": "what-omentir-does",
        "heading": "What the product actually does at booking time",
        "paragraphs": [
          "Campaigns can hand off on the first reply, keep drafting until the prospect shows interest, or keep going until a meeting is confirmed. The last mode needs a scheduling link. It will not invent a calendar product. It uses yours.",
          "The hosted guarantee counts bookings under its own rules. This page is about the conversation design, not the refund math. Read the Minimum Booking Guarantee if that is the promise you are buying."
        ]
      },
      {
        "id": "when-to-keep-the-thread",
        "heading": "When you should refuse the calendar",
        "paragraphs": [
          "If they asked a product question, answer it. If they said they are in a freeze, ask when to come back. Pushing a link through a soft reply trains people to ignore you. The inbox exists so a human can make that call."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Does Omentir book the calendar for me?",
        "answer": "No. It can share the scheduling link you configured after the prospect shows interest, and it can email you when a meeting is confirmed. You still take the call."
      },
      {
        "question": "Can I send the calendar in the connection request?",
        "answer": "You can type anything. You should not. Connection requests that read like meeting invites get ignored. Earn a reply first."
      }
    ],
    "relatedLinks": [
      {
        "label": "Turn replies into demos",
        "href": "/features/demo-booking",
        "description": "Reply modes and scheduling links."
      },
      {
        "label": "Unified inbox",
        "href": "/features/unified-inbox",
        "description": "Where the thread lives."
      },
      {
        "label": "Minimum Booking Guarantee",
        "href": "/minimum-booking-guarantee",
        "description": "How hosted bookings are counted."
      }
    ],
    "ctaTitle": "Add a calendar link you actually use",
    "ctaBody": "Set Calendly or Cal.com on My Product before you turn on booking-mode replies."
  },
  {
    "slug": "prospect-commenters",
    "title": "Prospect competitor commenters",
    "description": "Steal Customers finds people who already comment on competitor posts, keeps the post context, and drafts LinkedIn outreach from that signal.",
    "summary": "Turn competitor LinkedIn commenters into leads you can actually cite.",
    "publishedDate": "August 17, 2026",
    "updatedDate": "August 17, 2026",
    "layout": "timeline",
    "keywords": [
      "competitor commenter prospecting",
      "Steal Customers LinkedIn",
      "prospect people who comment on competitors"
    ],
    "highlights": [
      "Commenters, not employees",
      "Post text travels with the lead",
      "Two or three sources"
    ],
    "verdict": "Use this when buyers already argue under a competitor's posts. Skip it when those pages are silent or the comments are vendors pitching each other.",
    "phases": [
      {
        "title": "Pick sources that actually post",
        "detail": "Two or three competitor company pages, plus a founder profile if they write in public. A long list of quiet logos produces nothing. Steal Customers will not invent intent on an empty feed."
      },
      {
        "title": "Throw away the vendor pile",
        "detail": "Read the first batch of commenters. If they are agencies selling the same thing, change sources. The lead is the person who sounded like a buyer, not everyone who left a word."
      },
      {
        "title": "Cite the post in the first note",
        "detail": "Outreach can name the comment. That is the whole advantage over a title-only list. If you strip the context and send a template, you paid for a signal you did not use."
      }
    ],
    "sections": [
      {
        "id": "not-a-crawl",
        "heading": "This is not a website crawl",
        "paragraphs": [
          "Prompt-led crawlers start from language and the public web. Steal Customers starts from LinkedIn posts you named. The output is a person plus the comment that made them interesting. If you needed a TAM scrape, use a classic lead finder or a different category of tool."
        ]
      },
      {
        "id": "run-both",
        "heading": "Run it beside an ICP finder, not instead",
        "paragraphs": [
          "Commenter leads are warmer and noisier. Title-and-industry leads are cleaner and colder. Most teams need both. Do not force Steal Customers on a market where competitors never post."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Does this scrape private comments?",
        "answer": "No. It uses public posts and public comments on the sources you configure, subject to LinkedIn access and product limits."
      },
      {
        "question": "Can Claude create a Steal Customers agent?",
        "answer": "Yes, after My Product is complete and LinkedIn is connected. Pass competitor company URLs and optional founder or employee profile URLs. Do not ask it to invent sources."
      }
    ],
    "relatedLinks": [
      {
        "label": "Steal Customers",
        "href": "/features/steal-customers",
        "description": "Product page for the agent mode."
      },
      {
        "label": "Gojiberry alternatives",
        "href": "/comparisons/omentir-vs-gojiberry",
        "description": "Prompt crawl versus commenter signal."
      },
      {
        "label": "Lead finders",
        "href": "/features/lead-finders",
        "description": "The ICP motion to run in parallel."
      }
    ],
    "ctaTitle": "Name two competitors who actually post",
    "ctaBody": "If you cannot, start with a classic lead finder. Steal Customers needs a live feed."
  },
  {
    "slug": "outbound-for-founders",
    "title": "Outbound for founders",
    "description": "A LinkedIn outbound motion a founder can run without hiring an SDR. One account, one ICP, replies in one inbox.",
    "summary": "Founder-led LinkedIn outbound without a first sales hire.",
    "publishedDate": "August 17, 2026",
    "updatedDate": "August 17, 2026",
    "layout": "timeline",
    "keywords": [
      "LinkedIn outbound for founders",
      "founder LinkedIn outreach",
      "solo founder SDR"
    ],
    "highlights": [
      "Your profile, not a sender pool",
      "15 minutes of review",
      "Replies stay in one inbox"
    ],
    "verdict": "Use this when you are the closer and you still need a list that appears every morning. Skip it if you already have a team whose only job is sequences.",
    "phases": [
      {
        "title": "Write the buyer in two sentences",
        "detail": "Who feels the pain, who can pay, who is a waste even if the title looks senior. Put that in My Product before you create a finder. A vague offer produces notes you will be ashamed to send from your own name."
      },
      {
        "title": "One finder, fifty leads, then send",
        "detail": "Create one classic lead finder. Review the first fifty people as if you will message them tomorrow. Reject patterns, not individuals. Then start a small campaign with conservative daily limits."
      },
      {
        "title": "Own the inbox for two weeks",
        "detail": "Every reply is yours. Approve drafts or type the next sentence yourself. Measure meetings, not invites sent. If ignores pile up, change the promise before you raise volume."
      }
    ],
    "sections": [
      {
        "id": "what-founders-actually-buy",
        "heading": "What you are buying is time on your own name",
        "paragraphs": [
          "Founders search for an AI SDR when calendar gaps show up and hiring feels early. The useful object is not a robot that 'does sales.' It is a workspace that finds ICP-fit people on LinkedIn, drafts notes from your product brief, and leaves the conversation where you can see it.",
          "Omentir sends from the LinkedIn account you connect. That is the point and the constraint. You cannot hide behind a pool of unknown senders. If the note is wrong, it is wrong on your profile."
        ]
      },
      {
        "id": "when-this-fails",
        "heading": "When founder outbound fails on purpose",
        "paragraphs": [
          "It fails when the ICP is 'anyone in SaaS,' when My Product reads like a homepage, and when you treat the first week as a volume test. LinkedIn will throttle a quiet account that suddenly sends. A weak promise at a higher cap just disappoints more people.",
          "It also fails if you needed email deliverability, not LinkedIn conversations. Warm a domain somewhere else. This motion is for people you can actually see on LinkedIn."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Can I run this in fifteen minutes a day?",
        "answer": "After setup, yes: review new leads, approve or edit reply drafts, and pause anything that looks off. Setup itself takes a focused hour because My Product and the first finder have to be specific."
      },
      {
        "question": "Do I need Sales Navigator?",
        "answer": "Not to start. Omentir discovery runs from the ICP you write and from competitor commenters in Steal Customers. Sales Navigator is still useful if you already live in those filters and want to import a hand-built list later."
      },
      {
        "question": "What if I am not the closer?",
        "answer": "Then this page is the wrong use case. Hand the inbox to whoever takes the meeting, or wait until that person exists. Founder outbound only works if the founder will answer."
      }
    ],
    "relatedLinks": [
      {
        "label": "Lead finders",
        "href": "/features/lead-finders",
        "description": "How ICP filters become a list."
      },
      {
        "label": "Reply drafts you approve",
        "href": "/features/reply-drafts",
        "description": "What happens after someone writes back."
      },
      {
        "label": "Book demos on LinkedIn",
        "href": "/use-cases/book-linkedin-demos",
        "description": "The meeting handoff, not the list."
      }
    ],
    "ctaTitle": "Brief one ICP from your own profile",
    "ctaBody": "If you cannot name the buyer in two sentences, do not start a campaign yet."
  },
  {
    "slug": "open-source-ai-sdr",
    "title": "Open source AI SDR",
    "description": "Omentir is MIT licensed. Use the hosted product, or run the same LinkedIn workspace on your own machine when inspectable code is the buying reason.",
    "summary": "An inspectable LinkedIn sales agent, hosted or self-hosted.",
    "publishedDate": "August 17, 2026",
    "updatedDate": "August 17, 2026",
    "layout": "timeline",
    "keywords": [
      "open source AI SDR",
      "open source LinkedIn outreach",
      "self-host AI sales agent"
    ],
    "highlights": [
      "MIT license",
      "Hosted or Docker",
      "MCP and REST included"
    ],
    "verdict": "Pick Omentir for the license if a reviewer will read the repo. Skip the license pitch if you only wanted a hosted button. The motion is the same either way: My Product, finders, campaigns, inbox.",
    "phases": [
      {
        "title": "Decide what inspectable means for you",
        "detail": "Some teams need to know what the agent is allowed to send. Some need to self-host later. Some just sleep better with a public repo. Name which one you are. Do not buy open source as a vibe."
      },
      {
        "title": "Start hosted unless you must not",
        "detail": "The hosted product at omentir.com runs the same code. Self-host when data residency or a security review requires it. Docker is the path. Do not fork on day one."
      },
      {
        "title": "Connect an operator you already use",
        "detail": "Claude, ChatGPT, Cursor, and scripts talk to Omentir over MCP or REST. They never get your LinkedIn password. That split is the architecture, not a slogan."
      }
    ],
    "sections": [
      {
        "id": "not-a-wrapper",
        "heading": "Open source is not a ChatGPT wrapper",
        "paragraphs": [
          "The application includes lead discovery, campaign pacing, reply handling, and the agent API. A prompt file in a repo is not the same object. If you wanted a skill that tells ChatGPT to 'go sell,' look at Agent API and MCP for how a real operator is supposed to behave, then decide."
        ]
      },
      {
        "id": "when-closed-wins",
        "heading": "When a closed AI SDR is the better buy",
        "paragraphs": [
          "Keep 11x, Artisan, or a similar packaged agent if you want a vendor to own the whole motion, including channels Omentir does not run. Closed can be simpler. It is worse when you need to read the send path or keep LinkedIn credentials off a third-party black box you cannot inspect."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Is the hosted product a different codebase?",
        "answer": "No. Hosted Omentir runs the public application. You pay for operations, LinkedIn connectivity, and support, not for a secret fork."
      },
      {
        "question": "Do I need to self-host to use MCP?",
        "answer": "No. The hosted MCP endpoint is https://omentir.com/api/agent/v1/mcp. Self-hosting is for people who need the app on their own infrastructure."
      }
    ],
    "relatedLinks": [
      {
        "label": "Open source and self-hosting",
        "href": "/features/open-source-self-hosting",
        "description": "How to run it yourself."
      },
      {
        "label": "Agent API and MCP",
        "href": "/features/agent-api-and-mcp",
        "description": "Operator tools."
      },
      {
        "label": "GitHub repository",
        "href": "https://github.com/vanshyadav1408/Omentir",
        "description": "Source under MIT."
      }
    ],
    "ctaTitle": "Read the repo or start hosted",
    "ctaBody": "Both are the same product. Choose the operations model, not a different sales motion."
  },
  {
    "slug": "grok-bot-outbound",
    "title": "Get LinkedIn sales with Grok Bot",
    "description": "Use Grok Bot as the overnight researcher and Omentir as the LinkedIn send path. Drafts wait for you. The cloud browser does not drive the account.",
    "summary": "Grok Bot finds and drafts. Omentir sends. You still take the meeting.",
    "publishedDate": "August 20, 2026",
    "updatedDate": "August 20, 2026",
    "layout": "timeline",
    "keywords": [
      "Grok Bot LinkedIn sales",
      "Grok Bot outbound",
      "Grok Bot Omentir integration"
    ],
    "highlights": [
      "Overnight research",
      "Review list, then send",
      "No LinkedIn login on the Bot"
    ],
    "verdict": "Grok Bot can keep working after you close the laptop. That is useful for research and drafts. It is a problem if the Bot logs into LinkedIn and clicks Connect. Put LinkedIn in Omentir. Put the Bot on MCP.",
    "phases": [
      {
        "title": "Finish both products before you invent a workflow",
        "detail": "Omentir: LinkedIn connected, My Product written in two sentences a stranger would understand. Grok Bot: app installed, one named Bot whose job is outbound, not a catch-all assistant. If either side is empty, the overnight run will guess."
      },
      {
        "title": "Connect MCP and write the stop rule",
        "detail": "Add https://omentir.com/api/agent/v1/mcp in Grok Bot Plugins. Approve the workspace. Put this in the Bot description: research and draft only; never send; never enroll; never sign into LinkedIn. SpaceXAI's own sales-outbound example already stops at a review list. Keep that sentence."
      },
      {
        "title": "One narrow overnight job",
        "detail": "One ICP, one source, a number you can read in the morning (twenty to forty people, not four hundred). Ask for fit notes, a skip reason, and a draft that cites a real signal. In Omentir, list agents before you let it create a finder. Read the first batch yourself."
      },
      {
        "title": "Send from Omentir, own the inbox",
        "detail": "Start a small campaign with conservative daily limits and send windows in the prospect's timezone. Approve reply drafts. Measure meetings, not how many notes the Bot wrote while you slept. If ignores pile up, change the promise before you raise volume."
      }
    ],
    "sections": [
      {
        "id": "why-split-the-work",
        "heading": "Why the Bot should not own LinkedIn",
        "paragraphs": [
          "Grok Bot's pitch is that it can sign into the tools you already use, including sites with no MCP. For a CRM or an analytics dashboard, that can be fine. For LinkedIn, a cloud VM sharing logins across every Bot on the account is the fingerprint LinkedIn already looks for.",
          "Omentir already has the paced send path, the review queue, and the daily caps. Grok Bot's job is to keep filling that queue with people you would actually message, then stop."
        ]
      },
      {
        "id": "first-job-prompt",
        "heading": "Paste this into Grok Bot tonight",
        "paragraphs": [
          "Finish Omentir first. Add the MCP plugin. Put the stop rule in the Bot description: research and draft only. Never send. Never enroll. Never sign into LinkedIn. Then paste this. Replace the brackets. Keep the last two sentences."
        ],
        "code": GROK_BOT_FIRST_JOB_PROMPT
      },
      {
        "id": "what-gets-you-meetings",
        "heading": "What actually turns this into sales",
        "paragraphs": [
          "Meetings come from a tight ICP, a note that names a real trigger, and a human who answers when someone writes back. The Bot does not attend the demo. If you cannot spend fifteen minutes on the review list and the inbox, you bought a research toy, not a sales motion.",
          "Grok Bot is still in beta and sits on expensive Cursor or SuperGrok plans. If you do not already have it, start in Omentir Overview. Add the Bot later if you want overnight research on top."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Can Grok Bot send the LinkedIn messages?",
        "answer": "It can call Omentir tools that enqueue outreach under your campaign and safety settings. It should not send from the LinkedIn website on its own computer. Keep send behind your review."
      },
      {
        "question": "Do I need Salesforce or another CRM first?",
        "answer": "No. A written ICP plus an Omentir lead finder is enough. A CRM view is useful if you already live there. Do not wait on a CRM cleanup to start one segment."
      },
      {
        "question": "Is this the grok.com chat connector?",
        "answer": "No. That is the Grok integration. This use case is the Grok Bot app."
      }
    ],
    "relatedLinks": [
      {
        "label": "Grok Bot integration",
        "href": "/integrations/grok-bot",
        "description": "Plugins, MCP URL, and what not to sign into."
      },
      {
        "label": "Outbound for founders",
        "href": "/use-cases/outbound-for-founders",
        "description": "The motion if you are still the closer."
      },
      {
        "label": "Grok Bot for LinkedIn outreach",
        "href": "/blogs/grok-bot-linkedin-sales",
        "description": "Longer walkthrough of the split."
      },
      {
        "label": "Automate cold LinkedIn messages with Grok Bot",
        "href": "/use-cases/grok-bot-cold-messaging",
        "description": "The cold DM job, not the whole outbound loop."
      },
      {
        "label": "Grok Bot alternatives",
        "href": "/alternatives/grok-bot",
        "description": "If you do not already pay for the Bot plan."
      }
    ],
    "ctaTitle": "Connect the Bot to a workspace that already has a buyer written down",
    "ctaBody": "If My Product is still a homepage paragraph, fix that before the overnight run."
  },
  {
    "slug": "grok-bot-cold-messaging",
    "title": "Automate cold LinkedIn messages with Grok Bot",
    "description": "Grok Bot drafts the first LinkedIn notes overnight. Omentir sends them with caps. You edit the list in the morning and answer when someone writes back.",
    "summary": "Automate the pile of first touches. Keep the live reply, and the LinkedIn login, off the Bot.",
    "publishedDate": "August 23, 2026",
    "updatedDate": "August 23, 2026",
    "layout": "timeline",
    "keywords": [
      "automate cold messaging with Grok Bot",
      "Grok Bot cold LinkedIn messages",
      "Grok Bot cold outreach",
      "Grok Bot LinkedIn DMs"
    ],
    "highlights": [
      "Drafts overnight",
      "Send from Omentir",
      "Person on replies"
    ],
    "verdict": "Cold messaging is a connection note, a first DM after they accept, and one follow-up if they stay quiet. Grok Bot can fill that pile. It should not type in LinkedIn, and it should not argue in your inbox while you sleep.",
    "phases": [
      {
        "title": "Write the promise before you automate the note",
        "detail": "My Product in two sentences a stranger would understand: who feels the pain, what result you produce, what you will not claim. A vague brief produces notes you will not send from your own name. Grok Bot will not fix that overnight."
      },
      {
        "title": "Overnight: one ICP, drafts that cite a real trigger",
        "detail": "Connect MCP in Grok Bot Plugins. Stop rule in the Bot description: research and draft only; never send; never enroll; never sign into LinkedIn. Ask for twenty to forty people, fit notes, and a two-sentence after-accept DM. Invite notes stay short or blank."
      },
      {
        "title": "Morning: cut junk, keep notes you would send from your phone",
        "detail": "Reject agencies posing as SaaS, students, the wrong country. Edit a few drafts out loud. Start a small Omentir campaign with conservative daily limits and send windows in the prospect's timezone. Volume is not the goal."
      },
      {
        "title": "Daytime: replies pause the sequence",
        "detail": "The unified inbox collects answers. Approve or rewrite the next sentence. Book the call yourself. A Bot that cannot see the thread will double-send. If ignores pile up, change the promise before you raise caps."
      }
    ],
    "sections": [
      {
        "id": "what-you-are-automating",
        "heading": "Automate the pile, not the conversation",
        "paragraphs": [
          "People who search this want the afternoon of first touches to happen without sitting in LinkedIn. That is a real job. The failure is a cloud browser grinding Connect while you sleep. Grok Bot's computer is shared across your Bots. A LinkedIn login there is shared too.",
          "Omentir already has the paced send path. The Bot's job is to keep filling the queue with people you would actually message, then stop. SpaceXAI's own sales-outbound example already says do not send and do not enroll anyone."
        ]
      },
      {
        "id": "first-job-prompt",
        "heading": "Paste this into Grok Bot tonight",
        "paragraphs": [
          "Finish Omentir first. Add the MCP plugin. Stop rule in the Bot description. Then paste this. Replace the brackets. Keep the last two sentences. Invite notes stay short or blank. The draft here is the after-accept DM."
        ],
        "code": GROK_BOT_COLD_DM_PROMPT
      },
      {
        "id": "when-to-skip",
        "heading": "When cold messaging should stay manual",
        "paragraphs": [
          "A new or recently recovered LinkedIn account. A week you cannot sit with the list. A product story you cannot write in two sentences. Grok Bot is still in beta and sits on expensive Cursor or SuperGrok plans. If you do not already have it, start in Overview.",
          "If email is the only channel that works, solve email. Omentir will not rotate domains. The Bot can draft an email. It should not pretend a LinkedIn workspace is a mailbox rotator."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Can Grok Bot send the cold DM automatically?",
        "answer": "It can enqueue outreach through Omentir under your campaign and safety settings. It should not type the DM on linkedin.com. Keep send behind your review."
      },
      {
        "question": "Should every invite include a note?",
        "answer": "A specific one-liner can help. A pitch in the invite box often hurts. Blank is better than a fake paragraph."
      },
      {
        "question": "Is this the same as get LinkedIn sales with Grok Bot?",
        "answer": "That page is the overall outbound split. This page is the cold message job: invite note, first DM, follow-up. Same operator, narrower box."
      }
    ],
    "relatedLinks": [
      {
        "label": "Automate cold messaging with Grok Bot",
        "href": "/blogs/automate-cold-messaging-with-grok-bot",
        "description": "The longer how-to for the three boxes and the prompt."
      },
      {
        "label": "Get LinkedIn sales with Grok Bot",
        "href": "/use-cases/grok-bot-outbound",
        "description": "The weekly researcher loop, not only the DM."
      },
      {
        "label": "How do I automate cold messaging with Grok Bot?",
        "href": "/help/how-do-i-automate-cold-messaging-with-grok-bot",
        "description": "Short help version of this motion."
      }
    ],
    "ctaTitle": "Connect the Bot only after the first note is something you would send",
    "ctaBody": "If you would not put the draft on your own phone, do not let a campaign send it."
  }
];

export function getUseCase(slug: string) {
  return ALL_USE_CASES.find((page) => page.slug === slug);
}
