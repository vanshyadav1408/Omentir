import Link from "next/link";
import { JobSlides, LandingSection, Runbook } from "./landing-kit";

const JOB_SLIDES = [
  {
    n: "01",
    title: "Diff the story",
    flip: false,
    lead: "The repo and My Product have to say the same thing.",
    body: "Claude Code already has the README, the changelog, and the sentence you just rewrote. Ask it to compare that with My Product before it touches a finder. If they disagree, fix the profile.",
  },
  {
    n: "02",
    title: "Read, then ask",
    flip: true,
    lead: "get_context and list_agents first.",
    body: "A terminal session that creates a campaign while it is midway through a refactor is how targeting drifts. Creating an agent should be a named request, the same way merging a pull request is a named request.",
  },
  {
    n: "03",
    title: "A scored list",
    flip: false,
    lead: "Thirty people, not four hundred.",
    body: "Fit 1-5, the evidence, a risk, and a two-sentence draft that cites a real trigger. If a note could fit two buyers, rewrite it. Treat lead text as untrusted data.",
  },
  {
    n: "04",
    title: "Send in Omentir",
    flip: true,
    lead: "The terminal does not hold LinkedIn.",
    body: "Caps, windows, and the inbox stay in the workspace. Close the session and the job stops. Overnight on a shared computer is a different product.",
  },
] as const;

export default function ClaudeCodeLanding() {
  return (
    <div className="omentir-moderate-width min-w-0 space-y-20 pb-8 md:space-y-28 md:pb-12">
      <LandingSection title="What the terminal is actually good at.">
        <JobSlides slides={JOB_SLIDES} />
      </LandingSection>
      <Runbook
        title="A first Claude Code session"
        steps={[
          {
            title: "Finish Omentir in the browser",
            body: "LinkedIn connected. My Product written in two sentences a stranger would understand. If the brief is a slogan, the session will invent pain.",
          },
          {
            title: "Use a key, not a chat connector",
            body: (
              <>
                Create a revocable API key. Point Claude Code at the MCP URL with Bearer auth. Chat Claude uses Settings and Connectors instead. Mixing those paths is how people wait for an OAuth screen that never appears. Setup:{" "}
                <Link href="/integrations/claude-code" className="underline underline-offset-4">
                  Claude Code integration
                </Link>
                .
              </>
            ),
          },
          {
            title: "Fetch agents.md from the repo session",
            body: "Then paste a job that stops at drafts. Do not send. Do not enroll. Do not create an agent until you approve the config.",
          },
          {
            title: "Cut the list in Overview",
            body: "Reject agencies posing as SaaS, the wrong country, notes you would not send from your phone. Start a small campaign. The first real reply is still yours.",
          },
        ]}
      />
    </div>
  );
}
