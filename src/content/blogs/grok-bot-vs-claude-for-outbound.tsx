import Link from "next/link";
import GrokBotSetupBlock from "../../grok-bot-setup-block";
import { GROK_BOT_FIRST_JOB_PROMPT } from "../../grok-bot-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Grok Bot vs Claude for outbound - Omentir",
  description:
    "Claude is a session you sit with. Grok Bot keeps working overnight on a shared cloud computer. Both can talk to Omentir over MCP. Neither should log into LinkedIn.",
  path: "/blogs/grok-bot-vs-claude-for-outbound",
  image: {
    url: "/grok-bot-vs-claude-for-outbound.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Grok Bot versus Claude for outbound",
  },
  keywords: [
    "Grok Bot vs Claude",
    "Grok Bot vs Claude sales",
    "Grok Bot vs Claude outbound",
    "Claude or Grok Bot for LinkedIn",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "quick-split", label: "The split that matters", level: 1 },
  { id: "claude", label: "Where Claude fits outbound", level: 1 },
  { id: "grok-bot", label: "Where Grok Bot fits outbound", level: 1 },
  { id: "same-send-path", label: "The send path is the same", level: 1 },
  { id: "start-tonight", label: "If you picked Grok Bot, start tonight", level: 1 },
  { id: "pick-one", label: "Pick one operator", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "Is Grok Bot better than Claude for sales?",
    answer:
      "Not as a model ranking. Grok Bot is better when you want overnight research on a persistent computer. Claude is better when you want a session you sit with. LinkedIn send still belongs in Omentir either way.",
  },
  {
    question: "Can I run Claude and Grok Bot together?",
    answer:
      "You can. You should not on day one. Two review lists you never read are worse than one you finish. Pick the operator you will actually watch.",
  },
  {
    question: "Is Grok Bot the same as grok.com?",
    answer:
      "No. grok.com is a chat connector, closer to Claude's connector path. Grok Bot is a separate app with Plugins and a cloud computer.",
  },
  {
    question: "Does Claude have a cloud computer like Grok Bot?",
    answer:
      "The Claude connector path Omentir documents is a conversation with MCP tools. It does not get Grok Bot's shared VM. That is why Claude is the lower LinkedIn-login risk, and why it will not leave a list while you sleep.",
  },
  {
    question: "Which one should a founder start with?",
    answer:
      "Most founders should start in Omentir Overview with no extra operator. Add Claude if that is already where you work. Add Grok Bot only if you already pay for a plan that includes it.",
  },
  {
    question: "What about ChatGPT?",
    answer:
      "Same job split as Claude: a session, not an overnight computer. See Grok Bot versus ChatGPT for outbound.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Grok Bot vs Claude for outbound"
      description="Claude is a session you sit with. Grok Bot keeps working overnight on a shared cloud computer. Both can talk to Omentir over MCP. Neither should log into LinkedIn."
      slug="grok-bot-vs-claude-for-outbound"
      bannerSrc="/grok-bot-vs-claude-for-outbound.avif"
      bannerAlt="Editorial banner for Grok Bot versus Claude for outbound"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        People ask Grok Bot versus Claude as if one model should win outbound. The useful split is the machine.{" "}
        <Link href="/integrations/claude" className="text-blue-600 hover:underline">
          Claude
        </Link>{" "}
        is a conversation you watch.{" "}
        <a href="https://x.ai/bot" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          Grok Bot
        </a>{" "}
        is a named teammate on a persistent cloud computer. You give it a job. It keeps working after you close the laptop.
      </p>
      <p>
        Neither one should log into LinkedIn.{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>{" "}
        is the send path for both. The operator talks to Omentir over MCP. LinkedIn stays on the Omentir side.
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
              <th className="px-4 py-3 font-semibold">Claude</th>
              <th className="px-4 py-3 font-semibold">Grok Bot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            <tr>
              <td className="px-4 py-3">When it works</td>
              <td className="px-4 py-3">While you are in the chat</td>
              <td className="px-4 py-3">After you close the laptop</td>
            </tr>
            <tr>
              <td className="px-4 py-3">How you connect Omentir</td>
              <td className="px-4 py-3">Settings, Connectors, custom MCP URL</td>
              <td className="px-4 py-3">Settings, Plugins, same MCP URL</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Computer</td>
              <td className="px-4 py-3">No cloud VM for clicking sites</td>
              <td className="px-4 py-3">Shared cloud computer across your Bots</td>
            </tr>
            <tr>
              <td className="px-4 py-3">LinkedIn risk</td>
              <td className="px-4 py-3">Bad drafts if you skip review</td>
              <td className="px-4 py-3">Bad drafts, plus computer use if you let it log in</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Best first job</td>
              <td className="px-4 py-3">Tighten ICP, inspect a batch, rewrite a weak note</td>
              <td className="px-4 py-3">Overnight score-and-draft, stop at a review list</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Skip if</td>
              <td className="px-4 py-3">You needed unattended overnight runs</td>
              <td className="px-4 py-3">You do not already pay for the plan that includes it</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        grok.com chat sits closer to Claude than to Grok Bot. Same idea: a conversation, a connector, no persistent VM. If you landed here from grok.com, use the{" "}
        <Link href="/integrations/grok" className="text-blue-600 hover:underline">
          Grok integration
        </Link>
        . If you meant the Bot app, use{" "}
        <Link href="/integrations/grok-bot" className="text-blue-600 hover:underline">
          Grok Bot
        </Link>
        .
      </p>

      <h2
        id="claude"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Where Claude fits outbound
      </h2>
      <p>
        Claude is the operator to pick when you can sit with a batch this afternoon. Add the Omentir MCP connector, approve the workspace, ask for get_context and a list of agents, then inspect a small finder. You see the tools fire. You stop it when the targeting drifts.
      </p>
      <p>
        That is also the limit. Close the tab and the work stops. Claude will not leave thirty scored people while you sleep. If you wanted that, you wanted Grok Bot, or you wanted to run the same job yourself in Overview.
      </p>

      <h2
        id="grok-bot"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Where Grok Bot fits outbound
      </h2>
      <p>
        Grok Bot is useful when you already pay for SuperGrok Heavy, Cursor Ultra, or Cursor Teams Premium, and you want research after you close the laptop. Named Bot. One ICP. Stop at a review list. SpaceXAI&apos;s own sales example already says do not send and do not enroll anyone.
      </p>
      <p>
        The extra risk is the computer. All of your Bots share it. A LinkedIn login there is shared too. Claude does not give you that VM. Grok Bot does. If the Bot asks you to take over for a password or CAPTCHA, refuse. Setup:{" "}
        <Link href="/help/how-do-i-connect-grok-bot-to-omentir" className="text-blue-600 hover:underline">
          how to connect Grok Bot to Omentir
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
        Daily caps, send windows, and the inbox live in Omentir. Claude and Grok Bot both call the same tools. Switching operators does not raise your LinkedIn limit. It does not make a vague promise sound specific. If ignores pile up, change the brief, not the model.
      </p>
      <p>
        Grok Bot is still in beta. If you do not already have it, start in Overview or stay in Claude. Do not buy the Bot plan only to avoid reading your own list.
      </p>

      <GrokBotSetupBlock
        prompt={GROK_BOT_FIRST_JOB_PROMPT}
        heading="If you picked Grok Bot, start tonight"
        headingId="start-tonight"
      />

      <h2
        id="pick-one"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Pick one operator
      </h2>
      <p>
        If you already live in Claude and you can sit with a batch this afternoon, stay there. If you already pay for a Grok Bot plan and you want a review list by morning, use the Bot. If you have neither, start in Omentir Overview.
      </p>
      <p>
        ChatGPT is the same kind of session as Claude. That comparison is{" "}
        <Link href="/blogs/grok-bot-vs-chatgpt-for-outbound" className="text-blue-600 hover:underline">
          Grok Bot vs ChatGPT for outbound
        </Link>
        . Do not run all three on week one.
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
