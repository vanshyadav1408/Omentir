import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import Link from "next/link";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Lusha vs. Omentir: Moving Beyond Static Databases to Active Outreach - Omentir",
  description: "A comprehensive comparison between credit-based databases like Lusha and autonomous multi-channel AI SDR agents like Omentir for B2B outbound sales.",
  path: "/blogs/lusha-vs-omentir-database-vs-active-outreach",
  image: {
    url: "/lusha-vs-omentir-database-vs-active-outreach.avif",
    width: 1774,
    height: 887,
    alt: "Lusha vs. Omentir active lead sourcing vs database scraper cover art",
  },
  keywords: [
    "Lusha vs Omentir",
    "Lusha alternatives",
    "active B2B outreach",
    "autonomous SDR",
    "AI sales agent",
    "B2B lead generation",
    "multi-channel sales automation"
  ]
});

const tocItems = [
  { id: "database-vs-active-discovery", label: "Database Directory vs. Active Discovery", level: 1 },
  { id: "lusha-architecture-and-limitations", label: "Lusha's Legacy Lookup Architecture", level: 1 },
  { id: "omentir-unified-platform", label: "Omentir's Autonomous SDR Workflow", level: 1 },
  { id: "key-differentiators-comparison", label: "Feature and Workflow Comparison", level: 1 },
  { id: "tactical-lead-enrichment", label: "Building Natively Enriched Pipelines", level: 1 },
  { id: "calculating-roi-and-efficiency", label: "ROI Analysis: Databases vs. AI SDRs", level: 1 },
  { id: "frequently-asked-questions", label: "Frequently Asked Questions", level: 1 }
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Lusha vs. Omentir: Moving Beyond Static Databases to Active Outreach"
      description="Contrast the legacy, mobile-number-heavy database lookups of Lusha with the active, multi-channel automated B2B customer discovery of Omentir."
      slug="lusha-vs-omentir-database-vs-active-outreach"
      publishedDate="May 24, 2026"
      updatedDate="May 24, 2026"
      bannerSrc="/lusha-vs-omentir-database-vs-active-outreach.avif"
      bannerAlt="Lusha versus Omentir comparison concept art depicting legacy database lookup versus autonomous multi-channel outreach"
      tocItems={tocItems as any}
    >
      <div id="introduction" className="scroll-mt-28">
        <p>
          The transition from manual cold prospecting to automated sales development represents a significant evolution in B2B growth operations. Historically, outbound teams relied on massive contact databases to identify prospective buyers, fetch mobile numbers, and export lists to external messaging tools. This workflow was built around the static directory: a passive repository of professional profiles, phone numbers, and corporate email addresses. As data decay rates increase and target prospects become highly desensitized to generic cold outreach, this traditional model introduces friction, high bounce rates, and administrative overhead.
        </p>
        <p>
          Today, high-growth B2B startups, sales development agencies, and enterprise teams are transitioning to active, multi-channel customer discovery. Rather than manually querying directories and piecing together disparate data enrichment chains, modern teams leverage autonomous sales agents. These systems combine target sourcing, cascaded enrichment, copywriting, and multi-channel campaign execution into a single, unified workspace.
        </p>
        <p>
          This comparison examines the operational differences between <a href="https://lusha.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Lusha</a>, a legacy credit-based database, and Omentir, an autonomous AI sales agent designed to execute active outreach. By analyzing data accuracy, workflow efficiency, copy personalization, and account safety, this guide provides a tactical blueprint for growth leaders seeking to optimize their B2B outbound pipeline.
        </p>

        <h2
          id="database-vs-active-discovery"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          The Paradigm Shift: Database Directory vs. Active Discovery
        </h2>
        <p>
          At the core of modern B2B prospecting lies a choice between two distinct data models: static database directories and active discovery engines. A static database operates as an archival index. It collects millions of professional records, aggregates them from historical data dumps, public registries, and user contributions, and serves them to subscribers who query specific filters. This database functions as a snapshot of the past. If a marketing manager changes jobs or a company updates its domain infrastructure, the database profile remains unchanged until the next scheduled platform refresh.
        </p>
        <p>
          This latency leads directly to data decay. Research indicates that standard business data decays at a rate of roughly twenty to thirty percent annually. When an outbound team exports contacts from an archived directory, they frequently run into invalid email domains, inactive phone lines, and outdated job titles.
        </p>
        <p>
          Active discovery, conversely, uses real-time web crawling and context mapping. Instead of searching a pre-compiled index, an autonomous lead generation agent starts with a plain-English description of the ideal customer profile. The agent queries search indexes, parses target company websites, reads public social media updates, and extracts professional details directly from live web sources. Because the system retrieves and verifies information at the moment of discovery, the data is highly accurate and free of decay. This active approach eliminates the manual steps of cleaning lists and checking for domain validity, providing a clean stream of prospects ready for outreach.
        </p>

        <h2
          id="lusha-architecture-and-limitations"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          <a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a>'s Legacy Lookup Architecture: Mobile-Heavy and Credit-Bound
        </h2>
        <p>
          <a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a> built its reputation by providing direct-dial mobile phone numbers and verified business emails for sales professionals. Its primary interfaces are a web portal and a Google Chrome extension that overlays contact details on top of LinkedIn profiles. This design makes <a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a> highly effective for cold callers who require phone numbers to execute manual dialer campaigns.
        </p>
        <p>
          However, <a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a> is structurally designed as a passive database lookup utility. It does not initiate action on its own. Using <a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a> requires a human operator to perform a series of manual steps:
        </p>
        <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-850 my-4">
          <li>Formulate search filters inside the <a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a> web app or search for profiles individually on LinkedIn.</li>
          <li>Spend database credits to unlock the mobile numbers and emails of selected prospects.</li>
          <li>Export the unlocked records into a CSV spreadsheet.</li>
          <li>Upload the CSV to a third-party email verification service to check for bounce risk.</li>
          <li>Import the verified list into an email sequencing platform like <a href="https://instantly.ai" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Instantly</a> or <a href="https://smartlead.ai" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Smartlead</a>.</li>
          <li>Set up separate, dedicated domain networks and warm up email boxes manually to ensure high deliverability.</li>
          <li>Write cold email templates and insert custom merge tags to simulate personalization.</li>
          <li>Monitor the sequencing inbox daily to detect and manually classify replies.</li>
        </ul>
        <p>
          This multi-step pipeline is highly fragmented. Because <a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a> does not handle campaign execution, copywriting, or multi-channel integration, the user must manage a complex sales stack. If the team also wants to conduct LinkedIn outreach, they must purchase a separate LinkedIn automation tool, risking account suspension due to coordinate limits. The operational overhead, subscription costs, and manual synchronization of these isolated systems reduce the efficiency of modern sales teams.
        </p>

        {/* Premium Style Callout Box */}
        <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
          <div className="pl-4">
            <h4 className="font-bold text-black mb-2 flex items-center gap-2">
              Strategic Copywriting Note 💡
            </h4>
            <p className="text-sm text-zinc-650 leading-relaxed">
              Sourcing direct contact details is only half the battle. To convert highly qualified buyers, read our complete guide on{" "}
              <Link href="/blogs/personalization-at-scale-writing-custom-linkedin-notes-in-2026" className="text-black font-bold hover:underline">
                Personalization at Scale
              </Link>{" "}
              to write custom notes that achieve high acceptance and reply rates.
            </p>
          </div>
        </div>

        <h2
          id="omentir-unified-platform"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          Omentir's Autonomous SDR Workflow: Unified Multi-Source Sourcing
        </h2>
        <p>
          Omentir sits in a different category from credit-based data brokers. Instead of selling static contact reveals, it is closer to a unified outbound workspace that combines discovery, enrichment, personalization, delivery, and response management. That can be useful for multi-channel teams, but it is not the right replacement when the only requirement is direct dial access for cold calling.
        </p>
        <p>
          The core of Omentir's technical architecture is the multi-source enrichment cascade. When given an ideal customer profile described in plain English, Omentir does not search a single database. Instead, it queries multiple data sources in a sequential cascade. If the first directory lacks a verified email, Omentir queries the second, then the third, and cross-references the findings with public web databases, social profiles, and company DNS records.
        </p>
        <p>
          This cascaded approach ensures that every lead profile is enriched with the highest quality data available. It replicates the manual research process of a human virtual assistant, but does so in seconds. Teams do not need to configure complex data workflows in tools like <a href="https://clay.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Clay</a> or buy multiple subscriptions to platforms like <a href="https://cognism.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Cognism</a> or <a href="https://apollo.io" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Apollo.io</a>.
        </p>
        <p>
          Once target leads are enriched, Omentir does not stop at list generation. The platform writes hyper-personalized, context-aware messages based on target company press releases, social media activity, and professional summaries. It executes these sequences across LinkedIn and email natively, ensuring that the volume of messages scales while protecting account safety through automatic throttling.
        </p>
        <p>
          As teams look to automate outreach, they often evaluate platforms like <a href="https://artisan.co" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Artisan AI</a> or <a href="https://11x.ai" target="_blank" rel="noopener" className="text-blue-600 hover:underline">11x.ai</a> to scale their sales pipeline. While these platforms focus heavily on abstract agentic actions, Omentir combines robust data-cascading directly inside a unified sales execution workspace.
        </p>

        <h2
          id="key-differentiators-comparison"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          Feature and Workflow Comparison: Legacy Database vs. Autonomous SDR
        </h2>
        <p>
          To understand the differences, let us contrast how a sales representative accomplishes outbound objectives using a legacy credit-based database like <a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a> versus using Omentir's autonomous workspace.
        </p>

        <div className="my-6 overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm bg-white">
            <thead className="bg-[#f4f2ec]">
              <tr>
                <th className="px-4 py-3 font-semibold text-black">Operational Phase</th>
                <th className="px-4 py-3 font-semibold text-black"><a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a> Pipeline</th>
                <th className="px-4 py-3 font-semibold text-black">Omentir Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800">
              <tr>
                <td className="px-4 py-3 font-semibold text-black">Lead Sourcing</td>
                <td className="px-4 py-3">Manual filtering by job title, geography, and industry. High risk of data decay in static lists.</td>
                <td className="px-4 py-3">Autonomous web crawling based on plain-English ICP descriptions. Real-time accuracy verification.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-black">Data Enrichment</td>
                <td className="px-4 py-3">Single-source lookup. Charging credits for individual phone numbers or email unlocks.</td>
                <td className="px-4 py-3">Native multi-source enrichment cascade. Combines directories and public web data automatically.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-black">Copywriting</td>
                <td className="px-4 py-3">Manual template creation. Relies on simple merge tags (e.g., First_Name, Company_Name).</td>
                <td className="px-4 py-3">Context-aware AI copywriting. Generates bespoke intros from live social and website crawling.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-black">Multi-Channel Delivery</td>
                <td className="px-4 py-3">None. Must export CSVs and upload to third-party email tools or LinkedIn sequencers.</td>
                <td className="px-4 py-3">Natively integrated, multi-channel (LinkedIn + Email) sequence execution inside one dashboard.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-black">Reply Management</td>
                <td className="px-4 py-3">Manual inbox triage. Individual reps must read, categorize, and reply to every incoming message.</td>
                <td className="px-4 py-3">Autonomous inbox classification. Detects reply intent (e.g., interest, objection) and drafts contextual responses.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-black">Account Safety</td>
                <td className="px-4 py-3">User-defined. No built-in throttling for email senders or LinkedIn profiles.</td>
                <td className="px-4 py-3">Natively managed API controls, sending limit boundaries, and safety-first interaction throttling.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          When a sales development team relies on <a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a>, the primary constraint is human capital. A sales representative spending hours every week filtering records, resolving duplicate leads, verifying emails, and switching between tools is a representative who is not spending time talking to prospective customers. The static database model turns outbound sales into a logistics problem.
        </p>
        <p>
          Omentir, by comparison, operates as a self-driving outreach engine. By specifying the target profile in simple terms, the platform performs the data logistics automatically. It runs the lookups, verifies the domains, drafts the personalized outreach, and delivers the sequence. This shifts the representative's role from data administration to conversation management, dramatically increasing the leverage of small growth teams.
        </p>

        <h2
          id="tactical-lead-enrichment"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          Building Natively Enriched Pipelines: A Tactical Setup Guide
        </h2>
        <p>
          To demonstrate how Omentir structures high-volume, multi-channel outreach safely, let us walk through a tactical deployment blueprint. This setup replaces three distinct software subscriptions with a single active sequence.
        </p>

        <h3 className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">Phase 1: Establish the ICP Instructions in Plain English</h3>
        <p>
          Rather than selecting rigid dropdown items that yield generic results, write a detailed profile description inside the dashboard:
        </p>
        <p className="italic bg-zinc-50 border-l-4 border-zinc-300 p-3 text-zinc-700 my-3">
          &quot;Identify founders, chief executive officers, or partners at boutique software development agencies in Western Europe that have between ten and fifty employees and mention specialized React or Node.js development services on their company websites.&quot;
        </p>
        <p>
          This natural language input enables Omentir's crawling engine to target highly specialized prospects that standard industry categorization filters consistently miss. Standard database filters frequently lump all technical service providers under a generic information technology label, making it difficult to target niche specialties.
        </p>

        <h3 className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">Phase 2: Configure the Enrichment Cascade</h3>
        <p>
          Once Omentir flags a target website, the multi-source enrichment cascade begins:
        </p>
        <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-850 my-4">
          <li><strong>Primary Lookup</strong>: The system attempts to resolve the key decision-makers through direct web crawls of the target's internal pages.</li>
          <li><strong>Social Identification</strong>: The agent identifies matching active LinkedIn profiles to ensure the contact remains current.</li>
          <li><strong>Email Verification</strong>: Omentir performs a real-time MX record check and SMTP handshake validation to minimize bounce rates.</li>
        </ul>

        <h3 className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">Phase 3: Build the Multi-Channel Outreach Sequence</h3>
        <p>
          With the verified lead data in place, design a sequence that combines social touches with cold email. This multi-channel approach significantly improves response rates compared to single-channel cold outreach.
        </p>
        <p>
          To structure your sequences for optimal performance, reference our comprehensive guide on{" "}
          <Link href="/blogs/how-to-build-a-high-converting-b2b-sales-sequence-on-linkedin" className="text-blue-600 hover:underline">
            how to build a high-converting B2B sales sequence on LinkedIn
          </Link>. A highly effective touchpoint progression includes:
        </p>
        <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-850 my-4">
          <li><strong>Day 1</strong>: View the prospect's LinkedIn profile and check their public posts to establish professional familiarity.</li>
          <li><strong>Day 3</strong>: Send a personalized LinkedIn connection request. The request should reference their recent work or company focus without pitching a product. For templates, read our guide on <Link href="/blogs/how-to-write-a-linkedin-connection-request-that-gets-accepted" className="text-blue-600 hover:underline">how to write a LinkedIn connection request that gets accepted</Link>.</li>
          <li><strong>Day 5 (If accepted)</strong>: Deliver a value-driven follow-up message on LinkedIn. If not accepted, route the contact to a cold email sequence using their verified business email address. This cross-channel approach ensures consistent outreach without domain risk.</li>
          <li><strong>Day 8</strong>: Send a highly personalized cold email detailing a relevant case study or technical resource.</li>
        </ul>

        <h3 className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">Phase 4: Intent-Based Reply Handling</h3>
        <p>
          When a prospect replies to an email or a LinkedIn message, Omentir's conversation engine classifies the response. The platform categorizes replies into:
        </p>
        <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-850 my-4">
          <li><strong>Meeting Requests</strong>: Direct requests for calendar links or demo bookings.</li>
          <li><strong>Objections</strong>: Common concerns regarding timing, pricing, or existing vendor agreements.</li>
          <li><strong>Information Requests</strong>: Requests for white papers, decks, or case studies.</li>
          <li><strong>Referrals</strong>: Introductions to another team member who manages the specific domain.</li>
        </ul>
        <p>
          By sorting incoming messages by intent, the system prevents hot leads from being missed. It drafts a contextual reply for each intent category, allowing the sales representative to review, edit, and click send. This prevents lead loss and helps teams re-engage prospects who might have otherwise ghosted. For strategies on handling slow-burning or non-responsive leads, read our guide on <Link href="/blogs/the-art-of-the-linkedin-follow-up-how-to-re-engage-ghosted-leads" className="text-blue-600 hover:underline">how to re-engage ghosted leads</Link>.
        </p>

        <h2
          id="calculating-roi-and-efficiency"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          ROI Analysis: Database Subscriptions vs. Autonomous SDR Agents
        </h2>
        <p>
          For growth-focused startups and agencies, sales operations costs are a primary consideration. The cost of a legacy, database-driven sales stack accumulates quickly because each functional layer requires a separate subscription. A typical modern sales stack includes:
        </p>
        <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-850 my-4">
          <li><strong>Database Access (<a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a> or <a href="https://www.apollo.io/" target="_blank" rel="noopener">Apollo</a>)</strong>: One hundred to two hundred dollars per seat per month.</li>
          <li><strong>Email Verification Tool</strong>: Fifty to one hundred dollars per month to clean old lead lists.</li>
          <li><strong>Cold Email Sequencer</strong>: Eighty to one hundred and fifty dollars per month.</li>
          <li><strong>LinkedIn Automation Tool</strong>: Eighty to one hundred and twenty dollars per seat per month.</li>
          <li><strong>Data Enrichment Orchestrator (<a href="https://www.clay.com/" target="_blank" rel="noopener">Clay</a>)</strong>: Two hundred and fifty to six hundred dollars per month, depending on credit usage.</li>
        </ul>
        <p>
          The total cost of this fragmented stack ranges from six hundred to over one thousand dollars per representative per month. This does not account for the human labor required to clean spreadsheets, build manual pipelines, and manage API errors.
        </p>
        <p>
          Omentir consolidates this entire tech stack into a single autonomous platform. By replacing separate lead lookup tools, enrichment pipelines, email delivery networks, and response-handling tools, Omentir reduces total software spending while increasing pipeline volume. More importantly, it saves hours of manual labor per representative every week, allowing outbound teams to spend less time managing software and more time talking to prospects.
        </p>

        <h2
          id="frequently-asked-questions"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          Frequently Asked Questions
        </h2>
      <FaqAccordion
        items={[
          {
            question: <>How does Omentir ensure compliance with data regulations like GDPR and CCPA?</>,
            answer: <>Omentir retrieves all prospect information from public, live web directories, active corporate websites, and public professional social media profiles. It does not store or resell historic personal contact databases. Because it uses live, real-time web discovery and double-verifies business email addresses before sending outreach, your campaigns remain fully compliant with professional email regulations.</>,
          },
          {
            question: <>Can I keep using <a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a> alongside Omentir if I already have a subscription?</>,
            answer: <>Yes. If you have an existing <a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a> contract and want to leverage its direct-dial mobile database for cold calling, you can import your <a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a> CSV files directly into Omentir. Omentir's enrichment cascade will verify the emails, clean the data, write personalized copy, and execute the multi-channel sequences automatically.</>,
          },
          {
            question: <>How does Omentir protect my LinkedIn profile and email domains?</>,
            answer: <>Omentir operates with safety-first parameters at its core. Rather than sending massive bursts of messages that trigger spam filters and platform restrictions, Omentir throttles sending volumes, introduces human-like randomized delays between actions, and restricts LinkedIn connection requests to safe daily limits. It also monitors email deliverability metrics and automatically pauses sending if bounce rates rise, protecting your outreach infrastructure.</>,
          },
          {
            question: <>Which platform is better for cold calling versus multi-channel outreach?</>,
            answer: <>If your primary growth channel is cold calling and your representatives spend all day dialling direct mobile numbers, <a href="https://www.lusha.com/home/" target="_blank" rel="noopener">Lusha</a> is a specialized database worth evaluating. If your team relies on multi-channel outreach, including personalized LinkedIn messages, custom cold emails, dynamic enrichment, and reply classification, a unified workflow such as Omentir may be more relevant.</>,
          }
        ]}
      />
      </div>
    </BlogPostTemplate>
  );
}
