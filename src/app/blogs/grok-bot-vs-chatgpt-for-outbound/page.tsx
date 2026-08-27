import Link from "next/link";
import GrokBotSetupBlock from "../../grok-bot-setup-block";
import { GROK_BOT_FIRST_JOB_PROMPT } from "../../grok-bot-setup";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Grok Bot vs ChatGPT for outbound - Omentir",
  description:
    "Grok Bot keeps working overnight on a shared cloud computer. ChatGPT is a session you watch. Both can talk to Omentir over MCP. Neither should log into LinkedIn. Pick the operator you will actually read.",
  path: "/blogs/grok-bot-vs-chatgpt-for-outbound",
  image: {
    url: "/grok-bot-vs-chatgpt-for-outbound.avif",
    width: 1536,
    height: 1024,
    alt: "Editorial banner for Grok Bot versus ChatGPT for outbound",
  },
  keywords: [
    "Grok Bot vs ChatGPT",
    "Grok Bot vs ChatGPT sales",
    "Grok Bot vs ChatGPT outbound",
    "ChatGPT or Grok Bot for LinkedIn",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "quick-split", label: "The split that matters", level: 1 },
  { id: "chatgpt", label: "Where ChatGPT fits outbound", level: 1 },
  { id: "grok-bot", label: "Where Grok Bot fits outbound", level: 1 },
  { id: "same-send-path", label: "The send path is the same", level: 1 },
  { id: "start-tonight", label: "If you picked Grok Bot, start tonight", level: 1 },
  { id: "pick-one", label: "Pick one operator", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "Is Grok Bot better than ChatGPT for sales?",
    answer:
      "Not as a model ranking. Grok Bot is better when you want overnight research on a persistent computer. ChatGPT is better when you want a session you sit with. LinkedIn send still belongs in Omentir either way.",
  },
  {
    question: "Can I run both?",
    answer:
      "You can. You should not on day one. Two review lists you never read are worse than one you finish. Pick the operator you will actually watch.",
  },
  {
    question: "Is Grok Bot the same as grok.com?",
    answer:
      "No. grok.com is a chat connector, closer to ChatGPT's connector path. Grok Bot is a separate app with Plugins and a cloud computer.",
  },
  {
    question: "Which one should a founder start with?",
    answer:
      "Most founders should start in Omentir Overview with no extra operator. Add ChatGPT if that is already where you work. Add Grok Bot only if you already pay for a plan that includes it.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Grok Bot vs ChatGPT for outbound"
      description="Grok Bot keeps working overnight on a shared cloud computer. ChatGPT is a session you watch. Both can talk to Omentir over MCP. Neither should log into LinkedIn. Pick the operator you will actually read."
      slug="grok-bot-vs-chatgpt-for-outbound"
      bannerSrc="/grok-bot-vs-chatgpt-for-outbound.avif"
      bannerAlt="Editorial banner for Grok Bot versus ChatGPT for outbound"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        The useful answer to Grok Bot versus ChatGPT for outbound is not which model is smarter this month. It is which job you are hiring, and whether you will read the output.
      </p>
      <p>
        <a href="https://chatgpt.com/" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          ChatGPT
        </a>{" "}
        is a conversation you sit with. You paste a connector, approve a workspace, and watch the tools.{" "}
        <a href="https://x.ai/bot" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          Grok Bot
        </a>{" "}
        is a named teammate on a persistent cloud computer. You give it a job. It keeps working after you close the laptop. Those are different machines that happen to share a category name.
      </p>
      <p>
        Neither one should log into LinkedIn.{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>{" "}
        is the send path for both: My Product, finders, campaigns, caps, inbox. The operator talks to Omentir over MCP. LinkedIn stays on the Omentir side.
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
              <th className="px-4 py-3 font-semibold">ChatGPT</th>
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
              <td className="px-4 py-3">Mostly bad drafts if you skip review</td>
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
        grok.com chat sits closer to ChatGPT than to Grok Bot. Same idea: a conversation, a connector, no persistent VM. If you landed here from grok.com, use the{" "}
        <Link href="/integrations/grok" className="text-blue-600 hover:underline">
          Grok integration
        </Link>
        . If you meant the Bot app, use{" "}
        <Link href="/integrations/grok-bot" className="text-blue-600 hover:underline">
          Grok Bot
        </Link>
        . Mixing those two pages is how people paste the wrong setup.
      </p>

      <h2
        id="chatgpt"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Where ChatGPT fits outbound
      </h2>
      <p>
        ChatGPT is strongest when you are still deciding. Define the ICP. Inspect messy lead notes. Rewrite a weak first line. Role-play an objection before a campaign goes live. Ask it to run get_context and list_agents before it creates anything.
      </p>
      <p>
        It is a poor unattended operator. Close the tab and the work stops. That is a feature if you are not ready to trust a night run. It is a gap if you wanted a review list by morning without sitting there.
      </p>
      <p>
        The draft failure mode is the same as every other model. Generic compliments. Invented pain. Notes that could fit a dentist and a datacenter. Paste a real trigger. Cut until it sounds like you.{" "}
        <Link href="/help/can-i-use-chatgpt-to-write-linkedin-messages" className="text-blue-600 hover:underline">
          Can I use ChatGPT to write LinkedIn messages
        </Link>{" "}
        is the short version. Setup is the{" "}
        <Link href="/integrations/chatgpt" className="text-blue-600 hover:underline">
          ChatGPT integration
        </Link>
        .
      </p>

      <h2
        id="grok-bot"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Where Grok Bot fits outbound
      </h2>
      <p>
        Grok Bot is strongest when the job is overnight and the deliverable is a list. Pull a segment. Skip anyone already in a sequence. Score the rest. Attach a reason. Draft a note. Stop. SpaceXAI&apos;s own sales example already uses that shape.
      </p>
      <p>
        Access sits on SuperGrok Heavy, Cursor Ultra, or Cursor Teams Premium. The product is in beta. Linux desktop is not currently in SpaceXAI&apos;s get-started docs. Do not buy those plans only to avoid reading your pipeline. If you already have them, the Bot is a reasonable extra operator on top of Omentir.
      </p>
      <p>
        The extra risk is computer use. Grok Bot can click websites with no API. For an internal dashboard, that can be fine. For LinkedIn, a cloud VM clicking Connect is the fingerprint LinkedIn already looks for. When it asks you to take over for a password or CAPTCHA, refuse. Point it at MCP. Help:{" "}
        <Link href="/help/is-it-safe-to-let-grok-bot-log-into-linkedin" className="text-blue-600 hover:underline">
          is it safe to let Grok Bot log into LinkedIn
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
        Both operators hit the same MCP URL:{" "}
        <span className="font-mono text-sm">https://omentir.com/api/agent/v1/mcp</span>
        . Both should list existing agents before they create one. Both should show you targeting before they save. Both still send through Omentir campaigns with daily caps and send windows.
      </p>
      <p>
        ChatGPT uses Settings, then Connectors. Grok Bot uses Settings, then Plugins. Grok Bot shares MCP authentication with Cursor, so a team allowlist has to include that URL. ChatGPT&apos;s connector approval is its own flow. Neither path needs you to paste a LinkedIn password into the chat app.
      </p>
      <p>
        If the copy is bad, that is My Product and the ICP, not which logo you connected. Fix the brief. Do not switch operators to escape a vague offer.
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
        If you already live in ChatGPT and you can sit with a batch this afternoon, stay there. If you already pay for a Grok Bot plan and you want a review list by morning, use the Bot. If you have neither, start in Omentir Overview. The operator is optional. The workspace is not.
      </p>
      <p>
        Do not run Claude plus ChatGPT plus Grok Bot on week one. Connect paths are cheap to add and expensive to babysit. One unread overnight run is a more expensive way to ignore your pipeline.
      </p>
      <p>
        Other neighbors:{" "}
        <Link href="/blogs/grok-bot-vs-claude-for-outbound" className="text-blue-600 hover:underline">
          Grok Bot versus Claude for outbound
        </Link>{" "}
        if Claude is the session you already sit with,{" "}
        <Link href="/blogs/openclaw-vs-chatgpt-sales" className="text-blue-600 hover:underline">
          OpenClaw versus ChatGPT for sales
        </Link>{" "}
        if you wanted a local runtime, and{" "}
        <Link href="/alternatives/grok-bot" className="text-blue-600 hover:underline">
          Grok Bot alternatives
        </Link>{" "}
        if you wanted overnight research without the Bot plan. The Grok Bot sales motion is{" "}
        <Link href="/blogs/grok-bot-for-sales" className="text-blue-600 hover:underline">
          Grok Bot for sales
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
