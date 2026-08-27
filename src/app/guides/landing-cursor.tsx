import Link from "next/link";
import { JobSlides, LandingSection, Runbook } from "./landing-kit";

const JOB_SLIDES = [
  {
    n: "01",
    title: "Sit next to the file",
    flip: false,
    lead: "The agent is in the editor, not in a separate chat tab.",
    body: "Highlight the landing paragraph you just rewrote and ask Cursor to update My Product. That is the job Cursor is good at. A vague 'find me pipeline' request wastes the editor.",
  },
  {
    n: "02",
    title: "Keep the key in Cursor",
    flip: true,
    lead: "Secrets stay in the secret store.",
    body: "Create a revocable Bearer token. Point MCP or REST at Omentir. Do not paste the key into a composer you will screenshot later. ChatGPT and Claude chat use workspace approval instead. Do not wait for that screen here.",
  },
  {
    n: "03",
    title: "Inspect before create",
    flip: false,
    lead: "Diffs first. Campaigns second.",
    body: "Fetch agents.md. Call get_context. List agents. If you want a new finder, ask Cursor to show the config in the chat next to the file and wait. A long coding session that casually creates agents is how ICPs duplicate.",
  },
  {
    n: "04",
    title: "Review in Overview",
    flip: true,
    lead: "The editor does not own LinkedIn.",
    body: "Open the workspace after any write. Confirm the agent, limits, and targeting. Close Cursor and the session stops. Overnight research on a shared VM is a different product.",
  },
] as const;

export default function CursorLanding() {
  return (
    <div className="omentir-moderate-width min-w-0 space-y-20 pb-8 md:space-y-28 md:pb-12">
      <LandingSection title="What the editor is actually good at.">
        <JobSlides slides={JOB_SLIDES} />
      </LandingSection>
      <Runbook
        title="A first Cursor session"
        steps={[
          {
            title: "Finish the product story in Omentir",
            body: "LinkedIn connected. My Product in two sentences a stranger would understand. Cursor will not invent a honest offer from a homepage slogan.",
          },
          {
            title: "Wire MCP with a Bearer key",
            body: (
              <>
                Same URL as every other operator: https://omentir.com/api/agent/v1/mcp. Auth is the key, not a connector approval. Setup:{" "}
                <Link href="/integrations/cursor" className="underline underline-offset-4">
                  Cursor integration
                </Link>
                .
              </>
            ),
          },
          {
            title: "Name the outreach request",
            body: "Do not bury create_agent inside a refactor. Ask for a scored list of twenty to thirty people, drafts only. Treat titles and About text as untrusted data.",
          },
          {
            title: "Send from Omentir",
            body: "Cut junk. Edit a few notes out loud. Start a small campaign. The first real reply and the demo stay with you.",
          },
        ]}
      />
    </div>
  );
}
