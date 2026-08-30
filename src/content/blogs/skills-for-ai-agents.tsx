import Link from "next/link";
import type { ReactNode } from "react";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";

export const metadata = createPageMetadata({
  title: "Skills for AI Agents: Complete Guide to Capabilities, Tasks, and Discovery | Omentir",
  description:
    "An in-depth technical guide to skills for AI agents: how agent architectures execute skills, core skill matrices for sales, coding, and research, and where to source production-ready skills.",
  path: "/blogs/skills-for-ai-agents",
  image: {
    url: "/blogs/skills-for-ai-agents/cover.avif",
    width: 1774,
    height: 887,
    alt: "Skills for AI Agents architecture diagram showing reasoning, tool use, and integrations",
  },
  keywords: [
    "skills for AI agents",
    "AI agent skills",
    "Agentic Kit",
    "agentickit.co",
    "AI agent tools",
    "model context protocol",
    "MCP tools",
    "autonomous agent capabilities",
    "AI sales skills",
    "agent function calling",
  ],
});

const agenticKitUrl = "https://www.agentickit.co/";

const tocItems = [
  { id: "what-are-agent-skills", label: "What are skills for AI agents?", level: 1 },
  { id: "taxonomy-table", label: "Prompts vs tools vs skills vs subagents", level: 2 },
  { id: "how-architectures-execute-skills", label: "How AI agent architectures execute skills", level: 1 },
  { id: "mcp-and-standardization", label: "Standardization: function calling and MCP", level: 2 },
  { id: "core-skill-categories", label: "Essential AI agent skills and what tasks you can build", level: 1 },
  { id: "prospecting-and-enrichment", label: "1. Prospecting and lead enrichment", level: 2 },
  { id: "sales-and-outreach", label: "2. Autonomous outreach and conversation handling", level: 2 },
  { id: "software-engineering-skills", label: "3. Codebase analysis and engineering tasks", level: 2 },
  { id: "deep-research-and-extraction", label: "4. Web navigation and structured data extraction", level: 2 },
  { id: "customer-support-operations", label: "5. Customer support and operational triage", level: 2 },
  { id: "skill-matrix-table", label: "Agent skill and task breakdown matrix", level: 2 },
  { id: "anatomy-of-a-production-skill", label: "The anatomy of a production-ready agent skill", level: 1 },
  { id: "how-to-find-agent-skills", label: "How to find and source pre-built AI agent skills", level: 1 },
  { id: "agentic-kit-deep-dive", label: "Agentic Kit: the curated hub for agent skills", level: 2 },
  { id: "sourcing-comparison-table", label: "Comparison of skill sourcing ecosystems", level: 2 },
  { id: "evaluating-and-testing-skills", label: "How to evaluate and sandbox skills safely", level: 1 },
  { id: "faqs", label: "Frequently asked questions", level: 1 },
] as const;

const faqItems = [
  {
    question: "What is the difference between an AI tool and an AI agent skill?",
    answer:
      "A tool is a raw API endpoint or function that accepts inputs and returns outputs (such as a database query or web scraper). A skill is a higher-level capability package that combines tools with system instructions, schemas, decision heuristics, error handling, and state management to accomplish an end-to-end objective.",
  },
  {
    question: "Where can I find pre-built skills for my AI agents?",
    answer:
      "You can source battle-tested skills from curated registries like Agentic Kit (agentickit.co), open-source Model Context Protocol (MCP) server directories, and community repositories on GitHub.",
  },
  {
    question: "Can an AI agent learn new skills dynamically at runtime?",
    answer:
      "Yes. Modern agent architectures can inspect a skill registry, read schema definitions on demand, and load the appropriate execution scripts when a specific task requires them, rather than keeping every tool loaded in memory.",
  },
  {
    question: "How do skills protect against hallucinations in autonomous agents?",
    answer:
      "Skills enforce structured schemas (such as JSON Schema or Zod) for inputs and outputs. When an agent executes a deterministic skill, the system validates arguments before execution and returns verified real-world data back to the reasoning loop.",
  },
  {
    question: "How do agent skills connect to external sales and outbound platforms?",
    answer:
      "Skills communicate over HTTP APIs or standardized protocols like MCP. For example, an agent can use a dedicated outreach skill to connect directly with Omentir to find verified LinkedIn prospects and trigger personalized messaging sequences.",
  },
] as const;

