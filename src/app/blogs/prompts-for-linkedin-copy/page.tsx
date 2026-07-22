import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";

export const metadata = createPageMetadata({
  title: "5 AI Prompts for High-Converting LinkedIn Outreach Copy - Omentir",
  description: "Stop writing generic LinkedIn messages. Copy these 5 grounded AI prompts to write personalized connection notes and follow-ups that feel human.",
  path: "/blogs/prompts-for-linkedin-copy",
  keywords: [
    "5 AI prompts LinkedIn outreach",
    "LinkedIn copywriting templates",
    "B2B connection note prompts",
    "social selling message scripts",
    "outbound copywriting prompts",
    "Omentir prompt management"
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "writing-for-social-outbox", label: "Why Email Outreach Copy Fails on LinkedIn", level: 1 },
  { id: "prompt-1-job-change", label: "Prompt 1: The Job Change Milestone Note", level: 1 },
  { id: "prompt-2-hiring-signal", label: "Prompt 2: The Hiring Board Problem Solver", level: 1 },
  { id: "prompt-3-shared-content", label: "Prompt 3: The Content Engagement Reference", level: 1 },
  { id: "prompt-4-tech-integration", label: "Prompt 4: The Tech Stack Integration Hook", level: 2 },
  { id: "prompt-5-low-friction-ask", label: "Prompt 5: The Permission-Based Discovery Ask", level: 2 },
  { id: "pacing-and-outbox-safety", label: "Integrating Prompts with Safe Outbox Pacing", level: 1 },
  { id: "prompts-implementation-sop", label: "SOP: Deploying AI Prompts in Campaigns", level: 1 },
  { id: "conclusion", label: "Testing and Tuning Your Social Copy", level: 1 }
];

const faqItems = [
  {
    question: "Why should LinkedIn messages be shorter than cold emails?",
    answer: "LinkedIn is a chat-native platform. Long, formal emails feel out of place in a chat window. Keeping messages under 75 words increases readability and response rates."
  },
  {
    question: "Can I use these prompts directly in ChatGPT or Gemini?",
    answer: "Yes, but give the model verified prospect context and your real product profile. Do not ask it to invent missing details or fill weak evidence with confident language."
  },
  {
    question: "How does Omentir automate prompt variables?",
    answer: "Omentir uses product and prospect context during discovery and campaign creation, then helps draft LinkedIn outreach that can be reviewed or launched depending on your workflow."
  },
  {
    question: "Should I include links in my first connection note?",
    answer: "No. First connection notes should never contain sales links, as they trigger spam filters and look automated. Focus on starting a conversational thread first."
  }
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="5 AI Prompts That Generate Compelling LinkedIn Outreach Copy"
      description="Stop sending generic templates. Copy these 5 tested AI prompts to write personalized connection notes and follow-ups that get replies."
      slug="prompts-for-linkedin-copy"
      publishedDate="March 11, 2026"
      updatedDate="March 11, 2026"
      bannerSrc="/prompts-for-linkedin-copy.avif"
      bannerAlt="5 AI prompts for LinkedIn outreach and copywriting templates illustration"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <p id="writing-for-social-outbox" className="scroll-mt-28">
        Social selling is fundamentally conversational. While cold email relies on structured, multi-paragraph messages containing calendar links, <a href="https://www.linkedin.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">LinkedIn</a> is a chat-native environment. If your connection request or message reads like a formal sales pitch, prospects will ignore it.
      </p>
      <p>
        To get responses on social channels, you must write short, direct messages. Your outreach should open by referencing a specific trigger (such as a job change, content comment, or integration update) and lead into a conversational question.
      </p>
      <p>
        Writing these custom notes manually for every lead limits your campaign capacity. By using structured AI prompts, you can generate personalized copywriting variables programmatically.
      </p>
      <p>
        Omentir helps manage this copywriting flow by combining product context, lead context, campaign drafting, and reviewable outreach workflows. The five prompts below are not magic templates. They are safe starting points that force the AI to write from evidence rather than vibes.
      </p>

      <h2 id="prompt-1-job-change" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Prompt 1: The Job Change Milestone Note
      </h2>
      <p>
        A job change can be a useful reason to reach out because a new leader often reviews priorities, team process, and tooling. But do not assume they are buying. The message should acknowledge the transition and ask a relevant question, not pounce on the move as if it proves pain.
      </p>
      <p>
        Use the prompt template below to write a direct note that references the transition without sounding like a mass congratulations campaign:
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`Write a short LinkedIn message for:
- Prospect: {prospect_name}
- New Role: {new_role}
- Company: {company_name}
- Public Context: {why_this_role_relates_to_your_offer}
- Product Profile: {verified_product_profile}

Rules:
1. Keep under 60 words.
2. Congratulate them on the move to {company_name}.
3. Do not assume they are changing tools or buying software.
4. Connect the new role to one role-relevant workflow from Public Context.
5. End with one low-pressure question.`}</code>
      </pre>
      <p>
        This prompt works because it keeps the model from making the leap from "new role" to "needs your product." It gives the AI permission to be relevant, but not presumptuous. A good output should sound like a peer asking a timely question.
      </p>
      <p>
        Bad output: "Congrats on the new role, are you looking for a sales automation platform?" Better output: "Congrats on the move to Acme. Curious if pipeline handoff is one of the workflows you are reviewing in the first few months?" The second version gives them room to answer naturally.
      </p>

      <h2 id="prompt-2-hiring-signal" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Prompt 2: The Hiring Board Problem Solver
      </h2>
      <p>
        Hiring posts are useful because they describe work the company needs done. They are not proof of budget, urgency, or tool preference. The prompt should reference the job responsibility, not overstate the meaning of the job post.
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`Write a LinkedIn outreach note based on this input:
- Prospect: {prospect_name}
- Role: {prospect_role}
- Hiring Post Snippet: {exact_public_snippet}
- Source URL: {source_url}
- Product Profile: {verified_product_profile}

Rules:
1. Limit to 70 words.
2. Reference only the work described in Hiring Post Snippet.
3. Do not say you know their internal priorities.
4. Ask whether they are trying to make that workflow more repeatable.
5. Keep the tone peer-to-peer.`}</code>
      </pre>
      <p>
        This keeps the message grounded. A hiring post may say the new role owns outbound research, reporting, or CRM hygiene. Your prompt should use that exact evidence. If the snippet is vague, the AI should produce a softer role-based question or reject the lead.
      </p>

      <h2 id="prompt-3-shared-content" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Prompt 3: The Content Engagement Reference
      </h2>
      <p>
        Content-based outreach is powerful when you actually engage with the idea. It is weak when the AI says "loved your post" without proving it understood anything. The prompt should force a reflection before it mentions your product.
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`Write a LinkedIn message based on:
- Prospect: {prospect_name}
- Topic: {post_topic}
- Prospect's Point: {one_sentence_summary_of_their_actual_point}
- Product Profile: {verified_product_profile}

Rules:
1. Keep under 70 words.
2. Reflect their actual point in plain language.
3. Do not flatter them or say "great post."
4. Connect to one relevant workflow only if Product Profile supports it.
5. End with a question they can answer in one sentence.`}</code>
      </pre>
      <p>
        This prompt positions you as a peer who read the idea, not a seller scraping a feed. If you cannot summarize the prospect's point accurately, do not use a content hook. Use another prompt.
      </p>

      <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
        <div className="pl-4">
          <h4 className="font-bold text-black mb-2 flex items-center gap-2">
            Copywriting Rule: No Hard Pitching
          </h4>
          <p className="text-sm text-zinc-650 leading-relaxed">
            Do not insert calendar links or case study URLs in the first connection message. The first job is to earn a reply, not force the buyer into a sales path.
          </p>
        </div>
      </div>

      <h2 id="prompt-4-tech-integration" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Prompt 4: The Tech Stack Integration Hook
      </h2>
      <p>
        Tech-stack hooks are risky because teams often overclaim what a public signal proves. A script tag, job post, or integration page may suggest a workflow, but it does not always prove active usage. This prompt keeps the claim narrow.
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`Write a message for:
- Prospect: {prospect_name}
- Company: {company_name}
- Public Tech Signal: {exact_public_signal}
- Signal Source: {source_url}
- Product Profile: {verified_product_profile}

Rules:
1. Limit to 65 words.
2. Reference the public tech signal without saying you know their internal stack.
3. Connect to a workflow only if Product Profile supports it.
4. Ask a diagnostic question instead of pitching an integration.
5. Keep the tone direct and clear.`}</code>
      </pre>
      <p>
        A safe output might say, "Saw your docs mention HubSpot routing. Curious if lead handoff is still mostly manual or already automated?" That is very different from "I know you use HubSpot and can sync leads into it." The first is public and careful. The second may be false.
      </p>

      <h2 id="prompt-5-low-friction-ask" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Prompt 5: The Permission-Based Discovery Ask
      </h2>
      <p>
        Instead of booking a meeting immediately, ask for permission to share a short video or asset. This reduces buyer friction because the prospect can say yes without committing to a call.
      </p>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-5 text-[13px] leading-6 text-zinc-200 my-4">
