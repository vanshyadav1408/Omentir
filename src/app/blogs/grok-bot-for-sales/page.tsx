import Link from "next/link";
import GrokBotSetupBlock from "../../grok-bot-setup-block";
import { GROK_BOT_FIRST_JOB_PROMPT } from "../../grok-bot-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Grok Bot for sales - Omentir",
  description:
    "What Grok Bot can own in a sales motion: overnight research, scoring, and first-touch drafts. What it cannot own: LinkedIn clicks, the live reply, and the demo. Put send in Omentir.",
  path: "/blogs/grok-bot-for-sales",
  image: {
    url: "/grok-bot-for-sales.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Grok Bot for sales",
  },
  keywords: [
    "Grok Bot for sales",
    "Grok Bot sales",
    "Grok Bot SDR",
    "Grok Bot sales outreach",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "what-you-are-hiring", label: "What you are hiring", level: 1 },
  { id: "jobs-it-can-own", label: "Sales jobs the Bot can own", level: 1 },
  { id: "jobs-it-cannot", label: "Jobs that still need a person", level: 1 },
  { id: "first-job", label: "A first overnight job", level: 1 },
  { id: "weekly-loop", label: "A weekly loop that produces meetings", level: 1 },
  { id: "cost-and-skip", label: "Cost, beta, and when to skip", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "Is Grok Bot a sales tool?",
    answer:
      "It is a general always-on agent with a cloud computer. Sales is a job you can give it. LinkedIn outbound still needs a paced send path and a human on replies. That is the Omentir job.",
  },
  {
    question: "Can Grok Bot replace an SDR?",
    answer:
      "It can cover overnight research and first-touch drafts. It does not take the meeting, run a territory, or own a forecast. Software you ignore is more expensive than a hire.",
  },
  {
    question: "Do I need Grok Bot if I already use Omentir?",
    answer:
      "No. Overview, lead finders, and the inbox work without it. Add the Bot if you already pay for a plan that includes it and you want research while you sleep.",
  },
  {
    question: "Is this grok.com?",
    answer:
      "No. grok.com is a chat connector. Grok Bot is a separate app: named Bots, Plugins, and work that continues after you close the laptop.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Grok Bot for sales"
      description="What Grok Bot can own in a sales motion: overnight research, scoring, and first-touch drafts. What it cannot own: LinkedIn clicks, the live reply, and the demo. Put send in Omentir."
      slug="grok-bot-for-sales"
      bannerSrc="/grok-bot-for-sales.avif"
      bannerAlt="Editorial banner for Grok Bot for sales"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        Sales teams will try to give{" "}
        <a href="https://x.ai/bot" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          Grok Bot
        </a>{" "}
        the whole outbound job because the pitch is an always-on teammate. Named Bots. A persistent computer. Work after you close the laptop. That is a good researcher. It is a bad LinkedIn client.
      </p>
      <p>
        SpaceXAI already uses it for sales outbound: research accounts overnight, score contacts, draft email and LinkedIn in the seller&apos;s voice, leave a review list. Their starter prompt says do not send and do not enroll anyone. If you are trying to get customers without a restriction, that last sentence is the product.
      </p>
      <p>
        This post is the sales motion, not the connect wizard. If you wanted screenshots, start at the{" "}
        <Link href="/integrations/grok-bot" className="text-blue-600 hover:underline">
          Grok Bot integration
        </Link>
        . If you wanted the cold DM craft, use{" "}
        <Link href="/blogs/automate-cold-messaging-with-grok-bot" className="text-blue-600 hover:underline">
          automate cold messaging with Grok Bot
        </Link>
        .
      </p>

      <h2
        id="what-you-are-hiring"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        What you are hiring
      </h2>
      <p>
        Grok Bot is not a packaged SDR. It is not Alice from 11x. It is not Instantly. It is a general agent that can sign into tools, call MCP where it exists, and click through sites that have no API. You assign a job. It keeps going.
      </p>
      <p>
        That architecture is useful when the job is &quot;turn this CRM view into a short brief I can read on a phone.&quot; It is dangerous when the job is &quot;log into LinkedIn and grind Connect until morning.&quot; The Bot computer is shared across every Bot on the account. A LinkedIn session there is shared too.
      </p>
      <p>
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>{" "}
        is the LinkedIn workspace:{" "}
        <Link href="/features/my-product" className="text-blue-600 hover:underline">
          My Product
        </Link>
        , lead finders, Steal Customers, paced campaigns, reply drafts. Grok Bot calls those tools over MCP. It does not become a second LinkedIn client. Put this in the Bot description: research and draft only; never send; never enroll; never sign into LinkedIn.
      </p>

      <h2
        id="jobs-it-can-own"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Sales jobs the Bot can own
      </h2>
      <p>
        Overnight work with a clear deliverable. One ICP. One source. A number you can finish in the morning.
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li>
          Refresh a segment against Omentir (or a CRM view you already trust). Skip anyone already in a sequence.
        </li>
        <li>
          Score the rest 1-5 against a written buyer: role, company size, geography, trigger, who to skip. Attach the evidence, not a vibe.
        </li>
        <li>
          Draft a first touch that cites a real signal. Two sentences. No invented customer, no fake mutual friend.
        </li>
        <li>
          Turn a messy account list into a short brief you can reject from a phone. That is the job SpaceXAI describes in the{" "}
          <a href="https://docs.x.ai/grok-bot/use-cases" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
            Grok Bot use cases
          </a>
          .
        </li>
      </ul>
      <p>
        Notice what they do not ask the Bot to own: the send, the enroll, the live conversation. Keep that split even if you are impatient. Impatience is how you buy a restriction.
      </p>
      <p>
        A second useful job, once the classic finder is stable: Steal Customers. Competitor posts, public commenters, a note that can name the actual thread. Create it from Grok Bot with URLs you picked. Details on{" "}
        <Link href="/features/steal-customers" className="text-blue-600 hover:underline">
          Steal Customers
        </Link>
        .
      </p>

      <h2
        id="jobs-it-cannot"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Jobs that still need a person
      </h2>
      <p>
        The first reply that contains a real question. A pricing exception. A custom security answer. &quot;Are you the right person?&quot; The demo. The forecast. The claim on your own name.
      </p>
      <p>
        Taste is the other gap. A Bot told to find pipeline will widen titles and invent pain. The copy is fluent. It is also how you train buyers, and LinkedIn, to ignore you. Read the people in the morning. Reject the 1s and 2s. Edit a few drafts so they sound like you.
      </p>
      <p>
        If no one answers a careful founder note, an SDR will not save you, and a Bot will not either. Run one ICP for two weeks before you talk about replacing a hire. The hire-versus-software page is{" "}
        <Link href="/use-cases/replace-first-sdr" className="text-blue-600 hover:underline">
          replace the first SDR
        </Link>
        . The short help version is{" "}
        <Link href="/help/can-grok-bot-replace-a-sales-development-rep" className="text-blue-600 hover:underline">
          can Grok Bot replace a sales development rep
        </Link>
        .
      </p>

      <GrokBotSetupBlock
        prompt={GROK_BOT_FIRST_JOB_PROMPT}
        heading="A first overnight job"
        headingId="first-job"
      />

      <h2
        id="weekly-loop"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        A weekly loop that produces meetings
      </h2>
      <p>
        Once the first list produced real conversations, make the research a routine. SpaceXAI lets you save a path the Bot followed and run it on a schedule. Keep the same stop: review list, not send.
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li>
          Overnight: one ICP, scores, drafts, stop.
        </li>
        <li>
          Morning: cut junk, edit a few notes, start or refill a campaign in Omentir with conservative daily limits.
        </li>
        <li>
          Daytime: replies in the unified inbox. Approve or rewrite. Book the call yourself.
        </li>
        <li>
          Friday: if ignores piled up, change the promise or the segment. If the Bot started inventing posts, tighten the description. Do not add a second Bot.
        </li>
      </ul>
      <p>
        Meetings come from the inbox, not from how many notes the Bot wrote while you slept. If you cannot give the review list fifteen minutes, you bought a research toy, not a sales motion. The product landing for this loop is{" "}
        <Link href="/use-cases/grok-bot-outbound" className="text-blue-600 hover:underline">
          get LinkedIn sales with Grok Bot
        </Link>
        .
      </p>

      <h2
        id="cost-and-skip"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Cost, beta, and when to skip
      </h2>
      <p>
        Grok Bot is still in beta. Access sits on SuperGrok Heavy, Cursor Ultra, or Cursor Teams Premium. Linux desktop is not currently in SpaceXAI&apos;s get-started docs. Enterprise is a waitlist. Those plans are not a rounding error. Do not buy one only to avoid reading your pipeline.
      </p>
      <p>
        Skip it if you wanted grok.com. Use the{" "}
        <Link href="/integrations/grok" className="text-blue-600 hover:underline">
          Grok integration
        </Link>
        . Skip a stack of operators until one is a habit. Connect paths are cheap to add and expensive to babysit.
      </p>
      <p>
        If you do not have Grok Bot and you still need customers this month, start in Omentir Overview. Add the Bot later if you want overnight research on top. If you are shopping other operators,{" "}
        <Link href="/alternatives/grok-bot" className="text-blue-600 hover:underline">
          Grok Bot alternatives
        </Link>{" "}
        names Claude, ChatGPT, Cursor, and Overview without a Bot. The ChatGPT comparison is{" "}
        <Link href="/blogs/grok-bot-vs-chatgpt-for-outbound" className="text-blue-600 hover:underline">
          Grok Bot versus ChatGPT for outbound
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
