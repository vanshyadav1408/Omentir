import type { HelpPageDraft } from "./types";
import { GROK_BOT_COLD_DM_PROMPT, GROK_BOT_FIRST_JOB_PROMPT } from "../grok-bot-setup";

const DATE = "August 23, 2026";

export const HELP_PAGES_O: HelpPageDraft[] = [
  {
    slug: "can-grok-bot-send-linkedin-messages-automatically",
    question: "Can Grok Bot send LinkedIn messages automatically?",
    description:
      "It can enqueue outreach through Omentir if you connect MCP. It should not type DMs in LinkedIn's website on its cloud computer. Keep send behind a review list.",
    keywords: [
      "can Grok Bot send LinkedIn messages",
      "Grok Bot automatic LinkedIn DMs",
      "Grok Bot send messages automatically",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Grok Bot can keep working after you close the laptop. That includes drafting a LinkedIn note. Sending is a different job. SpaceXAI's own sales-outbound example stops at a review list: do not send, do not enroll anyone. Keep that sentence.",
      "If you connect [Omentir](/integrations/grok-bot) over MCP, the Bot can create a finder, pull leads, and write drafts that sit in your workspace. A campaign you start in Omentir can send later, under daily caps and send windows. That is paced send from the account you connected. It is not the Bot clicking Connect in a cloud browser.",
      "Letting the Bot log into linkedin.com and type the DM is the pattern LinkedIn already treats as automation. The Bot computer is shared across every Bot on your account. A LinkedIn session there is shared too. A restriction lands on your profile.",
      "If you wanted fully unsupervised sending, you are asking software to own taste. Fluent copy still invents pain, widens titles, and writes notes that could fit two unrelated buyers. Read the list in the morning. Cut the junk. Then start a small campaign.",
      "Setup is [how to connect Grok Bot](/help/how-do-i-connect-grok-bot-to-omentir). The sales split is [can I use Grok Bot for LinkedIn outreach](/help/can-i-use-grok-bot-for-linkedin-outreach).",
    ],
    prompt: GROK_BOT_FIRST_JOB_PROMPT,
    faqItems: [
      {
        question: "If I approve the drafts, does the Bot press send?",
        answer:
          "You start or refill a campaign in Omentir. Caps and windows still apply. The Bot's job is the review list, not the click.",
      },
      {
        question: "Can it send after they accept, without me?",
        answer:
          "Omentir can continue a campaign after accept if you set that up. You still own the words. First replies with a real question belong to a person.",
      },
      {
        question: "What about email?",
        answer:
          "Grok Bot can draft email. Omentir will not rotate domains or warm inboxes. If email is the channel, use an email tool. Do not pretend LinkedIn send is a mailbox rotator.",
      },
      {
        question: "Is automatic send allowed by LinkedIn?",
        answer:
          "A cloud VM typing DMs is the risk. A paced send path from your own workspace is still unofficial. You own the account. See [is LinkedIn automation allowed](/help/is-linkedin-automation-allowed).",
      },
    ],
    relatedSlugs: [
      "how-do-i-automate-cold-messaging-with-grok-bot",
      "can-i-use-grok-bot-for-linkedin-outreach",
      "is-it-safe-to-let-grok-bot-log-into-linkedin",
    ],
  },
  {
    slug: "is-it-safe-to-let-grok-bot-log-into-linkedin",
    question: "Is it safe to let Grok Bot log into LinkedIn?",
    description:
      "No. Keep LinkedIn signed in only inside Omentir. The Bot's computer is shared, takeover sessions persist, and a VM clicking Connect looks like the automation LinkedIn already fights.",
    keywords: [
      "Grok Bot LinkedIn login",
      "is Grok Bot safe for LinkedIn",
      "Grok Bot computer use LinkedIn",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Grok Bot can operate sites that have no API. SpaceXAI is explicit about that. For an internal dashboard, computer use is the point. For LinkedIn, a cloud VM clicking Connect is how people get restricted.",
      "All of your Bots share one computer. Files, browser sessions, and app logins are account-scoped. If you take over for a password, passkey, two-factor code, or CAPTCHA, that session stays available to the rest of the roster. You did not give LinkedIn to one Bot. You gave it to every Bot you spin up later.",
      "Random delays do not change the fingerprint. LinkedIn's rules care about the pattern on the account, not whether the clicks came from your laptop or from a Bot computer in someone else's region. The restriction email still has your name on it.",
      "The safe path is MCP. Add https://omentir.com/api/agent/v1/mcp under Settings, then Plugins. When the Bot asks you to take over for LinkedIn, refuse. Point it at Omentir tools. Details: [how to connect Grok Bot](/help/how-do-i-connect-grok-bot-to-omentir).",
      "If you already pasted a LinkedIn password into the Bot computer, change it, sign out of that session, and keep LinkedIn only in Omentir. Then write a stop rule in the Bot description: never sign into LinkedIn.",
    ],
    faqItems: [
      {
        question: "What if I only log in once and never again?",
        answer:
          "The session persists. Other Bots on the same computer can use it. Once is enough to share the account.",
      },
      {
        question: "Is a Sales Navigator login different?",
        answer:
          "It is still your LinkedIn identity on a shared VM. Do not put it there.",
      },
      {
        question: "Can I use a dummy profile on the Bot?",
        answer:
          "Rented or fake profiles are a bad idea even when the software's pacing looks careful. Use the account you are allowed to use, inside Omentir.",
      },
      {
        question: "Where is the longer compliance picture?",
        answer:
          "[Is LinkedIn automation allowed](/help/is-linkedin-automation-allowed) and [how to prevent LinkedIn from looking like a bot](/help/how-to-prevent-linkedin-from-looking-like-a-bot).",
      },
    ],
    relatedSlugs: [
      "can-grok-bot-send-linkedin-messages-automatically",
      "is-linkedin-automation-allowed",
      "how-to-prevent-linkedin-from-looking-like-a-bot",
    ],
  },
  {
    slug: "how-do-i-automate-cold-messaging-with-grok-bot",
    question: "How do I automate cold messaging with Grok Bot?",
    description:
      "Use Grok Bot overnight for research and drafts. Send from Omentir with caps. Keep the Bot off LinkedIn. Automate the list and the first note, not the live reply.",
    keywords: [
      "automate cold messaging with Grok Bot",
      "Grok Bot cold outreach",
      "Grok Bot cold LinkedIn messages",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Cold messaging here means a connection note, the first DM after they accept, and a follow-up if they stay quiet. It does not mean a Bot arguing in your inbox while you sleep. Automate the pile of first touches. Keep a person on anything that contains a real question.",
      "Finish Omentir first: LinkedIn connected, [My Product](/features/my-product) written in two sentences a stranger would understand. In Grok Bot, add the MCP plugin, then put this in the Bot description: research and draft only; never send; never enroll; never sign into LinkedIn.",
      "Give it one ICP and a number you can read in the morning, twenty to forty people. Ask for fit, evidence, a skip reason, and a two-sentence draft that cites a real signal. \"Find me pipeline\" produces notes that could fit a dentist and a datacenter.",
      "In the morning, reject the 1s and 2s. Edit a few drafts so they sound like you. Start a small campaign in Omentir with conservative daily limits. Replies hit the unified inbox. Approve or rewrite the next sentence. Book the call yourself.",
      "If you do not already pay for Cursor Ultra, Cursor Teams Premium, or SuperGrok Heavy, skip the Bot. Overview already finds people and drafts notes. The longer playbook is [automate cold messaging with Grok Bot](/blogs/automate-cold-messaging-with-grok-bot).",
    ],
    prompt: GROK_BOT_COLD_DM_PROMPT,
    faqItems: [
      {
        question: "Should the connection note be automated too?",
        answer:
          "A specific one-liner can ride on the invite. A pitch in that box is asking a stranger to approve a salesperson. Blank is often better than a fake paragraph. See [should I include a note](/help/should-i-include-a-note-with-linkedin-connection-request).",
      },
      {
        question: "How many follow-ups?",
        answer:
          "One or two after accept if they never replied. Infinite nudges train people to ignore you. Change the promise if ignores pile up. Do not add a second Bot to go faster.",
      },
      {
        question: "Can it write the follow-up overnight too?",
        answer:
          "Yes, as a draft. Send still goes through Omentir. If they already answered, stop. A Bot that cannot see the thread will double-send.",
      },
      {
        question: "Is this the same as grok.com chat?",
        answer:
          "No. See [Grok Bot versus grok.com](/help/what-is-the-difference-between-grok-bot-and-grok-com).",
      },
    ],
    relatedSlugs: [
      "can-grok-bot-send-linkedin-messages-automatically",
      "how-do-i-connect-grok-bot-to-omentir",
      "can-i-use-chatgpt-to-write-linkedin-messages",
    ],
  },
  {
    slug: "what-is-the-difference-between-grok-bot-and-grok-com",
    question: "What is the difference between Grok Bot and grok.com for sales?",
    description:
      "grok.com is a chat app with an MCP connector. Grok Bot is a separate app: named Bots, a shared cloud computer, Plugins, and work that continues after you close the laptop.",
    keywords: [
      "Grok Bot vs grok.com",
      "Grok Bot vs Grok chat",
      "difference between Grok Bot and Grok",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Omentir has two Grok pages on purpose. The [Grok integration](/integrations/grok) is grok.com: Settings, Connectors, paste https://omentir.com/api/agent/v1/mcp, approve the workspace, talk to tools in a conversation. Useful. It stops when you close the tab.",
      "Grok Bot is a desktop app on macOS or Windows, and an iOS app. Access sits on SuperGrok Heavy, Cursor Ultra, or Cursor Teams Premium. Linux desktop is not currently in SpaceXAI's get-started docs. You create a named Bot, give it a job, and message it like a coworker. It keeps working overnight.",
      "Grok Bot uses Settings, then Plugins, for the same MCP URL. It can also drive websites by clicking them. That second path is the one that gets LinkedIn accounts into trouble. Chat Grok does not get a cloud VM. Grok Bot does.",
      "For sales, pick the operator you will actually watch. If you only needed a conversation this afternoon, use grok.com. If you already pay for a plan that includes the Bot and you want a review list by morning, use Grok Bot. Do not run both plus Claude on day one.",
      "Neither product should hold your LinkedIn password. LinkedIn stays in Omentir. The comparison for operators is [Grok Bot versus ChatGPT for outbound](/blogs/grok-bot-vs-chatgpt-for-outbound).",
    ],
    faqItems: [
      {
        question: "Can I use grok.com if I do not have Grok Bot?",
        answer:
          "Yes. The chat connector is enough to operate Omentir in a session. You will not get overnight runs on a persistent computer.",
      },
      {
        question: "Does Grok Bot include grok.com?",
        answer:
          "They are separate products. A SuperGrok Heavy or Cursor plan that includes the Bot is not the same as opening grok.com in a browser.",
      },
      {
        question: "Which one should a founder start with?",
        answer:
          "Most founders should start in Omentir Overview with no extra operator. Add grok.com chat if that is already where you work. Add Grok Bot only if you already pay for it.",
      },
      {
        question: "Do they share MCP login with Cursor?",
        answer:
          "Grok Bot does. A team allowlist has to include the Omentir MCP URL. grok.com chat uses its own connector approval.",
      },
    ],
    relatedSlugs: [
      "how-do-i-connect-grok-bot-to-omentir",
      "can-i-use-grok-bot-for-linkedin-outreach",
      "can-i-use-chatgpt-to-write-linkedin-messages",
    ],
  },
  {
    slug: "can-grok-bot-replace-a-sales-development-rep",
    question: "Can Grok Bot replace a sales development rep?",
    description:
      "It can cover overnight research and first-touch drafts. It does not take the meeting, run a territory, or own a forecast. Skip it if you do not already pay for the plan that includes it.",
    keywords: [
      "Grok Bot replace SDR",
      "Grok Bot vs sales development rep",
      "Grok Bot for sales team",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "An SDR costs salary, ramp, tools, and management. Grok Bot costs a Cursor or SuperGrok plan you may already have, plus the hours you still spend on the review list and the inbox. The comparison is only honest if you count those hours. The Bot does not attend the demo.",
      "What it can own: refresh one ICP, skip people already in a sequence, score the rest, attach a reason, draft a note that cites a real trigger, stop. That is the sales-outbound example SpaceXAI already ships. What it cannot own: judgment when someone asks a pricing exception, a custom security answer, or \"are you the right person?\"",
      "If no one answers a careful founder note, an SDR will not save you, and a Bot will not either. Run one ICP for two weeks. If the promise is wrong, overnight volume multiplies the mistake. Hire when qualified threads wait a day because you are building product.",
      "Grok Bot is still in beta. Plans that include it are not a rounding error. Omentir Overview already finds leads and drafts notes without it. Add the Bot if you want overnight research on top. Do not buy the plan only to avoid reading your own pipeline.",
      "The hire-versus-software page is [replace the first SDR](/use-cases/replace-first-sdr). The Grok Bot version of founder outbound is [get LinkedIn sales with Grok Bot](/use-cases/grok-bot-outbound).",
    ],
    faqItems: [
      {
        question: "Can one Bot replace a three-person SDR team?",
        answer:
          "No. It does not do phone, multi-inbox email, or a manager's forecast. It can fill a LinkedIn review list. That is one slice of the job.",
      },
      {
        question: "Should I fire the SDR and plug in Grok Bot?",
        answer:
          "If the SDR's job was uploading CSVs and blasting the same paragraph, software was going to eat that anyway. If they run conversations, keep them. Point the Bot at research.",
      },
      {
        question: "Do I need Grok Bot if I already have Omentir?",
        answer:
          "No. The Bot is an extra operator. Overview works without it.",
      },
      {
        question: "What should I measure?",
        answer:
          "Meetings held, not how many notes the Bot wrote while you slept. If you cannot give the review list fifteen minutes, you bought a research toy.",
      },
    ],
    relatedSlugs: [
      "can-i-use-grok-bot-for-linkedin-outreach",
      "what-is-an-icp-for-b2b-sales",
      "how-to-qualify-a-linkedin-lead",
    ],
  },
];
