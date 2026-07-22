import Image from "next/image";
import Link from "next/link";
import AgentTypewriter from "../agent-typewriter";
import CopyConnectorUrl from "../copy-connector-url";
import FaqAccordion from "../faq-accordion";
import { PaperPlaneIllustration } from "../landing-illustrations";
import JsonLd from "../json-ld";
import { MarketingFooter, MarketingHeader } from "../marketing-shell";
import Reveal from "../scroll-reveal";
import {
  createBreadcrumbJsonLd,
  createFAQJsonLd,
  createPageMetadata,
  siteUrl,
  softwareApplicationJsonLd,
} from "../seo";

export const metadata = createPageMetadata({
  title: "MCP Server - Omentir",
  description:
    "Connect Claude, ChatGPT, Cursor, Hermes, OpenClaw, or your own assistant to the Omentir MCP server for LinkedIn lead discovery by tool call.",
  path: "/mcp-server",
  keywords: [
    "Omentir MCP server",
    "MCP server setup",
    "Model Context Protocol",
    "MCP LinkedIn outreach",
    "Claude MCP connector",
    "ChatGPT MCP connector",
    "Cursor MCP server",
    "MCP sales tools",
  ],
});

const mcpEndpoint = `${siteUrl}/api/agent/v1/mcp`;

type SetupStep = {
  number: string;
  title: string;
  description: string;
  copyUrl?: string;
  image: string;
  alt: string;
};

const setupSteps: SetupStep[] = [
  {
    number: "1.",
    title: "Connect LinkedIn",
    description:
      "Connect your LinkedIn account in Omentir first. Your agent will use the same safe workspace and sending limits as the dashboard.",
    image: "/connect-linkedin.avif",
    alt: "Connect LinkedIn screen in Omentir",
  },
  {
    number: "2.",
    title: "Get your API key",
    description:
      "Open your Omentir API keys page, create an agent key, and copy it. This is the credential your agent uses.",
    image: "/get-your-api-key.avif",
    alt: "Getting an Omentir API key for an agent connector",
  },
  {
    number: "3.",
    title: "Connect to your agent",
    description:
      "Copy the connector URL below and paste it into your agent. Replace <key> with the API key you copied from your Omentir dashboard. Treat the full URL like a password.",
    copyUrl: `${mcpEndpoint}?key=<key>`,
    image: "/connect-to-your-agent.avif",
    alt: "Connecting an AI agent to Omentir with an API key",
  },
  {
    number: "4.",
    title: "Request your AI",
    description:
      "Ask your agent anything about Omentir or the LinkedIn outreach process. It can choose the right tools on its own.",
    image: "/request-your-ai.avif",
    alt: "Requesting an AI agent to run Omentir outreach",
  },
];

// Mirrors the live MCP tool list in src/lib/agent-tools.ts - keep in sync.
const toolGroups = [
  {
    group: "Context & product profile",
    tools: [
      { name: "omentir_get_context", description: "Read workspace readiness, product profile, setup status, and counts." },
      { name: "omentir_get_product_profile", description: "Read the product profile used for ICP matching and personalization." },
      { name: "omentir_update_product_profile", description: "Update the product profile used to qualify and rank leads." },
    ],
  },
  {
    group: "Lead discovery",
    tools: [
      { name: "omentir_create_agent", description: "Create an ICP discovery agent and its target lead group." },
      { name: "omentir_update_agent", description: "Edit an agent's name, prompt, filters, signal sources, LinkedIn account, or lead group." },
      { name: "omentir_list_agents", description: "List the discovery agents running in the workspace." },
      { name: "omentir_list_leads", description: "Search, filter, sort, and list discovered leads." },
      { name: "omentir_get_lead", description: "Read one exact lead and its complete qualification record." },
      { name: "omentir_list_groups", description: "List the lead groups in the workspace." },
    ],
  },
  {
    group: "Workspace & discovery status",
    tools: [
      { name: "omentir_list_linkedin_accounts", description: "List connected LinkedIn accounts available for discovery." },
      { name: "omentir_list_activity", description: "Inspect recent discovery runs and operational status." },
      { name: "omentir_get_stats", description: "Read lead, agent, and existing outreach metrics." },
      { name: "omentir_update_settings", description: "Set daily connection-request and message limits, first-message delay, and AI follow-up behaviour." },
    ],
  },
  {
    group: "Lifecycle management",
    tools: [
      { name: "omentir_pause_agent", description: "Pause future discovery runs for one lead finder." },
      { name: "omentir_resume_agent", description: "Resume a paused lead finder and schedule it to run again." },
      { name: "omentir_delete_agent", description: "Delete a lead finder while retaining its lead group and leads." },
    ],
  },
  {
    group: "Replies",
    tools: [
      { name: "omentir_list_conversations", description: "List recent LinkedIn reply conversations captured by Omentir." },
      { name: "omentir_reply_to_lead", description: "Reply in existing conversations, within your daily message quota." },
    ],
  },
];

