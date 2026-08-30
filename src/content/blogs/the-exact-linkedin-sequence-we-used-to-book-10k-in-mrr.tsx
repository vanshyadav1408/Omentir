import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import Link from "next/link";
import FaqAccordion from "../../faq-accordion";

export const metadata = createPageMetadata({
  title: "The Exact LinkedIn Sequence We Used to Book $10k in MRR - Omentir",
  description: "A detailed breakdown of the exact multi-step LinkedIn outreach strategy, copywriting, and daily cadence used to generate $10k in MRR.",
  path: "/blogs/the-exact-linkedin-sequence-we-used-to-book-10k-in-mrr",
  image: {
    url: "/the-exact-linkedin-sequence-we-used-to-book-10k-in-mrr.avif",
    width: 1774,
    height: 887,
    alt: "LinkedIn $10k MRR sequence case study banner",
  },
  keywords: ["$10k MRR sales sequence", "LinkedIn outbound growth case study", "MRR lead generation copy", "B2B SaaS outreach sequence", "bootstrap sales playbook", "SaaS pipeline growth"],
});

const tocItems = [
  { id: "mrr-backstory", label: "The backstory: breaking the pipeline wall", level: 1 },
  { id: "multi-step-sequence", label: "The 3-step sequence architecture", level: 1 },
  { id: "copywriting-templates", label: "The exact copy-paste templates", level: 1 },
  { id: "outbound-math-case-study", label: "The campaign metrics and funnel", level: 1 },
  { id: "core-lessons", label: "3 core lessons for replicating $10k MRR", level: 1 },
  { id: "safety-automation", label: "Automating the sequence safely", level: 1 },
  { id: "faqs", label: "Frequently asked questions", level: 1 }
] as const;

