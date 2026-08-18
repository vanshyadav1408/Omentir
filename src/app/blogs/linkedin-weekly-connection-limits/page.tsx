import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import { ArticleImage } from "../article-image";

const slug = "linkedin-weekly-connection-limits";
const coverSrc = `/blogs/${slug}/cover.avif`;
const title = "LinkedIn Weekly Connection Limits: What Happens When You Hit Them";
const description =
  "LinkedIn does not publish a fixed weekly invite number. Here is what it does publish, why the popular 100-a-week figure is only a rumor, and how to work under the real limit.";

export const metadata = createPageMetadata({
  title,
  description,
  path: `/blogs/${slug}`,
  image: {
    url: coverSrc,
    width: 3200,
    height: 1600,
    alt: "Comparison of the rumored 100 LinkedIn invites a week versus what LinkedIn Help actually publishes",
  },
  keywords: [
    "LinkedIn weekly connection limits",
    "LinkedIn invitation limit reached",
    "how many LinkedIn connection requests per week",
    "LinkedIn pending invitations",
    "LinkedIn invite restriction",
  ],
});

const tocItems = [
  { id: "no-published-number", label: "There is no official weekly number", level: 1 },
  { id: "what-happens", label: "What happens when you hit the limit", level: 1 },
  { id: "what-counts", label: "What counts against the limit", level: 1 },
  { id: "why-100", label: "Why everyone still says 100 a week", level: 1 },
  { id: "pending", label: "Pending invites are a second limit", level: 1 },
  { id: "work-under", label: "How to work under the real limit", level: 1 },
  { id: "not-a-farm", label: "More profiles is not a cheat code", level: 1 },
  { id: "faqs", label: "Frequently asked questions", level: 1 },
] as const;

