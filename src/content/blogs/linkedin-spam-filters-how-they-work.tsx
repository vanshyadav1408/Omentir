import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import { ArticleImage } from "../article-image";

const slug = "linkedin-spam-filters-how-they-work";
const coverSrc = `/blogs/${slug}/cover.avif`;
const title = "LinkedIn Spam Filters: What They Catch, and What They Do Not";
const description =
  "LinkedIn's own rules ban using invitations as ads. Here is what the company publishes about spam, what its transparency report shows, and how to stay out of the filter.";

export const metadata = createPageMetadata({
  title,
  description,
  path: `/blogs/${slug}`,
  image: {
    url: coverSrc,
    width: 3200,
    height: 1600,
    alt: "LinkedIn policy quote: do not use the invitation feature to send promotional messages to people you do not know",
  },
  keywords: [
    "LinkedIn spam filters",
    "LinkedIn message marked as spam",
    "LinkedIn invitation spam",
    "LinkedIn Professional Community Policies spam",
    "why LinkedIn messages go to spam",
  ],
});

const tocItems = [
  { id: "not-a-bypass", label: "This is not a bypass guide", level: 1 },
  { id: "what-policy-says", label: "What LinkedIn's policy actually says", level: 1 },
  { id: "two-filters", label: "Two different filters", level: 1 },
  { id: "what-people-report", label: "What people report as spam", level: 1 },
  { id: "identical-copy", label: "Identical copy is the easy tell", level: 1 },
  { id: "links-and-asks", label: "Links and meeting asks in the first touch", level: 1 },
  { id: "stay-out", label: "How to stay out of the filter", level: 1 },
  { id: "faqs", label: "Frequently asked questions", level: 1 },
] as const;