const sectionClassName =
  "mt-10 scroll-mt-28 border-b border-[var(--md-sys-color-outline-variant)] pb-2 pt-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]";

const subSectionClassName =
  "mt-8 scroll-mt-28 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]";

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
      {children}
    </a>
  );
}

const taxonomyRows = [
  {
    layer: "Prompt",
    nature: "Instructional",
    statefulness: "Stateless context",
    schemaEnforcement: "None (free-form text)",
    failureRecovery: "Model re-prompting",
    primaryRole: "Sets persona, system tone, objective guidelines, and formatting style.",
  },
  {
    layer: "Tool (Function)",
    nature: "Deterministic API",
    statefulness: "Stateless single call",
    schemaEnforcement: "JSON Schema / Types",
    failureRecovery: "HTTP status / Error codes",
    primaryRole: "Executes discrete actions (e.g., fetch URL, query database, send webhook).",
  },
  {
    layer: "Agent Skill",
    nature: "Packaged Capability",
    statefulness: "State-aware execution",
    schemaEnforcement: "Strict Zod / JSON Schema",
    failureRecovery: "Self-correcting ReAct loop",
    primaryRole: "Combines tools, schemas, domain heuristics, and retry logic into an end-to-end task.",
  },
  {
    layer: "Subagent",
    nature: "Autonomous Worker",
    statefulness: "Isolated persistent state",
    schemaEnforcement: "Message passing / Task I/O",
    failureRecovery: "Supervisor evaluation",
    primaryRole: "Runs independent long-running workflows with dedicated context and multiple skills.",
  },
] as const;

const skillDomainRows = [
  {
    domain: "B2B Prospecting",
    coreSkills: "Domain Discovery, Waterfall Enrichment, ICP Scoring",
    keyInputs: "Target titles, industry verticals, company size, location",
    outputArtifacts: "Verified contact profile, validated email, LinkedIn URL",
    automationLevel: "95% Autonomous",
  },
  {
    domain: "Sales Outreach",
    coreSkills: "Signal Ingestion, Contextual Icebreaking, Sequence Trigger",
    keyInputs: "Recent prospect posts, company news, product value prop",
    outputArtifacts: "Personalized outreach copy, CRM activity log, calendar link",
    automationLevel: "85% Autonomous (Human Review optional)",
  },
  {
    domain: "Software Engineering",
    coreSkills: "AST Parsing, Test-Driven Patching, PR Review",
    keyInputs: "Failing test output, repository tree, git diff",
    outputArtifacts: "Surgical code patch, unit tests, commit message",
    automationLevel: "90% Autonomous",
  },
  {
    domain: "Deep Web Research",
    coreSkills: "Multi-Source Crawling, PDF Parsing, Table Extraction",
    keyInputs: "Research topic, seed domains, target data schema",
    outputArtifacts: "Structured JSON dataset, executive synthesis memo",
    automationLevel: "95% Autonomous",
  },
  {
    domain: "Customer Operations",
    coreSkills: "Intent Classification, Stripe Triage, Ticket Routing",
    keyInputs: "Customer inquiry, transaction ID, support knowledge base",
    outputArtifacts: "Automated resolution draft, refund execution, tagged ticket",
    automationLevel: "80% Autonomous",
  },
] as const;

