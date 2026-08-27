import Link from "next/link";
import { PromptCopyBox } from "../../grok-bot-setup-block";
import { SARVAM_DRAFT_PROMPT } from "../../chat-only-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Sarvam for LinkedIn drafts - Omentir",
  description:
    "Use Sarvam for India-first LinkedIn notes in the language the buyer actually posts in. Do not polish them into US English. There is no Sarvam connector. Send from Omentir.",
  path: "/blogs/sarvam-linkedin-drafts",
  image: {
    url: "/sarvam-linkedin-drafts.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Sarvam for LinkedIn drafts",
  },
  keywords: ["Sarvam LinkedIn", "Sarvam AI outreach", "India LinkedIn drafts"],
});

const faqItems = [
  {
    question: "Can Sarvam connect to Omentir?",
    answer: "Not as a supported path. Draft in Sarvam. Send in Omentir.",
  },
  {
    question: "Should every India lead get a Hindi note?",
    answer: "No. Write in the language they actually post in. Many post in English.",
  },
  {
    question: "Does this replace My Product?",
    answer: "No. Write the offer in the same language you will send.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Sarvam for LinkedIn drafts"
      description="Use Sarvam for India-first LinkedIn notes in the language the buyer actually posts in. Do not polish them into US English. There is no Sarvam connector. Send from Omentir."
      slug="sarvam-linkedin-drafts"
      bannerSrc="/sarvam-linkedin-drafts.avif"
      bannerAlt="Editorial banner for Sarvam for LinkedIn drafts"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={[
        { id: "india", label: "India-first, not translated", level: 1 },
        { id: "prompt", label: "Paste this into Sarvam", level: 1 },
        { id: "faqs", label: "FAQs", level: 1 },
      ]}
    >
      <p>
        Sarvam is useful when the buyer is in India and posts in Hindi, Tamil, or another language you actually want to write in. Paste the profile from{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>
        . Ask for two sentences in that language. Do not switch to English for polish. US-market metaphors that do not apply will show.
      </p>
      <p>
        There is no connector. Caps still apply on the LinkedIn account you connected. Help:{" "}
        <Link href="/help/can-i-use-sarvam-for-linkedin-outreach" className="text-blue-600 hover:underline">
          can I use Sarvam for LinkedIn outreach
        </Link>
        .
      </p>
      <h2
        id="india"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        India-first, not translated
      </h2>
      <p>
        If your send-from profile is English-only and the buyer is not, say that before you start. Keep the finder in a connected operator if you have one. Use Sarvam for the language pass on that list.
      </p>
      <h2
        id="prompt"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Paste this into Sarvam
      </h2>
      <PromptCopyBox prompt={SARVAM_DRAFT_PROMPT} label="Paste into Sarvam" />
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
