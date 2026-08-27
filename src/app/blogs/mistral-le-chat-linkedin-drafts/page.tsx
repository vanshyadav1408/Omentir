import Link from "next/link";
import { PromptCopyBox } from "../../grok-bot-setup-block";
import { MISTRAL_DRAFT_PROMPT } from "../../chat-only-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Mistral Le Chat for LinkedIn drafts - Omentir",
  description:
    "Use Le Chat for a plain first LinkedIn note you would send from your own name. There is no Omentir connector. Hosting in Europe does not connect the workspace.",
  path: "/blogs/mistral-le-chat-linkedin-drafts",
  image: {
    url: "/mistral-le-chat-linkedin-drafts.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Mistral Le Chat for LinkedIn drafts",
  },
  keywords: ["Mistral Le Chat LinkedIn", "Le Chat outreach", "Mistral sales messages"],
});

const faqItems = [
  {
    question: "Can Le Chat connect to Omentir?",
    answer: "Not as a supported path. Draft in Le Chat. Send in Omentir.",
  },
  {
    question: "Does European hosting change outbound?",
    answer: "It is a hosting choice. It does not make a vague note specific.",
  },
  {
    question: "Should I use Mistral inside Cursor instead?",
    answer: "If the work is already in Cursor, use the Cursor MCP path.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Mistral Le Chat for LinkedIn drafts"
      description="Use Le Chat for a plain first LinkedIn note you would send from your own name. There is no Omentir connector. Hosting in Europe does not connect the workspace."
      slug="mistral-le-chat-linkedin-drafts"
      bannerSrc="/mistral-le-chat-linkedin-drafts.avif"
      bannerAlt="Editorial banner for Mistral Le Chat for LinkedIn drafts"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={[
        { id: "plain", label: "Keep it plain", level: 1 },
        { id: "prompt", label: "Paste this into Le Chat", level: 1 },
        { id: "faqs", label: "FAQs", level: 1 },
      ]}
    >
      <p>
        Le Chat is useful when you want a short note without startup hype. Paste a trigger from{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>
        . Ask for two sentences you would send from your own name. If Le Chat cannot see a trigger, it should say so, not invent one.
      </p>
      <p>
        There is no workspace approval screen. Connected chats are ChatGPT, Claude, and grok.com. Help:{" "}
        <Link href="/help/can-i-use-mistral-le-chat-for-linkedin-outreach" className="text-blue-600 hover:underline">
          can I use Mistral Le Chat for LinkedIn outreach
        </Link>
        .
      </p>
      <h2
        id="plain"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Keep it plain
      </h2>
      <p>
        A privacy-conscious host does not change LinkedIn caps. You still review. You still send from Omentir. If the work is already in Cursor, stay in Cursor.
      </p>
      <h2
        id="prompt"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Paste this into Le Chat
      </h2>
      <PromptCopyBox prompt={MISTRAL_DRAFT_PROMPT} label="Paste into Le Chat" />
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