const faqItems = [
  { question: "How long did it take to close the initial 12 customers?", answer: "It took exactly 5 and a half months from the date we re-engineered our sequence copywriting and deployed Omentir's automated intent-sourcing tools." },
  { question: "What was the average contract value (ACV)?", answer: "Our average contract value sat at $850 per month, meaning we needed exactly 12 active premium accounts to cross the sustainable $10k in monthly recurring revenue milestone." },
  { question: "Did you use paid Sales Navigator features?", answer: "Yes. We treated a Sales Navigator subscription as required for clean B2B prospecting campaigns. It lets you build narrow, curated lead lists using real-time intent filters." },
  { question: "What if our close rate is lower than 25%?", answer: "If your close rate is low, your product validation is likely lagging or your demo presentation focuses on feature lists rather than business outcomes. Retool your demo script, address immediate pain points, and offer low-risk pilot trials to build momentum." },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="The Exact LinkedIn Sequence We Used to Book $10k in MRR"
      description="A detailed breakdown of the exact multi-step LinkedIn outreach strategy, copywriting, and daily cadence used to generate $10k in MRR."
      slug="the-exact-linkedin-sequence-we-used-to-book-10k-in-mrr"
      bannerSrc="/the-exact-linkedin-sequence-we-used-to-book-10k-in-mrr.avif"
      bannerAlt="The Exact LinkedIn Sequence We Used to Book $10k in MRR outreach concept art"
      faqItems={faqItems}
      tocItems={tocItems as any}
    >
      <div id="introduction" className="scroll-mt-28">
        <p>
          Reaching $10k in Monthly Recurring Revenue (MRR) is a practical milestone for a B2B SaaS startup or growth agency. At that point, the product has basic validation, operations can stay funded by customers, and the business is no longer only a side project.
        </p>
        <p>
          Getting there is still hard. Paid ads are expensive for early-stage companies, and search engine optimization (SEO) takes months. Direct outbound was the fastest path to customers for us. We secured our initial $10k in MRR in under six months with a structured, automated LinkedIn outbound sequence. This case study covers the copywriting, message timing, and deliverability parameters we used.
        </p>

        <h2
          id="mrr-backstory"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          The backstory: breaking the pipeline wall
        </h2>
        <p>
          When we first launched Omentir, our sales workflow was a complete mess. We fell into the classic "pitch-slap" trap: the second a prospect accepted our connection request, we blasted them with a 300-word block of marketing text detailing our features, along with a Calendly link.
        </p>
        <p>
          The results were bad. Our connection acceptance rates hovered below 25%, and our active reply rates sat at 3%. Prospects ignored our messages, and some even flagged our profiles as spam. We were spending 4 hours a day manually scraping directories and writing custom notes, only to book a single demo every three weeks.
        </p>
        <p>
          We realized we had to rebuild the approach. We stopped pitching the platform immediately, removed scheduling links from early messages, and focused on disarming, peer-level conversations. Better targeting and cleaner triggers made the campaign easier to manage and easier for prospects to answer.
        </p>

        {/* Premium Style Callout Box */}
        <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
          <div className="pl-4">
            <h4 className="font-bold text-black mb-2 flex items-center gap-2">
              The campaign outcome
            </h4>
            <p className="text-sm text-zinc-650 leading-relaxed">
              By deploying a 3-step value-first sequence, our connection acceptance rates rose to 68%. Our positive responder rate doubled, filling our pipeline with 12 new premium clients and pushing our bootstrapped SaaS past the $10,000 MRR milestone in under 90 days.
            </p>
          </div>
        </div>

        <h2
          id="multi-step-sequence"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          The 3-step sequence architecture
        </h2>
        <p>
          Our winning campaign cadence discarded long corporate messaging blocks in favor of brief, conversational Slack-style interactions. By spacing our touchpoints carefully, we gave prospects room to breathe and reply naturally.
        </p>
        <p>
          Here is the timeline and objective of each sequence touchpoint:
        </p>

        <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-3 text-zinc-850 my-4">
          <li><strong>Step 1: The Low-Friction Invite (Day 1):</strong> A brief connection note under 150 characters. It references a shared community or public comment, with exactly 0% sales pitch.</li>
          <li><strong>Step 2: The Conversational Value starter (Day 4 - 3 days later):</strong> A short message pointing to a specific operational pain point their peers navigate daily, offering a frictionless checklist or short loom video.</li>
          <li><strong>Step 3: The Low-Pressure Check-in (Day 9 - 5 days later):</strong> A brief, disarming breakup message that removes all sales pressure, which frequently triggers fear of missing out (FOMO) and prompts a response.</li>
        </ul>

        <h2
          id="copywriting-templates"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          The exact copy-paste templates
        </h2>
        <p>
          These are the copy templates we used. You can copy, adapt, and deploy them for your own B2B audience:
        </p>

        {/* Invite Template */}
        <div className="my-6 rounded-xl border border-zinc-200 bg-[#ba38710d] p-6 relative overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
          <div className="absolute inset-y-0 left-0 w-1 bg-black" />
          <div className="pl-4">
            <span className="text-xs font-bold text-black uppercase tracking-wider">Step 1: Low-Friction Connection Note</span>
            <p className="mt-2 text-sm text-zinc-800 font-mono italic leading-relaxed">
              "Hi [First_Name], saw we are both members of the Pavilion revenue group. Really enjoyed your recent post on sales onboarding duplicate friction. Thought it made sense to connect peer-to-peer!"
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-300 text-xs text-zinc-650">
              <strong>Why it works:</strong> It relies on the "in-group" bias of a shared professional community. It has no links, no pricing, and no requests on their calendar. It gets accepted 68% of the time.
            </div>
          </div>
        </div>

        {/* Value Template */}
        <div className="my-6 rounded-xl border border-zinc-200 bg-[#ba38710d] p-6 relative overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
          <div className="absolute inset-y-0 left-0 w-1 bg-black" />
          <div className="pl-4">
            <span className="text-xs font-bold text-black uppercase tracking-wider">Step 2: The Conversational Value Starter</span>
            <p className="mt-2 text-sm text-zinc-800 font-mono italic leading-relaxed">
              "Thanks for connecting, [First_Name]. Quick question: most revenue leaders I chat with in Pavilion say that duplicate lead scraping consumes almost 12 hours a week per AE. <br/><br/>
              We actually put together a 3-step automation blueprint that pulls real-time buyer intent directly into Slack, saving our team about 15 hours. Happy to drop the PDF if you are open to skimming it?"
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-300 text-xs text-zinc-650">
              <strong>Why it works:</strong> It asks for permission before sharing the link, which avoids the usual spam reflex. By focusing on a specific pain point ("12 hours of duplicate scraping") rather than generic benefits, it drives high response rates.
            </div>
          </div>
        </div>

        {/* Breakup Template */}
        <div className="my-6 rounded-xl border border-zinc-200 bg-[#ba38710d] p-6 relative overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
          <div className="absolute inset-y-0 left-0 w-1 bg-black" />
          <div className="pl-4">
            <span className="text-xs font-bold text-black uppercase tracking-wider">Step 3: The Disarming Breakup Note</span>
            <p className="mt-2 text-sm text-zinc-800 font-mono italic leading-relaxed">
              "Hey [First_Name], completely understand that streamlining lead scraping isn't a priority for your team this quarter. I'll stop cluttering your inbox. <br/><br/>
              If you ever want to check out the cached intent workflows in the future, I'll be sharing templates on my profile. Wish you all the best!"
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-300 text-xs text-zinc-650">
              <strong>Why it works:</strong> It is professional and removes sales pressure. Because you took the opportunity away, prospects frequently reply to keep the connection warm.
            </div>
          </div>
        </div>

        <h2
          id="outbound-math-case-study"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          The campaign metrics and funnel
        </h2>
        <p>
          Here is the campaign conversion funnel that delivered the initial $10k in MRR:
        </p>

        <div className="my-6 overflow-x-auto rounded-lg border border-zinc-200 shadow-sm bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
            <thead className="bg-[#f4f2ec]">
              <tr>
                <th className="px-4 py-3 font-semibold text-black">Sequence Metric</th>
                <th className="px-4 py-3 font-semibold text-black">Campaign Value</th>
                <th className="px-4 py-3 font-semibold text-black">Conversion Ratio</th>
                <th className="px-4 py-3 font-semibold text-black">Strategic Takeaway</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-650">
              <tr>
                <td className="px-4 py-3 font-medium text-black">Total Targets Contacted</td>
                <td className="px-4 py-3">600 Accounts</td>
                <td className="px-4 py-3">100% Funnel Entry</td>
                <td className="px-4 py-3">Curated list of Series A and B B2B technical companies.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-black">Connections Accepted</td>
                <td className="px-4 py-3">408 Accepted</td>
                <td className="px-4 py-3">68% Acceptance Rate</td>
                <td className="px-4 py-3">High rate driven by organic profile optimization and zero connection pitch notes.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-black">Total Active Responses</td>
                <td className="px-4 py-3">146 Responses</td>
                <td className="px-4 py-3">35.7% Response Rate</td>
                <td className="px-4 py-3">Active replies spread across Step 2 (92 replies) and Step 3 (54 replies).</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-black">Qualified Demos Booked</td>
                <td className="px-4 py-3">48 Demos Booked</td>
                <td className="px-4 py-3">32.8% Response-to-Demo Pivot</td>
                <td className="px-4 py-3">Demos secured by offering a disarming calendar convenience option.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-black">Closed Customers</td>
                <td className="px-4 py-3">12 Clients Closed</td>
                <td className="px-4 py-3">25% Close Rate</td>
                <td className="px-4 py-3">Average contract value of $850/mo, which crossed the $10k MRR milestone.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2
          id="core-lessons"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          3 core lessons for replicating $10k MRR
        </h2>
        <p>
          If you want to copy this growth path for your own B2B company, focus on these three guidelines:
        </p>
        <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-850 my-4">
          <li><strong>1. Clean your lead lists aggressively.</strong> Automation is only as good as the data feeding it. If your automation outputs uncleaned company strings like "Acme Corp LLC - EMEA Division," prospects will instantly recognize the script. Spend real time cleaning names, titles, and company formats.</li>
          <li><strong>2. Respect the buyer's calendar.</strong> Never pitch booking links in your early messages. Focus entirely on verifying pain points and establishing conversational dialogue first. Once the ice is broken, booking the call is simple.</li>
          <li><strong>3. Keep volume conservative.</strong> Do not run high-volume blast campaigns. Sending a steady, safe volume of 15 targeted invitations daily consistently yields better long-term pipeline value than sporadic, massive spamming campaigns.</li>
        </ul>

        {/* Workflow checklist */}
        <div className="my-10 rounded-2xl border border-zinc-200 bg-[#f4f2ec] p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.06)] relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[#ba3871]" />
          <h3 style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mb-3">
            Turn the sequence into a repeatable process
          </h3>
          <p className="text-sm text-zinc-650 leading-relaxed max-w-xl mx-auto mb-6">
            Use the sequence above as a repeatable operating model. Keep the list narrow, track each reply type, and only scale what proves it can create useful conversations.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-md bg-black px-5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Plan the Workflow
            </Link>
          </div>
        </div>

        <h2
          id="safety-automation"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          Automating the sequence safely
        </h2>
        <p>
          Executing a multi-touch sequence manually is a large time commitment. To scale safely, delegate only the repetitive steps to software and keep the strategy visible. Use random delay pacing, natural spacing, and strict volume limits to protect the profile while preserving message quality.
        </p>


        <h2
          id="adapt-sequence-to-your-market"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          How to adapt the sequence to your market
        </h2>
        <p>
          The exact sequence matters, but copying it blindly is a mistake. The reason it produced $10k in MRR was not the wording alone. It worked because the audience, trigger, offer, and follow-up path all matched each other.
        </p>
        <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-3 text-zinc-850 my-4">
          <li><strong>Change the trigger first:</strong> Replace our signal with the strongest buying signal in your market, such as hiring, funding, compliance pressure, agency growth, or a recent product launch.</li>
          <li><strong>Keep the first message low-friction:</strong> Do not jump straight to a demo request unless the prospect has already shown active buying intent.</li>
          <li><strong>Use proof that matches the segment:</strong> A founder cares about speed and revenue. A RevOps buyer cares about process reliability. A sales leader cares about pipeline quality.</li>
          <li><strong>Measure conversation quality:</strong> A sequence that creates fewer but better replies is usually more valuable than one that creates many vague positive responses.</li>
        </ul>
        <p>
          Treat the sequence as a structure: context, problem, proof, and simple next step. Once that structure is preserved, the surface copy can change for each market without losing the logic that made the campaign work.
        </p>

        <h2
          id="what-to-measure-after-launch"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28"
        >
          What to measure after launch
        </h2>
        <p>
          After launching the sequence, measure the full path from invite to revenue. Track connection acceptance, first-message replies, positive replies, booked demos, show rate, close rate, and new MRR. A sequence that books calls but closes poorly may be attracting curiosity rather than buyers.
        </p>
        <p>
          Also tag every positive reply by reason. Some prospects respond because of the trigger, some because of the proof, and some because the ask is easy. The winning reason tells you what to emphasize in the next version of the campaign.
        </p>
        <h2
          id="faqs"
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