const faqItems = [
  {
    question: "Does LinkedIn scan connection notes and messages for spam?",
    answer:
      "Yes. LinkedIn uses automated systems plus member reports. Its latest community report said automated defenses stopped 98.6 percent of the spam and scam content it removed. First messages that look harmful can also skip the inbox and land in spam.",
  },
  {
    question: "Is it against LinkedIn rules to pitch in a connection request?",
    answer:
      "The Professional Community Policies say not to use the invitation feature to send promotional messages to people you do not know. A connection note that is an ad is not a grey area. It is the thing the policy names.",
  },
  {
    question: "Why did my LinkedIn message go to spam?",
    answer:
      "A first message can be routed to spam if automated systems think it is harmful or unwanted, especially when you have never talked to that person. Identical copy, links, and a hard sell raise that chance. The recipient can also tap Report.",
  },
  {
    question: "Will changing a few words bypass LinkedIn spam filters?",
    answer:
      "No. Swapping synonyms in the same pitch is still the same promotional invitation. Filters and people both notice the pattern. Write a different reason for a different person, or do not send the note.",
  },
  {
    question: "Do links in a LinkedIn connection request trigger spam filters?",
    answer:
      "They often do, and they are also rude. A connection note is 200 characters and is not a landing page. Keep links out of the first touch. If they ask, send the link inside a conversation they already joined.",
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
      bannerAlt="LinkedIn policy quote: do not use the invitation feature to send promotional messages to people you do not know"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <p>
        Search for this topic and you will find a pile of posts about bypassing LinkedIn spam
        filters. That framing is the problem. LinkedIn publishes a rule against using invitations
        as ads. It also publishes that most spam is caught by machines, not by a person reading
        every note. You do not outsmart that by synonym-swapping a pitch.
      </p>
      <p>
        This article is about what LinkedIn says it does, what members do when they get a bad
        request, and how to write so neither one treats you as spam.
      </p>

      <h2 id="not-a-bypass" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        This is not a bypass guide
      </h2>
      <p>
        A filter exists because the product is full of people who do not want a stranger&apos;s
        calendar link. Trying to sneak the same calendar link past the filter is still the
        behavior the rule is about. If your plan only works when the recipient cannot tell it is
        a blast, the plan is the thing to throw away.
      </p>
      <p>
        Stay on this page if you want the published rules and the practical tells. If you want a
        loophole, there is not a durable one.
      </p>

      <h2 id="what-policy-says" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        What LinkedIn&apos;s policy actually says
      </h2>
      <p>
        The{" "}
        <a
          href="https://www.linkedin.com/legal/professional-community-policies"
          target="_blank"
          rel="noopener"
          className="text-blue-600 hover:underline"
        >
          Professional Community Policies
        </a>{" "}
        are plain. Do not spam members. Untargeted, irrelevant, obviously unwanted, unauthorized,
        or gratuitously repetitive commercial messages are not allowed. Then the line that most
        outbound posts skip:
      </p>
      <blockquote className="border-l-2 border-[var(--md-sys-color-outline-variant)] pl-4 italic">
        Do not use our invitation feature to send promotional messages to people you don&apos;t
        know or to otherwise spam people.
      </blockquote>
      <p>
        That is the whole connection-note debate, settled. A noted invite that is a product pitch
        is not clever outbound. It is the example in the policy.
      </p>
      <p>
        LinkedIn&apos;s{" "}
        <a
          href="https://about.linkedin.com/transparency/community-report"
          target="_blank"
          rel="noopener"
          className="text-blue-600 hover:underline"
        >
          Community Report
        </a>{" "}
        for the second half of 2025 said spam and scams were the most common violation it acted
        on, including repetitive communications or invitations meant for financial gain. Automated
        defenses stopped 98.6 percent of the spam and scam content it removed. The rest was
        handled by people. You are not talking your way past a junior moderator. You are talking
        to a system that already removes almost all of this class of content before a human sees
        it.
      </p>

      <h2 id="two-filters" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Two different filters
      </h2>
      <p>People mix these up. They are not the same lever.</p>
      <div className="not-prose my-8 overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Filter</th>
              <th className="px-4 py-3 font-semibold">What it does</th>
              <th className="px-4 py-3 font-semibold">What you notice</th>
            </tr>
          </thead>
          <tbody className="text-[var(--md-sys-color-on-surface-variant)]">
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">Content</td>
              <td className="px-4 py-3">
                Machines score a first message or invite.{" "}
                <a
                  href="https://www.linkedin.com/help/linkedin/answer/a1341705"
                  target="_blank"
                  rel="noopener"
                  className="text-blue-600 hover:underline"
                >
                  Harmful message detection
                </a>{" "}
                can send a first message straight to spam.
              </td>
              <td className="px-4 py-3">They never saw it. Or it sat in Other / spam.</td>
            </tr>
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">Account</td>
              <td className="px-4 py-3">
                Volume, ignores, reports, and authenticity signals can restrict invitations. See{" "}
                <Link href="/blogs/linkedin-weekly-connection-limits" className="text-blue-600 hover:underline">
                  weekly connection limits
                </Link>
                .
              </td>
              <td className="px-4 py-3">You cannot send invites. The wait is typically a week.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        A message that never arrives is a content problem. A Connect button that stops working is
        an account problem. Fixing the first with more volume creates the second.
      </p>

      <h2 id="what-people-report" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        What people report as spam
      </h2>
      <p>
        The machine is not the only rater. Recipients tap Report. LinkedIn even says members often
        mark invitations from people they do not know as spam. The human reasons are consistent:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>The note could have been sent to anyone with that job title.</li>
        <li>It asks for a meeting before there is a conversation.</li>
        <li>It includes a link or a PDF they did not request.</li>
        <li>It flatters a background the sender clearly did not read.</li>
        <li>A follow-up arrives the next morning asking if they saw the first one.</li>
      </ul>
      <p>
        That list is the same list in{" "}
        <Link href="/blogs/psychology-of-spam-outreach" className="text-blue-600 hover:underline">
          why prospects report messages
        </Link>
        . The filter and the person are looking for the same shape: a stranger extracting time.
      </p>

      <h2 id="identical-copy" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Identical copy is the easy tell
      </h2>
      <ArticleImage
        src={`/blogs/${slug}/same-letter.avif`}
        alt="Two identical LinkedIn connection notes sent to Sarah and Priya, only the first name changed"
        caption="If two notes are the same letter with a different first name, both the filter and the recipient can tell."
        width={3200}
        height={1280}
      />
      <p>
        Gratuitously repetitive messages are named in the policy. That does not mean every sentence
        must be unique poetry. It means the reason has to change when the person changes. &quot;I
        noticed your work at Company&quot; and &quot;I saw your role at Company&quot; are not two
        messages. They are one template with a twitch.
      </p>
      <p>
        A hiring-trigger note and a post-trigger note should not share a skeleton. A founder and a
        finance lead should not get the same logic. If you cannot write the second one without
        looking at the first, you do not have a second one.
      </p>

      <h2 id="links-and-asks" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Links and meeting asks in the first touch
      </h2>
      <p>
        A connection note is 200 characters. A first DM is still a first DM. Putting a booking
        link, a tracking shortener, or a pricing page in that space does two things. It asks them
        to leave the conversation before they agreed it was worth having. And it looks like
        distribution, which is what the spam systems are built to catch.
      </p>
      <p>
        If the resource matters, describe it in a clause and wait. &quot;I have a one-page
        checklist for stale pending invites&quot; is a sentence. A raw URL is a pitch. Send the
        URL after they ask.
      </p>
      <p>
        The same rule applies to &quot;open to a quick 15 minutes?&quot; in a connection note. They
        have not accepted the connection. They have not agreed you are a relevant person. The
        meeting ask is the promotional message the policy names. Write the reason to connect
        instead. That structure is in{" "}
        <Link
          href="/blogs/how-to-write-a-linkedin-connection-request-that-gets-accepted"
          className="text-blue-600 hover:underline"
        >
          how to write a connection request that gets accepted
        </Link>
        .
      </p>

      <h2 id="stay-out" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        How to stay out of the filter
      </h2>
      <p>None of this is a trick. It is the inverse of the policy.</p>
      <ol className="list-decimal space-y-2 pl-6">
        <li>Invite people you can name a reason for. Job title is not a reason.</li>
        <li>Do not use the invitation as an ad. Pitch later, if they want that conversation.</li>
        <li>Write a different reason when the person is different. Do not synonym-swap.</li>
        <li>Keep links and calendars out of the first touch.</li>
        <li>Send slowly enough that a human could have typed them. Warm a quiet account first.</li>
        <li>Stop a batch that is being ignored or reported. More volume is not the fix.</li>
      </ol>
      <p>
        If a note only works when the other person does not look closely, do not send it. The
        filter is not the audience you have to fool. The person is.
      </p>
    </BlogPostTemplate>
  );
}
