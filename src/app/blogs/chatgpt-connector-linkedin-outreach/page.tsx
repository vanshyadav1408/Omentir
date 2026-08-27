import Link from "next/link";
import { PromptCopyBox } from "../../grok-bot-setup-block";
import { CHATGPT_FIRST_JOB_PROMPT } from "../../chatgpt-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "ChatGPT connector for LinkedIn outreach - Omentir",
  description:
    "Connect ChatGPT to Omentir with a custom MCP connector. No API key. Draft in the tab. Send from the workspace. This is not Codex, not Cursor, and not an overnight Bot.",
  path: "/blogs/chatgpt-connector-linkedin-outreach",
  image: {
    url: "/chatgpt-connector-linkedin-outreach.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for ChatGPT connector for LinkedIn outreach",
  },
  keywords: [
    "ChatGPT MCP Omentir",
    "ChatGPT connector LinkedIn",
    "ChatGPT LinkedIn outreach MCP",
  ],
});

const faqItems = [
  {
    question: "Is this the same as the ChatGPT LinkedIn leads post?",
    answer:
      "That post is about using ChatGPT as a reasoning layer on pasted research. This post is the MCP connector: tools against the workspace.",
  },
  {
    question: "Do I need an API key?",
    answer: "No. Chat connectors use workspace approval. Codex and Cursor use a key.",
  },
  {
    question: "Does ChatGPT keep working after I close the tab?",
    answer: "No. Overnight is Grok Bot.",
  },
  {
    question: "Can it send LinkedIn messages?",
    answer:
      "It can call Omentir tools under your campaign and safety settings. Keep send behind review.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="ChatGPT connector for LinkedIn outreach"
      description="Connect ChatGPT to Omentir with a custom MCP connector. No API key. Draft in the tab. Send from the workspace. This is not Codex, not Cursor, and not an overnight Bot."
      slug="chatgpt-connector-linkedin-outreach"
      bannerSrc="/chatgpt-connector-linkedin-outreach.avif"
      bannerAlt="Editorial banner for ChatGPT connector for LinkedIn outreach"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={[
        { id: "connector", label: "The connector, not a paste", level: 1 },
        { id: "first-job", label: "A first ChatGPT session", level: 1 },
        { id: "not-codex", label: "Not Codex, not Cursor", level: 1 },
        { id: "faqs", label: "FAQs", level: 1 },
      ]}
    >
      <p>
        Older ChatGPT posts on this site treat the model as a reasoning layer on pasted research. That job still exists. This page is the other machine: Settings, Connectors, paste{" "}
        <span className="font-mono text-sm">https://omentir.com/api/agent/v1/mcp</span>, approve Connect workspace. ChatGPT then calls{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>{" "}
        tools. It still should not hold LinkedIn.
      </p>
      <p>
        Setup:{" "}
        <Link href="/help/how-do-i-connect-chatgpt-to-omentir" className="text-blue-600 hover:underline">
          how to connect ChatGPT
        </Link>
        . Integration notes:{" "}
        <Link href="/integrations/chatgpt" className="text-blue-600 hover:underline">
          ChatGPT integration
        </Link>
        .
      </p>
      <h2
        id="connector"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        The connector, not a paste
      </h2>
      <p>
        Ask ChatGPT to explain the workspace back to you: product summary, connected account, existing agents. If that summary is wrong, fix My Product before you let it create outreach. A confident draft from a wrong profile wastes a week.
      </p>
      <h2
        id="first-job"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        A first ChatGPT session
      </h2>
      <p>
        Finish Omentir first. Enable tools in the chat. Replace the brackets. Keep the last two sentences. This session ends when you close the tab.
      </p>
      <PromptCopyBox prompt={CHATGPT_FIRST_JOB_PROMPT} label="Paste into ChatGPT" />
      <h2
        id="not-codex"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Not Codex, not Cursor
      </h2>
      <p>
        Codex stores MCP in config.toml. Cursor uses a Bearer key in the editor. ChatGPT uses workspace approval. Mixing those paths is how people paste a token into a connector UI. Overnight research is{" "}
        <Link href="/blogs/grok-bot-linkedin-sales" className="text-blue-600 hover:underline">
          Grok Bot
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
