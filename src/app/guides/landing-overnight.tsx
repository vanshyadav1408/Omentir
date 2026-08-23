import Link from "next/link";
import { JobSlides, LandingSection } from "./landing-kit";

const JOB_SLIDES = [
  {
    n: "01",
    title: "Tonight",
    flip: false,
    lead: "One ICP and a stop rule.",
    body: "A number you can finish in the morning. Replace the brackets. Keep the last two sentences.",
  },
  {
    n: "02",
    title: "Overnight",
    flip: true,
    lead: "Research and drafts.",
    body: "Fit, evidence, a two-sentence note. No send. No enroll. No LinkedIn login on the Bot computer.",
  },
  {
    n: "03",
    title: "Morning",
    flip: false,
    lead: "The sales motion.",
    body: (
      <>
        Open Omentir. Read the people. Reject agencies posing as SaaS, students, the wrong country. Edit a few drafts.
        Cut anything that does not sound like you. Then start a small campaign. The first real question is yours. Human
        pacing lives in{" "}
        <Link href="/features/linkedin-account-safety" className="underline underline-offset-4">
          account safety
        </Link>{" "}
        and{" "}
        <Link href="/features/campaigns-and-send-windows" className="underline underline-offset-4">
          send windows
        </Link>
        .
      </>
    ),
  },
  {
    n: "04",
    title: "Skip",
    flip: true,
    lead: "When overnight is the wrong idea.",
    body: "A new LinkedIn account, or a recently recovered profile. Warm it up first. A week you cannot sit with the list: an unread overnight run is a more expensive way to ignore your pipeline. Grok Bot is still in beta and sits on expensive plans. Start in Overview if you do not already pay for it.",
  },
] as const;

export default function OvernightOutboundLanding() {
  return (
    <div className="omentir-moderate-width min-w-0 space-y-20 pb-8 md:space-y-28 md:pb-12">
      <LandingSection title="How this works overnight.">
        <JobSlides slides={JOB_SLIDES} />
      </LandingSection>
    </div>
  );
}
