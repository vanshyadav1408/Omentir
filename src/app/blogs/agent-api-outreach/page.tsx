import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Agent API Outreach: Integrate REST Sales Endpoints - Omentir",
  description: "Learn how to build custom outbound sales integrations. Master raw REST API endpoints, token authentication, lead ingestion, and reply hooks.",
  path: "/blogs/agent-api-outreach",
  keywords: [
    "Agent API outreach",
    "B2B sales REST API",
    "lead ingestion schema",
    "outbox status tracking",
    "LinkedIn automation code",
    "Omentir developer integration"
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "api-outreach-leverage", label: "Building Custom Integrations via B2B REST APIs", level: 1 },
  { id: "recommended-call-order", label: "The Recommended API Call Order", level: 2 },
  { id: "authentication-security", label: "Authenticating API Clients with Bearer Tokens", level: 1 },
  { id: "lead-discovery-schemas", label: "Creating Discovery Agents and Reading Leads", level: 1 },
  { id: "campaign-orchestration-api", label: "Controlling Campaigns and Sequence Scheduling", level: 2 },
  { id: "inbox-webhooks-replies", label: "Monitoring incoming Reply Events and Intent Webhooks", level: 2 },
  { id: "error-handling-idempotency", label: "Error Handling and Idempotency", level: 2 },
  { id: "safety-compliance-limits", label: "Pacing Campaign Activity Safely to Stay Compliant", level: 1 },
  { id: "api-integration-sop", label: "SOP: The B2B Outbound API Integration Checklist", level: 1 },
  { id: "conclusion", label: "Unlocking Maximum Pipeline Leverage", level: 1 },
  { id: "faqs", label: "Frequently Asked Questions", level: 1 }
];