const faqItems = [
  {
    question: "How many LinkedIn connection requests can I send per week?",
    answer:
      "LinkedIn does not publish a fixed weekly number. The ceiling moves with account age, acceptance, pending invites, and prior restrictions. Operator reports often cluster around 100 a week for healthy aged accounts, and much lower for new or quiet ones. Treat any public number as a rumor, not a quota to hit.",
  },
  {
    question: "How long does a LinkedIn invitation restriction last?",
    answer:
      "LinkedIn Help says a temporary restriction typically lasts one week. You cannot send invitations during that week. Withdrawing pending invitations does not lift it. You cannot buy more invites, and Support will not shorten the wait.",
  },
  {
    question: "Does Premium raise my weekly LinkedIn connection limit?",
    answer:
      "Premium lets you add a note to more invitations. It does not remove invitation limits. LinkedIn Help is explicit: Basic and Premium accounts are both subject to those limits.",
  },
  {
    question: "Should I withdraw old LinkedIn connection requests?",
    answer:
      "Yes, slowly. A large pile of ignored pending invites is a bad signal. Withdraw stale ones in small batches over days, not hundreds in one sitting. Withdraw does not lift a restriction that has already started.",
  },
  {
    question: "What can I do instead of sending more connection requests?",
    answer:
      "LinkedIn's own alternatives are follow, join a relevant group, send an InMail if you have credits, or message people you are already connected with. Those actions do not replace a good invite. They keep you from spending the invite on someone who has no reason to accept.",
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
      bannerAlt="Comparison of the rumored 100 LinkedIn invites a week versus what LinkedIn Help actually publishes"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <p>
        Most LinkedIn limit posts give you a number, usually 100 invitations a week, then tell you
        how to get around it. LinkedIn does not publish that number. What it publishes is simpler:
        invitations have a limit, the limit exists so strangers stop getting spam, and if you hit
        it you wait about a week.
      </p>
      <p>
        This article is about working under that fact. If you came here for a bypass, you are in
        the wrong place. If you came here because a healthy account suddenly could not send
        invites, keep reading.
      </p>

      <h2 id="no-published-number" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        There is no official weekly number
      </h2>
      <p>
        LinkedIn&apos;s help pages say invitation limits exist for every member, Basic and Premium
        included. They do not say &quot;100 per week&quot; or &quot;20 per day.&quot; They say the
        limit is there so people receive relevant requests, and that sending fewer, more thoughtful
        invitations improves the rest of the product for you: feed, search, and the rest.
      </p>
      <p>
        That is an important sentence. The company is not hiding a quota so power users can find
        it. It is telling you the product works better when you do not spend invitations like
        postage. A weekly ceiling that moves with how people treat your requests is consistent
        with that.
      </p>
      <p>
        The practical result: two accounts with the same plan can have different room. A five-year
        personal profile with high acceptance has more slack than a two-week sales seat. Copying
        a number from a 2024 tool blog onto a new account is how the new account spends the next
        week locked.
      </p>

      <h2 id="what-happens" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        What happens when you hit the limit
      </h2>
      <p>
        From{" "}
        <a
          href="https://www.linkedin.com/help/linkedin/answer/a550555"
          target="_blank"
          rel="noopener"
          className="text-blue-600 hover:underline"
        >
          Invitation limit reached
        </a>
        :
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>You cannot send invitations until the restriction lifts.</li>
        <li>The wait is typically one week.</li>
        <li>Withdrawing pending invitations does not remove the restriction.</li>
        <li>You cannot buy or otherwise acquire more invitations while restricted.</li>
        <li>LinkedIn will not shorten the wait, and Support will not tell you the exact reason.</li>
      </ul>
      <p>
        You can still use the rest of the account. Message people you are already connected with.
        Comment. Follow. Finish the profile. You just cannot mint new invitations. Treat that week
        as a cooldown, not a puzzle to solve. For the cooldown playbook, see{" "}
        <Link href="/blogs/how-to-warm-up-linkedin-account" className="text-blue-600 hover:underline">
          how to warm up a LinkedIn account
        </Link>
        .
      </p>

      <h2 id="what-counts" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        What counts against the limit
      </h2>
      <p>
        The invitation is the scarce object. These usually count: a Connect click from a profile,
        a Connect click from search, and a Connect click from most desktop surfaces where you can
        add a note. These usually do not spend an invitation:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>Following someone, which LinkedIn itself suggests as an alternative.</li>
        <li>Joining a group and talking there.</li>
        <li>An InMail, which spends InMail credit, not an invite.</li>
        <li>A message to someone who is already a first-degree connection.</li>
        <li>A reply to someone who wrote you first, including a reply to a note they have not accepted yet.</li>
      </ul>
      <p>
        LinkedIn lists those alternatives in{" "}
        <a
          href="https://www.linkedin.com/help/linkedin/answer/a551295"
          target="_blank"
          rel="noopener"
          className="text-blue-600 hover:underline"
        >
          Alternatives to inviting someone to connect
        </a>
        . It also says members often ignore or mark invitations from people they do not know as
        spam. That is the other half of the limit: you are not only spending a counter. You are
        spending reputation with the people who land in Focused versus Other.
      </p>
      <p>
        Incoming invitations are sorted that way, as described in{" "}
        <a
          href="https://www.linkedin.com/help/linkedin/answer/a542708"
          target="_blank"
          rel="noopener"
          className="text-blue-600 hover:underline"
        >
          Invitations on LinkedIn
        </a>
        . If your outgoing requests look low-trust, they sit in Other, where people are less
        likely to see them. A &quot;sent&quot; invite that nobody opens is still a spent invite.
      </p>

      <h2 id="why-100" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Why everyone still says 100 a week
      </h2>
      <p>
        Operators have watched the product for years. For a lot of aged, healthy accounts, the
        weekly ceiling has often sat near 100. Tool vendors repeated that number until it looked
        official. It is not. It is a cluster of anecdotes.
      </p>
      <p>
        Some accounts get less room after a restriction. Some get less room after a week of
        ignores. New accounts can hit a wall far below 100. Premium does not print extra invites.
        It prints extra notes. The 30,000 first-degree connection cap is a separate, published
        maximum for the whole network, not a weekly quota.
      </p>
      <p>
        If you need a number to plan around, plan around 40 to 60 thoughtful invites a week on a
        warmed account, and far fewer on a new one. Leave slack. The goal is to never see the
        restriction screen. Hitting 99 to &quot;use the quota&quot; is how you discover your
        personal ceiling the hard way.
      </p>

      <h2 id="pending" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Pending invites are a second limit
      </h2>
      <ArticleImage
        src={`/blogs/${slug}/pending.avif`}
        alt="Pending invitations list with 214 ignored requests sent four to six weeks ago"
        caption="Ignored invitations do not disappear. They sit in pending and keep talking about you."
        width={3200}
        height={1440}
      />
      <p>
        Every invitation you send that nobody acts on stays pending. A large pending pile tells
        the product you have been asking people who do not want to hear from you. That is a worse
        signal than a slightly lower weekly send count.
      </p>
      <p>
        Review pending invitations on a schedule. Withdraw ones older than a few weeks, in small
        batches, on different days. Do not dump 400 withdrawals on a Sunday night. You are trying
        to look like a person cleaning a desk, not a script emptying a queue.
      </p>
      <p>
        And again: once a restriction has started, withdraw will not end it. Clean pending before
        you scale, not as a panic move after the lock.
      </p>

      <h2 id="work-under" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        How to work under the real limit
      </h2>
      <p>The useful operating rules are almost all about not needing more invites.</p>
      <ol className="list-decimal space-y-2 pl-6">
        <li>
          Warm the account first. A quiet profile has a lower ceiling. The four-week version is in
          the warmup guide linked above.
        </li>
        <li>
          Spend invites on people with a reason. A post, a hire, a room you shared, a real intro.
          The note, if you add one, is that reason. Details are in{" "}
          <Link
            href="/blogs/how-to-write-a-linkedin-connection-request-that-gets-accepted"
            className="text-blue-600 hover:underline"
          >
            how to write a connection request that gets accepted
          </Link>
          .
        </li>
        <li>
          Follow first when the person is a publisher you do not know. Comment. Then invite later
          if there is still a reason.
        </li>
        <li>
          Use InMail for people who will never accept a cold invite and who are worth one credit.
          Do not use it as a volume channel.
        </li>
        <li>
          Message first-degree connections instead of re-inviting the same market every quarter.
        </li>
        <li>
          Stop a batch that is being ignored. More volume on a bad list spends the week and the
          reputation.
        </li>
      </ol>
      <p>
        If you want a weekly cap to type into a tool, type a number you would not mind living with
        after a bad week, not the highest rumor you have heard. On most warmed accounts that is
        closer to 10 a day than 20.
      </p>

      <h2 id="not-a-farm" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        More profiles is not a cheat code
      </h2>
      <p>
        Teams that need more conversations add more real people: a founder and a seller, two
        founders, an AE who already lives on the product. Each person warms their own account and
        stays under their own ceiling. That is a team, not a loophole.
      </p>
      <p>
        Creating extra profiles to multiply invites is how you collect restrictions in parallel.
        LinkedIn&apos;s user agreement and professional community policies are not on your side
        there. If one healthy profile cannot find enough people with a reason to connect, the list
        is the problem, not the weekly cap.
      </p>
      <p>
        The limit is doing the job LinkedIn says it is doing: making thoughtless invitations
        expensive. The way through it is a smaller, better list, not a higher number.
      </p>
    </BlogPostTemplate>
  );
}
