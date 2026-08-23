import Link from "next/link";
import { JobSlides, LandingSection } from "./landing-kit";

const JOB_SLIDES = [
  {
    n: "01",
    title: "Invite",
    flip: false,
    lead: "They have not accepted.",
    body: "Tiny, or blank. A pitch in the invite box often hurts. Blank is better than a fake paragraph.",
  },
  {
    n: "02",
    title: "Accept",
    flip: true,
    lead: "They opened a thread.",
    body: "This is the draft the Bot should write. Two sentences. A real trigger. No calendar hold. Omentir can continue a campaign after they accept, if you set that up.",
  },
  {
    n: "03",
    title: "Message",
    flip: false,
    lead: "Then stop.",
    body: "One follow-up if they stay quiet. The first real reply is yours. A Bot arguing about price in your inbox overnight is not this job. Paste a real trigger: a hire, a post they wrote, a comment on a competitor thread. Cut a fake mutual friend or an invented metric. If you would not send it from your own phone, cut it.",
  },
  {
    n: "04",
    title: "No login",
    flip: true,
    lead: "Do not let the Bot type in LinkedIn.",
    body: (
      <>
        Computer use is the pitch for sites with no API. On LinkedIn it is how accounts get restricted. The Bot
        computer is shared across your Bots. A login there is shared too. If it asks you to take over for a password or
        CAPTCHA, refuse. Grok Bot is a poor sender. SpaceXAI tells it not to send and not to enroll. Put LinkedIn in
        Omentir. How-to:{" "}
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
    </div>
  );
}
