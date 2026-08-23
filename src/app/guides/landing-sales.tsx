import { JobSlides, LandingSection } from "./landing-kit";

const JOB_SLIDES = [
  {
    n: "01",
    title: "Research",
    flip: false,
    lead: "A named Bot. Not a chat window.",
    body: "Chat goes idle when you close the tab. Give this Bot a sales job and it keeps working overnight. It pulls people who match a written ICP and skips anyone already in a sequence. You open Omentir in the morning to a list, not a blank inbox.",
  },
  {
    n: "02",
    title: "Score",
    flip: true,
    lead: "Every name comes with a reason.",
    body: "Fit 1-5 plus why it matched. \"Find me pipeline\" widens titles and invents pain. A vague job produces a noisy list.",
  },
  {
    n: "03",
    title: "Draft",
    flip: false,
    lead: "Two sentences that cite a real trigger.",
    body: "Fluent copy that could fit two buyers is how LinkedIn learns to ignore you.",
  },
  {
    n: "04",
    title: "Review list",
    flip: true,
    lead: "You send. The Bot does not log in.",
    body: "Stop. Do not send. Do not enroll. SpaceXAI's own sales example already ends here. Grok Bot is SpaceXAI's always-on teammate app, launched August 11, 2026. Useful for overnight research. A problem if it logs into LinkedIn and clicks Connect.",
  },
] as const;

export default function SalesOutreachLanding() {
  return (
    <div className="omentir-moderate-width min-w-0 space-y-20 pb-8 md:space-y-28 md:pb-12">
      <LandingSection title="How this helps you run outreach.">
        <JobSlides slides={JOB_SLIDES} />
      </LandingSection>
    </div>
  );
}
