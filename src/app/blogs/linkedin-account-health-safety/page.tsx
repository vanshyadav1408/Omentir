import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";

export const metadata = createPageMetadata({
  title: "The Ultimate Guide to LinkedIn Account Health - Omentir",
  description: "How to keep LinkedIn sales profiles usable: cookies, session location, API routing, pacing limits, and what to do after a restriction.",
  path: "/blogs/linkedin-account-health-safety",
  keywords: [
    "ultimate guide linkedin account health",
    "social selling profile safety score",
    "cookie session management outbound",
    "api routing encryption security",
    "recover restricted linkedin account",
    "Omentir platform safety"
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "account-health-importance", label: "What actually keeps a LinkedIn profile safe", level: 1 },
  { id: "health-baseline", label: "Create an account health baseline", level: 2 },
  { id: "calculating-health-score", label: "How platforms score account health", level: 1 },
  { id: "cookie-session-management", label: "Session security: cookies and location", level: 2 },
  { id: "secure-api-routing", label: "Skip risky extensions: use API routes", level: 2 },
  { id: "objections-and-spam-flags", label: "Copy that cuts spam reports", level: 1 },
  { id: "sender-reputation-loop", label: "The sender reputation feedback loop", level: 2 },
  { id: "health-metrics-table", label: "Account health metrics to track", level: 2 },
  { id: "handling-restrictions", label: "If you get restricted", level: 1 },
  { id: "restricted-restart-plan", label: "Restart safely after a restriction", level: 2 },
  { id: "safety-sop-checklist", label: "SOP: weekly account health audit", level: 1 },
  { id: "team-operating-rules", label: "Team operating rules", level: 2 },
  { id: "sender-assignment", label: "Assign the right sender", level: 2 },
  { id: "monthly-cleanup", label: "Monthly cleanup routine", level: 2 },
  { id: "conclusion", label: "Keep the sending setup boring and healthy", level: 1 },
  { id: "faqs", label: "Frequently asked questions", level: 1 }
];

const faqItems = [
  {
    question: "What factors influence my LinkedIn account health score?",
    answer: "Platforms weigh several signals: connection acceptance (aim above 40%), spam reports (keep near zero), profile completion, and whether sending pace looks consistent."
  },
  {
    question: "Why do browser extensions trigger LinkedIn account bans?",
    answer: "Browser extensions inject code directly into the LinkedIn DOM and perform actions at uniform, non-human speeds, which platform security flags as bot activity immediately."
  },
  {
    question: "How does Omentir ensure my login credentials stay safe?",
    answer: "Omentir connects to profiles via secure API pathways, encrypting session tokens and managing requests without storing raw passwords or using risky extensions."
  },
  {
    question: "What should I do if my LinkedIn account is temporarily restricted?",
    answer: "Disconnect all outreach automation, withdraw pending connection requests, wait for the restriction to lift on its own, and use the account by hand for 7 days before resuming campaigns."
  }
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="The Ultimate Guide to LinkedIn Account Health and Safety"
      description="How platform scoring, session persistence, API routes, and paced sending keep LinkedIn sales profiles from getting restricted."
      slug="linkedin-account-health-safety"
      bannerSrc="/linkedin-account-health-safety.avif"
      bannerAlt="LinkedIn profile security pillars and automated outbox throttling diagram"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <p id="account-health-importance" className="scroll-mt-28">
        B2B outbound only lasts as long as the sending accounts stay usable. Growth teams spend months sourcing lists, writing prompts, and wiring multi-profile campaigns. If those profiles get restricted or banned, the pipeline stops.
      </p>
      <p>
        Social platforms have tightened spam filters. They look for repetitive action intervals, session IP mismatches, and low acceptance. Profiles that look like bots get locked.
      </p>
      <p>
        You do not need a hidden tool to stay under those filters. You need cookie hygiene, API routing instead of DOM scripts, and daily limits you actually keep.
      </p>
      <p>
        Account health is not a setting. It is the history of where you logged in, how fast you sent, and whether the last fifty notes looked like one person. Treat that history as an asset.
      </p>

      <h3 id="health-baseline" className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">
        Create an account health baseline
      </h3>
      <p>
        Before connecting any outbound workflow, record the account's baseline. Count pending invites, recent accepted requests, current conversations, profile completeness, and whether the account has received recent security prompts. This gives you a reference point when performance changes.
      </p>
      <p>
        Without a baseline, teams misdiagnose problems. They blame the copy when the account was already unhealthy. Or they blame the platform when a new campaign doubled activity overnight. Account health is easier to protect when you can see what changed.
      </p>

      <h2 id="calculating-health-score" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        How platforms score account health
      </h2>
      <p>
        LinkedIn evaluates profile activity and assigns a trust score. Accounts with higher scores usually get more weekly invite room.
      </p>
      <p>
        The platform monitors several indicators:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Connection Acceptances:</strong> Target rates above 40-50%. If prospects ignore your requests, your trust score drops.</li>
        <li><strong>Spam Reports:</strong> Flagged when prospects select "I don't know this person" after declining invites.</li>
        <li><strong>Account Activity Mix:</strong> Organic feed posts, comments, and manual messages build trust margins.</li>
      </ul>
      <p>
        For profile setup rules, see our guide on{" "}
        <Link href="/blogs/crafting-a-linkedin-profile-that-doubles-your-outbound-acceptances" className="text-blue-600 hover:underline">
          crafting high-acceptance LinkedIn profiles
        </Link>
        .
      </p>
      <p>
        Treat these indicators as directional, not as a public scorecard. LinkedIn does not expose a single account-health number to operators. Your internal score should be a practical proxy that helps the team decide whether to increase, hold, or reduce activity.
      </p>

      <h2 id="cookie-session-management" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Session security: cookies and location
      </h2>
      <p>
        Session conflicts are a major trigger for security alerts. If a sales operator logs in to a profile from New York while an automation script accesses it from London minutes later, security checks will lock the profile.
      </p>
      <p>
        To prevent these geolocation alerts, ensure your automation runs on proxy servers located in your local region.
      </p>
      <p>
        Also keep browser cookies so session tokens persist. Constant re-authentication looks like a new device every time.
      </p>
      <p>
        The safest operating model is one owner per profile. If three people log in from different cities, while a tool sends from a fourth location, the account starts to look abnormal. Keep access limited, document who owns the profile, and avoid casual password sharing.
      </p>

      <h2 id="secure-api-routing" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Skip risky extensions: use API routes
      </h2>
      <p>
        Chrome extensions are a bad idea for B2B prospecting. They inject code into the page DOM, which platform security scripts can see.
      </p>
      <p>
        Use API routing instead. Connect profiles through an API connector (Unipile is one example). Campaigns then talk to platform endpoints instead of clicking around in a browser.
      </p>
      <p>
        API routing is not a license to send aggressively. It simply removes one risky execution method: browser manipulation. You still need daily caps, message review, opt-out handling, and a clear stop condition when someone replies.
      </p>

      <div className="my-8 rounded-xl border border-zinc-200 bg-[#f4f2ec] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />
        <div className="pl-4">
          <h4 className="font-bold text-black mb-2 flex items-center gap-2">
            Cap daily actions
          </h4>
          <p className="text-sm text-zinc-650 leading-relaxed">
            Never send more than 20 connection requests a day from one profile. Space them with random delays.
          </p>
        </div>
      </div>

      <h2 id="objections-and-spam-flags" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Copy that cuts spam reports
      </h2>
      <p>
        Relevance is an account-health issue. Generic pitches to cold lists get reported as spam.
      </p>
      <p>
        Use copywriting prompts grounded in website metadata and career signals, as detailed in our guide on{" "}
        <Link href="/blogs/prompts-for-linkedin-copy" className="text-blue-600 hover:underline">
          outbound copywriting prompts
        </Link>
        .
      </p>
      <p>
        Relevance protects the account because recipients react differently when a message clearly belongs in their professional context. A low-fit message is not just a conversion problem. It increases ignored requests, negative replies, and spam reports.
      </p>

      <h3 id="sender-reputation-loop" className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">
        The sender reputation feedback loop
      </h3>
      <p>
        Review account health weekly through a simple loop: audience, copy, volume, reaction. If the audience is broad, copy gets vague. If copy is vague, acceptance drops. If acceptance drops while volume rises, account risk increases.
      </p>
      <p>
        Fix the loop from the start, not the end. Narrow the audience before rewriting every message. Rewrite the opener before increasing daily sends. Reduce volume before the account shows verification prompts.
      </p>
      <div className="my-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="font-mono text-sm leading-7 text-zinc-800">
          Weekly question: did this sender create useful conversations with the right buyers, or did it merely perform activity?
        </p>
      </div>

      <h3 id="health-metrics-table" className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">
        Account health metrics to track
      </h3>
      <p>
        You do not need a complicated dashboard to protect a LinkedIn profile. Track a small set of metrics weekly and write down the decision each metric implies.
      </p>
      <div className="my-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
          <thead className="bg-[#f4f2ec]">
            <tr>
              <th className="px-4 py-3 font-semibold text-black">Metric</th>
              <th className="px-4 py-3 font-semibold text-black">What it tells you</th>
              <th className="px-4 py-3 font-semibold text-black">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-650">
            <tr>
              <td className="px-4 py-3 font-medium text-black">Acceptance rate</td>
              <td className="px-4 py-3">Whether the audience and connection note are relevant.</td>
              <td className="px-4 py-3">Tighten ICP before increasing volume.</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-black">Pending invites</td>
              <td className="px-4 py-3">Whether old requests are accumulating.</td>
              <td className="px-4 py-3">Withdraw stale requests on a schedule.</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-black">Negative replies</td>
              <td className="px-4 py-3">Whether prospects feel the outreach is irrelevant.</td>
              <td className="px-4 py-3">Pause and rewrite targeting or copy.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The action column is the important part. Metrics are only useful if they change behavior. If a profile is trending in the wrong direction and the team keeps sending anyway, the dashboard becomes decoration.
      </p>

      <h2 id="handling-restrictions" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        If you get restricted
      </h2>
      <p>
        If the profile is restricted, recover it in this order:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Step 1:</strong> Disconnect all campaigns and automation scripts immediately.</li>
        <li><strong>Step 2:</strong> Withdraw all pending connection requests to clean your inbox.</li>
        <li><strong>Step 3:</strong> Verify identity details requested by platform security.</li>
        <li><strong>Step 4:</strong> Once cleared, warm up the profile manually for 7 days before resuming campaign automation.</li>
      </ul>
      <p>
        For warmup details, see our guide on{" "}
        <Link href="/blogs/how-to-warm-up-linkedin-account" className="text-blue-600 hover:underline">
          warming up LinkedIn profiles
        </Link>
        .
      </p>

      <h3 id="restricted-restart-plan" className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">
        Restart safely after a restriction
      </h3>
      <p>
        A restriction should reset the campaign plan. Do not reconnect the account and resume at the old volume the moment access returns. Spend several days using the account manually, answering existing conversations, and removing stale pending invites.
      </p>
      <p>
        When you restart, go back to the last volume that produced clean signals. If 15 requests per day triggered issues, restart at 5 to 8 with a narrower ICP. The goal is to rebuild normal behavior, not to make up for lost sending days.
      </p>

      <h2 id="safety-sop-checklist" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        SOP: weekly account health audit
      </h2>
      <p>
        Audit account safety weekly:
      </p>
      <ul style={{ listStyleType: "disc" }} className="list-disc pl-6 space-y-2 text-zinc-800">
        <li><strong>Step 1:</strong> Track connection acceptance rates and keep them above 40%.</li>
        <li><strong>Step 2:</strong> Withdraw pending connection requests open for more than 14 days.</li>
        <li><strong>Step 3:</strong> Verify that your automation proxies match your local operator region.</li>
        <li><strong>Step 4:</strong> Check campaign pacing and outbox delay settings in Omentir.</li>
        <li><strong>Step 5:</strong> Review negative replies and opt-outs for targeting problems.</li>
        <li><strong>Step 6:</strong> Confirm every active campaign has a human owner watching replies.</li>
      </ul>
      <p>
        Omentir tracks these campaign settings so the outbound pipeline stays inside the limits you set.
      </p>

      <h3 id="team-operating-rules" className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">
        Team operating rules
      </h3>
      <p>
        If multiple people use the same workspace, write operating rules. Who can launch a campaign? Who can raise daily limits? Who handles opt-outs? Who decides when an account pauses? Ambiguity creates risk because everyone assumes someone else is watching the sender.
      </p>
      <p>
        Keep the rules simple: no new campaign without an ICP review, no volume increase without a weekly health check, no automated follow-up after a human reply, and no ignored opt-out. These rules protect the account and the brand at the same time.
      </p>

      <h3 id="sender-assignment" className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">
        Assign the right sender
      </h3>
      <p>
        Account health is easier to protect when the sender matches the buyer. A founder profile is usually strongest for early customer discovery, design-partner outreach, and high-trust conversations. A sales profile may work better for broader prospecting once the message is proven.
      </p>
      <p>
        Do not assign campaigns randomly across available accounts. Match the sender's role, geography, network, and credibility to the audience. A technical founder reaching CTOs feels natural. A generic sales account pitching engineers may feel like a spam pattern even if the message is technically personalized.
      </p>
      <p>
        This also helps with replies. When a prospect responds, the sender should be able to continue the conversation credibly. If the profile cannot answer obvious follow-up questions, the account will create awkward handoffs and weaker buyer trust.
      </p>
      <p>
        Good sender assignment makes the outreach feel natural before the buyer reads a word.
      </p>

      <h3 id="monthly-cleanup" className="text-lg font-bold text-zinc-900 mt-6 scroll-mt-28">
        Monthly cleanup routine
      </h3>
      <p>
        Once a month, run a deeper cleanup. Review every connected sender, archive inactive campaigns, remove old test lists, verify opt-out suppression, and check whether each sender still matches the market it is contacting.
      </p>
      <p>
        This routine catches slow drift. A profile that started as a founder account can become a generic company sender. A campaign that started with a tight ICP can quietly expand into weak-fit leads. Monthly cleanup brings the system back to the original safety standard.
      </p>
      <p>
        The best account-health program is not dramatic. It is a small set of habits repeated consistently: clean list, relevant message, paced send, fast human reply, and honest pause when the signals degrade.
      </p>

      <h2 id="conclusion" style={{ fontFamily: "var(--font-varta)" }} className="text-2xl font-semibold tracking-tight text-black mt-10 pt-2 border-b border-zinc-200 pb-2 scroll-mt-28">
        Keep the sending setup boring and healthy
      </h2>
      <p>
        Outbound works when it looks like a person talking to people they have a reason to contact. Teams that ignore safety spend their weeks recovering accounts.
      </p>
      <p>
        Manage session location, API routing, and invite pacing, and the profile stays usable. A clean integration still cannot save a founder who logs in from a new country and sends 60 invites that night. Judgment and hygiene still matter.
      </p>
    </BlogPostTemplate>
  );
}
