import Link from "next/link";
import { PromptCopyBox } from "../../grok-bot-setup-block";
import { KIMI_DRAFT_PROMPT } from "../../chat-only-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Kimi for LinkedIn drafts - Omentir",
  description:
    "Use Kimi as a long-context draft helper. Paste people from Omentir. Ask it to cite only what you gave it. Send from the workspace. There is no Kimi connector.",
  path: "/blogs/kimi-linkedin-drafts",
  image: {
    url: "/kimi-linkedin-drafts.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Kimi for LinkedIn drafts",
  },
  keywords: ["Kimi LinkedIn", "Kimi Moonshot outreach", "Kimi LinkedIn drafts"],
});

const faqItems = [
  {
    question: "Can Kimi connect to Omentir?",
    answer: "Not as a supported path. Paste from Omentir. Send in Omentir.",
  },
  {
    question: "Why Kimi instead of ChatGPT?",
    answer:
      "Long context for a batch you actually pasted. ChatGPT can also call Omentir tools. Kimi cannot.",
  },
  {
    question: "How many people should I paste?",
    answer: "Twenty to thirty. A hundred unread drafts is a pile.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Kimi for LinkedIn drafts"
      description="Use Kimi as a long-context draft helper. Paste people from Omentir. Ask it to cite only what you gave it. Send from the workspace. There is no Kimi connector."
      slug="kimi-linkedin-drafts"
      bannerSrc="/kimi-linkedin-drafts.avif"
      bannerAlt="Editorial banner for Kimi for LinkedIn drafts"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={[
        { id: "job", label: "The long paste", level: 1 },
        { id: "prompt", label: "Paste this into Kimi", level: 1 },
        { id: "faqs", label: "FAQs", level: 1 },
      ]}
    >
      <p>
        Kimi is a bad LinkedIn client and a decent scoring table if you paste the batch. Long context is the specialty. It is not a reason to invent posts you did not paste, and it is not an Omentir connector.
      </p>
      <p>
        Connected chats (Claude, ChatGPT, grok.com) can run finders. Kimi cannot. Use Kimi when you already have people in{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>{" "}
        and you want one chat to hold the dump. Help:{" "}
        <Link href="/help/can-i-use-kimi-for-linkedin-outreach" className="text-blue-600 hover:underline">
          can I use Kimi for LinkedIn outreach
        </Link>
        .
      </p>
      <h2
        id="job"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        The long paste
      </h2>
      <p>
        Export or copy twenty profiles. Include the trigger you actually have: a post, a hire, a comment. Ask for fit, evidence from that text, a skip reason, and two sentences. If a note could fit two buyers, rewrite it. Then you still send from Omentir.
      </p>
      <h2
        id="prompt"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Paste this into Kimi
      </h2>
      <PromptCopyBox prompt={KIMI_DRAFT_PROMPT} label="Paste into Kimi" />
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
