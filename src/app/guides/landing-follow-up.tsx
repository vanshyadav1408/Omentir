import Link from "next/link";
import { JobSlides, LandingSection, Runbook } from "./landing-kit";

const JOB_SLIDES = [
  {
    n: "01",
    title: "Quiet",
    flip: false,
    lead: "They accepted. They never wrote back.",
    body: "That is the only follow-up job. Skip anyone who already answered. A Bot that cannot see the thread will double-send.",
  },
  {
    n: "02",
    title: "New trigger",
    flip: true,
    lead: "Do not recycle the first miss.",
    body: "\"Just circling back\" is a second copy of a note they already ignored. Ask for a hire, a post, or a comment you can check. Two sentences. No calendar hold.",
  },
  {
    n: "03",
    title: "Cap",
    flip: false,
    lead: "One or two nudges.",
    body: "Infinite follow-ups train people to ignore you. If ignores pile up, change the promise. Do not add a second Bot to go faster.",
  },
  {
    n: "04",
    title: "Send path",
    flip: true,
    lead: "Omentir still sends.",
    body: (
      <>
        The Bot drafts. You cut. The campaign sends under caps. How-to for the first touch:{" "}
        <Link href="/blogs/automate-cold-messaging-with-grok-bot" className="underline underline-offset-4">
          automate cold messaging with Grok Bot
        </Link>
        .
      </>
    ),
  },
] as const;

export default function FollowUpLanding() {
  return (
    <div className="omentir-moderate-width min-w-0 space-y-20 pb-8 md:space-y-28 md:pb-12">
      <LandingSection title="How this writes the second note, not the whole thread.">
        <JobSlides slides={JOB_SLIDES} />
      </LandingSection>
      <Runbook
        title="Keep follow-up as a draft job."
        steps={[
          {
            title: "Confirm the first note already went out",
            body: "Follow-up is for people who accepted and stayed quiet. If the first DM never sent, run the cold-message job instead.",
          },
          {
            title: "Ask for a new reason to write",
            body: "Paste the follow-up prompt. Replace the brackets. Keep the stop rule. The draft should cite a new trigger, not a reminder that you exist.",
          },
          {
            title: "Skip anyone who replied",
            body: "If they asked a question, a person answers. A Bot arguing about price in your inbox overnight is not this job.",
          },
          {
            title: "Send from Omentir, then stop",
            body: "Start or refill a small campaign. One or two follow-ups. Measure replies, not how many nudges the Bot wrote while you slept.",
          },
        ]}
      />
    </div>
  );
}
