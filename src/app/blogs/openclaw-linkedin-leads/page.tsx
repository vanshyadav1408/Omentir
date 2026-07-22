import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "OpenClaw LinkedIn Leads: How to Run Prospecting Through an Agent - Omentir",
  description:
    "A practical workflow for using OpenClaw as the operator layer for LinkedIn lead discovery, qualification, and safe outreach handoff.",
  path: "/blogs/openclaw-linkedin-leads",
  image: {
    url: "/openclaw-linkedin-leads.avif",
    width: 1536,
    height: 768,
    alt: "Agent-led LinkedIn prospecting workflow",
  },
  keywords: [
    "OpenClaw LinkedIn leads",
    "AI agent prospecting",
    "MCP LinkedIn outreach",
    "agent-led sales workflow",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "openclaw-is-the-operator", label: "OpenClaw Is the Operator", level: 1 },
  { id: "define-the-sales-job", label: "Define the Sales Job", level: 1 },
  { id: "connect-the-right-tools", label: "Connect the Right Tools", level: 1 },
  { id: "lead-qualification-loop", label: "Lead Qualification Loop", level: 1 },
  { id: "approval-gates", label: "Approval Gates", level: 2 },
  { id: "daily-agent-routine", label: "Daily Agent Routine", level: 1 },
  { id: "where-omentir-fits", label: "Where Omentir Fits", level: 1 },
  { id: "faqs", label: "FAQs", level: 1 },
];

