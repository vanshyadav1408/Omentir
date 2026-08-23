import Link from "next/link";
import { PromptCopyBox } from "../../grok-bot-setup-block";
import { GROK_BOT_FIRST_JOB_PROMPT } from "../../grok-bot-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Grok Bot for LinkedIn outreach - Omentir",
  description:
    "Grok Bot can research accounts and draft LinkedIn notes overnight. Hook it to Omentir so the send path stays paced, and keep the cloud browser off LinkedIn.",
  path: "/blogs/grok-bot-linkedin-sales",
  image: {
    url: "/grok-bot-linkedin-sales.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Grok Bot for LinkedIn outreach",
  },
  keywords: [
    "Grok Bot for LinkedIn outreach",
    "Grok Bot outreach",
    "Grok Bot Omentir",
    "Grok Bot LinkedIn agent",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "not-grok-chat", label: "Grok Bot is not grok.com chat", level: 1 },
  { id: "what-it-is-good-for", label: "What Grok Bot is good at for sales", level: 1 },
  { id: "linkedin-problem", label: "The LinkedIn problem", level: 1 },
  { id: "connect-omentir", label: "Connect Omentir as the send path", level: 1 },
  { id: "first-job", label: "A first overnight job", level: 1 },
  { id: "weekly-loop", label: "Weekly loop that can book meetings", level: 1 },
  { id: "when-to-skip", label: "When to skip Grok Bot", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "Is Grok Bot a LinkedIn automation tool?",
    answer:
      "No. Grok Bot is a general always-on agent with its own cloud computer. It can draft LinkedIn notes and, if you let it, click around websites. LinkedIn outbound still needs a paced send path and a human on replies. That is the Omentir job.",
  },
  {
    question: "Should Grok Bot log into LinkedIn?",
    answer:
      "No. Keep LinkedIn signed in only inside Omentir. Grok Bot's computer is shared across your Bots. A LinkedIn session there is shared too, and a VM clicking Connect is the pattern LinkedIn already treats as automation.",
  },
  {
    question: "Do I need Grok Bot if I already use Omentir?",
    answer:
      "No. Overview, lead finders, and the inbox work without it. Add Grok Bot if you already pay for a plan that includes it and you want overnight research on top of the workspace.",
  },
  {
    question: "How is this different from grok.com?",
    answer:
      "grok.com is a chat app with a custom MCP connector. Grok Bot is a separate app: named Bots, a persistent computer, Plugins, and work that continues after you close the laptop.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Grok Bot for LinkedIn outreach"
      description="Grok Bot can research accounts and draft LinkedIn notes overnight. Hook it to Omentir so the send path stays paced, and keep the cloud browser off LinkedIn."
      slug="grok-bot-linkedin-sales"
      bannerSrc="/grok-bot-linkedin-sales.avif"
      bannerAlt="Editorial banner for Grok Bot for LinkedIn outreach"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        <a href="https://x.ai/bot" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          Grok Bot
        </a>{" "}
        shipped August 11, 2026 as an early beta from SpaceXAI. The pitch is not another chat window. You get named Bots on a persistent cloud computer. They can sign into apps, call MCP where it exists, click through sites that have no API, and keep working after you close the laptop.
      </p>
      <p>
        SpaceXAI already uses that for sales outbound: research accounts overnight, score contacts, draft email and LinkedIn in the seller&apos;s voice, and leave a review list. Their own starter prompt says do not send and do not enroll anyone. That last sentence is the whole product, if you are trying to sell from LinkedIn without a restriction.
      </p>
      <p>
        This post is for people who already have Grok Bot, or who are about to, and want pipeline on LinkedIn. The split is simple. Grok Bot researches and drafts.{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>{" "}
        holds the LinkedIn account, the daily caps, and the inbox. You still take the meeting.
      </p>

      <h2
        id="not-grok-chat"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Grok Bot is not grok.com chat
      </h2>
      <p>
        Omentir already has a{" "}
        <Link href="/integrations/grok" className="text-blue-600 hover:underline">
          Grok chat connector
        </Link>
        . That is grok.com: paste the MCP URL, approve the workspace, talk to tools in a conversation. Useful. It is not Grok Bot.
      </p>
      <p>
        Grok Bot is a desktop app (macOS or Windows) and an iOS app. Access today sits on SuperGrok Heavy, Cursor Ultra, or Cursor Teams Premium. Linux desktop is not currently in SpaceXAI&apos;s get-started docs. Enterprise is a waitlist. You create a Bot, give it a job, and message it like a coworker.
      </p>
      <p>
        All of your Bots share one computer. Files, browser sessions, and app logins are account-scoped, not Bot-scoped. That is handy for handoffs. It is also why a LinkedIn login on that computer is a gift to every Bot you spin up later.
      </p>

      <h2
        id="what-it-is-good-for"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        What Grok Bot is good at for sales
      </h2>
      <p>
        Overnight work with a clear deliverable. Pull a CRM view. Skip anyone already in a sequence. Score the rest against a written ICP. Attach a reason. Draft a note that cites a real trigger. Stop.
      </p>
      <p>
        It is also decent at turning a messy account list into a short brief you can read on a phone. That is the job SpaceXAI describes in the{" "}
        <a href="https://docs.x.ai/grok-bot/use-cases" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          Grok Bot use cases
        </a>
        . Notice what they do not ask the Bot to own: the send, the enroll, the live conversation.
      </p>
      <p>
        What it is bad at, left unsupervised, is taste. A Bot that has been told &quot;find pipeline&quot; will widen titles, invent pain, and write notes that could fit a dentist and a datacenter. That copy is fluent. It is also how you train LinkedIn to ignore you.
      </p>

      <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
        <div className="pl-4">
          <h4 className="font-bold text-black mb-2">The stop rule</h4>
          <p className="text-sm text-zinc-650 leading-relaxed">
            Put this in the Bot description and keep it there: research and draft only. Never send. Never enroll. Never sign into LinkedIn. Come back when the review list is ready.
          </p>
        </div>
      </div>

      <h2
        id="linkedin-problem"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        The LinkedIn problem
      </h2>
      <p>
        Grok Bot can operate sites with no clean API. SpaceXAI is explicit about that. For an internal admin tool, computer use is the point. For LinkedIn, it is how people get restricted.
      </p>
      <p>
        A cloud VM typing connection requests is still automation. Random delays do not change that. LinkedIn&apos;s rules care about the pattern on the account, not whether the clicks came from your laptop or from a Bot computer in someone else&apos;s region.
      </p>
      <p>
        There is a second issue. When the Bot needs a password, passkey, two-factor code, or CAPTCHA, Grok Bot asks you to take over the computer. That session then persists for other Bots. You did not give LinkedIn to one teammate. You gave it to the roster.
      </p>
      <p>
        If you want the longer compliance picture, start with{" "}
        <Link href="/blogs/linkedin-outreach-compliance-2026" className="text-blue-600 hover:underline">
          the 2026 outreach checklist
        </Link>
        . The short version for Grok Bot: do not let it drive the LinkedIn UI.
      </p>

      <h2
        id="connect-omentir"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Connect Omentir as the send path
      </h2>
      <p>
        Finish Omentir first. Connect the LinkedIn account you are allowed to use. Write{" "}
        <Link href="/features/my-product" className="text-blue-600 hover:underline">
          My Product
        </Link>{" "}
        in two sentences a stranger would understand: who feels the pain, what result you produce, what you will not claim. A vague brief produces notes you will be ashamed to send from your own name.
      </p>
      <p>
        In Grok Bot, open Settings, then Plugins. Add a custom MCP server:
      </p>
      <div className="my-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="font-mono text-sm leading-7 text-zinc-800">https://omentir.com/api/agent/v1/mcp</p>
      </div>
      <p>
        Sign in on Omentir when the browser opens and approve Connect workspace. Grok Bot shares MCP authentication with Cursor, so a team allowlist has to include that URL. If the plugin UI has no sign-in and wants a header, create a revocable key on the API page. Do not paste the key into a group thread with other Bots.
      </p>
      <p>
        Then tell the Bot to fetch{" "}
        <Link href="/agents.md" className="text-blue-600 hover:underline">
          agents.md
        </Link>
        , run get_context, and list existing agents before it creates anything. Setup screenshots live on the{" "}
        <Link href="/integrations/grok-bot" className="text-blue-600 hover:underline">
          Grok Bot integration page
        </Link>
        . The tool groups are on{" "}
        <Link href="/integrations/mcp" className="text-blue-600 hover:underline">
          MCP
        </Link>
        .
      </p>
      <p>
        If the Bot asks you to take over the computer for LinkedIn, refuse. Point it back at the MCP tools. That is the whole integration.
      </p>

      <h2
        id="first-job"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        A first overnight job
      </h2>
      <p>
        Give it a job spec, not a vibe. Replace the brackets. Keep the last two sentences.
      </p>
      <PromptCopyBox prompt={GROK_BOT_FIRST_JOB_PROMPT} />
      <p>
        Thirty is enough to judge the ICP. Four hundred is a pile you will skim and then resent. If the Bot wants to broaden titles because the first list was thin, that is a targeting problem. Fix My Product. Do not reward it with a wider net.
      </p>
      <p>
        In the morning, open Omentir and read the people, not the Bot&apos;s summary. Reject patterns (agencies posing as SaaS, students, the wrong country). Start a small campaign with conservative daily limits. Human pacing is in{" "}
        <Link href="/features/linkedin-account-safety" className="text-blue-600 hover:underline">
          account safety
        </Link>{" "}
        and{" "}
        <Link href="/features/campaigns-and-send-windows" className="text-blue-600 hover:underline">
          send windows
        </Link>
        .
      </p>

      <h2
        id="weekly-loop"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Weekly loop that can book meetings
      </h2>
      <p>
        Once the first list produced real conversations, you can make the research a routine. SpaceXAI lets you save a path the Bot followed and run it on a schedule. Keep the same stop: review list, not send.
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li>
          Overnight: Grok Bot refreshes one ICP against Omentir (or a CRM view you already trust), scores, drafts, stops.
        </li>
        <li>
          Morning: you cut the 1s and 2s, edit a few drafts so they sound like you, start or refill a campaign in Omentir.
        </li>
        <li>
          Daytime: replies hit the unified inbox. Approve or rewrite the next sentence. Book the call yourself.
        </li>
        <li>
          Friday: if ignores piled up, change the promise or the segment. If the Bot started inventing posts, tighten the description. Do not add a second Bot to &quot;go faster.&quot;
        </li>
      </ul>
      <p>
        Meetings come from the inbox, not from how many notes the Bot wrote while you slept. If you cannot give the review list fifteen minutes, you do not have a sales motion. You have a content generator pointed at strangers.
      </p>
      <p>
        Steal Customers is a useful second agent once the classic finder is stable: competitor posts, public commenters, a note that can name the actual thread. Create it from Grok Bot the same way, with URLs you picked, not logos the model guessed. Details are on{" "}
        <Link href="/features/steal-customers" className="text-blue-600 hover:underline">
          Steal Customers
        </Link>
        .
      </p>

      <h2
        id="when-to-skip"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        When to skip Grok Bot
      </h2>
      <p>
        Skip it if you do not already pay for Cursor Ultra, Cursor Teams Premium, or SuperGrok Heavy. Those plans are not a rounding error. Omentir Overview already finds leads, drafts notes, and collects replies. The Bot is an extra operator.
      </p>
      <p>
        Skip it if you wanted grok.com. Use the{" "}
        <Link href="/integrations/grok" className="text-blue-600 hover:underline">
          Grok integration
        </Link>
        . Skip it if you cannot sit with a review list. An unread overnight run is just a more expensive way to ignore your pipeline.
      </p>
      <p>
        Skip a second operator (Claude plus ChatGPT plus Grok Bot) until one of them is a habit. Connect paths are cheap to add and expensive to babysit.
      </p>
      <p>
        If you are still the closer and you only needed one ICP on your own profile, the shorter page is{" "}
        <Link href="/use-cases/outbound-for-founders" className="text-blue-600 hover:underline">
          outbound for founders
        </Link>
        . The Grok Bot version of that motion is{" "}
        <Link href="/use-cases/grok-bot-outbound" className="text-blue-600 hover:underline">
          get LinkedIn sales with Grok Bot
        </Link>
        . If the job is the cold note itself, use{" "}
        <Link href="/blogs/automate-cold-messaging-with-grok-bot" className="text-blue-600 hover:underline">
          automate cold messaging with Grok Bot
        </Link>
        .
      </p>

      <h2
        id="faqs"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        FAQs
      </h2>
      <FaqAccordion items={faqItems} />
    </BlogPostTemplate>
  );
}
