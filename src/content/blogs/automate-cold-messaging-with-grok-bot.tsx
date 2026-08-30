import Link from "next/link";
import { PromptCopyBox } from "../../grok-bot-setup-block";
import { GROK_BOT_COLD_DM_PROMPT } from "../../grok-bot-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Automate cold messaging with Grok Bot - Omentir",
  description:
    "Use Grok Bot overnight for research and first-touch drafts. Send cold LinkedIn notes from Omentir with caps. Keep the Bot off LinkedIn, and keep a person on real replies.",
  path: "/blogs/automate-cold-messaging-with-grok-bot",
  image: {
    url: "/automate-cold-messaging-with-grok-bot-v2.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for automating cold messaging with Grok Bot",
  },
  keywords: [
    "automate cold messaging with Grok Bot",
    "Grok Bot cold messaging",
    "Grok Bot cold LinkedIn messages",
    "automate cold outreach Grok Bot",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "what-automate-means", label: "What automate should mean", level: 1 },
  { id: "the-three-boxes", label: "The three boxes people mix up", level: 1 },
  { id: "overnight-drafts", label: "Overnight drafts, not overnight sending", level: 1 },
  { id: "the-prompt", label: "A job spec that produces notes you can send", level: 1 },
  { id: "morning-edit", label: "Morning edit, then a small campaign", level: 1 },
  { id: "replies", label: "Replies are a stop, not a step", level: 1 },
  { id: "when-to-skip", label: "When this is the wrong motion", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "Can Grok Bot send the cold messages for me?",
    answer:
      "It can fill a review list and call Omentir tools that enqueue outreach under your caps. It should not type DMs on linkedin.com from its cloud computer. Keep send behind your read.",
  },
  {
    question: "Is a connection note the same as a cold DM?",
    answer:
      "No. The note rides on the invite and is short. The DM after they accept is a normal thread. A pitch in the invite box is asking a stranger to approve a salesperson.",
  },
  {
    question: "Do I need Grok Bot to automate cold LinkedIn notes?",
    answer:
      "No. Omentir Overview already finds people and drafts notes. Add Grok Bot if you already pay for a plan that includes it and you want overnight research on top.",
  },
  {
    question: "Will this get my LinkedIn account restricted?",
    answer:
      "A VM clicking Connect is the pattern LinkedIn already treats as automation. A paced campaign from Omentir is still unofficial. You own the account. Conservative limits and a human on replies are the parts you control.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Automate cold messaging with Grok Bot"
      description="Use Grok Bot overnight for research and first-touch drafts. Send cold LinkedIn notes from Omentir with caps. Keep the Bot off LinkedIn, and keep a person on real replies."
      slug="automate-cold-messaging-with-grok-bot"
      bannerSrc="/automate-cold-messaging-with-grok-bot-v2.avif"
      bannerAlt="Editorial banner for automating cold messaging with Grok Bot"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        People type &quot;automate cold messaging with Grok Bot&quot; because they want the pile of first touches to happen without sitting in LinkedIn all afternoon. That job is real. The failure mode is also real: a cloud browser typing the same fluent paragraph at strangers while you sleep, then a restriction email with your name on it.
      </p>
      <p>
        <a href="https://x.ai/bot" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          Grok Bot
        </a>{" "}
        can research accounts and draft notes overnight.{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>{" "}
        holds the LinkedIn account, the daily caps, and the inbox. You still take the meeting. SpaceXAI&apos;s own sales-outbound example already says do not send and do not enroll anyone. This post is how to keep that sentence when the channel is a cold LinkedIn note.
      </p>

      <h2
        id="what-automate-means"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        What automate should mean
      </h2>
      <p>
        Automate the list and the first two sentences. Do not automate the live argument. A Bot that keeps talking after someone asks a real question is not saving time. It is transferring risk onto copy you did not read.
      </p>
      <p>
        Cold messaging here is three things: the connection note, the first DM after they accept, and one follow-up if they stay quiet. It is not a 12-step drip. Infinite nudges train people to ignore you. If ignores pile up, change the promise or the segment. Do not add a second Bot to &quot;go faster.&quot;
      </p>
      <p>
        If you do not already pay for SuperGrok Heavy, Cursor Ultra, or Cursor Teams Premium, skip the Bot. Omentir Overview already finds people and drafts notes. The Bot is an extra operator for overnight research, not a requirement for sending.
      </p>

      <h2
        id="the-three-boxes"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        The three boxes people mix up
      </h2>
      <p>
        Tools love to collapse every LinkedIn text field into one step called Message. That is how you stuff a pitch into an invite note, or spend InMail credits on a template that belonged in a DM after they said yes.
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li>
          Invite note: one specific reason, or nothing. LinkedIn rations personalized notes on free accounts. A blank invite with a strong profile still works on a warm-ish list. A fake paragraph in that box is worse than blank.
        </li>
        <li>
          After-accept DM: the premise and a small ask. A question, a resource, not a 30-minute hold. They opted into a conversation by accepting. This is the box most cold outbound actually lives in.
        </li>
        <li>
          InMail: paid or credit-based mail to someone you are not connected to. Use it when you cannot connect. Do not burn a credit on banner-ad copy.
        </li>
      </ul>
      <p>
        Tell Grok Bot which box the draft is for. A two-sentence DM that cites a hire is not an invite note. If you want the longer split,{" "}
        <Link href="/grok-bot-cold-messages" className="text-blue-600 hover:underline">
          cold messaging with Grok Bot
        </Link>{" "}
        is the short landing, and{" "}
        <Link href="/help/should-i-include-a-note-with-linkedin-connection-request" className="text-blue-600 hover:underline">
          should I include a note
        </Link>{" "}
        covers the invite box.
      </p>

      <h2
        id="overnight-drafts"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Overnight drafts, not overnight sending
      </h2>
      <p>
        Finish Omentir first. Connect the LinkedIn account you are allowed to use. Write{" "}
        <Link href="/features/my-product" className="text-blue-600 hover:underline">
          My Product
        </Link>{" "}
        in two sentences a stranger would understand: who feels the pain, what result you produce, what you will not claim. A vague brief produces notes you will be ashamed to send from your own name.
      </p>
      <p>
        In Grok Bot, open Settings, then Plugins. Add{" "}
        <span className="font-mono text-sm">https://omentir.com/api/agent/v1/mcp</span>
        . Approve Connect workspace. Put this in the Bot description and leave it there: research and draft only. Never send. Never enroll. Never sign into LinkedIn.
      </p>
      <p>
        If the Bot asks you to take over the computer for a LinkedIn password, passkey, two-factor code, or CAPTCHA, refuse. All of your Bots share one computer. A LinkedIn session there is shared too. A VM clicking Connect is how people get restricted. Screenshots live on the{" "}
        <Link href="/integrations/grok-bot" className="text-blue-600 hover:underline">
          Grok Bot integration
        </Link>{" "}
        page.
      </p>

      <h2
        id="the-prompt"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        A job spec that produces notes you can send
      </h2>
      <p>
        Give it a job, not a mood. Replace the brackets. Keep the last two sentences.
      </p>
      <PromptCopyBox prompt={GROK_BOT_COLD_DM_PROMPT} />
      <p>
        Thirty is enough to judge whether the ICP is real. Four hundred is a pile you will skim. If the Bot wants to broaden titles because the first list was thin, fix targeting. Do not reward it with a wider net.
      </p>
      <p>
        Steal Customers is a useful second source once the classic finder is stable: competitor posts, public commenters, a note that can name the actual thread. Create it from Grok Bot the same way, with URLs you picked, not logos the model guessed. Details are on{" "}
        <Link href="/features/steal-customers" className="text-blue-600 hover:underline">
          Steal Customers
        </Link>
        .
      </p>

      <h2
        id="morning-edit"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Morning edit, then a small campaign
      </h2>
      <p>
        Open Omentir. Read the people, not the Bot&apos;s summary. Reject patterns: agencies posing as SaaS, students, the wrong country, anyone already in a sequence. Edit a few drafts so they sound like you out loud. Cut the compliment. Leave one observation and one question.
      </p>
      <p>
        Then start a small campaign with conservative daily limits and send windows in the prospect&apos;s timezone. Human pacing is in{" "}
        <Link href="/features/linkedin-account-safety" className="text-blue-600 hover:underline">
          account safety
        </Link>{" "}
        and{" "}
        <Link href="/features/campaigns-and-send-windows" className="text-blue-600 hover:underline">
          send windows
        </Link>
        . A quiet account that suddenly fires a day of notes in twenty minutes still looks like a bot, even if Grok Bot wrote beautiful sentences.
      </p>
      <p>
        Measure meetings, not how many notes the Bot wrote while you slept. If accepts drop, tighten targeting. Do not raise volume to compensate for a weak promise.
      </p>

      <h2
        id="replies"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Replies are a stop, not a step
      </h2>
      <p>
        Message automation that cannot see an inbound reply will keep talking. That is the classic double-send. Replies should hit the{" "}
        <Link href="/features/unified-inbox" className="text-blue-600 hover:underline">
          unified inbox
        </Link>
        . Pause that person. Read the thread. Approve or rewrite the next sentence. Book the call yourself.
      </p>
      <p>
        Grok Bot can draft a follow-up overnight for people who never answered. It should not keep pitching someone who already asked a pricing question. If you cannot give the inbox fifteen minutes, you do not have a cold messaging motion. You have a generator.
      </p>
      <p>
        The product-shaped version of this loop is{" "}
        <Link href="/use-cases/grok-bot-cold-messaging" className="text-blue-600 hover:underline">
          automate cold LinkedIn messages with Grok Bot
        </Link>
        . The broader sales split, if you wanted the overnight researcher story rather than the DM craft, is{" "}
        <Link href="/use-cases/grok-bot-outbound" className="text-blue-600 hover:underline">
          get LinkedIn sales with Grok Bot
        </Link>
        .
      </p>

      <h2
        id="when-to-skip"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        When this is the wrong motion
      </h2>
      <p>
        Skip it on a new or recently recovered LinkedIn account. Skip it if you cannot sit with a review list. Skip it if you wanted grok.com chat: that is the{" "}
        <Link href="/integrations/grok" className="text-blue-600 hover:underline">
          Grok integration
        </Link>
        , not Grok Bot. Skip a second operator (Claude plus ChatGPT plus Grok Bot) until one of them is a habit.
      </p>
      <p>
        If email is the only channel that works for you, solve email. Omentir will not rotate domains or warm inboxes. Grok Bot can draft an email. It should not pretend a LinkedIn workspace is Instantly.
      </p>
      <p>
        If you already have Grok Bot and you only needed the connect steps, start with{" "}
        <Link href="/help/how-do-i-automate-cold-messaging-with-grok-bot" className="text-blue-600 hover:underline">
          how do I automate cold messaging with Grok Bot
        </Link>
        . If you are shopping operators,{" "}
        <Link href="/blogs/grok-bot-vs-chatgpt-for-outbound" className="text-blue-600 hover:underline">
          Grok Bot versus ChatGPT for outbound
        </Link>{" "}
        is the comparison.
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
