import Link from "next/link";
import { JobSlides, LandingSection, Runbook } from "./landing-kit";

const JOB_SLIDES = [
  {
    n: "01",
    title: "ICP",
    flip: false,
    lead: "Write who you want.",
    body: "Name the buyer, the result, the account type, region, and who to skip. A vague \"find leads\" request gives you a pile you cannot judge.",
  },
  {
    n: "02",
    title: "Find",
    flip: true,
    lead: "Use Omentir tools, not a scrape.",
    body: "Ask Grok Bot to call MCP, list agents, and pull people who match the brief. Skip anyone already in a sequence. Do not let it click around LinkedIn to harvest names.",
  },
  {
    n: "03",
    title: "Score",
    flip: false,
    lead: "Every name needs a reason.",
    body: "Fit 1-5, evidence, risk. Tonight you can skip the message drafts. A scored list is enough to decide whether the ICP is real.",
  },
  {
    n: "04",
    title: "Review",
    flip: true,
    lead: "You keep the list.",
    body: "Open Omentir in the morning. Cut the 1s and 2s. Then decide whether to draft notes. The Bot should not send, enroll, or sign into LinkedIn.",
  },
] as const;

export default function LeadGenerationLanding() {
  return (
    <div className="omentir-moderate-width min-w-0 space-y-20 pb-8 md:space-y-28 md:pb-12">
      <LandingSection title="How this finds people without driving LinkedIn.">
        <JobSlides slides={JOB_SLIDES} />
      </LandingSection>
      <Runbook
        title="Run a list you can finish."
        steps={[
          {
            title: "Write one buyer brief",
            body: "Name the buyer, the result you sell, the account type, region, real signal, and exclusions. Start with one segment so you can tell whether the list is right.",
          },
          {
            title: "Connect MCP, then ask for names",
            body: (
              <>
                Finish Omentir first, then add its MCP connector in Grok Bot. Tonight the job is a scored list, not copy. The{" "}
                <Link href="/integrations/grok-bot" className="underline underline-offset-4">
                  Grok Bot integration guide
                </Link>{" "}
                has the URL and the workspace approval step.
              </>
            ),
          },
          {
            title: "Cap the batch",
            body: "Ask for up to 30 people with fit, evidence, risk, and whether they are already in a sequence. Four hundred names is a spreadsheet you will ignore.",
          },
          {
            title: "Draft later, from Omentir",
            body: "If the list looks right, run a second job for two-sentence notes or start a small campaign. Keep LinkedIn signed in only inside Omentir.",
          },
        ]}
      />
    </div>
  );
}
