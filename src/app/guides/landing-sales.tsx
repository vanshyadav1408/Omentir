import Link from "next/link";
import { JobSlides, LandingSection, Runbook } from "./landing-kit";

const JOB_SLIDES = [
  {
    n: "01",
    title: "Research",
    flip: false,
    lead: "Give the Bot a narrow brief.",
    body: "Name the buyer, result, account type, region, signal, and who to skip. A broad \"find pipeline\" request gives you a list you cannot judge.",
  },
  {
    n: "02",
    title: "Score",
    flip: true,
    lead: "Every name comes with a reason.",
    body: "Ask for fit 1-5, evidence, and a risk. Keep the reason next to the name so you can reject weak matches without rereading the whole run.",
  },
  {
    n: "03",
    title: "Draft",
    flip: false,
    lead: "Two sentences that cite a real trigger.",
    body: "Use a post, hire, or competitor comment you can check. If the note fits two buyers, rewrite it before it reaches your queue.",
  },
  {
    n: "04",
    title: "Review list",
    flip: true,
    lead: "You send. The Bot does not log in.",
    body: "Stop at the review list. Read the evidence, remove bad fits, and edit the notes before a small Omentir campaign. The Bot should not send, enroll, or sign into LinkedIn.",
  },
] as const;

export default function SalesOutreachLanding() {
  return (
    <div className="omentir-moderate-width min-w-0 space-y-20 pb-8 md:space-y-28 md:pb-12">
      <LandingSection title="How this helps you run outreach.">
        <JobSlides slides={JOB_SLIDES} />
      </LandingSection>
      <Runbook
        title="Make the first run useful."
        steps={[
          {
            title: "Write one buyer brief",
            body: "Name the buyer, the result you sell, the account type, region, real signal, and exclusions. Start with one segment so you can tell whether the list is right.",
          },
          {
            title: "Connect the handoff",
            body: (
              <>
                Finish Omentir first, then add its MCP connector in Grok Bot. The{" "}
                <Link href="/integrations/grok-bot" className="underline underline-offset-4">
                  Grok Bot integration guide
                </Link>{" "}
                has the URL and the workspace approval step.
              </>
            ),
          },
          {
            title: "Stop at a review list",
            body: "Ask for up to 30 people with a fit score, evidence, risk, and a two-sentence draft. Keep the stop rule in the prompt: do not send, do not enroll, and do not sign into LinkedIn.",
          },
          {
            title: "Review before a small campaign",
            body: "Open Omentir, remove weak matches, and edit anything you would not say yourself. Start with a small campaign. The first real reply and the meeting are still yours.",
          },
        ]}
      />
    </div>
  );
}
