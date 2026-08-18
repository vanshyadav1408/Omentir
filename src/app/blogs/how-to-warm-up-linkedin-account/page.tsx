import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import { ArticleImage } from "../article-image";

const slug = "how-to-warm-up-linkedin-account";
const coverSrc = `/blogs/${slug}/cover.avif`;
const title = "How to Warm Up a LinkedIn Account Without Getting Restricted";
const description =
  "LinkedIn can lock invitations for a week if a quiet account suddenly sends too many. Here is a conservative four-week warmup, plus what to do if you already hit the limit.";

export const metadata = createPageMetadata({
  title,
  description,
  path: `/blogs/${slug}`,
  image: {
    url: coverSrc,
    width: 3200,
    height: 1600,
    alt: "Four-week LinkedIn warmup plan showing daily invite ceilings from week 1 through week 4",
  },
  keywords: [
    "how to warm up a LinkedIn account",
    "LinkedIn account warmup",
    "LinkedIn invitation restriction",
    "new LinkedIn profile connection requests",
    "LinkedIn invite limit reached",
  ],
});

const tocItems = [
  { id: "what-warmup-is", label: "What warmup actually is", level: 1 },
  { id: "what-linkedin-publishes", label: "What LinkedIn publishes", level: 1 },
  { id: "three-starting-states", label: "New, dormant, or already active", level: 1 },
  { id: "four-week-plan", label: "A conservative four-week plan", level: 1 },
  { id: "acceptance-governs", label: "Let acceptance govern volume", level: 1 },
  { id: "do-not-do", label: "What not to do in week one", level: 1 },
  { id: "if-restricted", label: "If you already hit the limit", level: 1 },
  { id: "when-warmup-ends", label: "When you can stop calling it warmup", level: 1 },
  { id: "faqs", label: "Frequently asked questions", level: 1 },
] as const;

const faqItems = [
  {
    question: "Do I need to warm up a LinkedIn account before sending connection requests?",
    answer:
      "Yes if the account is new, recently created, or has been quiet for weeks. LinkedIn looks at sudden changes in invitation volume. A complete, already-active profile can start lower and rise faster. A blank or dormant one should spend the first week on the profile and on people who already know you.",
  },
  {
    question: "How long does a LinkedIn invitation restriction last?",
    answer:
      "LinkedIn Help says a temporary invitation restriction typically lasts one week. Withdrawing pending invitations does not lift it. You cannot buy more invites while restricted, and Support will not shorten the wait.",
  },
  {
    question: "How many connection requests should a new LinkedIn account send per day?",
    answer:
      "There is no official daily number. A conservative start is zero to five invites a day, only to people likely to accept. Rise only when acceptance stays healthy and the account has no security prompts. Chasing 20 a day in week one is how quiet accounts get locked.",
  },
  {
    question: "Does withdrawing old invitations reset my LinkedIn limit?",
    answer:
      "No. LinkedIn Help is explicit: withdrawing pending invitations will not remove an invitation restriction. Clean stale pending invites before you scale, in small batches, so you do not create another spike. Do not treat withdraw as a way to lift a restriction.",
  },
  {
    question: "How long should a LinkedIn warmup take?",
    answer:
      "Four weeks is a safe default for a new or dormant account. An already-active personal profile can often move faster. Do not graduate the account because a calendar said day 15. Graduate it when the profile looks real, acceptance is healthy, and nothing has been flagged.",
  },
] as const;

