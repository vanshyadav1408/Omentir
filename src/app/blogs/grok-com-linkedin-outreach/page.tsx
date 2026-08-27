import Link from "next/link";
import { PromptCopyBox } from "../../grok-bot-setup-block";
import { GROK_CHAT_FIRST_JOB_PROMPT } from "../../grok-chat-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "grok.com for LinkedIn outreach - Omentir",
  description:
    "Use grok.com as a chat connector on Omentir. It is not Grok Bot. There is no cloud computer and no Plugins. Draft in the tab. Send from the workspace. Close the tab and the work stops.",
  path: "/blogs/grok-com-linkedin-outreach",
  image: {
    url: "/grok-com-linkedin-outreach.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for grok.com for LinkedIn outreach",
  },
  keywords: [
    "grok.com LinkedIn",
    "Grok chat LinkedIn outreach",
    "Grok MCP Omentir",
    "grok.com vs Grok Bot sales",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "not-bot", label: "This is not Grok Bot", level: 1 },
  { id: "first-job", label: "A first grok.com session", level: 1 },
  { id: "when-to-skip", label: "When to pick the Bot instead", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "Is grok.com the same as Grok Bot?",
    answer:
      "No. grok.com is a chat connector. Grok Bot has Plugins and a shared cloud computer. See the help page that splits them.",
  },
  {
    question: "Does grok.com keep working after I close the tab?",
    answer:
      "No. That is Grok Bot.",
  },
  {
    question: "Can I use Plugins here?",
    answer:
      "Plugins belong to Grok Bot. grok.com uses a custom connector, like Claude.",
  },
  {
    question: "Should I let Grok log into LinkedIn?",
    answer:
      "No. If it asks you to take over for a password, refuse. Keep LinkedIn in Omentir.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="grok.com for LinkedIn outreach"
      description="Use grok.com as a chat connector on Omentir. It is not Grok Bot. There is no cloud computer and no Plugins. Draft in the tab. Send from the workspace. Close the tab and the work stops."
      slug="grok-com-linkedin-outreach"
      bannerSrc="/grok-com-linkedin-outreach.avif"
      bannerAlt="Editorial banner for grok.com for LinkedIn outreach"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        People mix up the names.{" "}
        <a href="https://grok.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          grok.com
        </a>{" "}
        is a chat tab with a custom MCP connector.{" "}
        <Link href="/blogs/grok-bot-linkedin-sales" className="text-blue-600 hover:underline">
          Grok Bot
        </Link>{" "}
        is a separate app with Plugins and a computer that keeps running after you close the laptop. This page is the chat tab.
      </p>
      <p>
        Setup:{" "}
        <Link href="/integrations/grok" className="text-blue-600 hover:underline">
          Grok integration
        </Link>
        . Paste{" "}
        <span className="font-mono text-sm">https://omentir.com/api/agent/v1/mcp</span>
        . Approve Connect workspace. No API key for this path.
      </p>

      <h2
        id="not-bot"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        This is not Grok Bot
      </h2>
      <p>
        If the Bot asks you to take over for LinkedIn, that is the computer-use product. grok.com should never need that. Keep LinkedIn inside Omentir either way. The split is{" "}
        <Link href="/help/what-is-the-difference-between-grok-bot-and-grok-com" className="text-blue-600 hover:underline">
          Grok Bot versus grok.com
        </Link>
        .
      </p>

      <h2
        id="first-job"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        A first grok.com session
      </h2>
      <p>
        Finish Omentir first. Ask for get_context, then list_agents, then a scored list. Replace the brackets. Keep the last sentences. Help:{" "}
        <Link href="/help/can-i-use-grok-com-for-linkedin-outreach" className="text-blue-600 hover:underline">
          can I use grok.com for LinkedIn outreach
        </Link>
        .
      </p>
      <PromptCopyBox prompt={GROK_CHAT_FIRST_JOB_PROMPT} label="Paste into grok.com" />

      <h2
        id="when-to-skip"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        When to pick the Bot instead
      </h2>
      <p>
        You already pay for a plan that includes Grok Bot. You will read the morning list. You want research while you sleep. If any of those is false, stay on grok.com or start in Overview. Do not add both plus Claude on day one.
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
