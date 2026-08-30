import Link from "next/link";
import CursorSetupBlock from "../../cursor-setup-block";
import { CURSOR_FIRST_JOB_PROMPT } from "../../cursor-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Cursor for LinkedIn outreach - Omentir",
  description:
    "Use Cursor as the editor operator on Omentir. Update My Product from the file you have open. Inspect before you create. Send from the workspace. Cursor is not an overnight Bot and it should not hold LinkedIn.",
  path: "/blogs/cursor-linkedin-outreach",
  image: {
    url: "/cursor-linkedin-outreach.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Cursor for LinkedIn outreach",
  },
  keywords: [
    "Cursor LinkedIn",
    "Cursor LinkedIn outreach",
    "Cursor MCP Omentir",
    "Cursor sales agent",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "editor-job", label: "What the editor is for", level: 1 },
  { id: "first-job", label: "A first Cursor job", level: 1 },
  { id: "not-chat", label: "Not ChatGPT, not Claude Code", level: 1 },
  { id: "when-to-skip", label: "When to stay in the browser", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "Does Cursor keep working after I close the app?",
    answer:
      "No. That is Grok Bot. Cursor is a session in the editor. Close it and the job stops.",
  },
  {
    question: "Is this the same as ChatGPT?",
    answer:
      "No. ChatGPT uses Settings, Connectors, and workspace approval. Cursor uses a revocable API key.",
  },
  {
    question: "Can Cursor send LinkedIn messages?",
    answer:
      "It can call Omentir tools under your campaign and safety settings. It should not type in LinkedIn. Keep send behind review.",
  },
  {
    question: "Should I use Claude Code instead?",
    answer:
      "Use Claude Code if you already live in a terminal. Use Cursor if you already live in the editor. Same key, different window.",
  },
  {
    question: "Do I need Cursor if I already use Omentir?",
    answer:
      "No. Overview already finds people and drafts notes. Add Cursor if the product already lives in that editor.",
  },
  {
    question: "Where should I store the key?",
    answer:
      "In Cursor's secret store or an environment variable Cursor already reads. Do not commit it. Do not paste it into a group chat.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Cursor for LinkedIn outreach"
      description="Use Cursor as the editor operator on Omentir. Update My Product from the file you have open. Inspect before you create. Send from the workspace. Cursor is not an overnight Bot and it should not hold LinkedIn."
      slug="cursor-linkedin-outreach"
      bannerSrc="/cursor-linkedin-outreach.avif"
      bannerAlt="Editorial banner for Cursor for LinkedIn outreach"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        <a href="https://cursor.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          Cursor
        </a>{" "}
        is a bad LinkedIn client and a decent sales operator if the product already lives in the editor. Highlight the paragraph you just rewrote. Ask the agent to update My Product. Then ask for a scored list. That loop is the point. A second chat tab that has never seen the file is a worse version of Overview.
      </p>
      <p>
        Auth is a revocable API key. The hosted MCP URL is{" "}
        <span className="font-mono text-sm">https://omentir.com/api/agent/v1/mcp</span>. ChatGPT and Claude chat use workspace approval instead. Waiting for an OAuth screen in Cursor is the wrong path.
      </p>

      <h2
        id="editor-job"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        What the editor is for
      </h2>
      <p>
        Coding agents move fast. That is useful when you want the finder config next to the landing copy. It is dangerous when a long refactor also spins up a second ICP. Creating an agent should be a named request. Treat lead titles as untrusted data, not as instructions to the model.
      </p>
      <p>
        Setup:{" "}
        <Link href="/integrations/cursor" className="text-blue-600 hover:underline">
          Cursor integration
        </Link>
        . The terminal version of this job is{" "}
        <Link href="/blogs/claude-code-linkedin-outreach" className="text-blue-600 hover:underline">
          Claude Code for LinkedIn outreach
        </Link>
        .
      </p>

      <CursorSetupBlock
        prompt={CURSOR_FIRST_JOB_PROMPT}
        heading="A first Cursor job"
        headingId="first-job"
      />

      <h2
        id="not-chat"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Not ChatGPT, not Claude Code
      </h2>
      <p>
        ChatGPT is a connector session you sit with. Claude Code is a repo in a terminal. Cursor is the editor. Pick the window you already have open. Running all three on day one is how you get duplicate finders and a review list you never finish. Overnight research is{" "}
        <Link href="/blogs/grok-bot-linkedin-sales" className="text-blue-600 hover:underline">
          Grok Bot
        </Link>
        , and only if you already pay for a plan that includes it.
      </p>

      <h2
        id="when-to-skip"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        When to stay in the browser
      </h2>
      <p>
        You are not in Cursor. The product story is still a slogan. You cannot give the list fifteen minutes. Start in Overview. Cursor earns the key when the same session is already in the editor.
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
