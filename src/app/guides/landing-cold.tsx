import Link from "next/link";
import { JobSlides, LandingSection, Runbook } from "./landing-kit";

const JOB_SLIDES = [
  {
    n: "01",
    title: "Invite",
    flip: false,
    lead: "They have not accepted.",
    body: "Keep it tiny, or leave it blank. Use the invite to start contact, not to paste your whole pitch.",
  },
  {
    n: "02",
    title: "Accept",
    flip: true,
    lead: "They opened a thread.",
    body: "This is the draft the Bot should write: two sentences tied to a real trigger, with no calendar hold. Omentir can continue a campaign after they accept if you set that up.",
  },
  {
    n: "03",
    title: "Message",
    flip: false,
    lead: "Then stop.",
    body: "Use one follow-up if they stay quiet. The first real reply is yours. Cite a hire, a post, or a comment on a competitor thread. Cut fake mutual friends and invented metrics.",
  },
  {
    n: "04",
    title: "No login",
    flip: true,
    lead: "Do not let the Bot type in LinkedIn.",
    body: (
      <>
        Computer use helps on sites with no API. On LinkedIn it is how accounts get restricted. The Bot computer is
        shared across your Bots, so a login there is shared too. If it asks you to take over for a password or CAPTCHA,
        refuse. Put LinkedIn in Omentir. How-to:{" "}
        <Link href="/blogs/automate-cold-messaging-with-grok-bot" className="underline underline-offset-4">
          automate cold messaging with Grok Bot
        </Link>
        .
      </>
    ),
  },
] as const;

export default function ColdMessagesLanding() {
  return (
    <div className="omentir-moderate-width min-w-0 space-y-20 pb-8 md:space-y-28 md:pb-12">
      <LandingSection title="How this helps you send first touches.">
        <JobSlides slides={JOB_SLIDES} />
      </LandingSection>
      <Runbook
        title="Write the message before you automate it."
        steps={[
          {
            title: "Choose the message box",
            body: "Tell Grok Bot whether it is drafting an invite note, an after-accept DM, or InMail. Each one has a different job. An unnamed box gets the same pitch everywhere.",
          },
          {
            title: "Give it one real trigger",
            body: "Use a recent hire, post, comment, or tool they mentioned. The trigger gives the prospect a reason to answer and gives you something to verify.",
          },
          {
            title: "Keep the first ask light",
            body: "Do not turn the invite into a meeting request. Do not add a calendar hold to the first DM. Start a conversation and leave room for the other person to ask a question.",
          },
          {
            title: "Review, then let Omentir send",
            body: "Read the first batch and remove generic drafts before you start a campaign. Keep the Bot on research and drafts. Keep the live reply in your hands.",
          },
        ]}
      />
    </div>
  );
}
