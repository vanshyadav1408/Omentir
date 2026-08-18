import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";

export const metadata = createPageMetadata({
  title: "Crafting a Compelling B2B Sales Offer - Omentir",
  description: "Stop pitching product features. How to structure risk reversals, performance guarantees, and value-based pricing so a cold B2B offer is easier to try.",
  path: "/blogs/crafting-compelling-b2b-offer",
  keywords: [
    "crafting B2B sales offer",
    "risk reversal B2B contracts",
    "value based pricing structures",
    "performance guarantee outbound sales",
    "convert outbound leads conversion",
    "Omentir pricing models"
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "the-offer-barrier", label: "A feature pitch vs a real offer", level: 1 },
  { id: "diagnose-buyer-friction", label: "Diagnose the buyer friction first", level: 2 },
  { id: "offer-anatomy", label: "Anatomy of a B2B offer that is easy to try", level: 1 },
  { id: "aligned-incentive-pricing", label: "Pricing: match fees to how the buyer gets value", level: 2 },
  { id: "risk-reversal-guarantees", label: "Risk reversal: guarantees and pilots", level: 2 },
  { id: "contextual-proof", label: "Proof that matches the buyer", level: 2 },
  { id: "offer-message-example", label: "Turn the offer into outreach copy", level: 2 },
  { id: "safety-and-delivery-limits", label: "Pace delivery so the profile stays usable", level: 1 },
  { id: "offer-creation-sop", label: "SOP: four-step offer checklist", level: 1 },
  { id: "conclusion", label: "Remove friction. Do not shout the discount.", level: 1 },
  { id: "faqs", label: "Frequently asked questions", level: 1 }
];

const faqItems = [
  {
    question: "What is risk reversal in B2B sales?",
    answer: "It is the practice of shifting the purchase risk from the buyer to the seller, using guarantees (like money-back policies or pilot performance thresholds) to reduce buying hesitation."
  },
  {
    question: "How do I structure value-based pricing for software?",
    answer: "Set pricing tiers against the customer's usage metrics (Omentir's Pro plan starts at $49/month based on active accounts and discovery limits) so they pay in proportion to the value they get."
  },
  {
    question: "How does Omentir help deliver early-stage sales offers?",
    answer: "Omentir automates lead discovery, personalizes prompts based on website metadata, and manages organic pacing, allowing you to validate offers with minimal overhead."
  },
  {
    question: "What is a pilot program and how should I run it?",
    answer: "A pilot program is a short-term trial (usually 14 to 30 days) with defined success criteria, allowing enterprise buyers to verify product fit before signing long-term contracts."
  }
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Crafting a B2B Offer That Prospects Can't Say No To"
      description="Stop pitching features and start pitching outcomes. How to structure risk reversals, performance guarantees, and value-based pricing so a cold offer is easier to try."
      slug="crafting-compelling-b2b-offer"
      bannerSrc="/crafting-compelling-b2b-offer.avif"
      bannerAlt="B2B offer design and sales risk reversal framework diagram"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <p id="the-offer-barrier" className="scroll-mt-28">
        Outbound results depend on the offer. Teams spend weeks on landing pages, inbox rotation, and personalized prompts. Then they message prospects, and the reply rate is still driven by what they actually proposed.
      </p>
      <p>
        Most B2B pitches list features. The software uses machine learning. It integrates with CRMs. It has automated reporting.
      </p>
      <p>
        Feature lists do not close deals. Buyers want a problem solved, not a longer spec sheet.
      </p>
      <p>
        To convert cold leads, package pricing, risk guarantees, and proof into a proposition that makes the next step easy.
      </p>
      <p>
        Omentir supports that workflow: it finds leads and keeps campaigns paced. The rest of this piece is how to construct the offer itself.
      </p>
      <p>
        A compelling offer is not the same thing as an aggressive discount. Discounts lower the price, but they do not always lower the buyer's perceived risk. A buyer may still worry that the product will take too long to implement, fail to integrate with their workflow, distract their team, or create political risk if the project disappoints.
      </p>
      <p>
        The best offers make the buyer's next step feel obvious. They clarify the problem, define the outcome, reduce the risk of trying, and give the buyer a small first commitment that can expand if the value is real. That is especially important in outbound, where the prospect did not ask to evaluate your product.
      </p>

      <h2 id="diagnose-buyer-friction" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Diagnose the buyer friction first
      </h2>
      <p>
        Before improving your offer, identify the exact reason prospects hesitate. Most teams guess. They assume the issue is price, so they discount. Sometimes price is the issue. More often, the buyer is unclear on urgency, unsure whether the product fits their workflow, worried about implementation, or unconvinced that the promised outcome matters enough right now.
      </p>
      <p>
        Review recent sales conversations and sort objections into four categories:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Problem friction:</strong> The buyer does not believe the pain is urgent enough to solve.</li>
        <li><strong>Fit friction:</strong> The buyer is unsure whether your product matches their company size, workflow, tools, or team structure.</li>
        <li><strong>Risk friction:</strong> The buyer worries the rollout will fail, waste time, or make them look bad internally.</li>
        <li><strong>Proof friction:</strong> The buyer likes the idea but has not seen enough evidence to trust the promised outcome.</li>
      </ul>
      <p>
        Each type of friction needs a different offer adjustment. Problem friction needs sharper pain framing. Fit friction needs a narrower segment and clearer eligibility. Risk friction needs a pilot, onboarding support, or reversible commitment. Proof friction needs examples, usage evidence, or a smaller claim you can defend.
      </p>

      <h2 id="offer-anatomy" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Anatomy of a B2B offer that is easy to try
      </h2>
      <p>
        A usable B2B offer ties your product to the buyer's business metrics and reduces the risk of trying it.
      </p>
      <p>
        A professional B2B sales offer contains three core components:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Aligned Pricing:</strong> Fees that scale relative to value (e.g. usage-based plans).</li>
        <li><strong>Risk Reversal:</strong> Performance guarantees or trial periods that protect the buyer's investment.</li>
        <li><strong>Contextual Proof:</strong> Case studies displaying metrics from companies in their sector.</li>
      </ul>
      <p>
        Add two more elements for outbound campaigns: a clear entry point and a reason to act now. The entry point is the first step you are asking for, such as a short audit, a pilot, a teardown, or a workflow review. The reason to act now should come from the buyer's context, not fake urgency. Hiring a new sales role, expanding into a new market, changing a tech stack, or struggling with manual work are all better reasons than "limited time offer."
      </p>
      <p>
        A complete offer sentence should sound like this: "For [specific buyer] dealing with [painful current situation], we help [outcome] through [mechanism], starting with [low-risk first step], so you can decide based on [proof or observable result]." If you cannot fill that sentence without vague language, your offer is not ready for outbound.
      </p>
      <p>
        For early validation rules, see our guide on{" "}
        <Link href="/blogs/validate-mvp-via-cold-outreach" className="text-blue-600 hover:underline">
          MVP validation via cold outreach
        </Link>
        .
      </p>

      <h2 id="aligned-incentive-pricing" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Pricing: match fees to how the buyer gets value
      </h2>
      <p>
        Pricing design is a conversion issue. Large upfront costs make buyers hesitate and stretch the cycle.
      </p>
      <p>
        Omentir is priced so the buyer's cost tracks usage. Pro is self-serve. Enterprise is for teams that need more support:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li>
          <strong>Pro ($49/month):</strong> Includes one user, one LinkedIn
          account, unlimited AI agents, leads, campaigns, AI automated campaigns,
          API access, email customer support, and a minimum of three bookings per
          week or you pay nothing.
        </li>
        <li>
          <strong>Enterprise:</strong> Includes unlimited users, unlimited
          LinkedIn accounts, all Pro features, plus SSO, dedicated onboarding,
          and priority support. Book a call to discuss your setup.
        </li>
      </ul>
      <p>
        This self-serve model reduces purchasing friction, allowing buyers to start at a comfortable scale.
      </p>
      <p>
        For your own product, do not choose a pricing model because it sounds modern. Choose it based on how the buyer experiences value. Seat-based pricing works when each additional user clearly receives value. Usage-based pricing works when activity volume tracks value. Flat monthly pricing works when buyers want predictability and the product is easy to understand. Custom pricing works when implementation, volume, or security requirements vary heavily by customer.
      </p>
      <p>
        The important part is that the fee matches how value shows up. If a founder is testing outbound for the first time, a large annual contract is extra friction. If a sales agency manages multiple accounts, a tiny starter plan may underprice the work. A good offer lets the buyer start at the right commitment without feeling trapped.
      </p>
      <p>
        Avoid hiding pricing behind a sales call unless there is a real reason. Early-stage buyers often interpret hidden pricing as a sign that the product is expensive, complicated, or not designed for them. If you need custom pricing, explain what drives the range: account volume, workflow complexity, onboarding requirements, or integration needs.
      </p>

      <h2 id="risk-reversal-guarantees" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Risk reversal: guarantees and pilots
      </h2>
      <p>
        Risk reversal is the most effective way to close deals. By offering guarantees, you shift the purchase risk from the buyer to your business.
      </p>
      <p>
        Consider implementing these risk-reversal options:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>14-Day Free Trial:</strong> Allows buyers to verify product fit before their first billing cycle.</li>
        <li><strong>Pilot Success Guarantee:</strong> Promises custom onboarding support or service credits if defined usage metrics are not met during the first month.</li>
      </ul>
      <p>
        Be careful with performance guarantees. A guarantee should cover something you can control. You can guarantee setup help, response time, onboarding sessions, lead review quality, data cleanup, or service credits if a pilot does not reach agreed usage milestones. You should not guarantee revenue, booked meetings, or conversion outcomes unless you control the entire process and have clear terms.
      </p>
      <p>
        A strong pilot program has five parts:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Scope:</strong> Which team, workflow, account, or campaign will be tested?</li>
        <li><strong>Timeline:</strong> How long will the pilot run, and when will results be reviewed?</li>
        <li><strong>Success criteria:</strong> What observable result would make the buyer confident enough to continue?</li>
        <li><strong>Responsibilities:</strong> What must your team do, and what must the buyer provide?</li>
        <li><strong>Next step:</strong> What happens if the pilot works, and what happens if it does not?</li>
      </ul>
      <p>
        For example, instead of saying "try our outbound tool free," offer a two-week pilot to build one ICP-filtered LinkedIn prospecting workflow, review the first batch of leads, and compare message drafts against the buyer's current manual process. That pilot has a real job. It is not just free access.
      </p>

      <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
        <div className="pl-4">
          <h4 className="font-bold text-black mb-2 flex items-center gap-2">
            Ground copy in facts
          </h4>
          <p className="text-sm text-zinc-650 leading-relaxed">
            Make outreach copy match the product. Inventing prices or features in a campaign kills trust immediately.
          </p>
        </div>
      </div>

      <h2 id="contextual-proof" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Proof that matches the buyer
      </h2>
      <p>
        To make your offer believable, you must include verified proof. Senders who reference general product statements see lower conversion rates.
      </p>
      <p>
        Ground your messages by referencing specific, defensible proof. If you have verified customer outcomes, use them with permission. If you do not, use narrower proof: a workflow example, a short teardown, a product screenshot, a before-and-after process, or a pilot result that does not exaggerate what happened.
      </p>
      <p>
        Contextual proof means the evidence matches the buyer. A founder-led SaaS team may care about getting from manual prospecting to a repeatable first workflow. A sales agency may care about managing multiple LinkedIn accounts safely. A revenue leader may care about lead quality and rep focus. The same product can require different proof depending on who is reading the offer.
      </p>
      <p>
        Use this proof hierarchy:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Best:</strong> A named customer story with permission, clear context, and a specific outcome.</li>
        <li><strong>Good:</strong> An anonymized workflow example that explains the before and after honestly.</li>
        <li><strong>Useful early:</strong> A product teardown, sample output, or pilot checklist that lets the buyer judge quality directly.</li>
        <li><strong>Weak:</strong> Generic claims such as "save time," "boost productivity," or "grow faster" without evidence.</li>
      </ul>
      <p>
        When in doubt, make the claim smaller and more concrete. "We help teams centralize prospect research and message review" is less flashy than "we transform sales," but it is easier to believe and easier to validate.
      </p>

      <h2 id="offer-message-example" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Turn the offer into outreach copy
      </h2>
      <p>
        Once the offer is clear, your outreach message should not restate every detail. Cold copy should carry the smallest version of the offer that earns a reply. Save the pricing table, pilot terms, and proof packet for the conversation.
      </p>
      <p>
        A weak message sounds like this:
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`Hi Jordan, Omentir is an AI sales platform with lead discovery,
personalized messages, campaign automation, safe pacing, and analytics.
Would you like to book a demo?`}</code>
      </pre>
      <p>
        A stronger message turns the offer into a buyer-specific question:
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`Jordan, saw you are hiring your first outbound rep.
Teams at that stage often need cleaner prospect research before adding volume.
Omentir helps founder-led teams build one ICP-filtered LinkedIn workflow with human-reviewed messages.
Worth comparing how you are handling lead quality before the new hire starts?`}</code>
      </pre>
      <p>
        The stronger version does not list features. It names the buyer moment, connects it to a business problem, explains the mechanism, and asks a low-friction question. That is what a compelling offer should do in outbound form.
      </p>

      <h2 id="safety-and-delivery-limits" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Pace delivery so the profile stays usable
      </h2>
      <p>
        Even with a compelling offer, you must pace your outreach. Sending too many requests too quickly will trigger automated security restrictions.
      </p>
      <p>
        Omentir manages this pacing automatically. For safety limits, see our guide on{" "}
        <Link href="/blogs/human-paced-outreach" className="text-blue-600 hover:underline">
          pacing LinkedIn campaigns safely
        </Link>
        .
      </p>
      <p>
        Offer quality and sending safety work together. A strong offer sent too aggressively still damages trust. A safe, slow campaign with a vague offer still fails commercially. Start with smaller batches, review the quality of replies, and adjust the offer based on real objections rather than sending more volume to compensate for weak positioning.
      </p>
      <p>
        If prospects keep saying "not a priority," revisit the urgency. If they say "too expensive," inspect whether the value is specific enough. If they say "send more information," your offer may be interesting but unclear. Each objection is a signal about which part of the offer needs work.
      </p>

      <h2 id="offer-creation-sop" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        SOP: four-step offer checklist
      </h2>
      <p>
        Construct your B2B sales offer using these steps:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Step 1:</strong> Identify the core pain points resolved by your software.</li>
        <li><strong>Step 2:</strong> Set pricing against the buyer's usage metrics.</li>
        <li><strong>Step 3:</strong> Add a risk-reversal guarantee (such as a pilot trial period).</li>
        <li><strong>Step 4:</strong> Update copywriting variables in Omentir to reference proof metrics.</li>
      </ul>
      <p>
        Expand that into a working offer brief:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Buyer:</strong> The exact segment, role, company stage, and trigger you are targeting.</li>
        <li><strong>Pain:</strong> The costly workflow problem the buyer already recognizes.</li>
        <li><strong>Outcome:</strong> The practical result your product helps create.</li>
        <li><strong>Mechanism:</strong> The way your product creates that result, explained without jargon.</li>
        <li><strong>Entry point:</strong> Trial, pilot, audit, teardown, setup call, or self-serve plan.</li>
        <li><strong>Risk reducer:</strong> Support, clear scope, service credit, reversible commitment, or success review.</li>
        <li><strong>Proof:</strong> Customer result, workflow example, screenshot, or pilot evidence you can defend.</li>
      </ul>
      <p>
        Omentir manages these campaign variables so the copy stays specific and the send stays paced.
      </p>

      <h2 id="conclusion" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Remove friction. Do not shout the discount.
      </h2>
      <p>
        B2B outreach works when it is timely and relevant. Frame the product as a low-risk offer with a clear first step, and hesitation drops. The pipeline moves because trying is easier, not because the copy is louder.
      </p>
      <p>
        The offer does not need to be loud. It needs to be clear, credible, and easy to try. If a stranger cannot repeat the offer after one read, the copy is not ready for a cold inbox.
      </p>
    </BlogPostTemplate>
  );
}