<code>{`Write a message based on:
- Prospect: {prospect_name}
- Role: {prospect_role}
- Buyer Problem: {specific_problem}
- Asset: {specific_asset_that_actually_exists}

Rules:
1. Keep under 60 words.
2. Address them as a peer manager in {prospect_role}.
3. Explain the asset in one concrete phrase.
4. Do not attach the link yet, wait for permission.`}</code>
      </pre>
      <p>
        The asset must be real. Do not ask the AI to invent a teardown, checklist, or video that your team has not created. A permission ask builds trust only when the promised follow-through is useful.
      </p>

      <h2 id="pacing-and-outbox-safety" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Integrating Prompts with Safe Outbox Pacing
      </h2>
      <p>
        Strong prompts do not remove the need for safe delivery. If you send too many connection requests or messages too quickly, the campaign can still create account risk. Better copy should reduce your need for volume, not justify more of it.
      </p>
      <p>
        Keep campaigns conservative, paced, and reviewable. New prompts should start with a small batch so you can inspect the output before scaling. If the first drafts contain unsupported claims, fix the prompt and evidence schema before sending.
      </p>
      <p>
        Omentir coordinates campaign execution through daily quotas and human-paced queues. Learn more about safety principles in our guide to{" "}
        <Link href="/blogs/human-paced-outreach" className="text-blue-600 hover:underline">
          pacing LinkedIn outreach campaigns
        </Link>
        .
      </p>

      <h2 id="prompts-implementation-sop" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        SOP: Deploying AI Prompts in Campaigns
      </h2>
      <p>
        Follow these steps to deploy prompt templates:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Step 1:</strong> Select a target list and identify the primary intent trigger (e.g. job change or hiring post).</li>
        <li><strong>Step 2:</strong> Attach a source URL, exact snippet, and confidence level to every personalization variable.</li>
        <li><strong>Step 3:</strong> Add your verified product profile and disallowed claims.</li>
        <li><strong>Step 4:</strong> Generate a small draft batch and review the weakest examples first.</li>
        <li><strong>Step 5:</strong> Reject prompts that create fake familiarity, unsupported claims, or meeting pressure too early.</li>
        <li><strong>Step 6:</strong> Launch only after the drafts sound like something a careful founder would send manually.</li>
      </ul>
      <p>
        Omentir can help manage the product context, lead context, campaign creation, and review workflow around these prompts. Your team still owns the standard for what deserves to be sent.
      </p>
      <p>
        Add one more review step before launch: compare five drafts side by side. If they all have the same rhythm, same ask, and same vague compliment, the prompt is still too generic. Good prompt output should vary because the evidence varies, not because the model randomly swaps synonyms.
      </p>
      <p>
        Also inspect the weakest inputs, not only the strongest ones. A prompt that works when the lead has a perfect job-change signal may fail when the only context is a role and company page. Your production campaign will contain imperfect records, so the prompt must know when to fall back or reject the draft.
      </p>
      <p>
        Keep a small library of approved and rejected outputs. The approved examples show the model what good sounds like. The rejected examples help your team spot recurring problems: fake enthusiasm, unsupported integrations, too much pitch, or questions that feel like calendar pressure.
      </p>

      <h2 id="conclusion" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Testing and Tuning Your Social Copy
      </h2>
      <p>
        Writing copy for social selling requires testing, but do not optimize only for response volume. Track qualified replies, confused replies, objections, accepted conversations, and meetings that match your ICP. A prompt that gets more replies from the wrong people is not better.
      </p>
      <p>
        Start with these five prompts, but treat them as frameworks. The quality comes from the evidence you feed them, the product truth you enforce, and the review process that catches weak drafts. Omentir provides the campaign and safety controls to help you scale that workflow without turning LinkedIn into a template machine.
      </p>
    </BlogPostTemplate>
  );
}
