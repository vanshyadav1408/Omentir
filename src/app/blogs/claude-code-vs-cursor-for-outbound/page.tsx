import Link from "next/link";
import ClaudeCodeSetupBlock from "../../claude-code-setup-block";
import { CLAUDE_CODE_FIRST_JOB_PROMPT } from "../../claude-code-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Claude Code vs Cursor for outbound - Omentir",
  description:
    "Both are coding agents with an Omentir API key. Claude Code lives in the terminal. Cursor lives in the editor. Neither should log into LinkedIn. Pick the surface you will actually watch.",
  path: "/blogs/claude-code-vs-cursor-for-outbound",
  image: {
    url: "/claude-code-vs-cursor-for-outbound.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Claude Code versus Cursor for outbound",
  },
  keywords: [
    "Claude Code vs Cursor",
    "Claude Code vs Cursor sales",
    "Cursor or Claude Code LinkedIn",
    "Claude Code vs Cursor outbound",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "quick-split", label: "The split that matters", level: 1 },
  { id: "cursor", label: "Where Cursor fits outbound", level: 1 },
  { id: "claude-code", label: "Where Claude Code fits outbound", level: 1 },
  { id: "same-send-path", label: "The send path is the same", level: 1 },
  { id: "first-job", label: "If you picked Claude Code", level: 1 },
  { id: "pick-one", label: "Pick one coding agent", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "Is Claude Code better than Cursor for sales?",
    answer:
      "Not as a model ranking. Claude Code is better when the work is already in a terminal. Cursor is better when you want the editor, diffs, and the agent in one window. LinkedIn send still belongs in Omentir.",
  },
  {
    question: "Do they use the same Omentir auth?",
    answer:
      "Yes: a revocable Bearer key on MCP or REST. Chat Claude and ChatGPT use workspace approval instead. Do not mix those.",
  },
  {
    question: "Can I run both?",
    answer:
      "You can. You should not on day one. Two coding agents creating finders is how you get duplicate ICPs. Pick the surface you will actually read.",
  },
  {
    question: "Does either one work overnight like Grok Bot?",
    answer:
      "No. Close the editor or the terminal and the session stops. Grok Bot is a different app with a cloud computer.",
  },
  {
    question: "Which one should a founder start with?",
    answer:
      "Most founders should start in Omentir Overview. Add Cursor if that is already the editor. Add Claude Code if that is already the terminal. Do not buy a new tool only to operate LinkedIn.",
  },
  {
    question: "Where are the setup pages?",
    answer:
      "Cursor integration and Claude Code integration. Same MCP URL. Different clients.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Claude Code vs Cursor for outbound"
      description="Both are coding agents with an Omentir API key. Claude Code lives in the terminal. Cursor lives in the editor. Neither should log into LinkedIn. Pick the surface you will actually watch."
      slug="claude-code-vs-cursor-for-outbound"
      bannerSrc="/claude-code-vs-cursor-for-outbound.avif"
      bannerAlt="Editorial banner for Claude Code versus Cursor for outbound"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        Claude Code versus Cursor for outbound is not which model writes a nicer DM. It is which window you already live in.{" "}
        <Link href="/integrations/cursor" className="text-blue-600 hover:underline">
          Cursor
        </Link>{" "}
        is the editor.{" "}
        <Link href="/integrations/claude-code" className="text-blue-600 hover:underline">
          Claude Code
        </Link>{" "}
        is the terminal. Both talk to Omentir with a Bearer token. Both should stop at a review list.
      </p>
      <p>
        Neither one should log into LinkedIn. Omentir holds the account, the caps, and the inbox. The coding agent calls tools. You still read the batch.
      </p>

      <h2
        id="quick-split"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        The split that matters
      </h2>
      <div className="my-6 overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-left text-sm text-zinc-800">
          <thead className="bg-[#f4f2ec] text-zinc-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Job</th>
              <th className="px-4 py-3 font-semibold">Cursor</th>
              <th className="px-4 py-3 font-semibold">Claude Code</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            <tr>
              <td className="px-4 py-3">Where you sit</td>
              <td className="px-4 py-3">Editor, diffs, inline agent</td>
              <td className="px-4 py-3">Terminal, repo session</td>
            </tr>
            <tr>
              <td className="px-4 py-3">How you connect Omentir</td>
              <td className="px-4 py-3">MCP or REST, Bearer key</td>
              <td className="px-4 py-3">MCP or REST, Bearer key</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Best first job</td>
              <td className="px-4 py-3">Inspect a finder next to the code that describes the product</td>
              <td className="px-4 py-3">Diff My Product against README, then a scored list</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Risk</td>
              <td className="px-4 py-3">A long coding session casually creating agents</td>
              <td className="px-4 py-3">A long coding session casually creating agents</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Skip if</td>
              <td className="px-4 py-3">You are not already in Cursor</td>
              <td className="px-4 py-3">You are not already in a terminal</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The risk column is the same on purpose. Coding agents move fast. Your prompt has to treat create, delete, and reply as named requests. LinkedIn send still goes through Omentir either way.
      </p>

      <h2
        id="cursor"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Where Cursor fits outbound
      </h2>
      <p>
        Pick Cursor when the product lives in the editor and you want the agent beside the file. Fetch agents.md. Call get_context. List agents before create. Keep the token in Cursor&apos;s secret store, not in a chat you will screenshot later.
      </p>

      <h2
        id="claude-code"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Where Claude Code fits outbound
      </h2>
      <p>
        Pick Claude Code when you already run the product from a terminal. Same key pattern. Same stop rule. The specialty is the loop you are already in: README, scripts, a landing page draft, then a check against My Product. Longer walkthrough:{" "}
        <Link href="/blogs/claude-code-linkedin-outreach" className="text-blue-600 hover:underline">
          Claude Code for LinkedIn outreach
        </Link>
        .
      </p>

      <h2
        id="same-send-path"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        The send path is the same
      </h2>
      <p>
        Caps, windows, and the inbox live in Omentir. Switching from Cursor to Claude Code does not raise your LinkedIn limit. It does not make a vague promise specific. If ignores pile up, change the brief.
      </p>

      <ClaudeCodeSetupBlock
        prompt={CLAUDE_CODE_FIRST_JOB_PROMPT}
        heading="If you picked Claude Code"
        headingId="first-job"
      />

      <h2
        id="pick-one"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Pick one coding agent
      </h2>
      <p>
        If you already live in Cursor, stay there. If you already live in Claude Code, stay there. If you have neither, start in Overview. Chat Claude is a different machine: Connectors, no API key for the default path. Grok Bot is a different machine again: overnight computer, Plugins.
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
