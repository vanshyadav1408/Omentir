import Link from "next/link";
import GrokBotSetupBlock, { PromptCopyBox } from "../../grok-bot-setup-block";
import {
  GROK_BOT_COLD_DM_PROMPT,
  GROK_BOT_FIRST_JOB_PROMPT,
  GROK_BOT_FOLLOW_UP_PROMPT,
  GROK_BOT_LEAD_GEN_PROMPT,
} from "../../grok-bot-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Grok Bot prompts for LinkedIn outreach - Omentir",
  description:
    "Paste-ready Grok Bot prompts for LinkedIn research, cold DMs, follow-ups, and lead lists. Replace the brackets. Keep the stop rule. Send from Omentir.",
  path: "/blogs/grok-bot-linkedin-prompts",
  image: {
    url: "/grok-bot-linkedin-prompts.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Grok Bot prompts for LinkedIn outreach",
  },
  keywords: [
    "Grok Bot prompts",
    "Grok Bot LinkedIn prompts",
    "Grok Bot prompt for sales",
    "Grok Bot outreach prompt",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "how-to-use", label: "How to use these prompts", level: 1 },
  { id: "overnight", label: "Overnight research and first drafts", level: 1 },
  { id: "cold-dm", label: "After-accept DMs", level: 1 },
  { id: "follow-up", label: "Follow-ups after silence", level: 1 },
  { id: "lead-list", label: "A scored list, no copy", level: 1 },
  { id: "what-to-cut", label: "What to cut before you paste", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "Can I paste \"find me pipeline\" and skip the brackets?",
    answer:
      "You can. You will get a wide list and notes that could fit two unrelated buyers. Fill the brackets. Keep the last two sentences.",
  },
  {
    question: "Should the prompt tell Grok Bot to send?",
    answer:
      "No. SpaceXAI's own sales example already stops at a review list. Keep do not send, do not enroll, and do not sign into LinkedIn.",
  },
  {
    question: "Do I need a different prompt for grok.com?",
    answer:
      "grok.com is a chat connector. These jobs assume Grok Bot Plugins and overnight work. For grok.com, use the Grok integration and sit with the session.",
  },
  {
    question: "How many people should the first prompt pull?",
    answer:
      "Thirty is enough to judge the ICP. Four hundred is a list you will not read.",
  },
  {
    question: "Can I run all four prompts the same night?",
    answer:
      "No. Pick one job. A scored list, a DM pile, and a follow-up pile on the same Bot is how review dies unread.",
  },
  {
    question: "Where does sending happen?",
    answer:
      "In Omentir, after you cut the junk. Caps and send windows stay there. The Bot should not type in LinkedIn.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Grok Bot prompts for LinkedIn outreach"
      description="Paste-ready Grok Bot prompts for LinkedIn research, cold DMs, follow-ups, and lead lists. Replace the brackets. Keep the stop rule. Send from Omentir."
      slug="grok-bot-linkedin-prompts"
      bannerSrc="/grok-bot-linkedin-prompts.avif"
      bannerAlt="Editorial banner for Grok Bot prompts for LinkedIn outreach"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        Most Grok Bot LinkedIn prompts fail in the same place. They ask for pipeline. They skip who to ignore. They never say stop.{" "}
        <a href="https://x.ai/bot" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          Grok Bot
        </a>{" "}
        will still produce a list. You will not want to send it from your name.
      </p>
      <p>
        These prompts assume you already connected{" "}
        <Link href="/integrations/grok-bot" className="text-blue-600 hover:underline">
          Grok Bot to Omentir
        </Link>{" "}
        over MCP, and that LinkedIn stays inside Omentir. They are jobs, not personality files. Replace the brackets. Keep the last two sentences.
      </p>

      <h2
        id="how-to-use"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        How to use these prompts
      </h2>
      <p>
        Put the stop rule in the Bot description and leave it there: research and draft only. Never send. Never enroll. Never sign into LinkedIn. Then paste one job for tonight. One ICP. A number you can finish in the morning.
      </p>
      <p>
        If the Bot asks you to take over for a LinkedIn password or CAPTCHA, refuse. Computer use is how accounts get restricted. The longer split is{" "}
        <Link href="/blogs/grok-bot-linkedin-sales" className="text-blue-600 hover:underline">
          Grok Bot for LinkedIn outreach
        </Link>
        .
      </p>
      <GrokBotSetupBlock prompt={GROK_BOT_FIRST_JOB_PROMPT} />

      <h2
        id="overnight"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Overnight research and first drafts
      </h2>
      <p>
        This is the default sales job, the one in the setup block above. Score, evidence, risk, a two-sentence note. Stop at a review list. SpaceXAI already writes the send ban into their own sales example. Keep it.
      </p>

      <h2
        id="cold-dm"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        After-accept DMs
      </h2>
      <p>
        Tell the Bot which box the draft is for. An invite note is tiny or blank. The after-accept DM is two sentences and a real trigger. If you leave that unnamed, it writes the same paragraph for every box. More on the three boxes:{" "}
        <Link href="/blogs/automate-cold-messaging-with-grok-bot" className="text-blue-600 hover:underline">
          automate cold messaging with Grok Bot
        </Link>
        .
      </p>
      <PromptCopyBox prompt={GROK_BOT_COLD_DM_PROMPT} />

      <h2
        id="follow-up"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Follow-ups after silence
      </h2>
      <p>
        A follow-up that says \"just circling back\" is a second copy of the first miss. Ask for a new trigger. Skip anyone who already answered. One or two nudges. Infinite follow-ups train people to ignore you. The landing version is{" "}
        <Link href="/grok-bot-follow-up-messages" className="text-blue-600 hover:underline">
          follow-up messages with Grok Bot
        </Link>
        .
      </p>
      <PromptCopyBox prompt={GROK_BOT_FOLLOW_UP_PROMPT} />

      <h2
        id="lead-list"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        A scored list, no copy
      </h2>
      <p>
        Sometimes you only need names. Fit, evidence, already in a sequence or not. No drafts. Use this when the promise is still changing and you do not want thirty notes you will rewrite anyway. Lead gen as a motion:{" "}
        <Link href="/grok-bot-lead-generation" className="text-blue-600 hover:underline">
          Grok Bot for lead generation
        </Link>
        .
      </p>
      <PromptCopyBox prompt={GROK_BOT_LEAD_GEN_PROMPT} />

      <h2
        id="what-to-cut"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        What to cut before you paste
      </h2>
      <p>
        Cut any line that asks the Bot to log into LinkedIn, Sales Navigator, or a rented profile. Cut \"be more aggressive\" and \"book the meeting overnight.\" Cut a second ICP in the same job. If you need Sales Navigator-shaped search without putting the login on the Bot computer, use{" "}
        <Link href="/use-cases/grok-bot-sales-navigator" className="text-blue-600 hover:underline">
          Grok Bot and Sales Navigator
        </Link>
        .
      </p>
      <p>
        In the morning, reject the 1s and 2s. Edit a few drafts out loud. Start a small campaign. The first real question in the inbox is still yours.
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