const faqItems = [
  {
    question: "Can OpenClaw find LinkedIn leads without another tool?",
    answer:
      "OpenClaw can coordinate the work, but it still needs reliable data sources and approved tools. Treat it as the operator that calls your prospecting, CRM, notes, and outreach systems rather than as a standalone LinkedIn database.",
  },
  {
    question: "Should OpenClaw send LinkedIn messages automatically?",
    answer:
      "For founder-led outbound, keep human approval in the loop. Let the agent research, score, draft, and prepare a campaign, but review the prospect list and copy before anything sends from your LinkedIn account.",
  },
  {
    question: "What makes OpenClaw useful for prospecting?",
    answer:
      "Its strength is orchestration. You can ask for a business outcome in plain language, then have the agent gather context, call MCP tools, summarize fit, and return a clear shortlist instead of making you hop across tabs.",
  },
  {
    question: "How does Omentir change the workflow?",
    answer:
      "Omentir gives the agent a purpose-built lead system to call: configure discovery agents, search scored leads, retrieve exact lead context, inspect activity, and work with existing reply conversations through MCP or REST.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="OpenClaw LinkedIn Leads: How to Run Prospecting Through an Agent"
      description="A practical workflow for using OpenClaw as the operator layer for LinkedIn lead discovery, qualification, and safe outreach handoff."
      slug="openclaw-linkedin-leads"
      publishedDate="May 15, 2026"
      updatedDate="May 15, 2026"
      bannerSrc="/openclaw-linkedin-leads.avif"
      bannerAlt="Agent-led LinkedIn prospecting workflow"
      faqItems={faqItems}
      tocItems={tocItems}
    >
      <p>
        <a href="https://openclaw.ai/" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          OpenClaw
        </a>{" "}
        is most useful for LinkedIn lead generation when you stop treating it like a list generator and start treating it like an operator. The agent should not guess who your buyers are. It should run a defined prospecting workflow, inspect evidence, and return a qualified shortlist you can trust.
      </p>
      <p>
        That distinction matters because LinkedIn outbound has two separate jobs. One job is finding people who match your market. The harder job is deciding who deserves a message today and what proof supports that decision.
      </p>
      <p>
        This guide is for founders, technical operators, and small sales teams that want to control prospecting from an agent interface without turning LinkedIn into a spam channel. The goal is a repeatable operating loop: define the sales job, connect the right tools, score leads, approve outreach, and learn from replies.
      </p>

      <h2
        id="openclaw-is-the-operator"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        OpenClaw Is the Operator
      </h2>
      <p>
        OpenClaw describes itself as a personal AI assistant that can work from chat surfaces and connect to tools. In sales terms, that makes it a coordinator: you can ask it for an outcome, and it can gather context, call tools, and report progress back in plain language.
      </p>
      <p>
        Do not confuse coordination with source-of-truth data. OpenClaw still needs access to a real prospecting system, CRM, document, or API if you want it to return real leads. Without that, it will produce plausible but unverifiable names, which is worse than an empty list.
      </p>
      <p>
        The cleaner mental model is simple: OpenClaw is the operator, your lead sources are the inputs, your scoring rules are the judgment criteria, and your outreach tool is the execution surface. Keep those roles separate and the workflow becomes much easier to debug.
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li>
          <strong>Operator layer:</strong> OpenClaw receives the sales task, tracks the steps, and summarizes what happened.
        </li>
        <li>
          <strong>Data layer:</strong> LinkedIn, saved searches, CRM records, product notes, and lead groups provide the raw evidence.
        </li>
        <li>
          <strong>Judgment layer:</strong> your ICP rules decide which prospects are worth pursuing.
        </li>
        <li>
          <strong>Execution layer:</strong> outreach is drafted, reviewed, and sent through a controlled system.
        </li>
      </ul>

      <h2
        id="define-the-sales-job"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Define the Sales Job
      </h2>
      <p>
        A weak agent instruction sounds like this: "Find me leads on LinkedIn." It is short, but it hides every important decision. The agent does not know which market to prioritize, what counts as urgency, which buyers are bad fits, or what you want done with the results.
      </p>
      <p>
        A strong instruction gives OpenClaw a job spec. It names the buyer, the pain, the evidence threshold, the output format, and the approval boundary.
      </p>
      <div className="my-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="font-mono text-sm leading-7 text-zinc-800">
          Find 30 LinkedIn prospects for [product]. Prioritize [buyer title] at [company type] with [trigger signal]. Reject agencies, students, consultants, and companies below [size]. For each lead, return the profile context, company context, why they fit, one risk, and whether they should be messaged now, nurtured, or skipped. Do not draft outreach until I approve the list.
        </p>
      </div>
      <p>
        The final sentence is not decoration. It keeps the agent from racing into outreach before you have checked the quality of the list.
      </p>
      <p>
        If your market is still fuzzy, run this manually for a few batches first. The article on{" "}
        <Link href="/blogs/chatgpt-linkedin-leads" className="text-blue-600 hover:underline">
          using ChatGPT for LinkedIn lead qualification
        </Link>{" "}
        covers the reasoning step in more detail, while this OpenClaw workflow focuses on orchestration.
      </p>

      <h2
        id="connect-the-right-tools"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Connect the Right Tools
      </h2>
      <p>
        OpenClaw becomes more useful when it can call tools through the{" "}
        <a href="https://modelcontextprotocol.io/" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          Model Context Protocol
        </a>{" "}
        or a direct API. The official{" "}
        <a href="https://docs.openclaw.ai/cli/mcp" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          OpenClaw MCP documentation
        </a>{" "}
        describes how MCP can expose external capabilities to an agent workflow.
      </p>
      <p>
        For LinkedIn leads, the connected tools should answer specific questions. Can the agent read your product profile? Can it create or inspect lead groups? Can it search discovered prospects? Can it retrieve one exact lead with qualification context? Can it inspect activity and existing replies?
      </p>
      <p>
        Avoid connecting every tool just because you can. Sales agents get safer when each tool has a narrow purpose and a clear permission boundary.
      </p>
      <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
        <div className="pl-4">
          <h4 className="font-bold text-black mb-2 flex items-center gap-2">
            Tool Access Checklist
          </h4>
          <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-sm text-zinc-800">
            <li>Read-only workspace context before write access.</li>
            <li>Lead listing before campaign creation.</li>
            <li>Draft campaign creation before live sending.</li>
            <li>Dry-run checks before activation.</li>
            <li>Reply reading before reply sending.</li>
          </ul>
        </div>
      </div>
      <p>
        This gradual permission model mirrors how you would onboard a new sales hire. You would not give someone full sending authority on day one; you would first inspect their research, then their drafts, then their judgment in live threads.
      </p>

      <h2
        id="lead-qualification-loop"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Lead Qualification Loop
      </h2>
      <p>
        The agent loop should be boring and explicit. OpenClaw receives the prospecting job, pulls candidates from the connected system, scores them against your ICP, asks for missing evidence when needed, and returns a shortlist grouped by action.
      </p>
      <p>
        The output should not be a pile of names. It should be a decision table that lets you see why the agent recommends each next step.
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li>
          <strong>Message now:</strong> clear buyer, clear pain, clear timing signal, and no obvious disqualifier.
        </li>
        <li>
          <strong>Research more:</strong> good company, uncertain buyer ownership, or missing context.
        </li>
        <li>
          <strong>Nurture:</strong> relevant person but weak timing signal.
        </li>
        <li>
          <strong>Skip:</strong> wrong market, wrong buyer, bad fit, or no credible reason to start a conversation.
        </li>
      </ul>
      <p>
        Ask the agent to include a confidence note for every recommendation. A short "why" field catches a surprising number of mistakes because the agent must expose its reasoning instead of hiding behind a score.
      </p>
      <p>
        The cleanest output format is a compact table with six fields: person, company, signal, fit reason, risk, and next action. That gives you enough context to make a decision without forcing you to reread every profile from scratch.
      </p>
      <p>
        The signal field should be factual. "Hiring two account executives" is a signal; "probably scaling sales" is an interpretation. The fit reason can contain interpretation, but it should point back to the signal so you can audit the agent's work quickly.
      </p>
      <p>
        The risk field is where the workflow gets honest. A prospect might be senior enough but outside your geography, in the right industry but at the wrong company stage, or visibly interested in the topic but not responsible for budget. Those notes prevent the agent from presenting every lead as equally ready.
      </p>
      <p>
        Over time, save the agent's best and worst lead notes. The best notes become examples for future runs; the worst notes become disqualification rules. This is how an agent-led workflow improves without quietly drifting away from your actual market.
      </p>

      <h3 id="approval-gates" className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">
        Approval Gates
      </h3>
      <p>
        There are three approval gates that should exist before live outreach: approve the ICP, approve the lead list, and approve the copy. If any one of those gates is skipped, the campaign can look automated even when every individual step seems reasonable.
      </p>
      <p>
        The ICP gate asks whether the agent is looking for the right market. The lead gate asks whether the individual people actually fit. The copy gate asks whether the message sounds like something you would send from your own profile.
      </p>
      <p>
        This is especially important on{" "}
        <a href="https://www.linkedin.com/" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
          LinkedIn
        </a>
        , where messages come from a personal account, not an anonymous marketing domain. A bad campaign does not just waste credits; it makes your profile look careless.
      </p>

      <h2
        id="daily-agent-routine"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Daily Agent Routine
      </h2>
      <p>
        The advantage of an agent-led workflow is cadence. You can ask OpenClaw to run the same operating loop every morning, summarize what changed, and queue only the decisions that need you.
      </p>
      <p>
        Keep the daily routine small at first. A founder does not need 500 leads from an agent; they need 10 to 25 prospects they can actually inspect and message thoughtfully.
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li>
          <strong>Morning:</strong> review new candidates and ask the agent why each top prospect fits.
        </li>
        <li>
          <strong>Midday:</strong> approve or reject the shortlist, then ask for drafts only for approved leads.
        </li>
        <li>
          <strong>Afternoon:</strong> inspect accepted connections, reply intent, and follow-up due dates.
        </li>
        <li>
          <strong>Friday:</strong> ask the agent to summarize which ICP assumptions produced replies and which produced silence.
        </li>
      </ul>
      <p>
        If the agent starts recommending too many weak prospects, tighten the job spec rather than increasing volume. Better targeting compounds; bad targeting only creates more cleanup.
      </p>
      <p>
        For copy once the list is approved, use a separate playbook like{" "}
        <Link href="/blogs/10-linkedin-cold-message-templates-that-actually-book-demos" className="text-blue-600 hover:underline">
          these LinkedIn cold message templates
        </Link>{" "}
        or the guide to{" "}
        <Link href="/blogs/how-to-pitch-a-b2b-saas-on-linkedin-without-being-spammy" className="text-blue-600 hover:underline">
          pitching B2B SaaS without sounding spammy
        </Link>
        . Do not let one agent prompt collapse research, targeting, copywriting, and follow-up into one unreviewed blob.
      </p>

      <h2
        id="where-omentir-fits"
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
      >
        Where Omentir Fits
      </h2>
      <p>
        OpenClaw is the operator interface. Omentir can be the sales system it operates. Through the{" "}
        <Link href="/for-agents" className="text-blue-600 hover:underline">
          Omentir agent workflow
        </Link>
        , an AI agent can read workspace context, configure ICP discovery agents, search and rank discovered leads, retrieve exact lead records, inspect activity, and work with existing reply conversations.
      </p>
      <p>
        That combination keeps responsibilities clean. OpenClaw handles the conversation with you; Omentir handles the LinkedIn-specific sales motion: finding ICP-fit buyers, drafting personalized outreach, respecting human-paced sending limits, and collecting replies in one inbox sorted by intent.
      </p>
      <p>
        The practical prompt becomes: "OpenClaw, use Omentir to find 20 new ICP-fit leads, show the top 10 above an 80 fit score, and retrieve the full context for the five I approve." That is specific enough to be useful and constrained enough to be safe.
      </p>
      <p>
        If you want to understand how this differs from a pure chat workflow, compare it with the earlier guide on{" "}
        <Link href="/blogs/chatgpt-linkedin-leads" className="text-blue-600 hover:underline">
          ChatGPT LinkedIn lead research
        </Link>
        . ChatGPT helps reason about fit. OpenClaw helps operate the workflow. Omentir gives the workflow a production sales surface.
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
