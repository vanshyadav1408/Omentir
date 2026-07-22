import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "MCP Outreach Tools: Configure Model Context Protocol - Omentir",
  description: "Learn how to connect and configure the hosted Model Context Protocol server. Master client configuration, authentication, and agent tools.",
  path: "/blogs/mcp-outreach-tools",
  keywords: [
    "MCP outreach tools",
    "Model Context Protocol setup",
    "Omentir MCP server",
    "Claude MCP integration",
    "Cursor agent tools",
    "B2B sales automation API"
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "mcp-standardization", label: "How Model Context Protocol Standardizes AI Tool Access", level: 1 },
  { id: "omentir-mcp-server", label: "The Omentir Hosted MCP Server Architecture", level: 1 },
  { id: "configuring-clients", label: "Step-by-Step Client Setup for Cursor, Claude, and ChatGPT", level: 1 },
  { id: "cursor-setup", label: "Integrating with the Cursor IDE Agent", level: 2 },
  { id: "claude-code-setup", label: "Integrating with the Claude Code CLI", level: 2 },
  { id: "mcp-tool-catalog", label: "Deconstructing the Omentir MCP Tool Catalog", level: 1 },
  { id: "securing-agent-tokens", label: "Workspace Security and Token Authorization Boundaries", level: 1 },
  { id: "pacing-compliance-quotas", label: "Pacing Campaign Deliveries to Maintain Account Health", level: 1 },
  { id: "mcp-setup-checklist", label: "SOP: The MCP Client Setup and Audit Checklist", level: 1 },
  { id: "conclusion", label: "Empowering Your AI Agents with Context", level: 1 },
  { id: "faqs", label: "Frequently Asked Questions", level: 1 }
];

