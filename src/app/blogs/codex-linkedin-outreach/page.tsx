import Link from "next/link";
import { PromptCopyBox } from "../../grok-bot-setup-block";
import {
  CODEX_CONFIG_TOML,
  CODEX_FIRST_JOB_PROMPT,
  CODEX_MCP_URL,
} from "../../codex-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Codex for LinkedIn outreach - Omentir",
  description:
    "Use OpenAI Codex as a coding agent on Omentir. Put MCP in config.toml. Keep the token in an env var. Draft in the session. Send from the workspace. Codex is not ChatGPT chat and it should not hold LinkedIn.",
  path: "/blogs/codex-linkedin-outreach",
  image: {
    url: "/codex-linkedin-outreach.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Codex for LinkedIn outreach",
  },
  keywords: [
    "Codex LinkedIn",
    "OpenAI Codex MCP",
    "Codex config.toml Omentir",
    "Codex sales outreach",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "toml-job", label: "Why the TOML file matters", level: 1 },
  { id: "config", label: "The config Codex expects", level: 1 },
  { id: "first-job", label: "A first Codex job", level: 1 },
  { id: "not-chatgpt", label: "Not ChatGPT chat", level: 1 },
  { id: "when-to-skip", label: "When to stay in the browser", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "Is Codex the same as ChatGPT for outbound?",
    answer:
      "No. ChatGPT chat uses Connectors and workspace approval. Codex uses config.toml and a Bearer env var. Same Omentir tools. Different machine.",
  },
  {
    question: "Where does the MCP config live?",
    answer:
      "Usually ~/.codex/config.toml. A project .codex/config.toml only loads for trusted projects. The table name is mcp_servers, with an underscore.",
  },
  {
    question: "Can I put the API key in the TOML file?",
    answer:
      "bearer_token_env_var wants the variable name, not the token. Pasting the key into the file is how it lands in git.",
  },
  {
    question: "Does Codex keep working after I close it?",
    answer:
      "No. Overnight on a shared computer is Grok Bot, a different product.",
  },
  {
    question: "Should I use Cursor instead?",
    answer:
      "Use Cursor if that is already the editor. Use Codex if you already run the Codex CLI or extension. Do not run both on day one.",
  },
  {
    question: "Do I need Codex if I already use Omentir?",
    answer:
      "No. Overview already finds people and drafts notes. Add Codex if that agent is already in the repo.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Codex for LinkedIn outreach"
      description="Use OpenAI Codex as a coding agent on Omentir. Put MCP in config.toml. Keep the token in an env var. Draft in the session. Send from the workspace. Codex is not ChatGPT chat and it should not hold LinkedIn."
      slug="codex-linkedin-outreach"
      bannerSrc="/codex-linkedin-outreach.avif"
      bannerAlt="Editorial banner for Codex for LinkedIn outreach"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        OpenAI Codex is a coding agent, not a LinkedIn client. If you already run it against the repo, the same session can talk to{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>{" "}
        over MCP, score a batch, and leave drafts. It should not hold a LinkedIn password. It should not invent a campaign while you are midway through a refactor.
      </p>
      <p>
        This is not the ChatGPT connector. ChatGPT uses Settings, Connectors, and workspace approval. Codex reads{" "}
        <span className="font-mono text-sm">~/.codex/config.toml</span>. Mixing those paths is how people paste a token into a chat UI, or wait for an OAuth screen that never appears.
      </p>

      <h2
        id="toml-job"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Why the TOML file matters
      </h2>
      <p>
        The CLI and the IDE extension share the same file. Get the table name wrong (mcp-servers instead of mcp_servers) and Codex ignores the block. If you paste the actual token into bearer_token_env_var, Codex treats that string as a variable name and auth fails. Put OMENTIR_API_KEY there, and export the key before you launch. Then run /mcp in the session. If the server is missing, fix that before you invent a second connect path.
      </p>
      <p>
        A project-local `.codex/config.toml` only loads for trusted projects. If tools never appear, start with the global file. Setup:{" "}
        <Link href="/integrations/codex" className="text-blue-600 hover:underline">
          Codex integration
        </Link>
        .
      </p>

      <h2
        id="config"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        The config Codex expects
      </h2>
      <p>
        Create a revocable key. Export it as <span className="font-mono text-sm">OMENTIR_API_KEY</span>. Point url at{" "}
        <span className="font-mono text-sm">{CODEX_MCP_URL}</span>. Keep send behind review.
      </p>
      <PromptCopyBox prompt={CODEX_CONFIG_TOML} label="Paste into config.toml" />

      <h2
        id="first-job"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        A first Codex job
      </h2>
      <p>
        Finish Omentir first. Fetch{" "}
        <a href="https://omentir.com/agents.md" className="text-blue-600 hover:underline">
          agents.md
        </a>
        . Start with get_context and list_agents. If you want a new finder, ask it to show the config and wait. Replace the brackets. Keep the last two sentences.
      </p>
      <PromptCopyBox prompt={CODEX_FIRST_JOB_PROMPT} label="Paste into Codex" />

      <h2
        id="not-chatgpt"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Not ChatGPT chat
      </h2>
      <p>
        If you wanted a conversation this afternoon with no repo open, use the{" "}
        <Link href="/integrations/chatgpt" className="text-blue-600 hover:underline">
          ChatGPT integration
        </Link>
        . If you wanted the editor instead of Codex, use{" "}
        <Link href="/blogs/cursor-linkedin-outreach" className="text-blue-600 hover:underline">
          Cursor for LinkedIn outreach
        </Link>
        . Overnight research is{" "}
        <Link href="/blogs/grok-bot-linkedin-sales" className="text-blue-600 hover:underline">
          Grok Bot
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
        You are not in Codex. The product story is still a slogan. You cannot give the list fifteen minutes. Start in Overview. Codex earns the key when that agent is already in the repo.
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
