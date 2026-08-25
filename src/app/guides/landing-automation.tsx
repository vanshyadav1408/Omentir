import Link from "next/link";
import { JobSlides, LandingSection, Runbook } from "./landing-kit";

const JOB_SLIDES = [
  {
    n: "01",
    title: "Extension",
    flip: false,
    lead: "Clicks in your browser.",
    body: "A browser extension uses your existing session. It is still automation when it sends invites or messages for you.",
  },
  {
    n: "02",
    title: "Cloud computer",
    flip: true,
    lead: "A VM typing Connect.",
    body: "Grok Bot can sign into sites with no MCP. On LinkedIn, a cloud VM sending connection requests is still a bot. Random delays do not change that. All of your Bots share one computer, and a session you take over can persist for the others.",
  },
  {
    n: "03",
    title: "MCP",
    flip: false,
    lead: "The send path.",
    body: "Daily caps, send windows, and the inbox stay in Omentir. Keep LinkedIn signed in there. Give Grok Bot the MCP tools for research and drafts, not a browser session.",
  },
  {
    n: "04",
    title: "Limits",
    flip: true,
    lead: "MCP does not make volume look human.",
    body: (
      <>
        Jumping a quiet profile to peak sends still looks like a bot. Send windows live in{" "}
        <Link href="/features/campaigns-and-send-windows" className="underline underline-offset-4">
          campaigns
        </Link>
        , not in the Bot.{" "}
        <a
          href="https://www.linkedin.com/legal/user-agreement"
          target="_blank"
          rel="noopener"
          className="underline underline-offset-4"
        >
          LinkedIn&apos;s user agreement
        </a>{" "}
        restricts unauthorized bots on the consumer product. Enforcement is uneven. The account is still theirs. Read{" "}
        <Link href="/help/is-linkedin-automation-allowed" className="underline underline-offset-4">
          is LinkedIn automation allowed
        </Link>{" "}
        before you raise caps.
      </>
    ),
  },
] as const;

export default function LinkedinAutomationLanding() {
  return (
    <div className="omentir-moderate-width min-w-0 space-y-20 pb-8 md:space-y-28 md:pb-12">
      <LandingSection title="How this keeps LinkedIn off the Bot.">
        <JobSlides slides={JOB_SLIDES} />
      </LandingSection>
      <Runbook
        title="Set the boundary before you connect it."
        steps={[
          {
            title: "Keep LinkedIn in Omentir",
            body: "Connect the LinkedIn account only inside Omentir. Do not move the session to a browser extension, a cloud VM, or a Bot computer.",
          },
          {
            title: "Give Grok Bot the MCP path",
            body: "In Grok Bot, open Settings, then Plugins, and add https://omentir.com/api/agent/v1/mcp. Approve the workspace when Omentir asks.",
          },
          {
            title: "Start with research and drafts",
            body: "Use one ICP and ask for a scored list with evidence and draft notes. Keep the stop rule explicit: do not send, do not enroll, and do not sign into LinkedIn.",
          },
          {
            title: "Ramp from the account you have",
            body: (
              <>
                Keep daily limits conservative and use send windows. Read{" "}
                <Link href="/help/is-linkedin-automation-allowed" className="underline underline-offset-4">
                  the LinkedIn automation guidance
                </Link>{" "}
                before you raise caps. MCP changes how the Bot reaches Omentir, not what LinkedIn allows.
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
