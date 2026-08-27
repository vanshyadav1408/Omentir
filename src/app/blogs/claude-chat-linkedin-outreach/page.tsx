import Link from "next/link";
import { PromptCopyBox } from "../../grok-bot-setup-block";
import { CLAUDE_CHAT_FIRST_JOB_PROMPT } from "../../claude-chat-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Claude chat for LinkedIn outreach - Omentir",
  description:
    "Use Claude on claude.com as a connector session on Omentir. Approve the workspace. Draft in the tab. Send from Omentir. This is not Claude Code and it is not an overnight Bot.",
  path: "/blogs/claude-chat-linkedin-outreach",
  image: {
    url: "/claude-chat-linkedin-outreach.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Claude chat for LinkedIn outreach",
  },
  keywords: [
    "Claude LinkedIn outreach",
    "Claude MCP Omentir",
    "claude.com sales",
    "Claude connector LinkedIn",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "chat-job", label: "What the chat tab is for", level: 1 },
  { id: "first-job", label: "A first Claude session", level: 1 },
  { id: "not-code", label: "Not Claude Code", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "Is this Claude Code?",
    answer:
      "No. Claude Code uses a Bearer key in a terminal. Claude chat uses Settings, Connectors, and workspace approval.",
  },
  {
    question: "Does Claude keep working after I close the tab?",
    answer:
      "No. Overnight on a shared computer is Grok Bot.",
  },
  {
    question: "Do I need an API key?",
    answer:
      "Not for claude.com. Coding agents need a key. Chat does not.",
  },
  {
    question: "Can Claude send LinkedIn messages?",
    answer:
      "It can call Omentir tools under your campaign and safety settings. It should not type in LinkedIn. Keep send behind review.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Claude chat for LinkedIn outreach"
      description="Use Claude on claude.com as a connector session on Omentir. Approve the workspace. Draft in the tab. Send from Omentir. This is not Claude Code and it is not an overnight Bot."
      slug="claude-chat-linkedin-outreach"
      bannerSrc="/claude-chat-linkedin-outreach.avif"
      bannerAlt="Editorial banner for Claude chat for LinkedIn outreach"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        Claude on claude.com is a session you sit with. Add the custom connector, approve Connect workspace, and ask it to read{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>{" "}
        before it creates a finder. That is useful this afternoon. It is a bad overnight researcher, and it is a worse LinkedIn client.
      </p>
      <p>
        Setup lives on the{" "}
        <Link href="/integrations/claude" className="text-blue-600 hover:underline">
          Claude integration
        </Link>{" "}
        page. The MCP URL is{" "}
        <span className="font-mono text-sm">https://omentir.com/api/agent/v1/mcp</span>. No API key for this path.
      </p>

      <h2
        id="chat-job"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        What the chat tab is for
      </h2>
      <p>
        Give Claude the ICP in the same message. If you only say find me SaaS founders, you will get a wide list. Have it show the finder config before you leave it running. Confirm send windows in Overview after. Chat operators are fast. The LinkedIn account still pays for a sloppy config.
      </p>

      <h2
        id="first-job"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        A first Claude session
      </h2>
      <p>
        Finish Omentir first. Fetch{" "}
        <a href="https://omentir.com/agents.md" className="text-blue-600 hover:underline">
          agents.md
        </a>
        . Replace the brackets. Keep the last two sentences.
      </p>
      <PromptCopyBox prompt={CLAUDE_CHAT_FIRST_JOB_PROMPT} label="Paste into Claude" />

      <h2
        id="not-code"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Not Claude Code
      </h2>
      <p>
        If the repo is already open, use{" "}
        <Link href="/blogs/claude-code-linkedin-outreach" className="text-blue-600 hover:underline">
          Claude Code
        </Link>
        . If you wanted overnight research, that is{" "}
        <Link href="/blogs/grok-bot-linkedin-sales" className="text-blue-600 hover:underline">
          Grok Bot
        </Link>
        . Most founders should start in Overview. Add Claude chat if that tab is already where the work happens. Help:{" "}
        <Link href="/help/how-do-i-connect-claude-to-omentir" className="text-blue-600 hover:underline">
          how to connect Claude
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
