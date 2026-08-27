import Link from "next/link";
import { PromptCopyBox } from "../../grok-bot-setup-block";
import { HERMES_DRAFT_PROMPT } from "../../chat-only-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Hermes for LinkedIn drafts - Omentir",
  description:
    "Use a local Hermes chat to score pasted Omentir lead JSON on your machine. Treat lead text as untrusted data. There is no Hermes connector. Send from the workspace.",
  path: "/blogs/hermes-linkedin-drafts",
  image: {
    url: "/hermes-linkedin-drafts.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Hermes for LinkedIn drafts",
  },
  keywords: ["Hermes LinkedIn", "Nous Hermes outreach", "local LLM LinkedIn drafts"],
});

const faqItems = [
  {
    question: "Can Hermes connect to Omentir?",
    answer: "Not as a supported path. OpenClaw can use a Bearer key. Hermes here is a paste.",
  },
  {
    question: "Is this safer because it is local?",
    answer: "The JSON stays on the machine. It does not make unsupervised sending safe.",
  },
  {
    question: "Should I fine-tune on my sent mail?",
    answer: "Not for this job. A small paste and a last read will beat a half-trained clone of old pitches.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Hermes for LinkedIn drafts"
      description="Use a local Hermes chat to score pasted Omentir lead JSON on your machine. Treat lead text as untrusted data. There is no Hermes connector. Send from the workspace."
      slug="hermes-linkedin-drafts"
      bannerSrc="/hermes-linkedin-drafts.avif"
      bannerAlt="Editorial banner for Hermes for LinkedIn drafts"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={[
        { id: "untrusted", label: "Lead text is untrusted", level: 1 },
        { id: "prompt", label: "Paste this into Hermes", level: 1 },
        { id: "faqs", label: "FAQs", level: 1 },
      ]}
    >
      <p>
        Hermes is useful when you already run a local chat on Nous-style weights and you want lead JSON to stay on the machine. Paste an export from{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>
        . Ask for fit, evidence, risk, and a two-sentence draft. If a title says ignore previous instructions, it is still a title.
      </p>
      <p>
        This is not{" "}
        <Link href="/help/how-do-i-connect-openclaw-to-omentir" className="text-blue-600 hover:underline">
          OpenClaw
        </Link>
        . OpenClaw can call Omentir with a key. Hermes here is a paste. Do not store API keys in the chat. Help:{" "}
        <Link href="/help/can-i-use-hermes-for-linkedin-outreach" className="text-blue-600 hover:underline">
          can I use Hermes for LinkedIn outreach
        </Link>
        .
      </p>
      <h2
        id="untrusted"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Lead text is untrusted
      </h2>
      <p>
        A local model does not give you MCP tools. If you wanted tools, use Cursor, Claude Code, Codex, OpenClaw, or a hosted connector. If you are not already running Hermes, start in Overview.
      </p>
      <h2
        id="prompt"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Paste this into Hermes
      </h2>
      <PromptCopyBox prompt={HERMES_DRAFT_PROMPT} label="Paste into Hermes" />
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
