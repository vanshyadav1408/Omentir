import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import CustomerLogoWall from "./customer-logo-wall";
import { IntegrationMark } from "./integrations/integration-logo";
import { PROOF_STATS } from "./proof-data";

/** Homepage sections below the scroll story, built as centered slides.
 *  Features and results are pinned acts: HomeScrollActs sets `data-step` and
 *  one slide shows per step. The steps and tools slides build in once their
 *  list scrolls into view (`data-nx-reveal` gets `data-in`). Each feature
 *  slide shows a small sample card, the way nextrip.cc pairs a request with
 *  its result rows. Styled by the "Homepage slides" block in globals.css. */

type Row = [label: string, meta: ReactNode, value: ReactNode];

function Rows({ rows }: { rows: Row[] }) {
  return (
    <ul className="nx-demo-rows">
      {rows.map(([label, meta, value]) => (
        <li key={label}>
          <span>{label}</span>
          {meta ? <span className="nx-demo-meta">{meta}</span> : null}
          <span>{value}</span>
        </li>
      ))}
    </ul>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <span className="nx-demo-bar">
      <i style={{ width: `${pct}%` }} />
    </span>
  );
}

const FEATURES: Array<{ title: string; note: string; href: string; demo: ReactNode }> = [
  {
    title: "Lead groups and scoring",
    note: "See why each lead fits",
    href: "/features/lead-groups-and-scoring",
    demo: (
      <>
        <p className="nx-demo-k">High-intent SaaS leaders</p>
        <Rows
          rows={[
            ["Maya Chen", "Hiring SDRs", "94"],
            ["Daniel Ortiz", "Commented on a competitor", "88"],
            ["Aisha Karim", "Posts about outbound", "81"],
          ]}
        />
      </>
    ),
  },
  {
    title: "Campaigns and send windows",
    note: "Sent in each lead's time zone",
    href: "/features/campaigns-and-send-windows",
    demo: (
      <>
        <p className="nx-demo-k">Send window</p>
        <Rows
          rows={[
            ["Days", null, "Mon to Fri"],
            ["Hours", null, "9:00 to 17:00"],
            ["Time zone", null, "Each lead's own"],
          ]}
        />
      </>
    ),
  },
  {
    title: "LinkedIn account safety",
    note: "Daily caps you set",
    href: "/features/linkedin-account-safety",
    demo: (
      <>
        <p className="nx-demo-k">Today</p>
        <Rows
          rows={[
            ["Invites", <Bar key="i" pct={72} />, "18 of 25"],
            ["Messages", <Bar key="m" pct={55} />, "33 of 60"],
            ["Account health", null, <span key="h" className="nx-demo-ok">Good</span>],
          ]}
        />
      </>
    ),
  },
  {
    title: "Reply drafts",
    note: "A draft for every reply",
    href: "/features/reply-drafts",
    demo: (
      <>
        <p className="nx-demo-k">Priya replied</p>
        <p className="nx-demo-in">How does pricing work for a team of three?</p>
        <p className="nx-demo-k nx-demo-k-me">Draft</p>
        <p className="nx-demo-me">Happy to explain. Want to grab 15 minutes this week?</p>
      </>
    ),
  },
  {
    title: "Agent API and MCP",
    note: "Run it from Claude, ChatGPT or Cursor",
    href: "/features/agent-api-and-mcp",
    demo: (
      <>
        <p className="nx-demo-k">In Claude</p>
        <p className="nx-demo-me">Any new LinkedIn replies today?</p>
        <Rows
          rows={[
            ["Priya Shah", "Asked about pricing", "10:42"],
            ["Marcus Lee", "Free next Tuesday", "9:15"],
          ]}
        />
      </>
    ),
  },
  {
    title: "Open source self-hosting",
    note: "MIT licensed, on your server",
    href: "/features/open-source-self-hosting",
    demo: (
      <>
        <p className="nx-demo-k">MIT license</p>
        <Rows
          rows={[
            ["Hosted", null, "omentir.com"],
            ["Self-hosted", null, "Your own server"],
            ["Source", null, "GitHub"],
          ]}
        />
      </>
    ),
  },
];