const faqItems = [
  {
    question: "What is the Omentir MCP server?",
    answer:
      "It's a hosted Model Context Protocol endpoint at omentir.com/api/agent/v1/mcp. Any MCP-capable client - Claude, ChatGPT, Cursor, Hermes, OpenClaw, or a custom assistant - connects with a workspace-scoped token and gets seventeen tools for product context, lead-finder configuration, discovery status, lead inspection, and existing conversations. Nothing to install or self-host.",
  },
  {
    question: "How do I authenticate?",
    answer:
      "Create a token in Omentir under Settings → AI Agents, then send it as `Authorization: Bearer <token>` on every request. Clients that can't set custom headers (ChatGPT and claude.ai custom connectors) can append it as a query parameter instead: `?key=<token>`. Each token is scoped to exactly one workspace and can be revoked anytime.",
  },
  {
    question: "Which MCP methods are supported?",
    answer:
      "The Streamable HTTP server speaks JSON-RPC 2.0 and supports initialize, ping, tools/list, and tools/call, plus the initialized notification. It negotiates the stable MCP protocol version. A plain GET returns an unauthenticated discovery document for quick client setup checks.",
  },
  {
    question: "Can the server find LinkedIn leads from chat?",
    answer:
      "Yes. Your assistant can read the workspace's product context, create a lead finder with complete targeting, and inspect the scored leads Omentir discovers. It can also check activity so it reports when discovery is still pending instead of treating an empty list as a final result.",
  },
  {
    question: "My agent doesn't speak MCP - is there a REST fallback?",
    answer:
      "Yes. The same workflow is available through REST endpoints under /api/agent/v1, documented by the OpenAPI schema at /api/agent/v1/openapi.json and the machine-readable guide at /agents.md.",
  },
  {
    question: "How should my agent learn the recommended workflow?",
    answer:
      "Point it at omentir.com/agents.md. It's a markdown guide written for assistants: the recommended call order (context → product profile → existing agents → discovery → activity → leads), the full tool list, and guardrails for retries, asynchronous results, and existing conversations.",
  },
];

