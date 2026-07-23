import Image from "next/image";
import Link from "next/link";
import FaqAccordion from "../../faq-accordion";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";

export const metadata = createPageMetadata({
  title: "Introducing Omentir v2 - Omentir",
  description:
    "Omentir v2 introduces simpler pricing, Agent API, and connectors for AI agents to make outreach dead simple.",
  path: "/blogs/introducing-omentir-v2",
  keywords: [
    "Omentir v2",
    "Omentir pricing",
    "Omentir Agent API",
    "Omentir connectors",
    "AI sales agent API",
    "MCP outbound connector",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "why-v2", label: "Why We Built Omentir v2", level: 1 },
  { id: "new-pricing", label: "New Pricing", level: 1 },
  { id: "agent-api", label: "Agent API", level: 1 },
  { id: "connectors", label: "Connectors for Agentic Workflows", level: 1 },
  { id: "why-this-matters", label: "Why This Matters", level: 1 },
  { id: "what-comes-next", label: "What Comes Next", level: 1 },
  { id: "faqs", label: "Frequently Asked Questions", level: 1 },
];

const faqItems = [
  {
    question: "What is Omentir v2?",
    answer:
      "Omentir v2 is the next version of Omentir, focused on simpler pricing, programmable outbound through Agent API, and connectors for AI agents.",
  },
  {
    question: "What changed in Omentir pricing?",
    answer:
      "Omentir now has a Basic plan at $29/month, a Startup plan at $59/month, and custom Enterprise pricing for larger teams that need more accounts, workflows, support, and controls. The idea is to let teams start small and scale only when outbound is working.",
  },
  {
    question: "What can Agent API do?",
    answer:
      "Agent API exposes workspace-scoped REST endpoints so trusted tools can read context, configure lead finders, search scored leads, inspect activity, and work with existing reply conversations.",
  },
  {
    question: "What is an Omentir connector?",
    answer:
      "An Omentir connector lets an AI tool connect to your Omentir workspace through a secure URL and workspace-scoped key. Instead of copying data between tools, the agent can call approved Omentir tools directly.",
  },
  {
    question: "What is the difference between MCP and the REST API?",
    answer:
      "MCP is best when an AI agent should discover and call tools directly. REST API is best when a developer wants to wire Omentir into scripts, internal systems, or custom backend workflows.",
  },
  {
    question: "Can an agent send outreach without safety checks?",
    answer:
      "No. Agent actions remain workspace-scoped and pass through Omentir's validation, ownership checks, daily quotas, and LinkedIn connection requirements. The connector gives agents focused access, not unlimited control.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Introducing Omentir v2"
      description="Omentir v2 introduces simpler pricing, Agent API, and connectors for AI agents to make outreach dead simple."
      slug="introducing-omentir-v2"
      publishedDate="July 6, 2026"
      updatedDate="July 6, 2026"
      bannerSrc="/find-your-next-10-customers-banner.avif"
      bannerAlt="Omentir v2 launch banner showing pricing, API, and connector updates"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <p id="why-v2" className="scroll-mt-28">
        Omentir v2 is a simple idea rebuilt from the ground up: outbound should
        not feel like operating five disconnected tools.
      </p>
      <p>
        Most teams do not need more dashboards. They need a system that
        understands who they sell to, finds the right people, writes outreach
        with context, respects safe sending limits, and gives founders or sales
        teams a clear way to turn interest into pipeline.
      </p>
      <p>
        That is what v2 is built around. Omentir is no longer just a LinkedIn
        outreach assistant. It is becoming the outbound layer for humans, AI
        agents, and the tools they already use.
      </p>

      <h2
        id="new-pricing"
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-10 scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-2xl font-semibold tracking-tight text-black"
      >
        New Pricing
      </h2>
      <p>
        We are making pricing simpler. The goal is not to create confusing
        usage math. The goal is to make it easy to start small, prove the
        channel, and scale once the pipeline is working.
      </p>
      <p>
        The headline change is a brand new tier. We are introducing Basic at
        $29/month, and at the same time we are upgrading the existing Startup
        plan so it gives you a lot more for the same price.
      </p>
      <p>
        Here is what changed. Earlier there was no $29 option. The only paid
        plan was Startup at $59/month, and it included a single LinkedIn
        account. Now that same $59 Startup plan includes three LinkedIn
        accounts, and we have added a much cheaper entry point: the new $29
        Basic plan for a single LinkedIn account. So you can start outbound for
        less, and the plan you already knew now does three times the work.
      </p>
      <div className="my-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <Image
          src="/omentir-v2-pricing-plans.avif"
          alt="Omentir v2 pricing plans for Basic, Startup, and Enterprise"
          width={3600}
          height={2400}
          className="h-auto w-full"
          sizes="(min-width: 1024px) 720px, calc(100vw - 32px)"
        />
      </div>
      <p>
        The Basic plan is built for solo founders who want one focused outbound
        motion: one LinkedIn account, one AI agent, one campaign, and up to 50
        leads per day.
      </p>
      <p>
        The Startup plan is for small teams that want more room to run: up to
        three LinkedIn accounts, three AI agents, unlimited leads, unlimited
        campaigns, and AI automated campaigns.
      </p>
      <p>
        For larger teams, Enterprise remains custom. That includes unlimited
        LinkedIn accounts, unlimited AI agents, managed campaigns, SSO, and
        dedicated support.
      </p>
      <p>
        You can see the current plan details on the{" "}
        <Link href="/pricing" className="text-blue-600 hover:underline">
          Omentir pricing page
        </Link>
        .
      </p>

      <h2
        id="agent-api"
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-10 scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-2xl font-semibold tracking-tight text-black"
      >
        Agent API
      </h2>
      <p>
        The biggest shift in v2 is that Omentir is becoming programmable. With
        Agent API, trusted tools can read workspace context, inspect your
        product profile, configure discovery agents, search scored leads,
        inspect activity, and review conversations through REST
        endpoints.
      </p>
      <p>
        That matters because outbound does not live in one place anymore. Some
        teams work from CRMs. Some use internal scripts. Some use AI agents.
        Some want a founder-facing dashboard, while others want everything
        controlled from their own workflow.
      </p>
      <p>
        Agent API gives those teams a clean way to build on top of Omentir
        without bypassing workspace ownership, validation, and safety checks.
      </p>
      <div className="my-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <Image
          src="/agent-api-key-creation.avif"
          alt="Omentir API key creation screen for agent and script access"
          width={1600}
          height={1200}
          className="h-auto w-full"
          sizes="(min-width: 1024px) 720px, calc(100vw - 32px)"
        />
      </div>
      <p>
        You can create a workspace-scoped key from{" "}
        <Link href="/api-keys" className="text-blue-600 hover:underline">
          API keys
        </Link>
        . From there, integrations can call a few core endpoints:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc space-y-2 pl-6 text-zinc-800">
        <li>
          <code>GET /api/agent/v1/context</code> to check workspace readiness
          and available resources.
        </li>
        <li>
          <code>GET /api/agent/v1/leads</code> to search, filter, and rank
          discovered prospects.
        </li>
        <li>
          <code>GET /api/agent/v1/leads/&lt;leadId&gt;</code> to retrieve one exact
          lead and its qualification context.
        </li>
      </ul>
      <p>
        For the full technical surface, use the live OpenAPI schema at{" "}
        <Link href="/api/agent/v1/openapi.json" className="text-blue-600 hover:underline">
          /api/agent/v1/openapi.json
        </Link>{" "}
        or the agent guide at{" "}
        <Link href="/agents.md" className="text-blue-600 hover:underline">
          /agents.md
        </Link>
        .
      </p>
      <div className="relative my-8 overflow-hidden rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
        <div className="pl-4">
          <h4 className="mb-2 font-bold text-black">API principle</h4>
          <p className="text-sm leading-relaxed text-zinc-650">
            The API is not a shortcut around Omentir's safety model. It is a
            programmable path through the same workspace checks, campaign rules,
            and pacing controls used by the product.
          </p>
        </div>
      </div>

      <h2
        id="connectors"
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-10 scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-2xl font-semibold tracking-tight text-black"
      >
        Connectors for Agentic Workflows
      </h2>
      <p>
        v2 also introduces connectors for agentic workflows. Omentir now exposes
        an MCP server, so tools like Claude, ChatGPT, Cursor, Hermes, OpenClaw,
        and custom agents can connect to Omentir with a workspace-scoped API
        key.
      </p>
      <p>
        The setup is intentionally lightweight: create an Omentir key, paste
        the MCP URL into the agent's connector settings, and let the client
        discover the available tools. The agent gets structured capabilities
        instead of raw account access.
      </p>
      <div className="my-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <Image
          src="/omentir-custom-connector-mcp-url.avif"
          alt="Adding Omentir as a custom connector with the MCP URL"
          width={1800}
          height={1200}
          className="h-auto w-full"
          sizes="(min-width: 1024px) 720px, calc(100vw - 32px)"
        />
      </div>
      <p>
        Once connected, an agent can help with the full outbound workflow:
        understand the workspace, check the product profile, create a lead
        discovery agent, search and rank leads, inspect discovery activity, and
        work with existing replies.
      </p>
      <p>
        Technically, the connector gives an agent a typed tool surface instead
        of a vague browser session. A few useful tools look like this:
      </p>
      <div className="my-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="grid border-b border-zinc-200 bg-[#f4f2ec] px-5 py-3 text-sm font-semibold text-black sm:grid-cols-[1fr_1.5fr]">
          <div>Tool</div>
          <div>What it helps with</div>
        </div>
        <div className="grid gap-2 border-b border-zinc-100 px-5 py-4 text-sm leading-6 text-zinc-700 sm:grid-cols-[1fr_1.5fr]">
          <code className="text-zinc-950">omentir_get_context</code>
          <div>Checks workspace readiness, setup state, and available resources.</div>
        </div>
        <div className="grid gap-2 border-b border-zinc-100 px-5 py-4 text-sm leading-6 text-zinc-700 sm:grid-cols-[1fr_1.5fr]">
          <code className="text-zinc-950">omentir_get_lead</code>
          <div>Retrieves one exact lead with its qualification context.</div>
        </div>
        <div className="grid gap-2 px-5 py-4 text-sm leading-6 text-zinc-700 sm:grid-cols-[1fr_1.5fr]">
          <code className="text-zinc-950">omentir_list_conversations</code>
          <div>Reviews recent replies so a human or agent can choose the next step.</div>
        </div>
      </div>
      <p>
        The dashboard is still there for people who want a clean product
        experience. But now Omentir can also work wherever your operator,
        founder, developer, or AI agent already lives.
      </p>
      <p>
        For setup details, read the{" "}
        <Link href="/mcp-server" className="text-blue-600 hover:underline">
          Omentir MCP server guide
        </Link>
        .
      </p>

      <h2
        id="why-this-matters"
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-10 scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-2xl font-semibold tracking-tight text-black"
      >
        Why This Matters
      </h2>
      <p>
        Outbound is changing. The old workflow was manual and fragmented:
        scrape leads in one tool, enrich them in another, write messages
        somewhere else, upload everything into a sequencer, then hope the
        campaign does not sound generic.
      </p>
      <p>
        The next workflow is more fluid. You describe who you sell to. Omentir
        finds qualified buyers. Your AI agent can inspect the workspace, ask for
        more context, create campaigns, and monitor replies. Humans stay in
        control where judgment matters, while repetitive work gets handled by
        the system.
      </p>
      <p>
        v2 is our move toward that future. Not more automation for the sake of
        automation. Better discovery, better outreach, safer execution, and
        cleaner ways to plug Omentir into the rest of your stack.
      </p>

      <h2
        id="what-comes-next"
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-10 scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-2xl font-semibold tracking-tight text-black"
      >
        What Comes Next
      </h2>
      <p>
        Omentir v2 is built for founders and teams who want outbound to feel
        less like admin work and more like a repeatable path to customers.
      </p>
      <p>
        The product is moving in one direction: fewer disconnected steps, more
        qualified conversations, and a safer way to let agents help with the
        work that used to slow every outbound team down.
      </p>
      <div className="my-10 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="v2-dashboard-button inline-flex h-11 items-center justify-center rounded-md bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Dashboard
        </Link>
        <Link
          href="/pricing"
          className="v2-pricing-button inline-flex h-11 items-center justify-center rounded-md border border-[var(--md-sys-color-seed)] bg-[var(--md-sys-color-seed)] px-5 text-sm font-semibold text-black transition hover:brightness-95"
        >
          Pricing
        </Link>
        <Link
          href="/mcp-server"
          className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-5 text-sm font-semibold text-zinc-800 transition hover:border-black hover:text-black"
        >
          MCP Agents
        </Link>
      </div>

      <h2
        id="faqs"
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-10 scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-2xl font-semibold tracking-tight text-black"
      >
        Frequently Asked Questions
      </h2>
      <FaqAccordion items={faqItems} />
    </BlogPostTemplate>
  );
}