const STEPS: Array<[who: string, title: string, note: string]> = [
  ["Omentir", "Find", "People who fit your buyer profile"],
  ["Omentir", "Connect", "Invites from your own account"],
  ["Omentir", "Message", "Follow-ups when they go quiet"],
  ["You", "Book", "You take the call"],
];

/** [logo slug in integration-logo.tsx, label]. */
const TOOLS: Array<[slug: string, label: string]> = [
  ["claude", "Claude"],
  ["chatgpt", "ChatGPT"],
  ["cursor", "Cursor"],
  ["claude-code", "Claude Code"],
  ["codex", "Codex"],
  ["grok", "Grok"],
  ["openclaw", "OpenClaw"],
  ["mcp", "MCP"],
  ["rest-api", "REST API"],
];

function Arrow() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 9l6-6M4 3h5v5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Ticks({ count }: { count: number }) {
  return (
    <div className="nx-ticks" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <i key={i} />
      ))}
    </div>
  );
}

export default function HomeInfo() {
  return (
    <>
      <section
        id="features"
        aria-labelledby="nx-features-heading"
        data-nx-act=""
        data-nx-steps={FEATURES.length}
        data-step="0"
        className="nx-act nx-deck"
      >
        <div className="nx-pin">
          <h2 id="nx-features-heading">
            One place for your <em>whole LinkedIn pipeline</em>
          </h2>
          <ol className="nx-swap">
            {FEATURES.map((feature) => (
              <li key={feature.href}>
                <h3>{feature.title}</h3>
                <p className="nx-deck-note">{feature.note}</p>
                <div className="nx-card nx-demo" aria-hidden="true">
                  {feature.demo}
                </div>
                <p className="nx-also">
                  <Link href={feature.href}>
                    Learn more<span className="sr-only"> about {feature.title}</span> <Arrow />
                  </Link>
                </p>
              </li>
            ))}
          </ol>
          <Ticks count={FEATURES.length} />
        </div>
      </section>

      <section id="how" aria-labelledby="nx-steps-heading" className="nx-slide">
        <h2 id="nx-steps-heading">
          Four steps. <em>You only do the last one.</em>
        </h2>
        <ol className="nx-flow" data-nx-reveal="">
          {STEPS.map(([who, title, note], i) => (
            <li key={title} style={{ "--i": i } as CSSProperties}>
              <small>{who}</small>
              <b>{i === STEPS.length - 1 ? <mark>{title}</mark> : title}</b>
              <p>{note}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="nx-tools-heading" className="nx-slide">
        <h2 id="nx-tools-heading">
          Connect Omentir to the tools <em>you already use</em>
        </h2>
        <ul className="nx-wall" data-nx-reveal="">
          {TOOLS.map(([slug, label], i) => (
            <li key={slug} style={{ "--i": i } as CSSProperties}>
              {/* The label names the tool, so the logo is decoration. */}
              <span className="nx-wall-mark" aria-hidden="true">
                <IntegrationMark slug={slug} />
              </span>
              {label}
            </li>
          ))}
        </ul>
        <p className="nx-also">
          <Link href="/integrations">
            View all integrations <Arrow />
          </Link>
        </p>
      </section>

      {/* A pinned slide: one number per scroll step, blurring in like the
          problem questions above. */}
      <section
        aria-labelledby="nx-results-heading"
        data-nx-act=""
        data-nx-steps={PROOF_STATS.length}
        data-step="0"
        className="nx-act nx-proof"
      >
        <div className="nx-pin">
          <h2 id="nx-results-heading">
            Real customers. <em>Real numbers.</em>
          </h2>
          <ul className="nx-swap">
            {PROOF_STATS.map((stat) => (
              <li key={stat.label}>
                <strong>{stat.value}</strong>
                <b>{stat.label}</b>
              </li>
            ))}
          </ul>
          <Ticks count={PROOF_STATS.length} />
        </div>
      </section>
      <CustomerLogoWall />
    </>
  );
}
