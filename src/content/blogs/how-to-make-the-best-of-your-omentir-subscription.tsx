import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";

export const metadata = createPageMetadata({
  title: "How to Make the Best of Your Omentir Subscription - Omentir",
  description:
    "How to use an Omentir subscription for LinkedIn outreach: run multiple AI agents, test ICP profiles, set AI messaging, and connect Claude, ChatGPT, or Grok Bot.",
  path: "/blogs/how-to-make-the-best-of-your-omentir-subscription",
  image: {
    url: "/how-to-make-the-best-of-your-omentir-subscription.avif",
    width: 1536,
    height: 1024,
    alt: "How to make the best of your Omentir subscription with agents, ICP profiles, and AI messaging",
  },
  keywords: [
    "how to use Omentir",
    "Omentir subscription",
    "Omentir AI agents",
    "Omentir ICP",
    "Omentir AI messaging",
    "Omentir LinkedIn outreach",
    "Claude Omentir",
    "ChatGPT Omentir",
    "Grok Bot Omentir",
    "Omentir MCP",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "run-as-many-agents", label: "Run as many agents as you have hypotheses", level: 1 },
  { id: "experiment-with-icp-profiles", label: "Experiment with different ICP profiles", level: 1 },
  { id: "use-ai-messaging-settings", label: "Use the AI messaging settings", level: 1 },
  { id: "run-with-ai-tools", label: "Run Omentir from Claude, ChatGPT, or Grok Bot", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "How do I get the most out of my Omentir subscription?",
    answer:
      "Run more than one agent, give each agent its own ICP, set AI messaging instead of leaving defaults, and operate the workspace from Claude, ChatGPT, or Grok Bot. Keep LinkedIn signed in only inside Omentir.",
  },
  {
    question: "How many Omentir agents can I run on Pro?",
    answer:
      "Pro includes unlimited AI agents. They still share one LinkedIn account and one daily send budget, so extra agents split targeting and copy. They do not raise the invite cap.",
  },
  {
    question: "Should every Omentir agent use the same ICP?",
    answer:
      "No. Give each agent one buyer slice and a refuse list. If two ICPs need two offers, write that in each agent prompt instead of mixing both into My Product.",
  },
  {
    question: "What AI messaging settings should I change in Omentir?",
    answer:
      "Set campaign goal (conversations or demos), tone (professional, conversational, or direct), and reply handling (stop on first reply, continue until interest, or continue until booked). Review the first batch of connection notes and follow-ups.",
  },
  {
    question: "How do I connect Claude, ChatGPT, or Grok Bot to Omentir?",
    answer:
      "Add Omentir's MCP connector in the chat app, approve Connect workspace, then ask the model to list existing agents before creating anything. Do not put your LinkedIn password in those tools.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="How to Make the Best of Your Omentir Subscription"
      description="How to use an Omentir subscription for LinkedIn outreach: run multiple AI agents, test ICP profiles, set AI messaging, and connect Claude, ChatGPT, or Grok Bot."
      slug="how-to-make-the-best-of-your-omentir-subscription"
      bannerSrc="/how-to-make-the-best-of-your-omentir-subscription.avif"
      bannerAlt="How to make the best of your Omentir subscription with agents, ICP profiles, and AI messaging"
      bannerAspectRatio="3/2"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        An Omentir subscription is wasted if you run one mixed LinkedIn campaign.{" "}
        <Link href="/pricing" className="text-blue-600 hover:underline">
          Omentir Pro
        </Link>{" "}
        includes unlimited AI agents for lead discovery and outreach. Use more than one agent, test separate ICP profiles, set AI messaging on purpose, and operate the workspace from Claude, ChatGPT, or Grok Bot. Keep a human on the send path.
      </p>

      <h2
        id="run-as-many-agents"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Run as many agents as you have hypotheses
      </h2>
      <p>
        One Omentir agent aimed at "founders, VPs, and ops leads in SaaS" produces a mixed LinkedIn queue you cannot learn from. Create a separate agent for each bet, for example, Series A founders who just hired an SDR, or heads of growth at 20 to 80 person B2B tools. Each agent keeps its own titles, locations, prompt, and lead group. For the first setup, see{" "}
        <Link href="/blogs/setup-autonomous-prospecting-agent" className="text-blue-600 hover:underline">
          how to set up an autonomous prospecting agent
        </Link>
        .
      </p>
      <p>
        You still share one LinkedIn account and one daily send budget. More Omentir agents does not mean more invites. It means cleaner lists. Kill an agent after a week if the accepts come from people who cannot buy.
      </p>

      <h2
        id="experiment-with-icp-profiles"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Experiment with different ICP profiles
      </h2>
      <p>
        Write the{" "}
        <Link href="/blogs/icp-based-lead-discovery" className="text-blue-600 hover:underline">
          ICP
        </Link>{" "}
        in the agent&apos;s own words, not a slogan. Include who you refuse: students, consultants reselling your category, companies too small to pay. Change one slice at a time. If you swap title, industry, and geography together, you will not know which change moved replies.
      </p>
      <p>
        My Product is the shared description of what you sell. Omentir agents inherit that. If two ICP profiles need two offers, say so in each agent prompt instead of stuffing both into one product blurb.
      </p>

      <h2
        id="use-ai-messaging-settings"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Use the AI messaging settings
      </h2>
      <p>
        Do not leave the Omentir AI messaging defaults if they do not match how you talk. Campaign goal is either start conversations or book demos. Tone is professional, conversational, or direct. When a lead replies you can stop immediately, let AI continue until interest, or continue until a meeting is booked. That last option needs a calendar link.
      </p>
      <p>
        Connection notes, first messages, and follow-ups can be AI-written or pasted by you. Review the first batch. If drafts mention pain the profile never showed, tighten the prompt. Daily LinkedIn quotas still apply. Settings change the copy, not the invite limits.
      </p>

      <h2
        id="run-with-ai-tools"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Run Omentir from Claude, ChatGPT, or Grok Bot
      </h2>
      <p>
        Omentir has an{" "}
        <Link href="/integrations/mcp" className="text-blue-600 hover:underline">
          MCP connector
        </Link>
        , so an agent you already pay for can operate the workspace: read context, create lead finders, inspect leads, check the send schedule. Connect{" "}
        <a href="https://claude.ai/" target="_blank" rel="noopener dofollow" className="text-blue-600 hover:underline">
          Claude
        </a>
        ,{" "}
        <a href="https://chatgpt.com/" target="_blank" rel="noopener dofollow" className="text-blue-600 hover:underline">
          ChatGPT
        </a>
        , or{" "}
        <a href="https://x.ai/bot" target="_blank" rel="noopener dofollow" className="text-blue-600 hover:underline">
          Grok Bot
        </a>
        . Do not put your LinkedIn password in those tools. LinkedIn stays inside Omentir.
      </p>
      <p>
        Human setup lives on the{" "}
        <Link href="/integrations/claude" className="text-blue-600 hover:underline">
          Claude integration
        </Link>
        ,{" "}
        <Link href="/integrations/chatgpt" className="text-blue-600 hover:underline">
          ChatGPT integration
        </Link>
        , and{" "}
        <Link href="/integrations/grok-bot" className="text-blue-600 hover:underline">
          Grok Bot integration
        </Link>{" "}
        pages. Overnight research is useful, including the{" "}
        <Link href="/blogs/grok-bot-linkedin-sales" className="text-blue-600 hover:underline">
          Grok Bot LinkedIn outreach
        </Link>{" "}
        loop. Do not let those tools send LinkedIn actions on their own.
      </p>
      <p>
        Ask the connected model to list existing Omentir agents before it creates new ones. Ask it to show a draft before it replies to a thread. If you do only one thing this week, split your current list into two agents with two ICP profiles. Set tone and reply handling on purpose, then keep the inbox in front of you.
      </p>
    </BlogPostTemplate>
  );
}
