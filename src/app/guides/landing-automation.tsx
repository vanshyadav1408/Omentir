import Link from "next/link";
import { JobSlides, LandingSection } from "./landing-kit";

const JOB_SLIDES = [
  {
    n: "01",
    title: "Extension",
    flip: false,
    lead: "Clicks in your browser.",
    body: "The session is the one you already use. Still automation if it fires invites for you.",
  },
  {
    n: "02",
    title: "Cloud computer",
    flip: true,
    lead: "A VM typing Connect.",
    body: "Grok Bot can sign into sites with no MCP. For LinkedIn, a cloud VM sending connection requests is still a bot. Random delays do not change that. All of your Bots share one computer. When it needs a password, passkey, two-factor code, or CAPTCHA, Grok Bot asks you to take over. That session then persists for other Bots.",
  },
  {
    n: "03",
    title: "MCP",
    flip: false,
    lead: "The send path.",
    body: "Daily caps, send windows, and the inbox stay in the workspace. The cloud browser stays off the account. Keep LinkedIn signed in only inside Omentir. If it asks you to take over for LinkedIn, refuse.",
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
    </div>
  );
}
