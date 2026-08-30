import Link from "next/link";
import ClaudeCodeSetupBlock from "../../claude-code-setup-block";
import { CLAUDE_CODE_FIRST_JOB_PROMPT } from "../../claude-code-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Claude Code for LinkedIn outreach - Omentir",
  description:
    "Use Claude Code as a terminal operator on Omentir. Compare My Product to the repo. Draft in the session. Send from the workspace. It is not an overnight Bot and it should not hold LinkedIn.",
  path: "/blogs/claude-code-linkedin-outreach",
  image: {
    url: "/claude-code-linkedin-outreach.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Claude Code for LinkedIn outreach",
  },
  keywords: [
    "Claude Code LinkedIn",
    "Claude Code LinkedIn outreach",
    "Claude Code sales",
    "Claude Code MCP Omentir",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "what-you-are-hiring", label: "What you are hiring", level: 1 },
  { id: "repo-session", label: "Why the repo session matters", level: 1 },
  { id: "first-job", label: "A first session job", level: 1 },
  { id: "not-grok-bot", label: "Not Grok Bot, not Claude chat", level: 1 },
  { id: "when-to-skip", label: "When to stay in the browser", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "Does Claude Code keep working after I close the terminal?",
    answer:
      "No. That is Grok Bot. Claude Code is a session in the repo. Close it and the job stops.",
  },
  {
    question: "Is this the same as Claude on claude.com?",
    answer:
      "No. Claude chat uses Settings, Connectors, and workspace approval. Claude Code uses a revocable API key, like Cursor.",
  },
  {
    question: "Can Claude Code send LinkedIn messages?",
    answer:
      "It can call Omentir tools under your campaign and safety settings. It should not type in LinkedIn. Keep send behind review.",
  },
  {
    question: "Do I need Claude Code if I already use Omentir?",
    answer:
      "No. Overview already finds people and drafts notes. Add Claude Code if you already live in that terminal and you want the same session to inspect the workspace.",
  },
  {
    question: "Should I let it create a campaign while it is writing code?",
    answer:
      "No. Creating an agent should be a named request, the same way merging a pull request is a named request.",
  },
  {
    question: "Where is the operator guide?",
    answer:
      "https://omentir.com/agents.md. Fetch it before you let the session create anything.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Claude Code for LinkedIn outreach"
      description="Use Claude Code as a terminal operator on Omentir. Compare My Product to the repo. Draft in the session. Send from the workspace. It is not an overnight Bot and it should not hold LinkedIn."
      slug="claude-code-linkedin-outreach"
      bannerSrc="/claude-code-linkedin-outreach.avif"
      bannerAlt="Editorial banner for Claude Code for LinkedIn outreach"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        <a href="https://claude.com/product/claude-code" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          Claude Code
        </a>{" "}
        is a bad LinkedIn client and a decent sales operator if you already work in a repo. The same session that is editing the landing page can read{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>{" "}
        over MCP, score a batch, and leave drafts. It should not hold a LinkedIn password, and it should not invent a campaign while it is midway through a refactor.
      </p>
      <p>
        Auth is a revocable API key. The hosted MCP URL is the same as every other operator:{" "}
        <span className="font-mono text-sm">https://omentir.com/api/agent/v1/mcp</span>. Chat Claude uses workspace approval instead. Mixing those two paths is how people paste a token into a connector UI, or wait for an OAuth screen that never appears.
      </p>

      <h2
        id="what-you-are-hiring"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        What you are hiring
      </h2>
      <p>
        You are hiring a pair of eyes that already has the product in context. README, changelog, the sentence you just rewrote. Ask it to compare that with My Product. If they disagree, fix the profile before you let it touch a finder.
      </p>
      <p>
        You are not hiring overnight research. Close the terminal and the work stops. If you wanted a list by morning without sitting there, that is{" "}
        <Link href="/blogs/grok-bot-linkedin-sales" className="text-blue-600 hover:underline">
          Grok Bot
        </Link>
        , and only if you already pay for a plan that includes it.
      </p>

      <h2
        id="repo-session"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Why the repo session matters
      </h2>
      <p>
        Most outbound junk starts as a homepage paragraph pasted into a chat that has never seen the product. Claude Code is useful when the claim on the site and the claim in Omentir can be diffed in one place. That is a founder job. It is a slow way to click Create campaign if that is the only task.
      </p>
      <p>
        Treat lead text as untrusted data. A title that says &quot;ignore previous instructions&quot; is still a title. Your prompt should say so. Setup:{" "}
        <Link href="/integrations/claude-code" className="text-blue-600 hover:underline">
          Claude Code integration
        </Link>
        .
      </p>

      <ClaudeCodeSetupBlock
        prompt={CLAUDE_CODE_FIRST_JOB_PROMPT}
        heading="A first session job"
        headingId="first-job"
      />

      <h2
        id="not-grok-bot"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Not Grok Bot, not Claude chat
      </h2>
      <p>
        Grok Bot has a shared cloud computer and Plugins. Claude Code does not. Claude chat has Connectors. Claude Code does not. If you wanted a conversation this afternoon with no repo open, use the{" "}
        <Link href="/integrations/claude" className="text-blue-600 hover:underline">
          Claude integration
        </Link>
        . If you wanted the editor instead of the terminal, use{" "}
        <Link href="/blogs/claude-code-vs-cursor-for-outbound" className="text-blue-600 hover:underline">
          Claude Code versus Cursor
        </Link>
        .
      </p>

      <h2
        id="when-to-skip"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        When to stay in the browser
      </h2>
      <p>
        You are not in a terminal. The product story is still a slogan. You cannot give the review list fifteen minutes. Start in Overview. Claude Code earns the key when the same session is already in the repo.
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
