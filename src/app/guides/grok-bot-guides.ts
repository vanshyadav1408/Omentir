import type { GuidePage } from "./types";
import {
  GROK_BOT_COLD_DM_PROMPT,
  GROK_BOT_FIRST_JOB_PROMPT,
  GROK_BOT_FOLLOW_UP_PROMPT,
  GROK_BOT_LEAD_GEN_PROMPT,
} from "../grok-bot-setup";

const DATE = "August 23, 2026";

export const GROK_BOT_GUIDES: GuidePage[] = [
  {
    slug: "grok-bot-sales-outreach",
    title: "Using Grok Bot for sales outreach",
    description:
      "Grok Bot can research accounts and draft first touches overnight. Put LinkedIn in Omentir. Stop the Bot at a review list. You still take the meeting.",
    query: "grok bot sales",
    kicker: "Sales",
    cluster: "linkedin",
    publishedDate: DATE,
    updatedDate: DATE,
    keywords: [
      "Grok Bot sales",
      "Grok Bot for sales",
      "Grok Bot sales outreach",
      "Grok Bot SDR",
    ],
    sections: [
      {
        heading: "The job",
        paragraphs: [
          "[Grok Bot](https://x.ai/bot) is SpaceXAI's always-on teammate app, launched August 11, 2026. Give it a named job. It keeps working after you close the laptop.",
        ],
        bullets: [
          "Research: pull people who match a written ICP. Skip anyone already in a sequence.",
          "Score: fit 1-5 plus a reason.",
          "Draft: two sentences that cite a real trigger.",
          "Review list: stop. Do not send. Do not enroll.",
        ],
      },
      {
        heading: "Who does what",
        paragraphs: [
          "The Bot owns overnight research and first-touch drafts. You own the review list, the first real reply, and the demo.",
        ],
      },
      {
        heading: "Paste this into Grok Bot",
        paragraphs: [
          "Finish Omentir first. Add https://omentir.com/api/agent/v1/mcp under Settings, then Plugins. Put the stop rule in the Bot description. Replace the brackets. Keep the last two sentences.",
        ],
        code: GROK_BOT_FIRST_JOB_PROMPT,
      },
    ],
    faqItems: [
      {
        question: "Is this grok.com chat?",
        answer:
          "No. grok.com is a chat connector. Grok Bot is a separate app with Plugins and a cloud computer. See [Grok Bot versus grok.com](/help/what-is-the-difference-between-grok-bot-and-grok-com).",
      },
      {
        question: "Can Grok Bot replace an SDR?",
        answer:
          "It can cover research and first-touch drafts. It does not take the meeting or run a forecast. The Bot is not a three-person team.",
      },
      {
        question: "Does Grok Bot send the LinkedIn messages?",
        answer:
          "No. SpaceXAI's own sales example already ends at a review list: do not send, do not enroll. The Bot researches and drafts. You send from Omentir after you read the list.",
      },
      {
        question: "What should the first overnight job look like?",
        answer:
          "One written ICP. Pull people who match it and skip anyone already in a sequence. Score fit 1-5 plus a reason. Draft two sentences that cite a real trigger. \"Find me pipeline\" widens titles and invents pain.",
      },
      {
        question: "Do I need Grok Bot if I already use Omentir?",
        answer:
          "No. Overview already finds people and drafts notes. Add the Bot if you already pay for a plan that includes it and you want research while you sleep. Grok Bot is still in beta and sits on expensive plans.",
      },
      {
        question: "Who takes the meeting?",
        answer:
          "You do. The Bot owns overnight research and first-touch drafts. You own the review list, the first real reply, and the demo.",
      },
    ],
    related: [
      { label: "Get LinkedIn sales with Grok Bot", href: "/use-cases/grok-bot-outbound" },
      { label: "Grok Bot integration", href: "/integrations/grok-bot" },
      { label: "Grok Bot for LinkedIn outreach", href: "/blogs/grok-bot-linkedin-sales" },
    ],
    relatedHeading: "More on Grok Bot",
  },
  {
    slug: "grok-bot-cold-messages",
    title: "Cold messaging with Grok Bot",
    description:
      "Automate the pile of first LinkedIn notes with Grok Bot drafts. Send from Omentir. Keep the live reply, and the LinkedIn login, off the Bot computer.",
    query: "grok bot cold messaging",
    kicker: "Cold messages",
    cluster: "linkedin",
    publishedDate: DATE,
    updatedDate: DATE,
    keywords: [
      "Grok Bot cold messaging",
      "Grok Bot cold messages",
      "automate cold messaging Grok Bot",
      "Grok Bot LinkedIn DMs",
    ],
    sections: [
      {
        heading: "First touch, not the whole thread",
        paragraphs: [
          "A connection note, the DM after they accept, and one follow-up if they stay quiet. Keep a person on anything that contains a question.",
        ],
        bullets: [
          "Invite note: tiny, or blank. Blank is better than a fake paragraph.",
          "DM after accept: two sentences, a real trigger, no calendar hold.",
          "InMail: paid credit. Not a handshake.",
        ],
      },
      {
        heading: "Do not let the Bot type in LinkedIn",
        paragraphs: [
          "Computer use is how accounts get restricted. The Bot computer is shared. If it asks you to take over for a password or CAPTCHA, refuse. How-to: [automate cold messaging with Grok Bot](/blogs/automate-cold-messaging-with-grok-bot).",
        ],
      },
      {
        heading: "Paste this into Grok Bot",
        paragraphs: [
          "The draft is the after-accept DM. Replace the brackets. Keep the last two sentences.",
        ],
        code: GROK_BOT_COLD_DM_PROMPT,
      },
    ],
    faqItems: [
      {
        question: "Should every invite have a note?",
        answer:
          "No. A specific one-liner helps. A pitch in the invite box often hurts. Blank is better than a fake paragraph.",
      },
      {
        question: "Can it send the DM the moment they accept?",
        answer:
          "Omentir can continue a campaign after accept if you set that up. Keep the first real reply for a person.",
      },
      {
        question: "Should Grok Bot type the DMs in LinkedIn?",
        answer:
          "No. Computer use is how accounts get restricted. The Bot computer is shared across your Bots, so a login there is shared too. If it asks you to take over for a password or CAPTCHA, refuse. Put LinkedIn in Omentir. Put the Bot on MCP.",
      },
      {
        question: "Does the Bot know invite note, DM, and InMail apart?",
        answer:
          "Only if you tell it which box the draft is for. The invite is tiny or blank. The after-accept DM is two sentences, a real trigger, and no calendar hold. InMail is a paid credit, not a handshake. Leave that unnamed and it writes the same note for every box.",
      },
      {
        question: "Can it handle the live reply?",
        answer:
          "No. Automate the pile and the first two sentences. Keep a person on anything that contains a question. A Bot arguing about price in your inbox overnight is not this job.",
      },
      {
        question: "Do I need Grok Bot to automate cold LinkedIn notes?",
        answer:
          "No. Omentir can run the campaign after they accept if you set that up. Add Grok Bot if you already pay for it and you want overnight drafts on top. How-to: [automate cold messaging with Grok Bot](/blogs/automate-cold-messaging-with-grok-bot).",
      },
    ],
    related: [
      { label: "Automate cold LinkedIn messages with Grok Bot", href: "/use-cases/grok-bot-cold-messaging" },
      { label: "Automate cold messaging with Grok Bot", href: "/blogs/automate-cold-messaging-with-grok-bot" },
      { label: "How do I automate cold messaging with Grok Bot?", href: "/help/how-do-i-automate-cold-messaging-with-grok-bot" },
    ],
    relatedHeading: "More on Grok Bot",
  },
  {
    slug: "grok-bot-linkedin-automation",
    title: "Grok Bot and LinkedIn automation",
    description:
      "Grok Bot can click websites with no API. That is a bad idea on LinkedIn. Use MCP into Omentir so the send path stays paced and the cloud browser stays off the account.",
    query: "grok bot linkedin automation",
    kicker: "Account risk",
    cluster: "linkedin",
    publishedDate: DATE,
    updatedDate: DATE,
    keywords: [
      "Grok Bot LinkedIn automation",
      "Grok Bot automate LinkedIn",
      "Grok Bot Click Connect",
      "safe Grok Bot LinkedIn",
    ],
    sections: [
      {
        heading: "Computer use is the risk",
        paragraphs: [
          "A cloud VM typing connection requests is still a bot. Random delays do not change that. [LinkedIn's user agreement](https://www.linkedin.com/legal/user-agreement) restricts unauthorized bots on the consumer product.",
        ],
        bullets: [
          "Keep LinkedIn signed in only inside Omentir.",
          "Add https://omentir.com/api/agent/v1/mcp under Settings, then Plugins.",
          "If the Bot asks you to take over for LinkedIn, refuse.",
        ],
      },
      {
        heading: "Pacing still lives in the send path",
        paragraphs: [
          "Conservative daily limits, send windows, and a warmup on a quiet account matter more than a vendor badge. Read [is LinkedIn automation allowed](/help/is-linkedin-automation-allowed) before you raise caps.",
        ],
      },
      {
        heading: "Paste this into Grok Bot",
        paragraphs: [
          "Paste this after you add MCP. Replace the brackets. Keep the last two sentences. If it asks you to log into LinkedIn, refuse.",
        ],
        code: GROK_BOT_FIRST_JOB_PROMPT,
      },
    ],
    faqItems: [
      {
        question: "Is any of this official LinkedIn?",
        answer:
          "No. LinkedIn documents official APIs for ads and some partner programs. Personal-profile invite and DM automation sits outside that. You own the account outcome.",
      },
      {
        question: "Can I log in once and never again?",
        answer:
          "The session stays on the shared computer. Once is enough. Do not.",
      },
      {
        question: "Do random delays make computer use safe?",
        answer:
          "No. A cloud VM typing connection requests is still a bot. Random delays do not change that. [LinkedIn's user agreement](https://www.linkedin.com/legal/user-agreement) restricts unauthorized bots on the consumer product.",
      },
      {
        question: "What if the Bot asks me to take over for LinkedIn?",
        answer:
          "Refuse. All of your Bots share one computer. A password or CAPTCHA session then persists for other Bots you create later. Keep LinkedIn signed in only inside Omentir. Point it at the MCP tools.",
      },
      {
        question: "Does MCP let me send more?",
        answer:
          "No. MCP does not make volume look human. Keep daily limits conservative, and put send windows in the prospect timezone. Warm a quiet account before you raise caps. Jumping a quiet profile to peak sends still looks like a bot. Read [is LinkedIn automation allowed](/help/is-linkedin-automation-allowed) first.",
      },
      {
        question: "Is a Sales Navigator login different?",
        answer:
          "It is still your LinkedIn identity on a shared VM. Do not put it there. See [is it safe to let Grok Bot log into LinkedIn](/help/is-it-safe-to-let-grok-bot-log-into-linkedin).",
      },
    ],
    related: [
      { label: "Is it safe to let Grok Bot log into LinkedIn?", href: "/help/is-it-safe-to-let-grok-bot-log-into-linkedin" },
      { label: "Grok Bot integration", href: "/integrations/grok-bot" },
      { label: "Grok Bot for LinkedIn outreach", href: "/blogs/grok-bot-linkedin-sales" },
    ],
    relatedHeading: "More on Grok Bot",
  },
  {
    slug: "overnight-outbound-with-grok-bot",
    title: "Overnight outbound with Grok Bot",
    description:
      "Give Grok Bot one ICP and a stop rule before you sleep. Wake up to a review list in Omentir. Send from the workspace. Do not let the Bot enroll anyone while you are offline.",
    query: "automate cold outreach with grok bot",
    kicker: "Overnight work",
    cluster: "linkedin",
    publishedDate: DATE,
    updatedDate: DATE,
    keywords: [
      "overnight outbound Grok Bot",
      "automate cold outreach Grok Bot",
      "Grok Bot overnight sales",
      "Grok Bot review list",
    ],
    sections: [
      {
        heading: "The overnight job is a brief",
        paragraphs: [
          "Give it one ICP and a number you can finish in the morning. Replace the brackets. Keep the last two sentences.",
        ],
        code: GROK_BOT_FIRST_JOB_PROMPT,
      },
      {
        heading: "Morning is the sales motion",
        paragraphs: [
          "Open Omentir. Reject agencies posing as SaaS, students, the wrong country. Edit a few drafts. Start a small campaign. Human pacing lives in [account safety](/features/linkedin-account-safety) and [send windows](/features/campaigns-and-send-windows).",
        ],
      },
      {
        heading: "When overnight is the wrong idea",
        paragraphs: [
          "A new LinkedIn account, a recently recovered profile, or a week you cannot sit with the list. Grok Bot is still in beta and sits on expensive plans. If you do not already have it, start in Overview.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Can I schedule the same path every night?",
        answer:
          "SpaceXAI lets you save a path the Bot followed and run it on a schedule. Keep the same stop: review list, not send.",
      },
      {
        question: "Do I need a CRM first?",
        answer:
          "No. A written ICP plus an Omentir lead finder is enough. A CRM view is useful if you already live there.",
      },
      {
        question: "What if I cannot sit with the list in the morning?",
        answer:
          "Skip the overnight run. An unread list is a more expensive way to ignore your pipeline. Overnight is the wrong idea on a week you cannot sit with the list.",
      },
      {
        question: "Should I add a second Bot if ignores pile up?",
        answer:
          "No. Change the promise or the segment. Meetings come from the inbox, not from how many notes the Bot wrote while you slept.",
      },
      {
        question: "Is overnight a good idea on a new LinkedIn account?",
        answer:
          "No. Warm a new LinkedIn account, or a recently recovered profile, first. Human pacing lives in [account safety](/features/linkedin-account-safety) and [send windows](/features/campaigns-and-send-windows).",
      },
      {
        question: "Do I need Grok Bot to run outbound?",
        answer:
          "No. Grok Bot is still in beta and sits on expensive plans. If you do not already have it, start in Overview. Connect steps: [how do I connect Grok Bot to Omentir](/help/how-do-i-connect-grok-bot-to-omentir).",
      },
    ],
    related: [
      { label: "Get LinkedIn sales with Grok Bot", href: "/use-cases/grok-bot-outbound" },
      { label: "Grok Bot for LinkedIn outreach", href: "/blogs/grok-bot-linkedin-sales" },
      { label: "How do I connect Grok Bot to Omentir?", href: "/help/how-do-i-connect-grok-bot-to-omentir" },
    ],
    relatedHeading: "More on Grok Bot",
  },
  {
    slug: "grok-bot-lead-generation",
    title: "Grok Bot for lead generation",
    description:
      "Use Grok Bot overnight to find people who match a written ICP. Score the list. Keep LinkedIn off the Bot computer. Draft and send later from Omentir.",
    query: "grok bot lead generation",
    kicker: "Lead gen",
    cluster: "linkedin",
    publishedDate: "August 27, 2026",
    updatedDate: "August 27, 2026",
    keywords: [
      "Grok Bot lead generation",
      "Grok Bot find leads",
      "Grok Bot lead gen",
      "Grok Bot LinkedIn leads",
    ],
    sections: [
      {
        heading: "Find people, then stop",
        paragraphs: [
          "Lead generation here is a scored list: who matches, why, who to skip. It is not a cloud browser harvesting LinkedIn search. Put the finder in Omentir. Put the Bot on MCP.",
        ],
        bullets: [
          "One ICP, one region, a skip list.",
          "Fit 1-5 plus evidence.",
          "Flag anyone already in a sequence.",
          "No drafts unless you ask for a second job.",
        ],
      },
      {
        heading: "Do not scrape LinkedIn with computer use",
        paragraphs: [
          "Grok Bot can click sites with no API. That is a bad idea on LinkedIn. A VM paging through search is still a bot. [LinkedIn's user agreement](https://www.linkedin.com/legal/user-agreement) restricts unauthorized bots on the consumer product.",
        ],
      },
      {
        heading: "Paste this into Grok Bot",
        paragraphs: [
          "Finish Omentir first. Add MCP. Put the stop rule in the Bot description. Replace the brackets. Keep the last two sentences.",
        ],
        code: GROK_BOT_LEAD_GEN_PROMPT,
      },
    ],
    faqItems: [
      {
        question: "Is this the same as Grok Bot sales outreach?",
        answer:
          "Outreach is research plus drafts plus a campaign. This page is the list. You can stop after the scores if the promise is still changing.",
      },
      {
        question: "Can Grok Bot scrape LinkedIn search?",
        answer:
          "Do not ask it to. Use Omentir lead finders over MCP. Computer use on LinkedIn is how accounts get restricted.",
      },
      {
        question: "How many people should the first run pull?",
        answer:
          "Thirty is enough to judge the ICP. Four hundred is a spreadsheet you will ignore.",
      },
      {
        question: "Do I need Grok Bot to find LinkedIn leads?",
        answer:
          "No. Overview already runs finders. There is also a [free 10-lead search](/tools/find-leads) with no login. Add the Bot if you already pay for it and you want the list while you sleep.",
      },
      {
        question: "Should the lead-gen prompt also write DMs?",
        answer:
          "Not on the first night. If the names look wrong, thirty drafts are waste. Score first. Copy second.",
      },
      {
        question: "Where do the people go?",
        answer:
          "Into Omentir. You read them in the morning. Then you draft, or you start a small campaign. The Bot should not enroll anyone.",
      },
    ],
    related: [
      { label: "Find 10 leads", href: "/tools/find-leads" },
      { label: "Grok Bot prompts for LinkedIn outreach", href: "/blogs/grok-bot-linkedin-prompts" },
      { label: "Get LinkedIn sales with Grok Bot", href: "/use-cases/grok-bot-outbound" },
      { label: "Using Grok Bot for sales outreach", href: "/grok-bot-sales-outreach" },
    ],
    relatedHeading: "More on Grok Bot",
  },
  {
    slug: "grok-bot-follow-up-messages",
    title: "Follow-up messages with Grok Bot",
    description:
      "Let Grok Bot draft the second LinkedIn note after someone accepts and stays quiet. Cite a new trigger. Send from Omentir. Keep a person on real replies.",
    query: "grok bot follow up messages",
    kicker: "Follow-ups",
    cluster: "linkedin",
    publishedDate: "August 27, 2026",
    updatedDate: "August 27, 2026",
    keywords: [
      "Grok Bot follow up",
      "Grok Bot follow-up messages",
      "Grok Bot LinkedIn follow up",
      "automate LinkedIn follow up Grok Bot",
    ],
    sections: [
      {
        heading: "Only after silence",
        paragraphs: [
          "Follow-up is for people who accepted and never replied. Skip anyone who already asked a question. A Bot that cannot see the thread will send a second pitch into an open conversation.",
        ],
        bullets: [
          "New trigger, not \"just circling back.\"",
          "Two sentences. No calendar hold.",
          "One or two nudges, then stop.",
        ],
      },
      {
        heading: "The first note still has to exist",
        paragraphs: [
          "If the after-accept DM never went out, run the cold-message job instead. How-to: [automate cold messaging with Grok Bot](/blogs/automate-cold-messaging-with-grok-bot).",
        ],
      },
      {
        heading: "Paste this into Grok Bot",
        paragraphs: [
          "Replace the brackets. Keep the last two sentences. Send still goes through Omentir.",
        ],
        code: GROK_BOT_FOLLOW_UP_PROMPT,
      },
    ],
    faqItems: [
      {
        question: "How many follow-ups?",
        answer:
          "One or two after accept if they never replied. Infinite nudges train people to ignore you. Change the promise if ignores pile up.",
      },
      {
        question: "Can it write \"just circling back\"?",
        answer:
          "It will if you let it. Ask for a new trigger. A reminder that you exist is not a reason to reply.",
      },
      {
        question: "What if they already answered?",
        answer:
          "Stop. A person handles anything with a real question. Do not let a follow-up job run on live threads.",
      },
      {
        question: "Should Grok Bot send the follow-up while I sleep?",
        answer:
          "No. Draft overnight. You cut in the morning. Omentir sends under caps. See [can Grok Bot send LinkedIn messages automatically](/help/can-grok-bot-send-linkedin-messages-automatically).",
      },
      {
        question: "Is a follow-up the same as the first DM?",
        answer:
          "No. The first DM cites the original trigger. The follow-up needs a new one, or it is spam with extra steps.",
      },
      {
        question: "Do I need Grok Bot for follow-ups?",
        answer:
          "No. Omentir can continue a campaign after accept if you set that up. Add the Bot if you already pay for it and you want overnight drafts on the quiet pile.",
      },
    ],
    related: [
      { label: "Cold messaging with Grok Bot", href: "/grok-bot-cold-messages" },
      { label: "Grok Bot prompts for LinkedIn outreach", href: "/blogs/grok-bot-linkedin-prompts" },
      { label: "How do I automate cold messaging with Grok Bot?", href: "/help/how-do-i-automate-cold-messaging-with-grok-bot" },
    ],
    relatedHeading: "More on Grok Bot",
  },
];