export default function McpServerPage() {
  const jsonLd = [
    softwareApplicationJsonLd,
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: "MCP Server", url: `${siteUrl}/mcp-server` },
    ]),
    createFAQJsonLd(faqItems),
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      <JsonLd id="mcp-server-jsonld" data={jsonLd} />
      <MarketingHeader />

      {/* Hero */}
      <section className="mx-auto flex min-h-screen w-full max-w-4xl min-w-0 flex-col items-center justify-center px-4 py-24 text-center sm:px-8 sm:py-32">
        <h1
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-[2rem] leading-[1.12] font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] md:whitespace-nowrap md:text-5xl md:leading-tight lg:text-[3.5rem] xl:text-6xl"
        >
          Omentir works with{" "}
          <AgentTypewriter agents={["ChatGPT", "Gemini", "Grok", "Claude"]} />
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--md-sys-color-on-surface-variant)] sm:text-lg">
          One connector links Omentir with your favorite chat apps, so they can
          configure lead finders, inspect ICP-fit buyers, and explain discovery
          results from the MCP server you connect once.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="#explore"
            className="m3-btn m3-btn-filled-secondary h-11 px-5 text-sm"
          >
            Explore more
          </Link>
          <Link
            href="/api-keys"
            className="m3-btn m3-btn-outlined h-11 px-5 text-sm"
          >
            Get API key
          </Link>
        </div>
      </section>

      {/* Setup steps */}
      <section id="explore" className="mx-auto max-w-7xl min-w-0 px-4 py-16 sm:px-8 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-3xl lg:text-4xl"
          >
            Get started in <span className="text-gradient-brand">four steps</span>
          </h2>
        </Reveal>
        <div className="mt-12 space-y-14 sm:mt-16 sm:space-y-20">
          {setupSteps.map((step, index) => {
            const imageFirst = index % 2 === 0;
            return (
              <Reveal
                key={step.title}
                className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10"
              >
                <div
                  className={`mx-auto w-full max-w-md overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] shadow-[0_18px_60px_rgba(15,23,42,0.08)] ${
                    imageFirst ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <Image
                    src={step.image}
                    alt={step.alt}
                    width={1448}
                    height={1086}
                    className="h-auto w-full"
                  />
                </div>
                <div className={imageFirst ? "lg:order-2" : "lg:order-1"}>
                  <div className="mx-auto max-w-sm text-center lg:text-left">
                    <h3
                      style={{ fontFamily: "var(--font-varta)" }}
                      className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-2xl"
                    >
                      {step.number} {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)] sm:text-base">
                      {step.description}
                    </p>
                    {step.copyUrl ? <CopyConnectorUrl url={step.copyUrl} /> : null}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Tool catalog */}
      <section className="mx-auto max-w-7xl min-w-0 px-4 py-16 sm:px-8 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-3xl lg:text-4xl"
          >
            Every tool the server <span className="text-gradient-brand">exposes</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)] sm:text-base">
            Eighteen focused tools cover lead discovery and existing conversations. Clients
            discover them automatically via <code className="rounded bg-[var(--md-sys-color-surface-container-high)] px-1.5 py-0.5 text-[12px] text-[var(--md-sys-color-on-surface)]">tools/list</code>.
          </p>
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:mt-16 sm:grid-cols-2">
          {toolGroups.map((group, index) => (
            <Reveal key={group.group} delay={index * 100}>
              <div className="h-full rounded-2xl border-2 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] p-6 shadow-[var(--md-sys-card-elevation-rest)] sm:p-7">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--md-sys-color-on-surface-variant)]">
                  {group.group}
                </h3>
                <ul className="mt-4 space-y-4">
                  {group.tools.map((tool) => (
                    <li key={tool.name}>
                      <code className="text-[13px] font-semibold text-[var(--md-sys-color-on-surface)]">
                        {tool.name}
                      </code>
                      <p className="mt-1 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
                        {tool.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mx-auto mt-8 max-w-2xl">
          <p className="text-center text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
            Curious what your agent should do with them? The{" "}
            <Link
              href="/for-agents"
              className="font-medium text-[var(--md-sys-color-on-surface)] underline underline-offset-2 hover:text-[var(--md-sys-color-primary)]"
            >
              For Agents page
            </Link>{" "}
            walks through the recommended workflow end to end.
          </p>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-5xl min-w-0 px-4 py-16 sm:px-8 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-3xl lg:text-4xl"
          >
            Frequently Asked Questions
          </h2>
        </Reveal>
        <Reveal delay={120} className="mt-12 sm:mt-16">
          <FaqAccordion items={faqItems} />
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl min-w-0 px-4 py-16 sm:px-8 sm:py-20">
        <Reveal>
          <div className="marketing-cta relative overflow-hidden rounded-xl px-5 py-12 text-center sm:px-10 sm:py-14">
            <div
              aria-hidden
              className="pointer-events-none absolute right-6 top-1/2 hidden h-24 -translate-y-1/2 opacity-90 lg:block"
            >
              <PaperPlaneIllustration />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Plug your agent into Omentir
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/90">
              Create a workspace, mint an agent token, and your MCP client is
              finding buyers and sending outreach in minutes - end to end.
            </p>
            <Link
              href="/signup"
              className="m3-btn m3-btn-filled-secondary mt-7 h-12 cursor-pointer px-7 text-base"
            >
              Get Started
            </Link>
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