const sourcingRows = [
  {
    source: "Agentic Kit (agentickit.co)",
    type: "Curated Skill Registry",
    setupEffort: "Plug-and-play (minutes)",
    schemaQuality: "Strictly validated production schemas",
    maintenance: "Continuous updates by core team and community",
    idealFor: "SaaS founders and engineering teams building production agents quickly",
  },
  {
    source: "Official MCP Servers",
    type: "Open-Source Protocols",
    setupEffort: "Low to Moderate (JSON-RPC config)",
    schemaQuality: "Standardized Anthropic MCP spec",
    maintenance: "Maintained by platform vendors (GitHub, PostgreSQL)",
    idealFor: "Standard infrastructure tools (databases, git, file systems)",
  },
  {
    source: "Framework Registries (LangChain/CrewAI)",
    type: "Python/TS Libraries",
    setupEffort: "Moderate (pip/npm install)",
    schemaQuality: "Variable across individual community plugins",
    maintenance: "Ecosystem dependent",
    idealFor: "Fast local prototyping and hackathon projects",
  },
  {
    source: "Internal Monorepo",
    type: "Proprietary In-House",
    setupEffort: "High (requires custom engineering)",
    schemaQuality: "High (tailored to proprietary schemas)",
    maintenance: "100% internal engineering overhead",
    idealFor: "Confidential internal databases and proprietary business logic",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Skills for AI Agents: Complete Guide to Capabilities, Tasks, and Discovery"
      description="An in-depth technical guide to skills for AI agents: how agent architectures execute skills, core skill matrices for sales, coding, and research, and where to source production-ready skills."
      slug="skills-for-ai-agents"
      bannerSrc="/blogs/skills-for-ai-agents/cover.avif"
      bannerAlt="Skills for AI Agents architecture diagram showing reasoning, tool use, and integrations"
      tocItems={tocItems}
      faqItems={faqItems}
      visibleFaqItems={[
        faqItems[0],
        {
          question: faqItems[1].question,
          answer: (
            <>
              You can source battle-tested skills from curated registries like{" "}
              <ExternalLink href={agenticKitUrl}>Agentic Kit</ExternalLink> at{" "}
              <ExternalLink href={agenticKitUrl}>agentickit.co</ExternalLink>,
              open-source Model Context Protocol (MCP) server directories, and
              community repositories on GitHub.
            </>
          ),
        },
        faqItems[2],
        faqItems[3],
        faqItems[4],
      ]}
    >
      <p id="what-are-agent-skills" className="scroll-mt-28">
        Large language models possess vast general knowledge, but an isolated model cannot check your database, send an email, verify a prospect on LinkedIn, or fix a broken pull request on GitHub. On their own, models can only generate text based on prior training.
      </p>
      <p>
        To transform a raw model into an autonomous AI agent that performs real work, you must equip it with <strong>skills</strong>. Skills give language models hands and eyes: the ability to observe state, interact with software systems, run code, query APIs, and execute complex workflows deterministically.
      </p>
      <p>
        Whether you are building an autonomous sales development representative, an automated software engineer, or a research agent, understanding how skills are structured, executed, and discovered is the single most important factor in moving from brittle chat demos to production-grade agentic systems.
      </p>

      <h3 id="taxonomy-table" style={{ fontFamily: "var(--font-varta)" }} className={subSectionClassName}>
        Taxonomy: prompts vs tools vs skills vs subagents
      </h3>
      <p>
        To build reliable agent workflows, engineers must distinguish between the different abstraction layers of an agent stack:
      </p>

      {/* Taxonomy Table */}
      <div className="not-prose my-8 overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--md-sys-color-on-surface)]">
            <thead className="bg-[var(--md-sys-color-surface-container)] text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
              <tr>
                <th className="p-4 font-semibold">Layer</th>
                <th className="p-4 font-semibold">Nature</th>
                <th className="p-4 font-semibold">Statefulness</th>
                <th className="p-4 font-semibold">Schema Enforcement</th>
                <th className="p-4 font-semibold">Primary Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
              {taxonomyRows.map((row) => (
                <tr key={row.layer} className="hover:bg-[var(--md-sys-color-surface-container)] transition-colors">
                  <td className="p-4 font-semibold text-[var(--md-sys-color-on-surface)]">{row.layer}</td>
                  <td className="p-4 text-[var(--md-sys-color-on-surface-variant)]">{row.nature}</td>
                  <td className="p-4 text-[var(--md-sys-color-on-surface-variant)]">{row.statefulness}</td>
                  <td className="p-4 text-[var(--md-sys-color-on-surface-variant)]">{row.schemaEnforcement}</td>
                  <td className="p-4 text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)]">{row.primaryRole}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 id="how-architectures-execute-skills" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        How AI agent architectures execute skills
      </h2>
      <p>
        Modern agent frameworks (such as LangGraph, CrewAI, AutoGen, or custom in-house agent runtimes) follow a structured reasoning loop to execute skills. This loop is commonly known as the ReAct (Reason + Act) pattern or tool-use loop:
      </p>
      <div className="not-prose my-8 overflow-x-auto rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-5">
        <pre className="m-0 text-sm leading-7 text-[var(--md-sys-color-on-surface)]">
          <code>{`1. Task Ingestion: Agent receives user goal ("Find 20 VP Sales contacts in fintech").
2. Skill Selection: Agent matches the goal against available skill schemas in its registry.
3. Parameter Formulation: Model generates structured JSON arguments matching the skill schema.
4. Deterministic Execution: Host runtime validates schema, runs the skill function, and calls APIs.
5. Observation & Feedback: Execution output is injected back into the model context.
6. Evaluation / Iteration: Agent verifies if success criteria are met or calls next skill.`}</code>
        </pre>
      </div>

      <h3 id="mcp-and-standardization" style={{ fontFamily: "var(--font-varta)" }} className={subSectionClassName}>
        Standardization: function calling and the Model Context Protocol (MCP)
      </h3>
      <p>
        Historically, every framework had a proprietary format for defining tools, forcing developers to rewrite integrations for every model provider. In 2026, the industry has converged around standardized specifications:
      </p>
      <ul className="list-disc space-y-2 pl-6 text-[var(--md-sys-color-on-surface)]">
        <li>
          <strong>JSON Schema Function Calling:</strong> Standardized by OpenAI, Anthropic, and Google, allowing models to emit validated JSON payloads corresponding to callable functions.
        </li>
        <li>
          <strong>Model Context Protocol (MCP):</strong> An open standard introduced by Anthropic that decouples skill providers (MCP servers) from agent runtimes (MCP clients). With MCP, an agent can connect to any local or remote skill server over standard JSON-RPC without custom glue code. Learn more about configuring dedicated endpoints in our{" "}
          <Link href="/integrations/mcp" className="text-blue-600 hover:underline">
            MCP server documentation
          </Link>{" "}
          and{" "}
          <Link href="/features/agent-api-and-mcp" className="text-blue-600 hover:underline">
            agent integration guide
          </Link>
          .
        </li>
      </ul>

      <h2 id="core-skill-categories" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Essential AI agent skills and what tasks you can build
      </h2>
      <p>
        Equipping agents with specialized skill sets enables autonomous workflows across multiple business functions. Below are five foundational skill categories and the high-value tasks you can build with them.
      </p>

      <h3 id="prospecting-and-enrichment" style={{ fontFamily: "var(--font-varta)" }} className={subSectionClassName}>
        1. Prospecting and lead enrichment skills
      </h3>
      <p>
        Sales and growth teams use prospecting skills to eliminate manual data entry and lead scraping. Rather than having a human sales rep spend hours combing through databases, an agent with lead research skills can autonomously discover, qualify, and enrich accounts.
      </p>
      <p><strong>Tasks you can execute with prospecting skills:</strong></p>
      <ul className="list-disc space-y-2 pl-6 text-[var(--md-sys-color-on-surface)]">
        <li>
          <strong>ICP Account Discovery:</strong> Crawl industry directories, funding news, and job boards to detect companies actively hiring for specific roles.
        </li>
        <li>
          <strong>Multi-Source Enrichment:</strong> Query corporate registries and social graphs to identify decision-makers, verified email addresses, and company headcount trends.
        </li>
        <li>
          <strong>Buying Signal Detection:</strong> Monitor tech stack installations, executive job changes, and product launches to score lead intent in real time.
        </li>
      </ul>

      <h3 id="sales-and-outreach" style={{ fontFamily: "var(--font-varta)" }} className={subSectionClassName}>
        2. Autonomous outreach and conversation handling skills
      </h3>
      <p>
        Once leads are identified, outreach skills allow agents to craft hyper-personalized messages and manage communication across email and LinkedIn.
      </p>
      <p><strong>Tasks you can execute with outreach skills:</strong></p>
      <ul className="list-disc space-y-2 pl-6 text-[var(--md-sys-color-on-surface)]">
        <li>
          <strong>Contextual Icebreaker Generation:</strong> Read a prospect recent posts, podcast appearances, or articles to synthesize a genuine opening line that avoids generic templates.
        </li>
        <li>
          <strong>Multi-Channel Sequence Orchestration:</strong> Coordinate touchpoints across LinkedIn connection requests, follow-up messages, and cold emails with natural pacing.
        </li>
        <li>
          <strong>Objection Classification and Booking:</strong> Parse inbound replies, differentiate between "not interested" and "circle back next quarter", and share calendar booking links automatically.
        </li>
      </ul>
      <p>
        For sales teams executing LinkedIn campaigns, explore our detailed{" "}
        <Link href="/blogs/ai-sdr-linkedin-playbook" className="text-blue-600 hover:underline">
          AI SDR LinkedIn playbook
        </Link>{" "}
        and{" "}
        <Link href="/blogs/mcp-outreach-tools" className="text-blue-600 hover:underline">
          MCP outreach tools guide
        </Link>
        . Using dedicated platforms like{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Omentir
        </Link>{" "}
        provides an API-first foundation that autonomous agents can invoke as a native outreach skill to manage connections, profile warmup, and conversational messaging.
      </p>

      <h3 id="software-engineering-skills" style={{ fontFamily: "var(--font-varta)" }} className={subSectionClassName}>
        3. Codebase analysis and engineering tasks
      </h3>
      <p>
        Coding agents need reliable skills to navigate file trees, parse Abstract Syntax Trees (ASTs), execute shell commands, and run tests.
      </p>
      <p><strong>Tasks you can execute with engineering skills:</strong></p>
      <ul className="list-disc space-y-2 pl-6 text-[var(--md-sys-color-on-surface)]">
        <li>
          <strong>Static Code Analysis and Lint Fixes:</strong> Identify unused variables, type errors, or security vulnerabilities and apply surgical patch fixes.
        </li>
        <li>
          <strong>Automated Unit Test Generation:</strong> Read an existing module implementation and generate full test suites covering edge cases.
        </li>
        <li>
          <strong>Continuous Repository Maintenance:</strong> Automatically update deprecated dependencies, resolve breaking API migrations, and draft pull request descriptions.
        </li>
      </ul>

      <h3 id="deep-research-and-extraction" style={{ fontFamily: "var(--font-varta)" }} className={subSectionClassName}>
        4. Web navigation and structured data extraction skills
      </h3>
      <p>
        Research agents use web browsing and document parsing skills to synthesize insights from messy unstructured data.
      </p>
      <p><strong>Tasks you can execute with research skills:</strong></p>
      <ul className="list-disc space-y-2 pl-6 text-[var(--md-sys-color-on-surface)]">
        <li>
          <strong>Competitor Feature Matrix Generation:</strong> Navigate competitor pricing pages, documentation, and product releases to construct dynamic comparison matrices.
        </li>
        <li>
          <strong>PDF and Financial Report Extraction:</strong> Parse 10-K filings, annual balance sheets, and earnings call transcripts into clean JSON tables.
        </li>
        <li>
          <strong>Deep Web Synthesis:</strong> Query multiple search engines, filter clickbait sources, extract citations, and draft full technical whitepapers.
        </li>
      </ul>

      <h3 id="customer-support-operations" style={{ fontFamily: "var(--font-varta)" }} className={subSectionClassName}>
        5. Customer support and operational triage skills
      </h3>
      <p>
        Operational skills connect agents to billing gateways, internal ticket databases, and communication channels to automate day-to-day customer support.
      </p>
      <ul className="list-disc space-y-2 pl-6 text-[var(--md-sys-color-on-surface)]">
        <li>
          <strong>Stripe Refund Verification:</strong> Check customer transaction logs, verify eligibility against company return policies, and trigger refunds through Stripe APIs.
        </li>
        <li>
          <strong>Zendesk Ticket Triage:</strong> Classify customer issues by severity, route billing queries to finance teams, and auto-reply to common setup questions.
        </li>
      </ul>

      <h3 id="skill-matrix-table" style={{ fontFamily: "var(--font-varta)" }} className={subSectionClassName}>
        Agent skill and task breakdown matrix
      </h3>
      <p>
        Here is a structured overview of the five primary agent domains, their core capabilities, expected inputs, and generated artifacts:
      </p>

      {/* Skill Domain Matrix Table */}
      <div className="not-prose my-8 overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--md-sys-color-on-surface)]">
            <thead className="bg-[var(--md-sys-color-surface-container)] text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
              <tr>
                <th className="p-4 font-semibold">Domain</th>
                <th className="p-4 font-semibold">Core Skills</th>
                <th className="p-4 font-semibold">Key Inputs Required</th>
                <th className="p-4 font-semibold">Output Artifacts</th>
                <th className="p-4 font-semibold">Autonomy Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
              {skillDomainRows.map((row) => (
                <tr key={row.domain} className="hover:bg-[var(--md-sys-color-surface-container)] transition-colors">
                  <td className="p-4 font-semibold text-[var(--md-sys-color-on-surface)]">{row.domain}</td>
                  <td className="p-4 text-[var(--md-sys-color-on-surface-variant)]">{row.coreSkills}</td>
                  <td className="p-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">{row.keyInputs}</td>
                  <td className="p-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">{row.outputArtifacts}</td>
                  <td className="p-4 text-xs font-semibold text-blue-600">{row.automationLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 id="anatomy-of-a-production-skill" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        The anatomy of a production-ready agent skill
      </h2>
      <p>
        A brittle tool is just a simple Python or TypeScript script. A production-grade agent skill consists of four essential components:
      </p>
      <div className="not-prose my-8 overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)]">
        <div className="bg-[var(--md-sys-color-surface-container-low)] p-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <p className="m-0 font-semibold text-[var(--md-sys-color-on-surface)]">1. Explicit JSON Schema (Contract)</p>
          <p className="m-0 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Defines exact types, mandatory properties, and validation rules so the LLM cannot hallucinate invalid parameters.
          </p>
        </div>
        <div className="bg-[var(--md-sys-color-surface-container-low)] p-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <p className="m-0 font-semibold text-[var(--md-sys-color-on-surface)]">2. Clear System Instructions & Context</p>
          <p className="m-0 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Specifies when to call the skill, what edge cases require human escalation, and how to interpret raw outputs.
          </p>
        </div>
        <div className="bg-[var(--md-sys-color-surface-container-low)] p-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <p className="m-0 font-semibold text-[var(--md-sys-color-on-surface)]">3. Deterministic Execution Logic</p>
          <p className="m-0 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Handles rate limiting, retry backoffs, authentication headers, and network timeouts safely.
          </p>
        </div>
        <div className="bg-[var(--md-sys-color-surface-container-low)] p-4">
          <p className="m-0 font-semibold text-[var(--md-sys-color-on-surface)]">4. Structured Error Handling</p>
          <p className="m-0 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Returns machine-readable error messages so the agent can self-correct arguments instead of crashing.
          </p>
        </div>
      </div>

      <p>Here is an example of a TypeScript skill definition using Zod schema validation:</p>
      <div className="not-prose my-8 overflow-x-auto rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-5">
        <pre className="m-0 text-sm leading-7 text-[var(--md-sys-color-on-surface)]">
          <code>{`import { z } from "zod";

export const ProspectEnrichmentSkill = {
  name: "enrich_b2b_prospect",
  description: "Enriches a company domain with verified executive contacts and intent signals.",
  parameters: z.object({
    domain: z.string().url().describe("The official company website domain (e.g. stripe.com)"),
    targetTitles: z.array(z.string()).describe("List of target job titles to look for"),
    maxResults: z.number().min(1).max(25).default(5),
  }),
  execute: async ({ domain, targetTitles, maxResults }) => {
    try {
      const response = await fetch(\`https://api.prospects.io/v1/enrich\`, {
        method: "POST",
        headers: { Authorization: \`Bearer \${process.env.PROSPECT_API_KEY}\` },
        body: JSON.stringify({ domain, titles: targetTitles, limit: maxResults }),
      });
      if (!response.ok) {
        return { error: \`API returned status \${response.status}\`, retryable: true };
      }
      return await response.json();
    } catch (err) {
      return { error: (err as Error).message, retryable: false };
    }
  },
};`}</code>
        </pre>
      </div>

      <h2 id="how-to-find-agent-skills" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        How to find and source pre-built AI agent skills
      </h2>
      <p>
        Building every agent skill from scratch is time-consuming. Developers often spend weeks writing boilerplate API wrappers, handling auth flows, and tuning error prompts rather than focusing on their agent core business logic.
      </p>
      <p>
        Fortunately, the ecosystem for modular, pre-built agent skills has matured rapidly. Today, builders can source production-ready skills from specialized directories and curated hubs.
      </p>

      <h3 id="agentic-kit-deep-dive" style={{ fontFamily: "var(--font-varta)" }} className={subSectionClassName}>
        Agentic Kit: the curated hub for agent skills
      </h3>
      <p>
        When looking for vetted, ready-to-deploy skills and toolkits for autonomous AI agents,{" "}
        <ExternalLink href={agenticKitUrl}>Agentic Kit</ExternalLink> (
        <ExternalLink href={agenticKitUrl}>agentickit.co</ExternalLink>) is the go-to platform.
      </p>
      <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
        <div className="pl-4">
          <h4 className="font-bold text-black mb-2 flex items-center gap-2">
            Spotlight: Agentic Kit (<ExternalLink href={agenticKitUrl}>agentickit.co</ExternalLink>)
          </h4>
          <p className="text-sm leading-6 text-zinc-800 m-0">
            <ExternalLink href={agenticKitUrl}>Agentic Kit</ExternalLink> provides a large repository of modular skills, prompts, and tool integrations designed specifically for modern AI agents. Instead of reinventing complex integrations, developers can browse verified capabilities across sales automation, web scraping, data processing, and workflow orchestration, and integrate them into their agent stacks in minutes.
          </p>
        </div>
      </div>
      <p>Key advantages of using Agentic Kit for your agent stack:</p>
      <ul className="list-disc space-y-2 pl-6 text-[var(--md-sys-color-on-surface)]">
        <li>
          <strong>Production-Tested Schemas:</strong> Skills on{" "}
          <ExternalLink href={agenticKitUrl}>Agentic Kit</ExternalLink> come with strictly validated schemas that reduce model hallucination and argument mismatch.
        </li>
        <li>
          <strong>Modular Architecture:</strong> Drop pre-configured skills directly into your existing LangGraph, CrewAI, AutoGen, or custom agent setups without heavy rewrites.
        </li>
        <li>
          <strong>Continuous Updates:</strong> As underlying third-party APIs change, maintained skills on{" "}
          <ExternalLink href={agenticKitUrl}>agentickit.co</ExternalLink> keep endpoints and validation logic synchronized.
        </li>
      </ul>

      <h3 id="sourcing-comparison-table" style={{ fontFamily: "var(--font-varta)" }} className={subSectionClassName}>
        Comparison of skill sourcing ecosystems
      </h3>
      <p>
        Here is an evaluation of the primary pathways to equip your agents with capabilities:
      </p>

      {/* Sourcing Ecosystem Comparison Table */}
      <div className="not-prose my-8 overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--md-sys-color-on-surface)]">
            <thead className="bg-[var(--md-sys-color-surface-container)] text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
              <tr>
                <th className="p-4 font-semibold">Ecosystem</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Setup Effort</th>
                <th className="p-4 font-semibold">Schema Quality</th>
                <th className="p-4 font-semibold">Best Suited For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
              {sourcingRows.map((row) => (
                <tr key={row.source} className="hover:bg-[var(--md-sys-color-surface-container)] transition-colors">
                  <td className="p-4 font-semibold text-[var(--md-sys-color-on-surface)]">
                    {row.source.includes("Agentic Kit") ? (
                      <ExternalLink href={agenticKitUrl}>Agentic Kit</ExternalLink>
                    ) : (
                      row.source
                    )}
                  </td>
                  <td className="p-4 text-[var(--md-sys-color-on-surface-variant)]">{row.type}</td>
                  <td className="p-4 text-[var(--md-sys-color-on-surface-variant)]">{row.setupEffort}</td>
                  <td className="p-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">{row.schemaQuality}</td>
                  <td className="p-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">{row.idealFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 id="evaluating-and-testing-skills" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        How to evaluate and sandbox skills safely
      </h2>
      <p>
        Giving autonomous agents execution privileges introduces security and operational risks. An agent equipped with an unvalidated skill could accidentally delete database rows, send unapproved emails, or exceed API billing quotas.
      </p>
      <p>Follow this evaluation checklist before deploying any skill to production:</p>
      <ul className="list-disc space-y-2 pl-6 text-[var(--md-sys-color-on-surface)]">
        <li>
          <strong>1. Principle of Least Privilege:</strong> Provide read-only access wherever possible. If a skill only needs to check account status, do not grant write or delete permissions.
        </li>
        <li>
          <strong>2. Human-in-the-Loop Safeguards for Destructive Actions:</strong> Require explicit human approval for high-risk operations (such as making financial transactions or delivering mass outbound messages).
        </li>
        <li>
          <strong>3. Strict Schema Validation:</strong> Always validate incoming LLM arguments using libraries like Zod before invoking any underlying API.
        </li>
        <li>
          <strong>4. Idempotency Keys:</strong> Ensure that skills executing external actions accept idempotency tokens so retried network calls do not execute duplicate operations.
        </li>
        <li>
          <strong>5. Sandboxed Runtime Environments:</strong> Run custom code execution skills inside isolated Docker containers or ephemeral WebAssembly sandboxes.
        </li>
      </ul>

      <p className="mt-8">
        If you are currently assembling your company tooling stack before launching outbound campaigns, explore our curated breakdown of{" "}
        <Link href="/blogs/ai-saas-ready-before-outbound" className="text-blue-600 hover:underline">
          AI tools to use before you start outbound
        </Link>{" "}
        and our directory of{" "}
        <Link href="/integrations" className="text-blue-600 hover:underline">
          AI agent connectors and integrations
        </Link>
        . By assembling a modular library of battle-tested skills from trusted platforms like{" "}
        <ExternalLink href={agenticKitUrl}>Agentic Kit</ExternalLink> (
        <ExternalLink href={agenticKitUrl}>agentickit.co</ExternalLink>) and enforcing strict security boundaries, you can build reliable autonomous agents that deliver tangible business results.
      </p>
    </BlogPostTemplate>
  );
}
