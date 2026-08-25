import Link from "next/link";
import { JobSlides, LandingSection, Runbook } from "./landing-kit";

const JOB_SLIDES = [
  {
    n: "01",
    title: "Tonight",
    flip: false,
    lead: "One ICP and a stop rule.",
    body: "Give the Bot one buyer definition and a batch size you can finish in the morning. Replace the brackets in the prompt and keep the stop rule.",
  },
  {
    n: "02",
    title: "Overnight",
    flip: true,
    lead: "Research and drafts.",
    body: "The output should be fit, evidence, risk, and a two-sentence note. No send. No enroll. No LinkedIn login on the Bot computer.",
  },
  {
    n: "03",
    title: "Morning",
    flip: false,
    lead: "The sales motion.",
    body: (
      <>
        Open Omentir and read the people. Reject agencies posing as SaaS, students, or the wrong country. Edit drafts,
        then start a small campaign. The first real question is yours. Human pacing lives in{" "}
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
    body: "Skip it on a new or recently recovered LinkedIn account, and on weeks when you cannot review the list. Warm the account first. If you do not already pay for Grok Bot, start in Overview.",
  },
] as const;

export default function OvernightOutboundLanding() {
  return (
    <div className="omentir-moderate-width min-w-0 space-y-20 pb-8 md:space-y-28 md:pb-12">
      <LandingSection title="How this works overnight.">
        <JobSlides slides={JOB_SLIDES} />
      </LandingSection>
      <Runbook
        title="Use the morning list as your checkpoint."
        steps={[
          {
            title: "Set a finishable batch",
            body: "Give Grok Bot one ICP and a number you can review before the workday starts. A smaller list with evidence is more useful than a large list you will ignore.",
          },
          {
            title: "Leave sending switched off",
            body: "Keep the Bot description clear: research and draft only. Never send, never enroll, and never sign into LinkedIn on the Bot computer.",
          },
          {
            title: "Check the evidence first",
            body: "Open each promising lead in Omentir. Remove bad fits, check the trigger, and cut any draft that makes a claim you cannot support.",
          },
          {
            title: "Start small and watch replies",
            body: (
              <>
                Launch from Omentir with conservative limits and send windows. Read{" "}
                <Link href="/features/linkedin-account-safety" className="underline underline-offset-4">
                  account safety
                </Link>{" "}
                before you increase volume. The overnight run is preparation, not the conversation.
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
