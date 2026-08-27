import Link from "next/link";
import { JobSlides, LandingSection, Runbook, SurfaceCard } from "./landing-kit";

const JOB_SLIDES = [
  {
    n: "01",
    title: "TOML, not a connector screen",
    flip: false,
    lead: "Codex reads ~/.codex/config.toml.",
    body: "ChatGPT chat uses Settings and Connectors. Codex uses mcp_servers, a URL, and bearer_token_env_var. That field is the name of an environment variable. Pasting the token into the file is how it lands in git.",
  },
  {
    n: "02",
    title: "Shared with the Codex surfaces",
    flip: true,
    lead: "CLI and the IDE extension share the file.",
    body: "A project-local .codex/config.toml only loads for trusted projects. If the server never appears, the table is probably named mcp-servers instead of mcp_servers, or the env var was empty when Codex launched.",
  },
  {
    n: "03",
    title: "Check with /mcp",
    flip: false,
    lead: "Confirm tools before you ask for a finder.",
    body: "Then fetch agents.md. Call get_context. List agents. Creating a campaign from a coding session should be a named request.",
  },
  {
    n: "04",
    title: "Send stays in Omentir",
    flip: true,
    lead: "Codex should not hold LinkedIn.",
    body: "Close the session and the work stops. Overnight on a cloud computer is a different product. Caps still live in the workspace.",
  },
] as const;

export default function CodexLanding() {
  return (
    <div className="omentir-moderate-width min-w-0 space-y-20 pb-8 md:space-y-28 md:pb-12">
      <LandingSection title="What Codex is actually good at.">
        <JobSlides slides={JOB_SLIDES} />
      </LandingSection>
      <LandingSection title="The config Codex expects">
        <SurfaceCard>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-7 text-[var(--md-sys-color-on-surface)]">
            {`[mcp_servers.omentir]
url = "https://omentir.com/api/agent/v1/mcp"
bearer_token_env_var = "OMENTIR_API_KEY"`}
          </pre>
        </SurfaceCard>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--md-sys-color-on-surface-variant)]">
          Export OMENTIR_API_KEY in the shell before you launch Codex. Run /mcp in the session. If the server is missing, fix the table name and the env var before you invent a second path.
        </p>
      </LandingSection>
      <Runbook
        title="A first Codex session"
        steps={[
          {
            title: "Finish Omentir in the browser",
            body: "LinkedIn connected. My Product written. Codex will not fix a slogan.",
          },
          {
            title: "Add the server in config.toml",
            body: (
              <>
                Global file at ~/.codex/config.toml, or a project file only if the repo is trusted. Details:{" "}
                <Link href="/integrations/codex" className="underline underline-offset-4">
                  Codex integration
                </Link>
                .
              </>
            ),
          },
          {
            title: "Ask for a scored list, drafts only",
            body: "Thirty people. Fit, evidence, risk, two sentences that cite a real trigger. Do not send. Do not enroll.",
          },
          {
            title: "Review in Overview",
            body: "Cut junk. Start a small campaign. The first real reply is still yours.",
          },
        ]}
      />
    </div>
  );
}
