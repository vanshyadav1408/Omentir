import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";

export const metadata = createPageMetadata({
  title: "Programmatic Personalization: How to Write 100 Unique Cold Messages - Omentir",
  description: "Learn how to build a programmatic personalization script. Copy our TypeScript codebase to crawl sites, call LLM APIs, and write custom sales copy.",
  path: "/blogs/programmatic-personalization",
  keywords: [
    "programmatic personalization",
    "write 100 unique cold messages",
    "B2B outreach scripting",
    "LLM API copywriting",
    "sales automation code",
    "Omentir developer guide"
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "shift-to-programmatic", label: "Moving Beyond Simple Mail Merge Variables", level: 1 },
  { id: "pipeline-architecture", label: "The Programmatic Personalization Architecture", level: 1 },
  { id: "enrichment-crawling-step", label: "Extracting Live Context from Company Websites", level: 2 },
  { id: "copywriting-script-loop", label: "Copyable TypeScript Personalization Script", level: 2 },
  { id: "fallback-management", label: "Handling Stale Data and Empty Variable Fallbacks", level: 1 },
  { id: "safe-delivery-integration", label: "Routing Campaigns Safely to Avoid Account Bans", level: 1 },
  { id: "programmatic-sop-checklist", label: "SOP: Running Your First Programmatic Campaign", level: 1 },
  { id: "conclusion", label: "Scaling Relevance for Sustainable Outbound", level: 1 },
  { id: "faqs", label: "Frequently Asked Questions", level: 1 }
];

const faqItems = [
  {
    question: "What is programmatic personalization in outbound sales?",
    answer: "It is the practice of using custom scripts and API waterfalls to crawl prospect profiles, score business context, and generate unique, custom-tailored outreach copy for every contact."
  },
  {
    question: "How do I prevent the LLM API from making up false details in messages?",
    answer: "You must ground the prompt in verified inputs (such as website HTML extracts) and instruct the model to only use details present in the text, setting strict negative constraints against generic buzzwords."
  },
  {
    question: "Can I use Omentir's API to run this programmatic sequence?",
    answer: "Yes. Omentir provides REST endpoints under /api/agent/v1 and a hosted Model Context Protocol (MCP) server for workspace context, discovery agents, searchable scored leads, activity, existing conversations, and replies."
  },
  {
    question: "How many personalized messages can I send daily safely?",
    answer: "There is no universal safe number. Keep volume conservative, account for sender history, avoid overlapping campaigns, and route messages through human-paced queues with daily quotas."
  }
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Programmatic Personalization: How to Write 100 Unique Cold Messages"
      description="Learn how to build a programmatic personalization pipeline. Access copyable TypeScript workflows to crawl sites, call LLM APIs, and automate sales copy."
      slug="programmatic-personalization"
      publishedDate="March 13, 2026"
      updatedDate="March 13, 2026"
      bannerSrc="/programmatic-personalization.avif"
      bannerAlt="Programmatic personalization data flow and script execution diagram"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <p id="shift-to-programmatic" className="scroll-mt-28">
        Programmatic personalization is what teams reach for when mail merge stops working. First name, company name, and job title are not personalization anymore; they are table stakes. Buyers can see the placeholder underneath the sentence.
      </p>
      <p>
        Real personalization explains why this person is receiving this message now. It might reference their company's positioning, a current hiring signal, a product page, a recent role change, a public integration, or a problem that is specific to their segment. The detail should make the message more useful, not merely more decorative.
      </p>
      <p>
        Manual research can produce that quality for a small account list. It breaks when you need to evaluate hundreds of accounts and still keep the work consistent. Programmatic personalization solves the workflow problem by collecting context, structuring it, drafting from it, and rejecting weak cases before they reach a prospect.
      </p>
      <p>
        The goal is not to write 100 flashy messages as quickly as possible. The goal is to build a repeatable system that can produce 100 messages you would not be embarrassed to send from your own account. Omentir supports this kind of developer workflow through REST endpoints and a hosted Model Context Protocol (MCP) server, as outlined in our guide on{" "}
        <Link href="/blogs/mcp-outreach-tools" className="text-blue-600 hover:underline">
          configuring MCP tool setups
        </Link>
        . Let's look at the architecture behind a safer personalization pipeline.
      </p>

      <h2 id="pipeline-architecture" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        The Programmatic Personalization Architecture
      </h2>
      <p>
        A programmatic personalization pipeline is a small decision system. It decides which prospects deserve research, which public evidence is useful, which message angle fits, and whether the final draft is safe to send. The LLM is only one part of that system.
      </p>
      <p>
        Senders who pass entire raw HTML pages directly into a model usually get expensive, inconsistent output. The model sees navigation text, cookie banners, footer links, repeated boilerplate, and stale page copy. Clean architecture reduces that noise before drafting begins.
      </p>
      <p>
        A practical pipeline has six steps:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Discovery:</strong> Source prospect domains, LinkedIn URLs, roles, and companies from a defined ICP.</li>
        <li><strong>Enrichment:</strong> Collect public website, profile, and company context that may explain relevance.</li>
        <li><strong>Extraction:</strong> Convert messy text into structured evidence such as source URL, snippet, signal type, and confidence.</li>
        <li><strong>Drafting:</strong> Ask the model to write from verified evidence and approved product context only.</li>
        <li><strong>QA:</strong> Reject drafts that invent facts, overstate the signal, sound creepy, or lack a clear reason to reply.</li>
        <li><strong>Delivery:</strong> Route approved drafts to a paced queue, not a bulk sender.</li>
      </ul>
      <p>
        The extraction step is the difference between useful personalization and automated guesswork. A prompt that says "write a personalized message from this website" leaves too much room for interpretation. A prompt that receives "source URL, exact snippet, buyer role, safe angle, disallowed claims" has a much better chance of staying grounded.
      </p>
      <p>
        For details on list sourcing, see our guide to{" "}
        <Link href="/blogs/sales-leads-from-linkedin" className="text-blue-600 hover:underline">
          generating sales leads from LinkedIn
        </Link>
        .
      </p>

      <h2 id="enrichment-crawling-step" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Extracting Live Context from Company Websites
      </h2>
      <p>
        To personalize a message, you need context that is accurate, current, and relevant to your offer. Not every public detail deserves to be in a cold message. A prospect's homepage tagline may help you understand the business, but it may not be a good opener. A hiring post may be a stronger signal if your product helps with the workflow described in the role.
      </p>
      <p>
        When your script crawls a prospect's website, it should extract evidence from specific page types:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Header Copy:</strong> Reveals how they pitch their product to their buyers.</li>
        <li><strong>Value Propositions:</strong> Outlines the key outcomes they promote.</li>
        <li><strong>Active Hiring:</strong> Identifies roles they are recruiting for.</li>
        <li><strong>Integration Pages:</strong> Shows tools and workflows the company publicly supports.</li>
        <li><strong>Security or Compliance Pages:</strong> Helps qualify enterprise readiness without guessing.</li>
        <li><strong>Changelog or Product Updates:</strong> Reveals what the team is actively shipping or prioritizing.</li>
      </ul>
      <p>
        Store the source beside every extracted detail. If your message says, "Saw your team is hiring for outbound operations," the system should know which page produced that conclusion. Source tracking makes QA possible and keeps the model from turning vague context into a confident claim.
      </p>
      <p>
        Also distinguish evidence from interpretation. "The careers page mentions LinkedIn prospecting and weekly pipeline reporting" is evidence. "They need outbound automation immediately" is interpretation. Your pipeline can use the interpretation to suggest an angle, but the message should be written from the evidence.
      </p>

      <h2 id="copywriting-script-loop" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Copyable TypeScript Personalization Script
      </h2>
      <p>
        A useful script does not need to be complicated. The core pattern is: accept a prospect, accept verified evidence, refuse weak evidence, and ask the model for a short message that stays inside the facts.
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`import { GoogleGenAI } from "@google/genai";

interface Prospect {
  name: string;
  company: string;
  domain: string;
  role: string;
}

interface Evidence {
  sourceUrl: string;
  snippet: string;
  signalType: "hiring" | "positioning" | "integration" | "role_based";
  confidence: "low" | "medium" | "high";
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateMessage(prospect: Prospect, evidence: Evidence): Promise<string> {
  if (evidence.confidence === "low" || evidence.snippet.length < 40) {
    throw new Error("Evidence is too weak for personalized outreach.");
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: [{
      role: "user",
      parts: [{
        text: \`Write a short LinkedIn message from a founder to a prospect.
        - Prospect: \${prospect.name}
        - Role: \${prospect.role}
        - Company: \${prospect.company}
        - Public evidence: \${evidence.snippet}
        - Evidence source: \${evidence.sourceUrl}

        Rules:
        1. Keep it under 70 words.
        2. Reference only the public evidence above.
        3. Do not claim private knowledge.
        4. Ask one low-pressure question.
        5. Return only the message text.\`
      }]
    }]
  });
  
  return response.text ?? "";
}`}</code>
      </pre>
      <p>
        This is not a full production system, and it should not be treated as one. It shows the core guardrail: the model does not receive a giant pile of raw context. It receives a specific evidence object and rules that prevent it from overreaching.
      </p>
      <p>
        In a real workflow, add logging for rejected evidence, source URLs, prompt versions, model output, and reviewer decisions. Those logs are how you improve the campaign. If the model keeps rejecting a segment because evidence is weak, the targeting may need to change before the writing does.
      </p>

      <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
        <div className="pl-4">
          <h4 className="font-bold text-black mb-2 flex items-center gap-2">
            Engineering Rule: Set Up Variable Fallbacks
          </h4>
          <p className="text-sm text-zinc-650 leading-relaxed">
            Ensure your script handles missing context fields. If a web crawl fails, define a fallback variable (such as using their job title and company sector) to write a clean message.
          </p>
        </div>
      </div>

      <h2 id="fallback-management" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Handling Stale Data and Empty Variable Fallbacks
      </h2>
      <p>
        Web crawlers will occasionally fail. Sites change structure, block automated requests, hide pages behind scripts, or return thin content that teaches you nothing. Profile data can be incomplete too. If your pipeline treats every missing field as usable, the model will produce brittle copy.
      </p>
      <p>
        Fallbacks should be designed by signal strength. Strong public evidence can support a specific opener. Medium evidence can support a softer question. Weak evidence should fall back to role-based copy or reject the prospect for now.
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Strong fallback:</strong> "Saw your careers page mentions LinkedIn prospecting and pipeline reporting."</li>
        <li><strong>Medium fallback:</strong> "Looks like your team is building out outbound operations."</li>
        <li><strong>Role-based fallback:</strong> "Curious how you are handling prospect sourcing as the team grows."</li>
        <li><strong>Reject:</strong> No clear ICP fit, no useful signal, or no confident buyer role.</li>
      </ul>
      <p>
        The reject path is important. Many personalization systems fail because they force every lead into a message. That is how you get copy that sounds polished but empty. A good programmatic pipeline should be willing to say, "not enough evidence to personalize well."
      </p>
      <p>
        To prevent errors, validate variables before running prompts. If a crawl returns empty results, switch to a safer prompt or hold the account for manual review. Do not ask the model to compensate for missing truth with creativity.
      </p>

      <h2 id="safe-delivery-integration" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Routing Campaigns Safely to Avoid Account Bans
      </h2>
      <p>
        Generating 100 personalized messages is the easy part. Sending them safely is the part that determines whether the workflow can survive. High volume, stacked campaigns, and unnatural timing can damage sender reputation even when the messages are individually well written.
      </p>
      <p>
        Route drafts to a paced delivery queue instead of sending directly from the script. A delivery system should enforce daily budgets, space actions naturally, stop follow-ups when a prospect replies, and make it easy to pause a campaign if quality signals drop.
      </p>
      <p>
        Omentir is built around daily quotas and human-paced LinkedIn outreach. The API and MCP workflow lets agents configure lead finders, inspect scored leads and activity, retrieve exact lead context, and reply within existing threads. Read more about safety setups in our guide on{" "}
        <Link href="/blogs/human-paced-outreach" className="text-blue-600 hover:underline">
          pacing LinkedIn outreach campaigns
        </Link>
        .
      </p>
      <p>
        The safest operating rule is to separate generation from delivery. A script can create draft candidates quickly. The sending layer should decide what actually leaves the account, when it leaves, and whether a human needs to review it first.
      </p>

      <h2 id="programmatic-sop-checklist" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        SOP: Running Your First Programmatic Campaign
      </h2>
      <p>
        Implement these steps to run a programmatic campaign without turning it into a bulk-blast machine:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Step 1:</strong> Define one ICP and one offer. Do not test five segments at once.</li>
        <li><strong>Step 2:</strong> Source target company domains and LinkedIn profiles from that ICP.</li>
        <li><strong>Step 3:</strong> Crawl only pages likely to contain useful buying context.</li>
        <li><strong>Step 4:</strong> Extract sourceable evidence into a structured schema before drafting.</li>
        <li><strong>Step 5:</strong> Generate drafts with strict product facts, disallowed claims, and fallback rules.</li>
        <li><strong>Step 6:</strong> Review the first batch manually and reject weak personalization.</li>
        <li><strong>Step 7:</strong> Route approved drafts to a paced campaign workflow.</li>
        <li><strong>Step 8:</strong> Inspect replies and rejected drafts before increasing volume.</li>
      </ul>
      <p>
        Omentir can help manage the discovery, campaign, conversation, and pacing pieces around this workflow. Your team still owns the judgment: which evidence is good enough, which messages deserve to be sent, and when to stop.
      </p>

      <h2 id="conclusion" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Scaling Relevance for Sustainable Outbound
      </h2>
      <p>
        Outbound campaigns do not require you to choose between quality and scale, but you do have to design the system around quality first. If you automate a weak template, you get weak outreach faster. If you automate evidence collection, draft review, and paced delivery, you get a workflow that can scale without losing the reader.
      </p>
      <p>
        Start with a small batch. Review every source, every draft, and every reply. Once the system consistently produces messages that feel specific, truthful, and easy to answer, scale the campaign in controlled steps.
      </p>
      <p>
        Omentir provides the discovery, campaign, reply, and safety infrastructure to support that kind of pipeline. The best use of programmatic personalization is not making outreach feel automated. It is making good research and thoughtful writing repeatable.
      </p>
    </BlogPostTemplate>
  );
}
