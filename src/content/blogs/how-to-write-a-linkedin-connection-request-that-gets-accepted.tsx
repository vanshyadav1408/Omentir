import Link from "next/link";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import { ArticleImage } from "../article-image";

const slug = "how-to-write-a-linkedin-connection-request-that-gets-accepted";
const coverSrc = `/blogs/${slug}/cover.avif`;
const title = "How to Write a LinkedIn Connection Request That Gets Accepted";
const description =
  "LinkedIn lets free accounts add a 200-character note to only three invitations a month. Here is how to use that space, and when a blank request is better.";

export const metadata = createPageMetadata({
  title,
  description,
  path: `/blogs/${slug}`,
  image: {
    url: coverSrc,
    width: 3200,
    height: 1600,
    alt: "A LinkedIn connection invitation card with a 118-character note to Maya Chen and the 200-character limit",
  },
  keywords: [
    "LinkedIn connection request",
    "LinkedIn connection note",
    "LinkedIn invitation message examples",
    "how to write a LinkedIn connection request",
    "LinkedIn connection request acceptance rate",
    "personalized LinkedIn invitation",
  ],
});

const tocItems = [
  { id: "what-they-see", label: "What the other person actually sees", level: 1 },
  { id: "official-limits", label: "The official note limits", level: 1 },
  { id: "when-to-add-a-note", label: "When a note helps, and when it does not", level: 1 },
  { id: "note-structure", label: "A structure that fits 200 characters", level: 1 },
  { id: "profile-check", label: "Fix the profile before you write", level: 1 },
  { id: "notes-that-fail", label: "Notes that get ignored", level: 1 },
  { id: "notes-that-work", label: "Notes that get accepted", level: 1 },
  { id: "five-minutes", label: "Write one in five minutes", level: 1 },
  { id: "after-they-accept", label: "What to send after they accept", level: 1 },
  { id: "measure", label: "How to measure acceptance honestly", level: 1 },
  { id: "faqs", label: "Frequently asked questions", level: 1 },
] as const;

const faqItems = [
  {
    question: "How long can a LinkedIn connection request note be?",
    answer:
      "LinkedIn Help currently caps a personalized invitation at 200 characters, including spaces. That is the number to write to. Some older posts still say 300. Treat 200 as the safe limit unless the field in your app shows otherwise.",
  },
  {
    question: "How many personalized connection notes can I send?",
    answer:
      "On a free account, LinkedIn currently allows a personalized note on up to three connection requests per month. Premium members can add a note to every invitation, though weekly invite limits still apply. People You May Know invitations on the mobile app cannot be personalized.",
  },
  {
    question: "Should I always add a note to a LinkedIn connection request?",
    answer:
      "No. Add a note when the person would not otherwise know why you are reaching out. Skip it when you already commented, met them, or were introduced. A blank request from a complete, relevant profile often beats a generic compliment.",
  },
  {
    question: "What should I not put in a LinkedIn connection request?",
    answer:
      "Do not pitch, attach a calendar link, drop a tracking URL, or flatter their background. Do not claim a mutual connection you do not have. The note is a reason to connect, not a first sales email.",
  },
  {
    question: "What is a good LinkedIn connection request acceptance rate?",
    answer:
      "It depends on how cold the list is. People you already interacted with often accept more than half the time. A specific note to a stranger is often in the 25 to 45 percent range. A generic pitch to a broad title list can sit under 20 percent and attracts ignores and reports. Track by segment, not one blended number.",
  },
] as const;

const sectionClassName =
  "mt-10 scroll-mt-28 border-b border-[var(--md-sys-color-outline-variant)] pb-2 pt-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]";

