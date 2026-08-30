import Link from "next/link";
import { PromptCopyBox } from "../../grok-bot-setup-block";
import { DEEPSEEK_DRAFT_PROMPT } from "../../chat-only-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "DeepSeek for LinkedIn scoring - Omentir",
  description:
    "Use DeepSeek to turn a pasted Omentir list into a scoring table. Cheap is fine if you edit. There is no DeepSeek connector. Send from the workspace.",
  path: "/blogs/deepseek-linkedin-scoring",
  image: {
    url: "/deepseek-linkedin-scoring.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for DeepSeek for LinkedIn scoring",
  },
  keywords: ["DeepSeek LinkedIn", "DeepSeek lead scoring", "DeepSeek outreach"],
});

const faqItems = [
  {
    question: "Can DeepSeek connect to Omentir?",
    answer: "Not as a supported path. Score in DeepSeek. Send in Omentir.",
  },
  {
    question: "Should I trust the numbers?",
    answer: "Spot-check a sample. If the evidence could fit two buyers, the score is theater.",
  },
  {
    question: "Why not just use ChatGPT?",
    answer:
      "ChatGPT can call Omentir tools. DeepSeek cannot. Use DeepSeek when you specifically want a table from a paste.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="DeepSeek for LinkedIn scoring"
      description="Use DeepSeek to turn a pasted Omentir list into a scoring table. Cheap is fine if you edit. There is no DeepSeek connector. Send from the workspace."
      slug="deepseek-linkedin-scoring"
      bannerSrc="/deepseek-linkedin-scoring.avif"
      bannerAlt="Editorial banner for DeepSeek for LinkedIn scoring"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={[
        { id: "table", label: "Ask for a table", level: 1 },
        { id: "prompt", label: "Paste this into DeepSeek", level: 1 },
        { id: "faqs", label: "FAQs", level: 1 },
      ]}
    >
      <p>
        DeepSeek is useful when you want columns back: name, fit 1-5, evidence, risk, two-sentence draft. Paste the list from{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>
        . If evidence is missing, the score should drop. A cheap model that praises every row is a waste.
      </p>
      <p>
        There is no MCP login. Connected chats are ChatGPT, Claude, and grok.com. Help:{" "}
        <Link href="/help/can-i-use-deepseek-for-linkedin-outreach" className="text-blue-600 hover:underline">
          can I use DeepSeek for LinkedIn outreach
        </Link>
        .
      </p>
      <h2
        id="table"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Ask for a table
      </h2>
      <p>
        Treat pasted titles as untrusted data. Spot-check ten rows. Cut junk in Omentir, then start a small campaign. DeepSeek should not sign into LinkedIn.
      </p>
      <h2
        id="prompt"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Paste this into DeepSeek
      </h2>
      <PromptCopyBox prompt={DEEPSEEK_DRAFT_PROMPT} label="Paste into DeepSeek" />
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