const sectionClassName =
  "mt-10 scroll-mt-28 border-b border-[var(--md-sys-color-outline-variant)] pb-2 pt-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]";

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title={title}
      description={description}
      slug={slug}
      bannerSrc={coverSrc}
      bannerAlt="Four-week LinkedIn warmup plan showing daily invite ceilings from week 1 through week 4"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <p>
        Warmup is not a growth hack. It is the boring work of making a LinkedIn account look like a
        person who already uses the product: complete profile, real conversations, invitations to
        people who will recognize the name. Skip it on a new or quiet account and LinkedIn can stop
        you from sending invitations for a week. That week costs more pipeline than the warmup would
        have.
      </p>
      <p>
        This is a conservative four-week plan. The daily numbers below are operator ranges, not a
        secret official quota. LinkedIn does not publish a safe daily invite count. It publishes
        what happens when you ignore the spirit of the limit.
      </p>

      <h2 id="what-warmup-is" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        What warmup actually is
      </h2>
      <p>
        LinkedIn is trying to tell a new account from a spam account. A spam account is created, or
        dusted off, and immediately sends a pile of invitations to strangers. A real account logs
        in, finishes the profile, talks to people it already knows, and only later reaches out to
        people it does not know yet.
      </p>
      <p>
        Warmup is you choosing the second pattern on purpose. You are not tricking a filter. You
        are giving the account a short history that looks like work. The history is what lets later
        outreach survive.
      </p>
      <p>
        That is also why copying someone else&apos;s 14-day spreadsheet can fail. A founder who has
        posted for two years is not the same starting point as a sales seat created on Monday.
      </p>

      <h2 id="what-linkedin-publishes" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        What LinkedIn publishes
      </h2>
      <p>
        The useful official pages are short. From{" "}
        <a
          href="https://www.linkedin.com/help/linkedin/answer/a550555"
          target="_blank"
          rel="noopener"
          className="text-blue-600 hover:underline"
        >
          Invitation limit reached
        </a>{" "}
        and{" "}
        <a
          href="https://www.linkedin.com/help/linkedin/answer/a542708"
          target="_blank"
          rel="noopener"
          className="text-blue-600 hover:underline"
        >
          Invitations on LinkedIn
        </a>
        :
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>Every member, including Premium, is subject to invitation limits.</li>
        <li>Hitting the limit can restrict you from sending invitations. The wait is typically one week.</li>
        <li>Withdrawing pending invitations does not lift that restriction.</li>
        <li>You cannot buy extra invitations while restricted. Support will not shorten the wait.</li>
        <li>Members can have at most 30,000 first-degree connections.</li>
        <li>Incoming invitations are sorted into Focused and Other using authenticity signals.</li>
        <li>LinkedIn asks you to send invitations to people you know and trust.</li>
      </ul>
      <p>
        Two help pages disagree on personalized notes. The older invitation-limit page still says
        five noted invites a month for free members. The more recently updated{" "}
        <a
          href="https://www.linkedin.com/help/linkedin/answer/a563153"
          target="_blank"
          rel="noopener"
          className="text-blue-600 hover:underline"
        >
          personalize invitations
        </a>{" "}
        page says three notes a month and 200 characters. Trust what the field in your own account
        shows, and write as if 200 characters and a small monthly note budget are the rule. For the
        note itself, use{" "}
        <Link
          href="/blogs/how-to-write-a-linkedin-connection-request-that-gets-accepted"
          className="text-blue-600 hover:underline"
        >
          how to write a connection request that gets accepted
        </Link>
        .
      </p>
      <p>
        Weekly volume is covered on its own in{" "}
        <Link href="/blogs/linkedin-weekly-connection-limits" className="text-blue-600 hover:underline">
          LinkedIn weekly connection limits
        </Link>
        . Warmup is the period before you should even think about a weekly ceiling.
      </p>

      <h2 id="three-starting-states" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        New, dormant, or already active
      </h2>
      <p>Write down the starting state before you pick a schedule.</p>
      <div className="not-prose my-8 overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Starting state</th>
              <th className="px-4 py-3 font-semibold">What to do first</th>
            </tr>
          </thead>
          <tbody className="text-[var(--md-sys-color-on-surface-variant)]">
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">Brand new</td>
              <td className="px-4 py-3">Finish the profile. Week one is colleagues and activity only. No tools.</td>
            </tr>
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">Dormant</td>
              <td className="px-4 py-3">Log in for a week like a person. Withdraw stale pending invites slowly. Then treat it like new.</td>
            </tr>
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">Already active</td>
              <td className="px-4 py-3">You can skip the empty-profile week. Still rise invite volume gradually. Do not jump from 2 a week to 20 a day.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Also write down pending invites, last post date, connection count, and whether the headline
        names real work. A warmup on top of 700 ignored pending requests is not a warmup. It is a
        pile.
      </p>

      <h2 id="four-week-plan" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        A conservative four-week plan
      </h2>
      <p>
        Use this if the account is new or has been quiet. If a week goes well, stay at that volume
        for a few more days before rising. If anything feels off, hold. Extending warmup is cheap.
        A one-week lock is not.
      </p>
      <div className="not-prose my-8 overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Week</th>
              <th className="px-4 py-3 font-semibold">Invites per day</th>
              <th className="px-4 py-3 font-semibold">Who they go to</th>
              <th className="px-4 py-3 font-semibold">Everything else</th>
            </tr>
          </thead>
          <tbody className="text-[var(--md-sys-color-on-surface-variant)]">
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">1</td>
              <td className="px-4 py-3">0 to 5</td>
              <td className="px-4 py-3">People who already know you</td>
              <td className="px-4 py-3">Photo, headline, About, 3 to 5 real comments. No tools.</td>
            </tr>
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">2</td>
              <td className="px-4 py-3">5 to 8</td>
              <td className="px-4 py-3">Warm names: met, commented, same group</td>
              <td className="px-4 py-3">Reply to every message yourself. Still no bulk follow-up.</td>
            </tr>
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">3</td>
              <td className="px-4 py-3">8 to 12</td>
              <td className="px-4 py-3">One narrow segment, not a whole industry</td>
              <td className="px-4 py-3">One message family. Read every accept and ignore.</td>
            </tr>
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">4</td>
              <td className="px-4 py-3">10 to 15</td>
              <td className="px-4 py-3">Same segment, only if week 3 stayed clean</td>
              <td className="px-4 py-3">Still space sends through the day. Do not dump them at 9:01.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        These are ceilings, not targets. Five good invites beat fifteen ignored ones. Spread them
        through the working day. A burst of twenty in four minutes looks like a script even when a
        human clicked send.
      </p>
      <p>
        Week one comments should be comments you would leave if nobody was measuring you. One
        specific sentence on a post you read. Five &quot;Great share!&quot; clicks are not activity.
        They are noise.
      </p>

      <h2 id="acceptance-governs" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Let acceptance govern volume
      </h2>
      <p>
        The schedule is a starting guess. Acceptance is the governor. If people who should know you
        are ignoring the request, the account is not ready for strangers. If strangers in one
        narrow segment accept and nobody complains, you can rise a little.
      </p>
      <p>
        There is no official acceptance percentage that raises how many invites you can send. Treat a week of
        mostly ignores as a targeting problem, not a reason to send more. A useful operator check:
        if fewer than about one in three relevant people accept a noted invite, stop raising volume
        and change who you are asking, or whether you should add a note at all.
      </p>
      <p>
        Track each week as its own batch. Role, how you found them, note or no note, sent,
        accepted, ignored. Do not blend week one colleagues with week three cold names and then
        celebrate a blended rate.
      </p>

      <h2 id="do-not-do" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        What not to do in week one
      </h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>Do not connect a sending tool to a profile that still has a logo for a face.</li>
        <li>Do not send invitations to a purchased list of titles.</li>
        <li>Do not add calendar links or product lines to the connection note.</li>
        <li>Do not auto-view hundreds of profiles. That is its own spike.</li>
        <li>Do not run three campaigns so you can &quot;see what works.&quot; You will not be able to tell.</li>
        <li>Do not create the account on Monday and go full volume on Tuesday because a competitor does.</li>
      </ul>
      <p>
        If the team is impatient, add another already-healthy profile later. Do not ask one new
        account to behave like a call center. For the copy side of that pressure, the profile work
        sits in{" "}
        <Link
          href="/blogs/crafting-a-linkedin-profile-that-doubles-your-outbound-acceptances"
          className="text-blue-600 hover:underline"
        >
          how to make the profile survive a five-second glance
        </Link>
        .
      </p>

      <h2 id="if-restricted" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        If you already hit the limit
      </h2>
      <ArticleImage
        src={`/blogs/${slug}/wait-it-out.avif`}
        alt="Invitation limit reached card listing what LinkedIn Help says: wait one week, withdraw does not lift it"
        caption="If invitations are locked, the work is to wait. Withdrawing pending requests will not shorten the week."
        width={3200}
        height={1440}
      />
      <p>
        Stop sending. Do not test whether a different browser still works. Do not open a second
        tool against the same session. Do not withdraw 400 pending invites in one sitting hoping
        the counter resets. LinkedIn says that withdraw does not lift the restriction, and a mass
        withdraw is another unnatural burst.
      </p>
      <p>
        Use the week. Answer anyone who already replied. Finish the About section. Comment on a few
        posts as yourself. When invitations open again, restart below the volume that triggered the
        lock, not at the same number. If the lock happened at 25 a day, go back to 8 and stay there
        until acceptance looks normal.
      </p>
      <p>
        If you get an identity check or a phone prompt, complete it as the real owner and then
        pause outbound for a few days. A prompt plus more sending is how a one-week lock becomes a
        longer one.
      </p>

      <h2 id="when-warmup-ends" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        When you can stop calling it warmup
      </h2>
      <p>The calendar is not the graduation test. The account is ready when all of these are true:</p>
      <ul className="list-disc space-y-2 pl-6">
        <li>The profile looks like a person who does a specific job.</li>
        <li>There has been real activity for several weeks, not one burst.</li>
        <li>Pending invites are not a graveyard.</li>
        <li>Recent invites are being accepted by the people you meant to reach.</li>
        <li>No security prompt is hanging over the session.</li>
        <li>You can name one segment that worked, not five that you mixed together.</li>
      </ul>
      <p>
        If any of those fail, repeat the current week. The point of warmup is a profile you can
        still use next quarter. A locked account teaches the same lesson, only slower.
      </p>
    </BlogPostTemplate>
  );
}