function NoteCard({
  label,
  note,
  chars,
  verdict,
}: {
  label: string;
  note: string;
  chars: number;
  verdict: "use" | "skip";
}) {
  const over = chars > 200;
  return (
    <figure className="not-prose my-6 overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--md-sys-color-outline-variant)] px-4 py-3">
        <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">{label}</span>
        <span className={`text-xs font-medium ${over ? "text-red-700" : "text-[var(--md-sys-color-on-surface-variant)]"}`}>
          {chars} / 200 characters
        </span>
      </div>
      <blockquote className="px-4 py-4 text-[15px] leading-7 text-[var(--md-sys-color-on-surface)]">
        {note}
      </blockquote>
      <figcaption className="border-t border-[var(--md-sys-color-outline-variant)] px-4 py-3 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
        {verdict === "use" ? "Keep this shape. Change the specific detail." : "Do not send this. It reads like a blast."}
      </figcaption>
    </figure>
  );
}

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title={title}
      description={description}
      slug={slug}
      bannerSrc={coverSrc}
      bannerAlt="A LinkedIn connection invitation card with a 118-character note to Maya Chen and the 200-character limit"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <p>
        A LinkedIn connection request is not a sales email that happens to be short. It is a
        stranger asking to sit in someone else&apos;s professional inbox. Most people decide in a
        few seconds, and they decide with more than the note. They see your photo, your headline,
        and one line that either explains the ask or makes them feel sold to.
      </p>
      <p>
        This guide is about that first line. It covers the official 200-character cap, the three
        personalized notes LinkedIn currently gives a free account each month, when you should send
        no note at all, and examples you can adapt without turning them into another template farm.
      </p>

      <h2 id="what-they-see" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        What the other person actually sees
      </h2>
      <p>
        On a phone, the request is a name, a headline, a face, and maybe 200 characters. They do
        not see your sequence, your ICP, or the research you meant to do. If the headline is vague
        and the note is flattery, they ignore it. If the note pitches a product they did not ask
        about, some of them hit Ignore. A few hit Report.
      </p>
      <p>
        That is why a good request is boring on purpose. It names one real reason you are there. It
        does not ask for a meeting. It does not try to sound impressive. The work happens before you
        type: you picked the right person, and your profile can survive a five-second glance.
      </p>

      <h2 id="official-limits" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        The official note limits
      </h2>
      <p>
        A lot of outreach posts still tell you to write a 300-character invitation. That is not
        what{" "}
        <a
          href="https://www.linkedin.com/help/linkedin/answer/a563153"
          target="_blank"
          rel="noopener"
          className="text-blue-600 hover:underline"
        >
          LinkedIn Help
        </a>{" "}
        says today. The current rules, as LinkedIn publishes them:
      </p>
      <div className="not-prose my-8 overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Rule</th>
              <th className="px-4 py-3 font-semibold">What LinkedIn says</th>
            </tr>
          </thead>
          <tbody className="text-[var(--md-sys-color-on-surface-variant)]">
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">Note length</td>
              <td className="px-4 py-3">Up to 200 characters, including spaces</td>
            </tr>
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">Free accounts</td>
              <td className="px-4 py-3">A personalized note on up to three requests per month</td>
            </tr>
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">Premium</td>
              <td className="px-4 py-3">Unlimited notes, but weekly invite limits still apply</td>
            </tr>
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">Mobile People You May Know</td>
              <td className="px-4 py-3">Those invitations cannot be personalized</td>
            </tr>
            <tr className="border-t border-[var(--md-sys-color-outline-variant)]">
              <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">Replies</td>
              <td className="px-4 py-3">They can reply to the note without accepting the request</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Two practical consequences. First, a free account should treat a noted invite as a scarce
        resource, not a default. Second, if your playbook still assumes every request can carry a
        paragraph, the playbook is already out of date. Write to 200 characters even if a third-party
        tool still shows a higher box. LinkedIn can truncate or block the extra text.
      </p>
      <p>
        Invite volume is a separate problem. Weekly connection limits move with account age, pending
        invites, and how often people ignore you. Do not try to max a number you saw in a 2023
        screenshot. For that side of the work, read{" "}
        <Link href="/blogs/linkedin-weekly-connection-limits" className="text-blue-600 hover:underline">
          how weekly connection limits actually work
        </Link>
        .
      </p>

      <h2 id="when-to-add-a-note" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        When a note helps, and when it does not
      </h2>
      <p>
        A note is useful when the other person would otherwise have no idea why you appeared. You
        liked a specific post. You were in the same room. Someone they trust named them. Their team
        just posted a role that matches work you actually do. In those cases, the note is a caption
        for the request.
      </p>
      <p>
        A note is wasted when it restates the obvious. If you commented on their post yesterday, they
        already have context. If a mutual connection introduced you in the comments, the introduction
        is the note. If your headline already says you work on the same problem they just wrote about,
        a blank request can look cleaner than a stiff compliment.
      </p>
      <p>
        Never spend one of the three monthly notes on a pitch. A calendar link, a pricing page, or
        &quot;would love to hop on a call&quot; turns a networking action into an ad. People did not
        opt into that, and some of them will treat it as spam. For the psychology of that reaction,
        see{" "}
        <Link href="/blogs/psychology-of-spam-outreach" className="text-blue-600 hover:underline">
          why prospects report messages
        </Link>
        .
      </p>

      <h2 id="note-structure" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        A structure that fits 200 characters
      </h2>
      <p>
        You do not have room for a greeting paragraph, a compliment, a company intro, and a call to
        action. You have room for one observation and one reason. This is the shape that keeps
        fitting:
      </p>
      <ol className="list-decimal space-y-2 pl-6">
        <li>Their name, once.</li>
        <li>One specific thing only they would recognize: a post, a hire, an event, a group remark.</li>
        <li>One short clause for why you are the person sending this.</li>
        <li>Stop. No meeting ask. No link. No &quot;would love to find synergies.&quot;</li>
      </ol>
      <p>
        In one line: name, specific thing, why you, then stop. If you cannot name the specific thing
        without opening their profile, you are not ready to send a noted invite. Send nothing, or
        send a blank request only if the profile-to-profile fit is already obvious.
      </p>

      <h2 id="profile-check" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Fix the profile before you write
      </h2>
      <p>
        The note cannot rescue a profile that looks like a landing page for a tool nobody asked for.
        Before you send anything, check four things the recipient will see next to your name:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>A photo that looks like you, not a logo or a conference booth.</li>
        <li>A headline that names the work, not a slogan. &quot;Founder, billing for agencies&quot; beats &quot;Helping teams grow without limits.&quot;</li>
        <li>An About section a stranger can parse in twenty seconds.</li>
        <li>Some recent public activity, so the account does not look unused.</li>
      </ul>
      <p>
        If those four are weak, fix them first. A tight note next to a vague headline still feels
        like a trap. For the full profile pass, use{" "}
        <Link
          href="/blogs/crafting-a-linkedin-profile-that-doubles-your-outbound-acceptances"
          className="text-blue-600 hover:underline"
        >
          how to treat your LinkedIn profile as the landing page for outbound
        </Link>
        .
      </p>

      <ArticleImage
        src={`/blogs/${slug}/cut-the-pitch.avif`}
        alt="Side by side LinkedIn connection notes: a demo-booking pitch versus a short note about Sarah rebuilding outbound"
        caption="Same person. The left note is a pitch. The right note names a fact from her world and stops."
        width={3200}
        height={1440}
      />

      <h2 id="notes-that-fail" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Notes that get ignored
      </h2>
      <p>
        These three patterns show up in almost every weak campaign. They are short enough to send.
        They still fail because they could be pasted onto anyone.
      </p>

      <NoteCard
        label="Skip: empty flattery"
        note="Hi Sarah, I came across your profile and was highly impressed by your background. Let us connect!"
        chars={97}
        verdict="skip"
      />
      <p>
        &quot;Impressed by your background&quot; is a tell. It means you did not pick a detail. A
        rewrite that keeps the same length:
      </p>
      <NoteCard
        label="Use: one specific comment"
        note="Hi Sarah. Your comment on inbound teams drowning in no-shows was the useful part of that thread. Connecting here."
        chars={113}
        verdict="use"
      />

      <NoteCard
        label="Skip: compressed pitch"
        note="Hi Sarah. We help B2B teams automate LinkedIn outreach and book more demos. Open to a 15 minute call this week?"
        chars={111}
        verdict="skip"
      />
      <p>
        This is a cold email wearing a connection note. They have not agreed to a conversation yet.
        Same person, same research, no ask:
      </p>
      <NoteCard
        label="Use: name the situation"
        note="Hi Sarah. Noticed you just posted about rebuilding outbound after two SDRs left. I work with teams in that spot."
        chars={112}
        verdict="use"
      />

      <NoteCard
        label="Skip: vague networking"
        note="Hi Sarah, would love to connect and explore ways we might collaborate."
        chars={70}
        verdict="skip"
      />
      <p>
        Collaborate on what? A group, a post, or a shared problem gives the request a place to land:
      </p>
      <NoteCard
        label="Use: shared group, specific remark"
        note="Hi Sarah. We are both in the B2B onboarding group, and your note on implementation time was specific. Connecting here."
        chars={118}
        verdict="use"
      />

      <h2 id="notes-that-work" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Notes that get accepted
      </h2>
      <p>
        The notes below are written to the 200-character cap. Do not copy them word for word. Copy
        the job each one does. If you cannot fill the specific detail from their page, do not send
        that version.
      </p>

      <NoteCard
        label="Someone's post"
        note="Hi Maya. Your post on demo no-shows was specific and useful. I work on the same problem. Thought I would connect here."
        chars={118}
        verdict="use"
      />
      <p>
        Use this only when you actually read the post. Mentioning a title they used is stronger than
        mentioning that they &quot;shared great insights.&quot;
      </p>

      <NoteCard
        label="A hiring signal"
        note="Hi Priya. Saw Northlane is hiring two AEs while you own outbound. I talk to teams in that exact squeeze. Worth connecting here."
        chars={127}
        verdict="use"
      />
      <p>
        This works when the role is real and recent. It fails when you spray it at every VP Sales
        whose company has any open job. The hire has to touch the work you do.
      </p>

      <NoteCard
        label="A shared event"
        note="Hi Jordan. We were both in the pricing panel at SaaStr. Your point on usage floors stuck with me. Connecting so I can follow your work."
        chars={135}
        verdict="use"
      />
      <p>
        Events, dinners, Slack groups, and comment threads are the easiest notes to write because
        the context already exists. If you were not in the room, do not invent it.
      </p>

      <NoteCard
        label="A real introduction"
        note="Hi Alex. Priya Shah suggested I reach out. I am the founder of a small outbound tool, not pitching, just connecting as she asked."
        chars={129}
        verdict="use"
      />
      <p>
        Name the introducer only if they would confirm it. Fake mutual context is worse than no
        note. People check.
      </p>

      <NoteCard
        label="Founder to founder"
        note="Hi Sam. I have been following how you are taking Hallway from design partners to first paid seats. Connecting to keep up."
        chars={121}
        verdict="use"
      />
      <p>
        Peer notes work when the specific journey is real. They fail when every founder gets
        &quot;love what you are building.&quot; If you cannot name the current chapter, you do not
        have a founder note. You have flattery.
      </p>

      <h2 id="five-minutes" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Write one in five minutes
      </h2>
      <p>
        If a request takes twenty minutes, you will stop sending them. If it takes twenty seconds,
        you will send junk. Five minutes is enough to be specific:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Minute 1.</strong> Open the profile, the company page, and the last three posts.
          Write down one fact you could not have guessed from the job title.
        </li>
        <li>
          <strong>Minute 2.</strong> Decide the relationship. Peer, founder, former colleague, or
          someone who read their work. If none of those are true, you may not have a reason.
        </li>
        <li>
          <strong>Minute 3.</strong> Draft one sentence that joins the fact to the relationship. No
          product nouns.
        </li>
        <li>
          <strong>Minute 4.</strong> Cut it under 160 characters so it still fits if LinkedIn counts
          an extra space or a name you forgot.
        </li>
        <li>
          <strong>Minute 5.</strong> Read it as if you did not send it. If it could fit any other
          VP, throw it away.
        </li>
      </ul>
      <p>
        Do this for a small batch, not a hundred names. A noted invite is expensive on a free
        account and still expensive on a healthy Premium account, because ignore and report rates
        follow you into next week&apos;s limits.
      </p>

      <h2 id="after-they-accept" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        What to send after they accept
      </h2>
      <ArticleImage
        src={`/blogs/${slug}/after-they-accept.avif`}
        alt="A LinkedIn message thread after Maya accepts, continuing a conversation about demo no-shows instead of pitching"
        caption="She accepted because of a post about demo no-shows. The first message stays on that post."
        width={3200}
        height={1520}
      />
      <p>
        The first message after they accept should continue the sentence you started. If you
        mentioned their post, ask one concrete question about that post. If you mentioned a hire,
        ask how they are splitting the new role against the current team. If you mentioned an event,
        reference the same point. Do not paste a deck. Do not send a Calendly link in the same
        breath as &quot;great to connect.&quot;
      </p>
      <p>
        Some people will accept and never reply. That is normal. Wait a few days. Add one useful
        follow-up, then leave them alone. A connection is a long inbox, not a countdown to a demo.
      </p>

      <h2 id="measure" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        How to measure acceptance honestly
      </h2>
      <p>
        Track requests in batches of twenty, and keep each batch to one segment. Mix founders,
        managers, and recruiters in the same pile and the number becomes theater.
      </p>
      <p>For each batch, write down:</p>
      <ul className="list-disc space-y-2 pl-6">
        <li>Who they are, in one line (role, company stage, how you found them).</li>
        <li>Note or no note.</li>
        <li>The context source: post, hire, event, intro, or none.</li>
        <li>Sent, accepted, ignored, and replied.</li>
      </ul>
      <p>
        Ranges that operators actually see, not a fake benchmark. People you already interacted
        with often accept more than half the time. A specific note to a stranger often lands
        between 25 and 45 percent. A generic pitch to a job-title list can sit under 20 percent
        and will also collect ignores. If a batch is under 20 percent, do not send more of it.
        Change the list or the reason, not the volume.
      </p>
      <p>
        New or quiet accounts should not jump into noted invites at all. Warm the profile first
        with real activity. The 14-day version of that is in{" "}
        <Link href="/blogs/how-to-warm-up-linkedin-account" className="text-blue-600 hover:underline">
          how to warm up a LinkedIn account
        </Link>
        .
      </p>
      <p>
        The request that gets accepted is the one that looks like it came from a person who had a
        reason. Everything else is decoration, and LinkedIn does not give you much room for
        decoration.
      </p>
    </BlogPostTemplate>
  );
}
