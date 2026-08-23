import type { GuidePage } from "./types";
import { GROK_BOT_COLD_DM_PROMPT, GROK_BOT_FIRST_JOB_PROMPT } from "../grok-bot-setup";

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
  },
];
