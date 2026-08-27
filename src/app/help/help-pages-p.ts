import type { HelpPageDraft } from "./types";
import {
  GROK_BOT_FIRST_JOB_PROMPT,
  GROK_BOT_SALES_NAV_PROMPT,
} from "../grok-bot-setup";

const DATE = "August 27, 2026";

export const HELP_PAGES_P: HelpPageDraft[] = [
  {
    slug: "how-do-i-connect-grok-bot-to-linkedin",
    question: "How do I connect Grok Bot to LinkedIn?",
    description:
      "You do not. Keep LinkedIn signed in only inside Omentir. Connect Grok Bot to Omentir over MCP. A LinkedIn login on the Bot computer is shared across every Bot you create later.",
    keywords: [
      "connect Grok Bot to LinkedIn",
      "Grok Bot LinkedIn login",
      "Grok Bot connect LinkedIn",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "People search this because Grok Bot can click websites with no API. That is a bad idea on LinkedIn. A cloud VM typing Connect is still a bot. [LinkedIn's user agreement](https://www.linkedin.com/legal/user-agreement) restricts unauthorized bots on the consumer product.",
      "All of your Bots share one computer. If you take over for a password, passkey, two-factor code, or CAPTCHA, that session stays available to the rest of the roster. You did not give LinkedIn to one Bot. You gave it to every Bot you spin up later.",
      "The path that works: finish [Omentir](/integrations/grok-bot) first, LinkedIn connected there, My Product written. In Grok Bot, open Settings, then Plugins, and add https://omentir.com/api/agent/v1/mcp. Approve Connect workspace. Put this in the Bot description: research and draft only; never send; never enroll; never sign into LinkedIn.",
      "If the Bot asks you to take over for LinkedIn, refuse. Point it at Omentir tools. Setup details: [how to connect Grok Bot to Omentir](/help/how-do-i-connect-grok-bot-to-omentir). Why the login is unsafe: [is it safe to let Grok Bot log into LinkedIn](/help/is-it-safe-to-let-grok-bot-log-into-linkedin).",
      "If you already pasted a LinkedIn password into the Bot computer, change it, sign out of that session, and keep LinkedIn only in Omentir.",
    ],
    prompt: GROK_BOT_FIRST_JOB_PROMPT,
    faqItems: [
      {
        question: "Can I log in once and never again?",
        answer:
          "The session persists. Other Bots on the same computer can use it. Once is enough to share the account.",
      },
      {
        question: "Is Sales Navigator different?",
        answer:
          "It is still your LinkedIn identity on a shared VM. Do not put it there. See [can I use Grok Bot with Sales Navigator](/help/can-i-use-grok-bot-with-sales-navigator).",
      },
      {
        question: "Does MCP count as connecting Grok Bot to LinkedIn?",
        answer:
          "MCP connects Grok Bot to Omentir. Omentir already holds the LinkedIn session. The Bot never sees the password.",
      },
      {
        question: "What if I wanted the Bot to click Connect for me?",
        answer:
          "That is the restriction pattern. Send from Omentir after you read the list. See [can Grok Bot send LinkedIn messages automatically](/help/can-grok-bot-send-linkedin-messages-automatically).",
      },
    ],
    relatedSlugs: [
      "how-do-i-connect-grok-bot-to-omentir",
      "is-it-safe-to-let-grok-bot-log-into-linkedin",
      "can-i-use-grok-bot-for-linkedin-outreach",
    ],
  },
  {
    slug: "can-i-use-grok-bot-with-sales-navigator",
    question: "Can I use Grok Bot with Sales Navigator?",
    description:
      "Do not put a Sales Navigator login on the Grok Bot computer. Use Omentir to find people a Navigator search would also surface. The Bot drafts. You send.",
    keywords: [
      "Grok Bot Sales Navigator",
      "Grok Bot LinkedIn Sales Navigator",
      "Sales Navigator Grok Bot",
    ],
    cluster: "inmail",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Sales Navigator is still your LinkedIn identity. Logging it into Grok Bot's shared computer is the same mistake as logging in the free profile. The session can persist for other Bots. A restriction still has your name on it.",
      "What you can do: write the titles, company type, region, and signals you would have put in a Navigator search. Point Grok Bot at Omentir MCP. Ask for a scored list and two-sentence drafts. Omentir already has lead finders for that job. The Bot should not open Sales Navigator in a cloud browser.",
      "InMail is a paid credit, not a handshake. If you use InMail, say so in the prompt so the Bot does not write a connection note into that box. Invite notes stay tiny or blank. After-accept DMs are two sentences and a real trigger.",
      "Grok Bot is still in beta and sits on expensive Cursor or SuperGrok plans. If you do not already have it, run the same search from Overview. The longer motion is [Grok Bot and Sales Navigator](/use-cases/grok-bot-sales-navigator).",
      "If you already pasted a Navigator password into the Bot computer, change it, sign out, and keep LinkedIn only in Omentir. Then write the stop rule: never sign into LinkedIn or Sales Navigator.",
    ],
    prompt: GROK_BOT_SALES_NAV_PROMPT,
    faqItems: [
      {
        question: "Does Omentir need a Sales Navigator subscription?",
        answer:
          "No. Write the same targeting you would have used in Navigator. Omentir finds people through its own lead finders. Navigator is optional on your own laptop if you already pay for it. Keep that login off the Bot.",
      },
      {
        question: "Can the Bot export a Navigator list?",
        answer:
          "Do not ask it to scrape Navigator. Paste a CSV into Omentir if you already exported one yourself, or let a finder pull a new batch.",
      },
      {
        question: "Is InMail a good first job?",
        answer:
          "Usually no. InMail costs credits. Start with invites and after-accept DMs on a small campaign. Save InMail for people you cannot reach another way.",
      },
      {
        question: "Can Grok Bot send from Sales Navigator?",
        answer:
          "It should not type in LinkedIn products at all. Send from Omentir after you read the list. See [can Grok Bot send LinkedIn messages automatically](/help/can-grok-bot-send-linkedin-messages-automatically).",
      },
    ],
    relatedSlugs: [
      "is-it-safe-to-let-grok-bot-log-into-linkedin",
      "how-do-i-connect-grok-bot-to-linkedin",
      "can-i-use-grok-bot-for-linkedin-outreach",
    ],
  },
  {
    slug: "what-grok-bot-prompts-should-i-use-for-linkedin",
    question: "What Grok Bot prompts should I use for LinkedIn?",
    description:
      "Use a job, not a personality file. One ICP, a number you can read, and a stop rule: do not send, do not enroll, do not sign into LinkedIn. Paste-ready prompts live in the prompts post.",
    keywords: [
      "Grok Bot prompts LinkedIn",
      "best Grok Bot prompt for sales",
      "Grok Bot LinkedIn prompt",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A good Grok Bot prompt names the buyer, the result, who to skip, and where to stop. \"Find me pipeline\" produces notes that could fit a dentist and a datacenter. Fill the brackets. Keep the last two sentences.",
      "Put the stop rule in the Bot description and leave it there: research and draft only; never send; never enroll; never sign into LinkedIn. Then paste one job for tonight. Overnight research, after-accept DMs, follow-ups, or a scored list with no copy. Do not run all four the same night.",
      "Tell the Bot which box the draft is for. The invite is tiny or blank. The after-accept DM is two sentences and a real trigger. A follow-up needs a new trigger, not \"just circling back.\"",
      "Finish Omentir first and add MCP before you paste anything. If the Bot asks you to take over for LinkedIn, refuse. The paste-ready set is [Grok Bot prompts for LinkedIn outreach](/blogs/grok-bot-linkedin-prompts).",
      "If you do not already pay for a plan that includes Grok Bot, skip the prompt pack. Overview already finds people and drafts notes.",
    ],
    prompt: GROK_BOT_FIRST_JOB_PROMPT,
    faqItems: [
      {
        question: "Which prompt should I run first?",
        answer:
          "The overnight research prompt: up to 30 people, fit 1-5, evidence, a two-sentence draft, stop at a review list. See [how to connect Grok Bot](/help/how-do-i-connect-grok-bot-to-omentir).",
      },
      {
        question: "Can I ask it to be more aggressive?",
        answer:
          "You can. You will get calendar holds and notes you will not send from your phone. Cut that line. Keep two sentences and a real trigger.",
      },
      {
        question: "Do grok.com and Grok Bot share prompts?",
        answer:
          "The brief can be similar. The machine is not. grok.com is a session. These jobs assume Plugins and overnight work. See [Grok Bot versus grok.com](/help/what-is-the-difference-between-grok-bot-and-grok-com).",
      },
      {
        question: "Where do I send after the prompt runs?",
        answer:
          "In Omentir. Cut the junk, edit a few drafts, start a small campaign. The Bot should not press send.",
      },
    ],
    relatedSlugs: [
      "how-do-i-automate-cold-messaging-with-grok-bot",
      "how-do-i-connect-grok-bot-to-omentir",
      "can-i-use-grok-bot-for-linkedin-outreach",
    ],
  },
];