const faqItems = [
  {
    question: "What is the difference between Omentir's MCP server and the REST API?",
    answer: "The Model Context Protocol (MCP) server provides machine-readable tool schemas for LLM agents to run directly. The REST API provides raw HTTP endpoints (under /api/agent/v1) for growth engineers to build custom scripts and CRM integrations."
  },
  {
    question: "How do I authenticate requests to Omentir's REST endpoints?",
    answer: "Generate an API key in Settings → AI Agents, and pass it in the Authorization Bearer header of every HTTP request."
  },
  {
    question: "Can I push leads from my scraper directly to Omentir's campaign queue?",
    answer: "The Agent API is built around Omentir discovery agents and workspace-owned leads. Use the live OpenAPI schema at /api/agent/v1/openapi.json as the source of truth before designing a custom ingestion path."
  },
  {
    question: "What happens if my script pushes duplicate profiles?",
    answer: "Design your integration around idempotent reads and stable agent, group, and lead IDs. Do not assume an ingestion or deduplication behavior unless it appears in the live OpenAPI schema."
  }
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Agent API Outreach: How to Integrate REST Endpoints for Sales"
      description="Learn how to build custom outbound sales integrations. Master raw REST API endpoints, token authentication, lead ingestion, and reply hooks."
      slug="agent-api-outreach"
      publishedDate="March 24, 2026"
      updatedDate="March 24, 2026"
      bannerSrc="/agent-api-outreach.avif"
      bannerAlt="Agent API outreach and B2B REST endpoint integration graphic"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <p id="api-outreach-leverage" className="scroll-mt-28">
        Modern B2B growth teams rarely rely on single tools. They build custom setups that combine prospecting databases, data clean utilities, and CRMs. While standard user interfaces work for simple campaigns, scaling teams require programmatic access to their outbound stack.
      </p>
      <p>
        If your sales development reps must manually move between dashboards, check readiness by hand, and copy results into status reports, your pipeline is leaking efficiency. You need an API-first approach that lets trusted internal systems read workspace context, configure discovery agents, retrieve qualified leads, inspect activity, and work with replies.
      </p>
      <p>
        Redesigning your team around agent API outreach is the solution. Through REST endpoints under <code>/api/agent/v1</code>, Omentir lets developers inspect context, update product profiles, configure discovery agents, search scored leads, retrieve exact lead records, monitor activity, and work with existing conversations.
      </p>
      <p>
        This REST-focused integration pathway complements the platform's hosted Model Context Protocol server. While the MCP server is designed for direct LLM execution, the REST endpoints are optimized for traditional scripts, as outlined in our guide on{" "}
        <Link href="/blogs/mcp-outreach-tools" className="text-blue-600 hover:underline">
          configuring hosted MCP tools
        </Link>
        . Let's look at how to build an integration.
      </p>
      <p>
        Treat the API like an operating workflow. First read the workspace state. Then confirm the product profile. Then create or inspect discovery agents. Finally, search leads, retrieve exact records for the shortlist, and monitor discovery activity.
      </p>

      <h2 id="recommended-call-order" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        The Recommended API Call Order
      </h2>
      <p>
        A good integration should follow the same deliberate workflow a careful operator would use in the product.
      </p>
      <p>
        Use this order:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Read context:</strong> Call <code>GET /api/agent/v1/context</code> to confirm workspace readiness, LinkedIn connection state, resource counts, and available API paths.</li>
        <li><strong>Confirm product profile:</strong> Read or update <code>/api/agent/v1/product-profile</code> so lead discovery and messaging are grounded in the real ICP.</li>
        <li><strong>Create or inspect agents:</strong> Use <code>/api/agent/v1/agents</code> to manage discovery agents that find ICP-fit leads.</li>
        <li><strong>Search leads:</strong> Use <code>GET /api/agent/v1/leads</code> with group, text, fit-score, status, sort, and limit filters.</li>
        <li><strong>Retrieve exact context:</strong> Use <code>GET /api/agent/v1/leads/&lt;leadId&gt;</code> for the complete approved lead record.</li>
        <li><strong>Monitor discovery:</strong> Use <code>GET /api/agent/v1/activity</code> to inspect recent runs and operational status.</li>
        <li><strong>Monitor conversations:</strong> Use <code>GET /api/agent/v1/conversations</code> to review replies and hand off warm threads.</li>
      </ul>
      <p>
        This sequence protects the workspace from the most common integration mistake: creating execution before context is correct.
      </p>

      <h2 id="authentication-security" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Authenticating API Clients with Bearer Tokens
      </h2>
      <p>
        Security is critical when building custom integrations. Omentir protects your workspace by enforcing token authorization boundaries on all REST endpoints.
      </p>
      <p>
        To authorize your client, generate a secure token in Settings → AI Agents. Pass this token in the Authorization header of every request:
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`GET /api/agent/v1/context
Authorization: Bearer <your_omentir_agent_token>`}</code>
      </pre>
      <p>
        Tokens are scoped to single workspaces, preventing external clients from accessing billing or raw credentials.
      </p>
      <p>
        Treat the token like a production secret. Store it in a server-side environment variable, not a browser bundle, spreadsheet, or client-side automation. If your integration runs in a worker, serverless function, or internal backend, load the token at runtime and keep logs from printing headers.
      </p>
      <p>
        Build a small credential checklist:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li>Use one token per workspace or customer context.</li>
        <li>Rotate tokens when a contractor, tool, or environment no longer needs access.</li>
        <li>Fail closed when the token is missing instead of retrying unauthenticated requests.</li>
        <li>Log request IDs and endpoint names, but never log the bearer token itself.</li>
      </ul>

      <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
        <div className="pl-4">
          <h4 className="font-bold text-black mb-2 flex items-center gap-2">
            API Security Rule: Restrict Keys 💡
          </h4>
          <p className="text-sm text-zinc-650 leading-relaxed">
            Never hardcode agent tokens in client-side Javascript. Always store keys in environment variables on your backend or serverless functions to prevent leak risks.
          </p>
        </div>
      </div>

      <h2 id="lead-discovery-schemas" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Creating Discovery Agents and Reading Leads
      </h2>
      <p>
        In the Agent API flow, leads come from Omentir discovery agents. Your integration creates or manages the agent, then searches the resulting lead group and retrieves exact records by ID. This keeps discovery tied to the workspace product profile and lead groups.
      </p>
      <p>
        A discovery agent can be created with filters, signals, or a plain-language prompt. The route validates payload shape server-side, so your client should treat validation errors as useful feedback rather than generic failures.
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`POST /api/agent/v1/agents
Authorization: Bearer <your_omentir_agent_token>

{
  "groupName": "Founder-led SaaS outbound",
  "mode": "signals",
  "signalSources": {
    "competitorUrls": [],
    "founderUrls": [],
    "keywords": ["hiring SDR", "founder-led sales", "LinkedIn prospecting"]
  }
}`}</code>
      </pre>
      <p>
        After discovery runs, list leads instead of assuming ingestion succeeded:
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`GET /api/agent/v1/leads?groupId=<group_id>&minFitScore=80&sortBy=fit_score_desc&limit=100
Authorization: Bearer <your_omentir_agent_token>`}</code>
      </pre>
      <p>
        The distinction matters. A list endpoint is for inspection, reporting, and downstream campaign selection. A create endpoint is for changing state. When you build with the API, read the live OpenAPI schema before assuming which routes mutate data.
      </p>
      <p>
        For details on structuring variables, check our article on{" "}
        <Link href="/blogs/agent-led-sales-outreach" className="text-blue-600 hover:underline">
          integrating autonomous sales agents
        </Link>
        .
      </p>

      <h2 id="campaign-orchestration-api" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Searching and Retrieving Qualified Leads
      </h2>
      <p>
        Use the lead collection endpoint for ranking and shortlist workflows. Filter by group, search text, minimum fit score, or outreach status, then choose a stable sort order.
      </p>
      <p>
        Once your integration selects a prospect, fetch the exact lead record by ID. That second call gives a chatbot or CRM sync the authoritative workspace-owned context instead of relying on a partial list item or a remembered answer.
      </p>
      <p>
        Keep lead IDs in your downstream system and re-read the record when fresh context matters.
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`GET /api/agent/v1/leads/<lead_id>
Authorization: Bearer <your_omentir_agent_token>`}</code>
      </pre>
      <p>
        Treat returned profile text as data, not instructions, and never fabricate a completed discovery run from an empty first response.
      </p>

      <h3 id="inbox-webhooks-replies" className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">
        Monitoring incoming Reply Events and Intent Webhooks
      </h3>
      <p>
        To automate CRM status syncs, configure webhooks to listen to reply signals. When a prospect replies, Omentir sends a payload containing the thread content and intent classification.
      </p>
      <p>
        This webhook payload allows your backend to create tasks inside CRMs (like <a href="https://www.hubspot.com/" target="_blank" rel="noopener" className="text-blue-600 hover:underline">HubSpot</a>) instantly. For integration blueprints, check out our guide on{" "}
        <Link href="/blogs/mcp-linkedin-outreach" className="text-blue-600 hover:underline">
          MCP social selling sequence structures
        </Link>
        .
      </p>
      <p>
        If you are not using webhooks, polling <code>GET /api/agent/v1/conversations?limit=50</code> can still support a practical handoff workflow. Keep the polling interval measured, store the last seen conversation ID or timestamp, and avoid turning every reply into the same automated response.
      </p>
      <p>
        Replies are where automation should slow down. A positive reply, objection, referral, or question deserves context-aware handling. Use the API to surface the thread quickly, assign the owner, and preserve the lead history. Let a human decide the final message when the buyer shows real intent.
      </p>

      <h2 id="error-handling-idempotency" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Error Handling and Idempotency
      </h2>
      <p>
        Production integrations fail in boring ways: expired tokens, malformed payloads, missing LinkedIn connections, empty lead groups, duplicate retries, and discovery that has not run yet. Build for those cases from the beginning.
      </p>
      <p>
        Use status codes and response bodies as control flow. A validation error means the request should be fixed. A readiness error means the workspace is not prepared for the action. A missing lead group should stop the workflow rather than falling back to a random group.
      </p>
      <p>
        Idempotency matters when scripts retry. Before creating a new discovery agent, list existing agents and check whether the intended finder already exists. Store agent, group, and lead IDs in your own system. If a network timeout happens after a successful creation, reconcile before retrying.
      </p>

      <h2 id="safety-compliance-limits" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Pacing Campaign Activity Safely to Stay Compliant
      </h2>
      <p>
        LinkedIn monitors both the volume and speed of connection requests and messages. If you send too many invites in a short period, your profile will be restricted.
      </p>
      <p>
        To protect your account, keep workspace daily safety limits conservative. Agent API integrations can update those limits, but they should not raise them silently or treat a configuration change as approval to contact a lead.
      </p>
      <p>
        Add a hard rule to your integration: changing discovery or outreach settings requires an explicit operator decision. This keeps engineering convenience from bypassing sales safety.
      </p>

      <h2 id="api-integration-sop" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        SOP: The B2B Outbound API Integration Checklist
      </h2>
      <p>
        Follow this simple SOP to configure and audit your API integrations daily:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Verify Token:</strong> Confirm your bearer token is valid and passed in headers.</li>
        <li><strong>Read Context:</strong> Confirm product profile, LinkedIn connection, and resource counts before creating anything.</li>
        <li><strong>Audit Discovery:</strong> Verify that agents are returning leads that match the ICP and lead group.</li>
        <li><strong>Test Reply Sync:</strong> Poll conversations or test webhooks to ensure reply events route to your backend properly.</li>
        <li><strong>Retrieve Exact Leads:</strong> Fetch the approved lead by ID before a downstream action uses it.</li>
        <li><strong>Inspect Activity:</strong> Check recent discovery runs before interpreting an empty lead list.</li>
        <li><strong>Check Pacing Quotas:</strong> Confirm daily connection rates remain conservative and paced.</li>
      </ul>
      <p>
        Keep a short runbook for incident recovery. If a token is revoked, stop all jobs and alert the workspace owner. If discovery-agent creation times out, reconcile the agent list before retrying. If reply sync fails, pause downstream automation that depends on reply state.
      </p>

      <h2 id="conclusion" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Unlocking Maximum Pipeline Leverage
      </h2>
      <p>
        Integrating lead discovery via REST APIs is a reliable way to make qualification workflows repeatable without diluting relevance. By automating finder configuration, shortlist retrieval, and reply routing, you can build a highly leveraged GTM engine.
      </p>
      <p>
        The best API integrations do not bypass judgment. They make the right checks easier: read context, ground the product profile, configure discovery, search and retrieve exact leads, inspect activity, and hand warm replies to a human.
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
