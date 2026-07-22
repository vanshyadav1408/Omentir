import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "ICP-Based Lead Discovery: Build a Dynamic Search Workflow - Omentir",
  description: "Learn how to convert your static B2B Ideal Customer Profile into precise search parameters, automate lead discovery, and personalize your LinkedIn outreach.",
  path: "/blogs/icp-based-lead-discovery",
  keywords: [
    "ICP-based lead discovery",
    "Ideal Customer Profile LinkedIn",
    "Boolean search sales navigator",
    "B2B prospecting workflow",
    "Omentir discovery agent",
    "lead qualification criteria"
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "icp-translation-problem", label: "The Challenge of Translating B2B Buyer Personas", level: 1 },
  { id: "deconstructing-icp", label: "Deconstructing the Core Pillars of Your ICP", level: 1 },
  { id: "mapping-filters", label: "Mapping ICP Attributes to LinkedIn Search Parameters", level: 1 },
  { id: "boolean-logic", label: "Mastering Boolean Search Logic for Title Filtering", level: 2 },
  { id: "company-filters", label: "Filtering by Company Size, Industry, and Headcount", level: 2 },
  { id: "automating-discovery", label: "Automating Daily Discovery with Omentir Agents", level: 1 },
  { id: "reviewing-queue", label: "SOP: Auditing and Refining the Discovered Lead Queue", level: 1 },
  { id: "personalization-alignment", label: "Aligning Outreach Copy to Specific ICP Pain Points", level: 1 },
  { id: "conclusion", label: "Moving Beyond Static Lists", level: 1 },
  { id: "faqs", label: "Frequently Asked Questions", level: 1 }
];

