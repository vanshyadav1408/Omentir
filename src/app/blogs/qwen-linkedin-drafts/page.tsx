import Link from "next/link";
import { PromptCopyBox } from "../../grok-bot-setup-block";
import { QWEN_DRAFT_PROMPT } from "../../chat-only-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Qwen for LinkedIn drafts - Omentir",
  description:
    "Use Qwen when the profile is not in English and you want the note in the language they actually use. There is no Qwen connector. Send from Omentir.",
  path: "/blogs/qwen-linkedin-drafts",
  image: {
    url: "/qwen-linkedin-drafts.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Qwen for LinkedIn drafts",
  },
  keywords: ["Qwen LinkedIn", "Qwen Chinese outreach", "Tongyi LinkedIn drafts"],
});

const faqItems = [
  {
    question: "Can Qwen connect to Omentir?",
    answer: "Not as a supported path. Draft in Qwen. Send in Omentir.",
  },
  {
    question: "Should I always write in Chinese?",
    answer: "Write in the language the profile actually uses.",
  },
  {
    question: "Can I mix languages for polish?",
    answer: "No. Mixed notes look machine-made. Pick one.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Qwen for LinkedIn drafts"
      description="Use Qwen when the profile is not in English and you want the note in the language they actually use. There is no Qwen connector. Send from Omentir."
      slug="qwen-linkedin-drafts"
      bannerSrc="/qwen-linkedin-drafts.avif"
      bannerAlt="Editorial banner for Qwen for LinkedIn drafts"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={[
        { id: "language", label: "Match the profile language", level: 1 },
        { id: "prompt", label: "Paste this into Qwen", level: 1 },
        { id: "faqs", label: "FAQs", level: 1 },
      ]}
    >
      <p>
        Qwen is useful when the buyer writes in Chinese, or mixes Chinese and English, and you do not want a translated-sounding English note. Paste the profile text from{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>
        . Ask for two sentences in the language they actually use. Cite a real trigger. Do not mix for polish.
      </p>
      <p>
        There is no Omentir connector. If you wanted tools against the workspace, use Claude, ChatGPT, or grok.com. Help:{" "}
        <Link href="/help/can-i-use-qwen-for-linkedin-outreach" className="text-blue-600 hover:underline">
          can I use Qwen for LinkedIn outreach
        </Link>
        .
      </p>
      <h2
        id="language"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Match the profile language
      </h2>
      <p>
        If the account you send from is English-only and the buyer is Chinese-only, say that out loud before you start. The model will not fix a language mismatch on the profile. Caps still live in Omentir.
      </p>
      <h2
        id="prompt"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Paste this into Qwen
      </h2>
      <PromptCopyBox prompt={QWEN_DRAFT_PROMPT} label="Paste into Qwen" />
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
