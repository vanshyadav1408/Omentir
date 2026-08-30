import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import Link from "next/link";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "Crafting a LinkedIn Profile That Doubles Your Outbound Acceptances - Omentir",
  description: "Treat your LinkedIn profile as a B2B sales landing page. Structure the headline, About section, and featured links so prospects can decide whether to accept.",
  path: "/blogs/crafting-a-linkedin-profile-that-doubles-your-outbound-acceptances",
  image: {
    url: "/crafting-a-linkedin-profile-that-doubles-your-outbound-acceptances.avif",
    width: 1774,
    height: 887,
    alt: "Crafting a LinkedIn Profile banner",
  },
  keywords: ["optimize LinkedIn profile sales", "LinkedIn profile landing page", "outreach acceptance rate LinkedIn", "sales profile headline formula", "social selling profile audit"],
});

const tocItems = [
  { id: "profile-landing-page", label: "Profile as a landing page", level: 1 },
  { id: "headline-formula", label: "Headline writing formula", level: 1 },
  { id: "about-section-story", label: "Drafting the About section", level: 1 },
  { id: "social-proof-cta", label: "Social proof and calls to action", level: 1 },
  { id: "profile-optimization-checklist", label: "Full profile audit checklist", level: 1 },
  { id: "frequently-asked-questions", label: "Outreach FAQs", level: 1 }
] as const;