const faqItems = [
  {
    question: "What is a hosted MCP server and why does Omentir use it?",
    answer: "A hosted Model Context Protocol (MCP) server provides machine-readable tool schemas over standard protocols. This allows AI agents to discover, run, and evaluate tools dynamically without custom code integrations."
  },
  {
    question: "How do I authorize my MCP client to access my workspace?",
    answer: "Generate a secure agent token in Settings → AI Agents. Pass this token only as an Authorization Bearer header in your client setup."
  },
  {
    question: "Can I connect my agent if my client does not support headers?",
    answer: "No. Tokens in URLs leak into logs and copied links, so Omentir requires a client that supports Authorization headers."
  },
  {
    question: "What happens if my agent triggers a tool error during a campaign?",
    answer: "The MCP server returns structured error details, allowing the agent to adjust parameters (like changing a lead group or editing a message) and run the action again."
  }
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="MCP Outreach Tools: How to Configure Model Context Protocol for Sales"
      description="Learn how to connect and configure the hosted Model Context Protocol server. Master client configuration, authentication, and agent tools."
      slug="mcp-outreach-tools"
      publishedDate="April 6, 2026"
      updatedDate="April 6, 2026"
      bannerSrc="/mcp-outreach-tools.avif"
      bannerAlt="Model Context Protocol (MCP) server setup and client tools configuration dashboard illustration"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <p id="mcp-standardization" className="scroll-mt-28">
        Building custom integrations for AI agents is a major challenge for modern sales engineering teams. Every time you connect a model to a new tool, you must write API endpoints, document JSON schemas, and program custom logic. This manual setup is slow and makes it difficult to upgrade to new models.
      </p>
      <p>
        The solution to this integration bottleneck is the Model Context Protocol (<a href="https://modelcontextprotocol.io" target="_blank" rel="noopener" className="text-blue-600 hover:underline">MCP</a>). MCP is an open-source standard that defines how client applications connect to server tools. Instead of writing custom code, servers provide machine-readable schemas, allowing agents to discover and run tools automatically.
      </p>
      <p>
        Omentir adopts this standard with a hosted MCP server. Connecting an AI agent gives it a focused, workspace-scoped surface for product context, lead-finder configuration, scored-lead retrieval, discovery activity, and existing reply conversations. Let's look at how to configure your MCP clients.
      </p>
      <p>
        The important distinction is that MCP is not another automation shortcut. It is a clean contract between the agent and the sales system. The agent can see which tools exist, what each tool expects, and what the tool returned. That structure matters because outreach work has real consequences: the wrong lead group, the wrong campaign state, or the wrong reply can affect an actual prospect conversation.
      </p>
      <p>
        For teams that prefer standard REST integrations, the platform also provides full OpenAPI-compliant endpoints under <code>/api/agent/v1</code>. However, using the native MCP server provides the most seamless experience for modern developer environments, as detailed in our guide to{" "}
        <Link href="/for-agents" className="text-blue-600 hover:underline">
          Omentir's agent features
        </Link>
        .
      </p>

      <h2 id="omentir-mcp-server" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        The Omentir Hosted MCP Server Architecture
      </h2>
      <p>
        The Omentir MCP server runs as a hosted endpoint. Unlike local MCP servers that require Node.js or Python packages on your computer, the hosted server manages credentials and API pathways in the cloud.
      </p>
      <p>
        This hosted design makes configuration simple. You do not need to run terminal scripts or install external packages. You simply point your local client (like Cursor or Claude CLI) to the Omentir MCP URL and pass your workspace-scoped token as authorization.
      </p>
      <p>
        In practice, the hosted server sits between your agent client and your Omentir workspace. The client asks for available tools, the server returns tool schemas, and the agent chooses a tool call with structured arguments. Omentir then applies the same workspace checks, campaign rules, and pacing safeguards used by the rest of the product.
      </p>
      <p>
        This is especially useful for sales teams that want an AI assistant to help with operations without handing it unrestricted access. A founder can ask an agent to configure a lead finder, rank scored prospects, retrieve an exact lead, review existing conversations, or summarize discovery activity. Billing and account credentials stay outside the tool surface.
      </p>

      <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
        <div className="pl-4">
          <h4 className="font-bold text-black mb-2 flex items-center gap-2">
            The MCP Endpoint URL
          </h4>
          <p className="text-sm text-zinc-650 leading-relaxed font-mono">
            https://omentir.com/api/agent/v1/mcp
          </p>
        </div>
      </div>

      <h2 id="configuring-clients" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Step-by-Step Client Setup for Cursor, Claude, and ChatGPT
      </h2>
      <p>
        Setting up your client takes only a few minutes. The exact screen names can change as agent products evolve, but every setup needs the same three pieces: the Omentir MCP endpoint, your workspace token, and a supported transport method.
      </p>
      <p>
        Start by creating a fresh token for this use case rather than reusing an old one. Name it after the client, such as "Claude desktop prospecting" or "Cursor campaign QA." That makes later cleanup simple. If you stop using a client, revoke that token without affecting other agent workflows.
      </p>

      <h3 id="cursor-setup" className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">
        Integrating with the Cursor IDE Agent
      </h3>
      <p>
        To connect <a href="https://cursor.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Cursor</a> to Omentir, open your settings panel and navigate to the MCP server settings. Add a new server and enter the following settings:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Name:</strong> omentir</li>
        <li><strong>Type:</strong> SSE</li>
        <li><strong>URL:</strong> https://omentir.com/api/agent/v1/mcp</li>
        <li><strong>Header:</strong> Authorization: Bearer [your_omentir_agent_token]</li>
      </ul>
      <p>
        Once added, Cursor will discover Omentir's tools automatically, allowing you to ask the IDE agent to build campaigns or check responses directly from your editor.
      </p>
      <p>
        A good first prompt is deliberately boring: "Call <code>omentir_get_context</code> and summarize whether the workspace is ready for automation." If the agent can read workspace context, authentication is working. If it cannot, fix the token or client transport before asking it to create anything.
      </p>

      <h3 id="claude-code-setup" className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">
        Integrating with the Claude Code CLI
      </h3>
      <p>
        To connect <a href="https://www.anthropic.com/claude-code" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Claude Code</a>, add Omentir as an HTTP MCP server using your client configuration or command-line setup. A JSON client configuration usually follows this shape:
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`{
  "mcpServers": {
    "omentir": {
      "url": "https://omentir.com/api/agent/v1/mcp",
      "headers": {
        "Authorization": "Bearer <your_omentir_agent_token>"
      }
    }
  }
}`}</code>
      </pre>
      <p>
        Save the file and restart your CLI session to verify the connection.
      </p>
      <p>
        Clients that do not support custom authorization headers cannot securely connect to Omentir. Never place an agent token in the endpoint URL, shared docs, screenshots, or public issue trackers.
      </p>

      <h2 id="mcp-tool-catalog" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Deconstructing the Omentir MCP Tool Catalog
      </h2>
      <p>
        The Omentir MCP server provides 25 tools that cover the entire outbound workflow. These tools are grouped into five functional categories:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Context & Profile:</strong> Tools like <code>omentir_get_context</code> and <code>omentir_get_product_profile</code> that read your target buyer parameters and feature details.</li>
        <li><strong>Lead Discovery:</strong> Tools like <code>omentir_create_agent</code> and <code>omentir_list_leads</code> that search LinkedIn daily and score fit profiles.</li>
        <li><strong>Lead inspection:</strong> <code>omentir_get_lead</code> retrieves one exact workspace-owned lead with qualification context.</li>
        <li><strong>Lifecycle Management:</strong> Tools to edit, pause, resume, or remove discovery agents and campaigns, and to tune outreach settings like daily sending limits.</li>
        <li><strong>Replies:</strong> Tools like <code>omentir_list_conversations</code> and <code>omentir_reply_to_lead</code> that monitor your inbox and draft responses.</li>
      </ul>
      <p>
        Think of these categories as a workflow, not a menu. A sensible agent run begins with context, checks the product profile, inspects existing agents or campaigns, then decides whether to create something new. Jumping straight to campaign creation is usually a bad prompt because the agent has not yet learned the workspace constraints.
      </p>
      <p>
        A strong operator prompt might be: "Read the workspace context and product profile. List active lead groups. If there is no group for early-stage SaaS founders selling to sales teams, propose a draft discovery agent and explain the targeting assumptions before creating it." That prompt keeps the agent anchored to evidence and asks for assumptions before action.
      </p>
      <p>
        For detailed campaign configuration steps, read our guide to{" "}
        <Link href="/blogs/mcp-linkedin-outreach" className="text-blue-600 hover:underline">
          MCP B2B campaign design
        </Link>
        .
      </p>

      <h2 id="securing-agent-tokens" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Workspace Security and Token Authorization Boundaries
      </h2>
      <p>
        Security is critical when delegating tasks to AI agents. Omentir protects your workspace by enforcing strict authorization boundaries on all agent tokens.
      </p>
      <p>
        Each token is scoped to a single workspace. It cannot edit billing details, view other accounts, or access your raw LinkedIn credentials. You can revoke tokens anytime in Settings → AI Agents, disabling access immediately.
      </p>
      <p>
        You should still treat agent access as production access. Use one token per client, rotate tokens when a teammate leaves, and keep the token out of prompts that might be saved in transcripts. If you are testing a new agent, begin with read-heavy tasks such as context checks, lead searches, exact-lead retrieval, and activity review before allowing it to change discovery agents or settings.
      </p>
      <p>
        The safest pattern is to separate planning from execution. Ask the agent to inspect context and propose changes first. Then ask it to apply the change only after you have reviewed the plan. This keeps the workflow fast while still preventing a model from quietly acting on a bad assumption.
      </p>
      <p>
        This security structure allows you to connect external agents without risking account safety. For integration blueprints, read our guide on{" "}
        <Link href="/blogs/agent-led-sales-outreach" className="text-blue-600 hover:underline">
          integrating autonomous sales agents
        </Link>
        .
      </p>

      <h2 id="pacing-compliance-quotas" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Pacing Campaign Deliveries to Maintain Account Health
      </h2>
      <p>
        LinkedIn monitors both the volume and speed of connection requests and messages. If you send too many invites in a short period, your profile will be restricted.
      </p>
      <p>
        To protect your account, configure campaigns around conservative daily quotas, natural sending windows, and reviewable drafts. Omentir manages these safety protocols automatically, coordinating outgoing messages through secure, human-paced queues.
      </p>
      <p>
        MCP does not change that philosophy. An agent can help build and inspect the outbound system, but it should not turn LinkedIn into a bulk sender. The best use of agent tooling is to improve lead fit, message relevance, and response handling while keeping the actual delivery pace human.
      </p>
      <p>
        Before trusting a shortlist, confirm the workspace has a connected LinkedIn account, the discovery agent is active, its targeting is intentional, and recent activity shows a completed run. If the first lead list is empty, inspect activity rather than claiming discovery is complete.
      </p>

      <h2 id="mcp-setup-checklist" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        SOP: The MCP Client Setup and Audit Checklist
      </h2>
      <p>
        Follow this simple SOP to configure and audit your client setups:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Mint Token:</strong> Go to Settings → AI Agents to generate a workspace token.</li>
        <li><strong>Select Client Type:</strong> Choose SSE (Server-Sent Events) for editor integrations (Cursor, VS Code) or JSON block for local configs (Claude Code).</li>
        <li><strong>Check Connection:</strong> Run a basic context tool call (e.g., <code>omentir_get_context</code>) to verify authentication.</li>
        <li><strong>Review Limits:</strong> Set campaign discovery agent quotas within daily safety boundaries.</li>
        <li><strong>Monitor Logs:</strong> Check Omentir logs to confirm that outgoing messages are sent using natural pacing.</li>
      </ul>
      <p>
        Add two checks for real-world usage. First, ask the agent to explain what it is about to do before it creates or resumes a lead finder. Second, keep a short changelog of agent changes: who prompted them, what target segment was chosen, and which finder settings changed. That record makes later debugging much easier.
      </p>
      <p>
        If a tool call fails, do not immediately retry with random parameters. Read the structured error, identify whether the problem is authentication, missing workspace setup, invalid tool arguments, or campaign readiness, and then make the smallest correction. Good MCP usage feels like operating software with a careful assistant, not like repeatedly asking a chatbot to guess.
      </p>

      <h2 id="conclusion" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Empowering Your AI Agents with Context
      </h2>
      <p>
        Connecting your AI agent to a hosted MCP server makes lead-discovery operations accessible from a chatbot while keeping access scoped and auditable. By documenting tools and securing tokens, you can build a reliable GTM workflow.
      </p>
      <p>
        Use Omentir to power your integration. Connect your client via MCP, configure a precise finder, review scored leads, and retrieve exact context before deciding the next step.
      </p>
      <p>
        The teams that get the most from MCP will not be the ones that automate the most actions. They will be the ones that give agents clean context, narrow permissions, and explicit review points. That is how you get the leverage of AI without losing control of the sales motion.
      </p>

      <h2
        id="faqs"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Frequently Asked Questions
      </h2>
      <FaqAccordion items={faqItems} />
    </BlogPostTemplate>
  );
}