const faqItems = [
  {
    question: "What is the difference between a buyer persona and an Ideal Customer Profile?",
    answer: "An Ideal Customer Profile (ICP) defines the characteristics of the accounts or companies that get the most value from your product, such as industry, revenue, or team size. A buyer persona defines the specific job roles and individual traits of the buyers within those companies."
  },
  {
    question: "How do I translate a complex tech stack requirement into a LinkedIn search?",
    answer: "While you cannot filter by technology stack directly in standard searches, you can use Boolean keywords such as 'Salesforce' or 'AWS' within the profile keyword field, or leverage external enrichment tools to validate technology usage before importing leads."
  },
  {
    question: "How does Omentir automate the lead discovery process?",
    answer: "Omentir lets you define search agents using natural language. The system runs automated LinkedIn discovery pathways daily, scores every new lead against your profile parameters, and queues up high-fit prospects for review."
  },
  {
    question: "Why should I avoid using broad title searches like 'Sales' or 'Marketing'?",
    answer: "Broad titles return too many false positives, such as sales representatives when you want to target VPs. Use specific title filters and Boolean operators like 'VP' OR 'Director' to keep lists clean."
  }
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="ICP-Based Lead Discovery: How to Build a Dynamic LinkedIn Search Workflow"
      description="Learn how to convert your static B2B Ideal Customer Profile into precise search parameters, automate lead discovery, and personalize your LinkedIn outreach."
      slug="icp-based-lead-discovery"
      publishedDate="April 15, 2026"
      updatedDate="April 15, 2026"
      bannerSrc="/icp-based-lead-discovery.avif"
      bannerAlt="ICP-based lead discovery and target audience search workflow illustration"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <p id="icp-translation-problem" className="scroll-mt-28">
        Most B2B startups fail because they spend their outbound budget targeting the wrong companies. They start with a vague description of their ideal buyer, such as "SaaS companies in North America with 10 to 50 employees." Then, they buy a broad database export matching those parameters and launch cold outreach campaigns.
      </p>
      <p>
        The problem is that static database lists grow stale quickly. Companies hire new teams, change their product offerings, or pivot to new markets. A list that looked good in January is full of dead leads by June. To build a reliable sales pipeline, you must shift from static database exports to dynamic, ICP-based lead discovery.
      </p>
      <p>
        Dynamic discovery means defining your Ideal Customer Profile (ICP) as a set of active search rules rather than a static document. By running daily searches on <a href="https://www.linkedin.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">LinkedIn</a>, you can find prospects as they match your criteria, allowing you to reach out at the moment of highest relevance.
      </p>
      <p>
        Omentir is designed to run this discovery process in the background. By setting up plain-language search rules, the platform monitors target markets, filters out poor fits, and places qualified profiles into your review queue. Let's look at how to deconstruct and translate your ICP into a working search engine.
      </p>
      <p>
        A strong ICP workflow is not a bigger list. It is a better decision system. Every profile should either have a clear reason to enter the queue or a clear reason to be rejected. When the criteria are fuzzy, the list grows quickly but the conversations get worse.
      </p>

      <h2 id="deconstructing-icp" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Deconstructing the Core Pillars of Your ICP
      </h2>
      <p>
        Before you build a search query, you must define the boundaries of your target market. A complete Ideal Customer Profile contains three layers of data:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Firmographic Data:</strong> The organizational boundaries, including company size, industry classification, geographic presence, and employee growth rates.</li>
        <li><strong>Technographic Data:</strong> The software tools and infrastructure the company uses, such as cloud providers, CRM systems, or analytics dashboards.</li>
        <li><strong>Buyer Personas:</strong> The specific decision-makers within the organization, including their department, job title, and level of authority.</li>
      </ul>
      <p>
        By documenting these pillars, you create a concrete blueprint for your prospecting. This prevents your team from importing low-value leads that drag down campaign conversion rates.
      </p>
      <p>
        Add a fourth layer: timing. A perfect-fit company with no current reason to care may still ignore you. A slightly narrower company that is hiring, launching a product, changing leadership, or posting about the problem is often more useful. Your ICP should define both fit and timing so your outreach has a reason to exist now.
      </p>
      <p>
        The easiest way to write this is as an inclusion and exclusion table. Include companies with the right model, size, role, and trigger. Exclude agencies, students, consultants, competitors, inactive profiles, and companies outside your sales motion. Exclusions are what keep the agent honest when a profile looks close but would never buy.
      </p>

      <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
        <div className="pl-4">
          <h4 className="font-bold text-black mb-2 flex items-center gap-2">
            Targeting Rule: Mind the Tech Stack
          </h4>
          <p className="text-sm text-zinc-650 leading-relaxed">
            If your product integrates with Salesforce, target only companies using Salesforce. Reaching out to HubSpot users with a Salesforce-specific pitch is a quick way to destroy outbound efficiency.
          </p>
        </div>
      </div>

      <h2 id="mapping-filters" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Mapping ICP Attributes to LinkedIn Search Parameters
      </h2>
      <p>
        Once your pillars are defined, you must translate them into the search fields of your prospecting tools. The primary engine for B2B active sourcing is <a href="https://www.linkedin.com/products/linkedin-sales-navigator/" target="_blank" rel="noopener" className="text-blue-600 hover:underline">LinkedIn Sales Navigator</a>, which provides advanced filters for title, company size, and headcount growth.
      </p>
      <p>
        Translation is where most ICP documents break. "Fast-growing SaaS company" is not a search parameter. "Headcount 11-200, software industry, North America, sales department growth, hiring SDRs, founder or VP Sales title" is. Turn every fuzzy phrase into a filter, keyword, or manual review rule.
      </p>
      <p>
        Some ICP attributes cannot be captured perfectly in LinkedIn. That is fine. Mark them as enrichment or review fields. For example, "uses Salesforce" may require technographic enrichment. "Founder-led sales motion" may require website or profile review. "High outbound urgency" may require job posts, founder content, or recent hiring signals.
      </p>

      <h3 id="boolean-logic" className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">
        Mastering Boolean Search Logic for Title Filtering
      </h3>
      <p>
        Do not rely on LinkedIn's default title categories, which are often too broad. Instead, build custom Boolean query strings using the AND, OR, and NOT operators. This ensures that you target specific decision-makers while excluding irrelevant support roles.
      </p>
      <p>
        For example, if you are targeting VP-level marketing executives, a Boolean title search query might look like:
      </p>
      <p className="rounded bg-zinc-200/50 p-3 font-mono text-sm text-zinc-800">
        ("VP" OR "Vice President" OR "Director") AND "Marketing" NOT ("Assistant" OR "Coordinator" OR "Consultant")
      </p>
      <p>
        This string targets marketing directors and VPs while filtering out coordinators and external consultants who lack buying authority.
      </p>
      <p>
        Build title strings in pairs: one inclusive query and one exclusion query. The inclusive query finds likely buyers. The exclusion query removes people who share similar language but not the buying role. If you target revenue leaders, exclude coaches, agencies, advisors, students, professors, and fractional consultants unless those segments are intentionally part of the campaign.
      </p>

      <h3 id="company-filters" className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">
        Filtering by Company Size, Industry, and Headcount
      </h3>
      <p>
        After defining the title string, apply firmographic constraints. Use the company headcount filter to exclude organizations that are too small or too large for your sales cycle. 
      </p>
      <p>
        Additionally, look at department headcount growth rates rather than company-wide growth. A company whose total employee count is flat might still be expanding its engineering team by 30% year-over-year, indicating a growing focus on technical infrastructure.
      </p>
      <p>
        Company size should match your sales cycle. A solo founder may buy quickly but have low budget. A 5,000-person enterprise may have budget but a long procurement process. If your product is founder-friendly, target smaller teams with urgent pain. If your product needs security review and implementation support, target larger accounts with clear department ownership.
      </p>
      <p>
        Industry filters need the same care. Broad categories hide very different businesses. "Software" can include developer tools, vertical SaaS, marketplaces, data vendors, and agencies. Write the subsegments you want, then add negative filters for the ones you do not.
      </p>

      <h2 id="automating-discovery" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Automating Daily Discovery with Omentir Agents
      </h2>
      <p>
        Running searches manually every day is a tedious process. It takes hours of click-heavy work that distracts you from closing sales.
      </p>
      <p>
        Omentir automates this loop by letting you run discovery agents. You can define your ideal company parameters and target titles in plain language. The system runs searches on LinkedIn daily, extracts matching profiles, and scores them against your criteria. This workflow is detailed in our guide on{" "}
        <Link href="/blogs/ai-linkedin-prospecting" className="text-blue-600 hover:underline">
          AI LinkedIn prospecting workflows
        </Link>
        .
      </p>
      <p>
        The platform saves these matches inside dedicated lead groups. The agent reports who was found and highlights the exact reasons they fit, allowing you to review and approve prospects quickly.
      </p>
      <p>
        Start new agents in a conservative mode. Let them collect a small sample first, then inspect the false positives. If too many leads fail because the title is wrong, tighten the Boolean string. If too many fail because the company segment is wrong, add exclusions. If the leads fit but the message feels weak, add stronger timing signals.
      </p>
      <p>
        The point of automation is not to remove iteration. It is to make iteration faster. Instead of rebuilding a spreadsheet every week, you adjust the rules and let the agent keep watching the market.
      </p>

      <h2 id="reviewing-queue" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        SOP: Auditing and Refining the Discovered Lead Queue
      </h2>
      <p>
        Never import automated search results directly into an outbound sequence without auditing the queue. Even the best search strings return false positives, and sending automated pitches to poor-fit profiles damages your sender reputation.
      </p>
      <p>
        Establish a simple daily audit routine for your sales team:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Check the Profile:</strong> Confirm that the prospect's current title matches your Boolean rules and that they have been in their role for at least 30 days.</li>
        <li><strong>Review the Company Site:</strong> Verify that the company is active, has a working website, and fits your target industry category.</li>
        <li><strong>Analyze Intent Signals:</strong> Look for recent signals, such as job openings or funding updates, to prioritize outreach. This intent-scoring process is detailed in our guide to{" "}
          <Link href="/blogs/linkedin-lead-scoring" className="text-blue-600 hover:underline">
            LinkedIn lead scoring rubrics
          </Link>
          .</li>
        <li><strong>Disqualify Instantly:</strong> If the company is a competitor or does not fit your technographic profile, reject the lead immediately to keep your lists clean.</li>
      </ul>
      <p>
        This review step keeps your list quality high. Spending a short moment to check a profile before sending is often the difference between a relevant note and obvious automation.
      </p>
      <p>
        Track rejection reasons while you review. Common reasons include wrong role, wrong company type, no timing signal, inactive profile, existing competitor, unclear authority, or poor geography fit. After twenty rejects, patterns will appear. Those patterns are your next search improvements.
      </p>

      <h2 id="personalization-alignment" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Aligning Outreach Copy to Specific ICP Pain Points
      </h2>
      <p>
        A clean prospect list is useless if your outreach copy is generic. Your connection note and first message must speak to the specific challenges that your target persona faces at their type of company.
      </p>
      <p>
        If your ICP targets growth-stage B2B startups, focus your copy on efficiency and team leverage. If you target enterprise companies, focus on compliance, safety, and integration capabilities.
      </p>
      <p>
        Omentir ensures your outreach copy matches these parameters by grounding drafts in your product profile and company-specific context. When the system drafts a campaign sequence, it matches the prospect's firmographic attributes with the relevant marketing messages in your database. This structured copywriting strategy is outlined in our guide on{" "}
        <Link href="/blogs/b2b-lead-gen-with-ai" className="text-blue-600 hover:underline">
          B2B lead generation setups
        </Link>
        .
      </p>
      <p>
        The message should map to the reason the lead qualified. If the lead qualified because of hiring, mention hiring. If they qualified because of a role change, mention the new mandate. If they qualified because of a public post, mention the topic, not the fact that they posted. This keeps your copy connected to evidence.
      </p>
      <p>
        Avoid one-size-fits-all proof points. A founder cares that the workflow saves time and creates conversations. A VP cares that the system is controlled, measurable, and safe for the team. A RevOps buyer cares about routing, data quality, and process consistency. Same product, different pain.
      </p>

      <h2 id="conclusion" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Moving Beyond Static Lists
      </h2>
      <p>
        Building a repeatable sales pipeline requires a shift from stale databases to dynamic, ICP-based lead discovery. By deconstructing your ICP, mapping attributes to specific search parameters, and using automated discovery loops, you can build a reliable GTM machine.
      </p>
      <p>
        Use Omentir to automate the logistics of your search. Set up your discovery agents, review the incoming leads daily, and launch safe, paced sequences that turn warm LinkedIn profiles into qualified demos.
      </p>
      <p>
        The best discovery workflow feels calm. New leads arrive, weak fits are rejected, good fits have a clear reason for outreach, and the message matches the reason they were selected. That is how ICP moves from a slide in a strategy doc to a daily operating system for pipeline.
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