const faqItems = [
  { question: "Should B2B sales reps activate \"Creator Mode\" on their LinkedIn profiles?", answer: "Yes. Creator Mode lets you display custom hashtags, highlights your Featured section, and replaces the default \"Connect\" button with \"Follow\" for non-targeted traffic, while preserving the \"Connect\" capability for personalized outreach campaigns." },
  { question: "How many client recommendations should I have to build credible social proof?", answer: "Aim for at least three to five recommendations from direct professional peers or clients. Those recommendations should mention specific metrics, project outcomes, and professional credibility rather than generic politeness." },
  { question: "Should I clean up ancient, non-relevant job history from my experience section?", answer: "Yes. Your experience section is a sales credibility asset, not an exhaustive background check. Remove old student roles, internships, or non-B2B roles that do not support your current profile." },
  { question: "How can I double my acceptance rates while maintaining daily outreach limits?", answer: "Combine a clear landing-page profile with a safety-first sales outreach tool like Omentir. Targeted campaigns, daily safety throttles, and personalized messages let you raise connection acceptances without putting profile health at risk." },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Crafting a LinkedIn Profile That Doubles Your Outbound Acceptances"
      description="Treat your LinkedIn profile as a B2B sales landing page. Structure the headline, About section, and featured links so prospects can decide whether to accept."
      slug="crafting-a-linkedin-profile-that-doubles-your-outbound-acceptances"
      bannerSrc="/crafting-a-linkedin-profile-that-doubles-your-outbound-acceptances.avif"
      bannerAlt="Crafting a LinkedIn Profile That Doubles Your Outbound Acceptances outreach concept art"
      faqItems={faqItems}
      tocItems={tocItems as any}
    >
      <div id="introduction" className="scroll-mt-28">
        <p>
          Your LinkedIn profile is the first thing a B2B decision maker checks after a connection request or a cold message. They click your name and ask: who is this person, do they understand my industry, and is this a sales trap?
        </p>
        <p>
          If the profile reads like a generic sales pitch, or like a representative hunting for a meeting, connection acceptance often sits below 20 percent. To raise outbound conversions, treat the profile as a B2B landing page. A resume that lists your quota does less work than a page that explains the problem you help with and why you are a credible peer.
        </p>

        <h2
          id="profile-landing-page"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          Why your LinkedIn profile behaves as a B2B landing page
        </h2>
        <p>
          In traditional marketing, a landing page converts traffic by removing distractions, proving authority, and pointing to one call to action. On LinkedIn, your profile does the same job. The cold message is the ad copy. The profile is the page that checks whether the ad was honest.
        </p>
        <p>
          To convert cold leads, the profile has to respect how buyers actually read:
        </p>
        <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-850 my-4">
          <li><strong>Shift focus from self to prospect:</strong> Do not lead with personal sales achievements, quota attainments, or business development awards. Outline the operational challenges your prospects face and the metric outcomes your organization delivers.</li>
          <li><strong>Lead with peer-level authority:</strong> B2B decision makers, especially founders, CEOs, and technical directors, prefer talking with other leaders and operational peers, not sales reps. Position yourself as a professional peer with subject-matter expertise.</li>
          <li><strong>Make the next step obvious:</strong> Make it easy for a visiting prospect to learn what you do, review solid social proof, and open a low-friction resource without leaving LinkedIn.</li>
        </ul>

        {/* Premium Style Callout Box */}
        <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
          <div className="pl-4">
            <h4 className="font-bold text-black mb-2 flex items-center gap-2">
              The Pitchless Headline Boundary
            </h4>
            <p className="text-sm text-zinc-650 leading-relaxed">
              Never use sales-heavy headlines like "Helping B2B SaaS book 20 demos." They read as "sales representative" and push prospects to decline. Write headlines that name your operational role and the core business metrics you manage.
            </p>
          </div>
        </div>

        <h2
          id="headline-formula"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          The high-converting headline formula
        </h2>
        <p>
          Your headline is the single most visible element of your profile. It appears next to your name in search results, connection request notifications, feed posts, and group discussions. It must state clearly what you do, who you serve, and why it matters in under 120 characters.
        </p>
        <p>
          Use this three-part framework:
        </p>
        <div className="my-6 text-sm text-zinc-600 font-mono bg-[#f4f2ec] p-4 rounded-xl border border-zinc-250">
          <strong>[Role / Authority Title]</strong> + <strong>[Clear Metric Outcome / Value Hook]</strong> + <strong>[Niche Keyword / Specific Problem Solved]</strong>
        </div>

        <p>
          Three role-specific examples using this formula:
        </p>

        {/* Template 1 */}
        <div className="my-6 rounded-xl border border-zinc-200 bg-[#ba38710d] p-6 relative overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
          <div className="absolute inset-y-0 left-0 w-1 bg-[#ba3871]" />
          <div className="pl-4">
            <span className="text-xs font-bold text-black uppercase tracking-wider block mb-2">1. Technical Founder Variant</span>
            <p className="text-sm text-zinc-800 italic leading-relaxed mb-3">
              "Founder @ [CompanyName] - Building secure, API-first integrations that eliminate data synchronization lag | B2B Infrastructure Architect"
            </p>
            <p className="text-xs text-zinc-500">
              <strong>Why it works:</strong> Positions the founder around engineering authority and the technical outcome, completely avoiding sales jargon.
            </p>
          </div>
        </div>

        {/* Template 2 */}
        <div className="my-6 rounded-xl border border-zinc-200 bg-[#ba38710d] p-6 relative overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
          <div className="absolute inset-y-0 left-0 w-1 bg-[#ba3871]" />
          <div className="pl-4">
            <span className="text-xs font-bold text-black uppercase tracking-wider block mb-2">2. VP of Sales / Growth Director Variant</span>
            <p className="text-sm text-zinc-800 italic leading-relaxed mb-3">
              "Growth @ [CompanyName] - Fixing B2B deliverability systems so cold outreach reaches the primary inbox | Deliverability Expert"
            </p>
            <p className="text-xs text-zinc-500">
              <strong>Why it works:</strong> Focuses on the core business challenge (inbox delivery) and the expert capacity, inviting curiosity from sales leaders.
            </p>
          </div>
        </div>

        {/* Template 3 */}
        <div className="my-6 rounded-xl border border-zinc-200 bg-[#ba38710d] p-6 relative overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
          <div className="absolute inset-y-0 left-0 w-1 bg-[#ba3871]" />
          <div className="pl-4">
            <span className="text-xs font-bold text-black uppercase tracking-wider block mb-2">3. Early Stage Operations Director Variant</span>
            <p className="text-sm text-zinc-800 italic leading-relaxed mb-3">
              "Ops Director @ [CompanyName] - Optimizing B2B sales automation pipelines to protect account safety and throttle bounce rates"
            </p>
            <p className="text-xs text-zinc-500">
              <strong>Why it works:</strong> Emphasizes risk management and operations efficiency, which matters to buyers who care about account safety.
            </p>
          </div>
        </div>

        <h2
          id="about-section-story"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          Drafting a B2B About section sales narrative
        </h2>
        <p>
          Your About section should not be a dry, chronological listing of past job roles. Frame it as a B2B sales narrative: the prospect's daily pains, the outcomes you deliver, credibility with clear milestones, and a low-pressure call to action.
        </p>
        <p>
          A B2B About section that converts usually follows this four-part structure:
        </p>
        <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-3 text-zinc-850 my-4">
          <li><strong>Part 1: The Context Trap (0-100 words):</strong> State a controversial or highly visible operational challenge in your industry. Frame it as the primary blocker preventing companies from scaling. (e.g., <em>"Most B2B outreach campaigns are completely blocked by email providers before a single buyer reads the copy..."</em>)</li>
          <li><strong>Part 2: The Core Thesis (100-200 words):</strong> Explain why traditional methods fail, and present your core operational thesis. Focus on how you approach the problem differently.</li>
          <li><strong>Part 3: The Authority Proof (200-350 words):</strong> List three bulleted metric achievements or milestones that validate your thesis. Use clear, unembellished numbers to prove your claims.</li>
          <li><strong>Part 4: The Frictionless CTA (350-400 words):</strong> Close with a low-friction call to action. Do not ask for a formal meeting or calendar slot. Instead, invite them to send a DM or check out a pinned resource.</li>
        </ul>

        <h2
          id="social-proof-cta"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          Setting up social proof and CTA features
        </h2>
        <p>
          LinkedIn's **Featured** section is prime real estate. It sits directly below your About section and lets you pin visual links, PDFs, articles, and media. This is the main way to move a visiting prospect further into your sales funnel.
        </p>
        <p>
          To set up Featured for B2B lead conversion:
        </p>
        <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-3 text-zinc-850 my-4">
          <li><strong>Pin a 90-Second Value Video:</strong> Record a brief, un-gated loom video outlining a custom operational workflow or tearing down a common industry mistake. Make sure the thumbnail is clean and professional.</li>
          <li><strong>Upload a Peer Case Study PDF:</strong> Pin a highly readable, 2-page PDF case study detailing how you helped a similar peer organization resolve their core bottlenecks, highlighting clear metric outcomes.</li>
          <li><strong>Include a Frictionless Calendar Link:</strong> If you include a scheduling link, be sure to frame it around a value-first, non-sales audit or peer discussion, completely removing the "hard sales trap" connotation.</li>
        </ul>

        {/* Featured Section Strategy Box */}
        <div className="my-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-zinc-400" />
          <div className="pl-4">
            <h4 className="font-bold text-black mb-2">Featured section setup guide</h4>
            <p className="text-sm text-zinc-650 leading-relaxed mb-4">
              To convert visiting cold prospects, limit Featured to no more than three items. Too many links causes choice overload and weakens the main proof:
            </p>
            <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-sm text-zinc-650">
              <li><strong>Item 1:</strong> A high-quality un-gated resource (PDF checklist or video teardown).</li>
              <li><strong>Item 2:</strong> A detailed B2B peer-group client success story.</li>
              <li><strong>Item 3:</strong> A conversational call to action (a link to an audit or direct profile DM invite).</li>
            </ul>
          </div>
        </div>

        <h2
          id="profile-optimization-checklist"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          The LinkedIn profile optimization checklist
        </h2>
        <p>
          To make the profile function as a B2B landing page, audit your account assets against this checklist:
        </p>

        {/* Profile Audit Checklist Table */}
        <div className="my-6 overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm bg-white">
            <thead className="bg-[#f4f2ec]">
              <tr>
                <th className="px-4 py-3 font-semibold text-black">Profile Asset</th>
                <th className="px-4 py-3 font-semibold text-black">Optimization Action Required</th>
                <th className="px-4 py-3 font-semibold text-black">Conversion Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr>
                <td className="px-4 py-3 font-medium text-black">Profile Photo</td>
                <td className="px-4 py-3 text-zinc-650">High-resolution headshot with professional lighting, clear eye contact, and neutral background. Avoid casual selfies or cropped group photos.</td>
                <td className="px-4 py-3 text-zinc-650 font-semibold text-green-600">Immediate Trust Build</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-black">Banner Image</td>
                <td className="px-4 py-3 text-zinc-650">Clean, branded graphic displaying a single, concise value proposition or your company logo against a neutral background. Avoid generic stock photos.</td>
                <td className="px-4 py-3 text-zinc-650 font-semibold text-green-600">Brand Professionalism</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-black">Headline</td>
                <td className="px-4 py-3 text-zinc-650">Apply the three-part formula: Role + Metric Value Hook + Niche Keyword. Avoid sales-heavy pitches.</td>
                <td className="px-4 py-3 text-zinc-650 font-semibold text-red-500">Connection Accept Rates</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-black">About Section</td>
                <td className="px-4 py-3 text-zinc-650">Structure as a 4-part sales narrative. Focus on prospect pain points and metric proof instead of career history.</td>
                <td className="px-4 py-3 text-zinc-650 font-semibold text-green-600">Engagement & Inquiry</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-black">Experience Section</td>
                <td className="px-4 py-3 text-zinc-650">Highlight metric achievements, case studies, and corporate milestones under your current role. Remove ancient, irrelevant history.</td>
                <td className="px-4 py-3 text-zinc-650 font-semibold text-yellow-600">Credibility Verification</td>
              </tr>
            </tbody>
          </table>
        </div>


        <h2
          id="profile-copy-examples-you-can-use"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          Profile copy examples you can use
        </h2>
        <p>
          A profile optimization guide should leave the reader with usable copy, not only principles. Below are simple before-and-after patterns for the parts of your profile that prospects inspect after receiving your connection request.
        </p>
        <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-3 text-zinc-850 my-4">
          <li><strong>Headline before:</strong> Founder at Acme. <strong>Headline after:</strong> Helping B2B SaaS teams turn warm LinkedIn conversations into qualified demos.</li>
          <li><strong>About opener before:</strong> I am passionate about sales and automation. <strong>About opener after:</strong> I work with lean B2B teams that have a strong offer but need a repeatable way to start conversations with the right buyers.</li>
          <li><strong>Featured section before:</strong> A company homepage link with no context. <strong>Featured section after:</strong> A short case study, a clear demo page, and one proof asset that shows the outcome your outreach claims.</li>
        </ul>
        <p>
          The profile should answer three questions quickly: who you help, what problem you solve, and why the prospect should trust you enough to accept the request. If a sentence does not support one of those three questions, remove it or move it lower on the page.
        </p>

        <h2
          id="quick-audit-before-you-send-invites"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          Quick audit before you send invites
        </h2>
        <p>
          Before sending a new batch of requests, open your profile as if you were the buyer. In ten seconds, can they understand who you help and why your request is relevant? If not, rewrite the headline, first line of the About section, and featured proof asset before increasing outreach volume.
        </p>
        <p>
          A strong profile creates continuity. The request creates curiosity, the headline confirms relevance, the About section explains the problem you solve, and the featured section proves you have helped someone similar. When those pieces match, acceptance rates rise because the prospect does not need to guess your intent.
        </p>
        <h2
          id="frequently-asked-questions"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          Frequently asked questions
        </h2>

        <FaqAccordion items={faqItems} />
      </div>
    </BlogPostTemplate>
  );
}
