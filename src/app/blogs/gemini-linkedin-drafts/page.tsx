import Link from "next/link";
import { PromptCopyBox } from "../../grok-bot-setup-block";
import { GEMINI_DRAFT_PROMPT } from "../../chat-only-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Gemini for LinkedIn drafts - Omentir",
  description:
    "Use Gemini to test whether a public snippet actually supports a LinkedIn note. There is no Omentir connector. Paste the lead. Send from the workspace. Do not log Gemini into LinkedIn.",
  path: "/blogs/gemini-linkedin-drafts",
  image: {
    url: "/gemini-linkedin-drafts.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Gemini for LinkedIn drafts",
  },
  keywords: ["Gemini LinkedIn", "Google Gemini outreach", "Gemini LinkedIn drafts"],
});

const faqItems = [
  {
    question: "Can Gemini connect to Omentir?",
    answer: "Not as a supported path. ChatGPT and Claude can. Gemini cannot.",
  },
  {
    question: "Should Gemini browse LinkedIn?",
    answer: "No. Paste a snippet you already have. A model on the site is still a bot.",
  },
  {
    question: "Why Gemini instead of ChatGPT?",
    answer:
      "You already have the public page in Gemini. ChatGPT is the better pick if you wanted MCP tools.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Gemini for LinkedIn drafts"
      description="Use Gemini to test whether a public snippet actually supports a LinkedIn note. There is no Omentir connector. Paste the lead. Send from the workspace. Do not log Gemini into LinkedIn."
      slug="gemini-linkedin-drafts"
      bannerSrc="/gemini-linkedin-drafts.avif"
      bannerAlt="Editorial banner for Gemini for LinkedIn drafts"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={[
        { id: "snippet", label: "The snippet test", level: 1 },
        { id: "prompt", label: "Paste this into Gemini", level: 1 },
        { id: "faqs", label: "FAQs", level: 1 },
      ]}
    >
      <p>
        Gemini is useful when the public page is already in the window. The job is a yes-or-no: does this snippet support a note, or should I skip. If Gemini cannot point at the line, skip. If it can, take two sentences and edit them in{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>
        .
      </p>
      <p>
        There is no Settings, Connectors path for Gemini on Omentir. Do not wait for one. Connected chats are{" "}
        <Link href="/help/how-do-i-connect-chatgpt-to-omentir" className="text-blue-600 hover:underline">
          ChatGPT
        </Link>
        , Claude, and grok.com. Help:{" "}
        <Link href="/help/can-i-use-gemini-for-linkedin-outreach" className="text-blue-600 hover:underline">
          can I use Gemini for LinkedIn outreach
        </Link>
        .
      </p>
      <h2
        id="snippet"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        The snippet test
      </h2>
      <p>
        Paste the lead and the snippet. No calendar hold. No fake mutual. If the snippet is a homepage slogan, the note will be a slogan. You still send from Omentir. Gemini should not hold LinkedIn.
      </p>
      <h2
        id="prompt"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Paste this into Gemini
      </h2>
      <PromptCopyBox prompt={GEMINI_DRAFT_PROMPT} label="Paste into Gemini" />
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
