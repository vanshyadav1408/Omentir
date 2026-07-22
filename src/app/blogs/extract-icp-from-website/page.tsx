import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";

export const metadata = createPageMetadata({
  title: "How to Extract an Ideal Customer Profile (ICP) from Your Website - Omentir",
  description: "Stop guessing your target audience. Learn how to use AI crawlers to analyze your company site, extract buyer profiles, and construct an ICP schema.",
  path: "/blogs/extract-icp-from-website",
  keywords: [
    "extract ICP from website",
    "B2B Ideal Customer Profile AI",
    "landing page audience extraction",
    "target persona builder",
    "real-time lead scoring data",
    "Omentir ICP definition"
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "defining-icp-manually", label: "The Challenge of Defining Your Target Buyer", level: 1 },
  { id: "extraction-pipeline", label: "The Automated Website-to-ICP Pipeline", level: 1 },
  { id: "landing-page-analysis", label: "Extracting Pain Points from Landing Page Copy", level: 2 },
  { id: "testimonial-analysis", label: "Analyzing Customer Case Studies for ICP Clues", level: 2 },
  { id: "structured-icp-schema", label: "Constructing a Machine-Readable ICP JSON Schema", level: 1 },
  { id: "grounding-campaigns", label: "Applying the ICP Schema to Outbound Lead Scoring", level: 1 },
  { id: "extraction-sop-checklist", label: "SOP: The 10-Minute ICP Extraction Workflow", level: 1 },
  { id: "conclusion", label: "Basing Outreach on Real Data", level: 1 },
  { id: "faqs", label: "Frequently Asked Questions", level: 1 }
];

const faqItems = [
  {
    question: "Why should I extract my ICP from my website instead of writing it manually?",
    answer: "Your website copy, landing pages, and testimonials are designed to convert your best buyers. Sourcing these details using AI extracts the precise pain points and value drivers your business supports, eliminating assumptions."
  },
  {
    question: "What is an ICP JSON Schema?",
    answer: "It is a structured data format that defines your target buyer variables (such as company size, geographic region, and industry tags), allowing AI agents to evaluate prospect list fit automatically."
  },
  {
    question: "How does Omentir use my extracted ICP details?",
    answer: "Omentir uses your ICP schema to score lead fit during discovery, ensuring that outreach profiles are qualified before campaigns launch."
  },
  {
    question: "Can I extract multiple ICP definitions from a single website?",
    answer: "Yes. If your platform has multiple landing pages for different industries or roles, you should run the extraction pipeline on each page to build distinct target profiles."
  }
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="How to Extract an Ideal Customer Profile (ICP) from Your Website"
      description="Learn how to use AI web crawlers to analyze your value proposition, reverse-engineer your target buyers, and construct a precise ICP schema."
      slug="extract-icp-from-website"
      publishedDate="March 14, 2026"
      updatedDate="March 14, 2026"
      bannerSrc="/extract-icp-from-website.avif"
      bannerAlt="Ideal Customer Profile extraction from landing page copy diagram"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <p id="defining-icp-manually" className="scroll-mt-28">
        An outbound campaign is only as effective as its targeting. You can write sharp copy, use careful pacing, and review every draft, but if the list is full of people who do not feel the pain your product solves, the campaign will still feel irrelevant.
      </p>
      <p>
        Many founders and sales leaders struggle to define their Ideal Customer Profile (<Link href="/blogs/icp-based-lead-discovery" className="text-blue-600 hover:underline">ICP</Link>) because they describe the market instead of the buyer. "Mid-sized tech companies in the US" is a market slice. It does not explain who owns the problem, what makes the problem urgent, what language the buyer uses, or which accounts should be excluded.
      </p>
      <p>
        Your website is a useful starting point because it already contains your best public attempt at explaining the product. Landing pages, pricing pages, case studies, feature sections, and testimonials all reveal who you think you serve and what outcomes you promise. They are not perfect truth, but they are better evidence than a blank brainstorming doc.
      </p>
      <p>
        The job is to extract that evidence, turn it into a structured ICP, then review it against real prospects. Omentir uses ICP settings and product context during discovery and outreach so leads can be evaluated before campaigns run. Let's look at how to build a website-to-ICP workflow that produces something useful instead of a generic persona.
      </p>

      <h2 id="extraction-pipeline" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        The Automated Website-to-ICP Pipeline
      </h2>
      <p>
        Extracting an ICP from your site requires a structured approach. If you feed raw HTML into a language model and ask for "our ICP," the output will usually be broad, flattering, and hard to use. It may say your buyer is "growth-focused teams seeking efficiency," which sounds fine and helps no one build a list.
      </p>
      <p>
        A better pipeline separates evidence collection from judgment:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Crawling:</strong> Extracting clean text from landing pages, case studies, and testimonial directories.</li>
        <li><strong>Parsing:</strong> Isolating the value propositions, target features, and pain points addressed by your copy.</li>
        <li><strong>Synthesis:</strong> Building a structured buyer profile that lists target industries, company sizes, and job titles.</li>
        <li><strong>Review:</strong> Checking the model's proposed ICP against actual customer knowledge and obvious exclusions.</li>
        <li><strong>Testing:</strong> Running the ICP against sample prospects to see whether it selects accounts you would actually want.</li>
      </ul>
      <p>
        The review and testing steps matter because websites often contain aspirational copy. A startup may say it serves "enterprise teams" because that is the market it wants, while its real customers are founder-led SaaS companies. A pricing page may imply one buyer, while testimonials reveal another. Treat the website as evidence, then reconcile conflicts.
      </p>
      <p>
        To learn more about how AI crawlers analyze web text, see our deep dive into{" "}
        <Link href="/blogs/beyond-database-scraping-how-ai-salesman-qualify-leads" className="text-blue-600 hover:underline">
          how AI qualifiers evaluate corporate sites
        </Link>
        .
      </p>

      <h2 id="landing-page-analysis" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Extracting Pain Points from Landing Page Copy
      </h2>
      <p>
        Your main landing page is usually the fastest way to understand the promised outcome. Headers, sub-headers, feature descriptions, objections, and calls to action all hint at the buyer you are trying to convert.
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Headers:</strong> Highlight the primary outcome your software claims to provide.</li>
        <li><strong>Feature Cards:</strong> List the specific capabilities your prospects need to achieve those outcomes.</li>
        <li><strong>Call to Action:</strong> Explains what steps buyers must take to evaluate your tool.</li>
        <li><strong>Objection Copy:</strong> Reveals the concerns your buyer is likely to have before booking a call.</li>
        <li><strong>Use-Case Sections:</strong> Shows whether the product is positioned by role, company type, workflow, or industry.</li>
      </ul>
      <p>
        The extraction should translate copy into buyer variables. If the page emphasizes "reply management," the buyer may own outbound operations. If it emphasizes "founder-led sales," the buyer may be an early-stage founder. If it emphasizes "team visibility," the buyer may manage reps rather than send messages personally.
      </p>
      <p>
        Be careful with vague benefits. Words like productivity, growth, scale, and efficiency appear on almost every B2B site. They are not enough to define an ICP. The useful clues are more concrete: which workflow is improved, which role struggles with it, which trigger makes it urgent, and which accounts should not be targeted.
      </p>

      <h2 id="testimonial-analysis" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Analyzing Customer Case Studies for ICP Clues
      </h2>
      <p>
        Testimonials and case studies are often stronger than homepage copy because they describe real usage. They show who got value, what problem existed before buying, and which outcome mattered enough to mention publicly.
      </p>
      <p>
        For example, imagine a case study says a founder used a LinkedIn outreach tool to manage connection pacing, draft follow-ups, and keep replies organized while hiring the first sales rep. You could extract:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Target Profile:</strong> Founder-led or lean GTM teams starting outbound before a full sales team exists.</li>
        <li><strong>Pain Point:</strong> Need to source prospects, write messages, and manage replies without turning LinkedIn into a manual time sink.</li>
        <li><strong>Buying Trigger:</strong> Hiring a first sales rep, testing a new market, or trying to make outbound repeatable.</li>
        <li><strong>Exclusion:</strong> Companies looking only for a raw contact database or mass email blasting.</li>
      </ul>
      <p>
        Case studies can also expose hidden segments. Your homepage may speak to VP Sales buyers, but your proof may come mostly from founders. When that happens, do not average the two into a mushy persona. Create separate ICPs or choose the one with stronger evidence.
      </p>

      <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
        <div className="pl-4">
          <h4 className="font-bold text-black mb-2 flex items-center gap-2">
            Targeting Rule: Identify the Operator
          </h4>
          <p className="text-sm text-zinc-650 leading-relaxed">
            Separate the buyer, operator, and champion. The person who pays, the person who feels the daily pain, and the person who can introduce you internally may be three different people. Your ICP should name all three when they differ.
          </p>
        </div>
      </div>

      <h2 id="structured-icp-schema" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Constructing a Machine-Readable ICP JSON Schema
      </h2>
      <p>
        Once you extract your ICP variables, structure them in a machine-readable schema. The schema should be specific enough to score leads and flexible enough for a human to edit.
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`{
  "icp_definition": {
    "primary_buyer_roles": ["Founder", "VP of Sales"],
    "operator_roles": ["Growth Operator", "Sales Development Lead"],
    "target_industries": ["B2B SaaS", "B2B Services"],
    "company_size": {
      "min": 10,
      "max": 200
    },
    "pain_points": [
      "manual LinkedIn sourcing",
      "inconsistent follow-up",
      "low visibility into reply intent"
    ],
    "buying_triggers": [
      "hiring first sales role",
      "testing outbound",
      "expanding founder-led sales"
    ],
    "exclusion_keywords": ["retail storefront", "student project"],
    "confidence_notes": "Derived from homepage, pricing page, and case-study language."
  }
}`}</code>
      </pre>
      <p>
        The confidence note is not decoration. It tells future users where the ICP came from and how much trust to place in it. If the schema is based only on homepage copy, mark it as a draft. If it is supported by several customer stories and closed-won data, it deserves more weight.
      </p>
      <p>
        You should also keep exclusions explicit. Many outbound systems fail because they define who to include but never define who to reject. Exclusions protect your sending capacity and keep the campaign from drifting into accounts that technically match one keyword but have no chance of buying.
      </p>

      <h2 id="grounding-campaigns" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Applying the ICP Schema to Outbound Lead Scoring
      </h2>
      <p>
        A structured ICP schema becomes useful when it changes the way leads are scored. Instead of asking, "does this person have a sales title?" the system can ask a better set of questions: does this company match the segment, does this role own the pain, is there a visible trigger, and is there any reason to exclude the account?
      </p>
      <p>
        Scoring should produce actions, not just numbers. High-fit leads can move to reviewed outreach. Medium-fit leads can wait for stronger signals. Low-fit leads should be rejected. If every lead eventually gets messaged, the ICP is not doing its job.
      </p>
      <p>
        Omentir uses product and ICP context during lead discovery and campaign creation. You can also run verification loops using custom tools. Omentir provides a hosted MCP server, detailed in our guide on{" "}
        <Link href="/blogs/mcp-outreach-tools" className="text-blue-600 hover:underline">
          configuring MCP tool setups
        </Link>
        , which allows external agents to work with workspace context, discovery agents, scored leads, activity, existing conversations, and replies.
      </p>
      <p>
        The most important test is manual: take twenty leads the system would approve and ask whether you would happily spend your own LinkedIn reputation contacting them. If the answer is no, tighten the schema before scaling.
      </p>

      <h2 id="extraction-sop-checklist" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        SOP: The 10-Minute ICP Extraction Workflow
      </h2>
      <p>
        Follow these steps to extract a practical ICP from your website:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Step 1:</strong> Collect your homepage, pricing page, use-case pages, case studies, testimonials, and product pages.</li>
        <li><strong>Step 2:</strong> Extract repeated pain points, promised outcomes, buyer roles, use cases, and objections.</li>
        <li><strong>Step 3:</strong> Separate evidence from interpretation so the model does not invent buyer traits.</li>
        <li><strong>Step 4:</strong> Create one ICP per distinct segment instead of blending conflicting buyers.</li>
        <li><strong>Step 5:</strong> Add exclusions, weak-fit patterns, and disallowed targeting assumptions.</li>
        <li><strong>Step 6:</strong> Test the schema against a sample lead list and inspect the false positives.</li>
        <li><strong>Step 7:</strong> Use the refined ICP inside your discovery and outreach workflow.</li>
      </ul>
      <p>
        This workflow is short enough to run in one sitting, but do not confuse speed with certainty. The first version should be treated as a draft. Improve it as you learn which prospects reply, which demos qualify, and which segments actually convert.
      </p>

      <h2 id="conclusion" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Basing Outreach on Real Data
      </h2>
      <p>
        Defining your target audience does not have to start from assumptions. Your website already contains clues about the buyer, pain, value proposition, and use cases your business believes in. Extracting those clues gives you a stronger first draft than a generic persona workshop.
      </p>
      <p>
        The website is not the final authority, though. Review the extracted ICP against real customers, sales conversations, and lead samples. Then use the structured version to guide discovery, scoring, and outreach.
      </p>
      <p>
        Omentir helps turn that structured context into practical outbound execution: finding relevant buyers, drafting messages from real product context, pacing LinkedIn activity, and organizing replies. The better your ICP, the better that whole system becomes.
      </p>
    </BlogPostTemplate>
  );
}
