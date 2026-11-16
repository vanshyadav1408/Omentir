import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import HeroCta from "../hero-cta";
import { PROOF_STATS } from "../proof-data";

/** Sections of the remade landing page at /new-landing. Same story as the
 *  homepage (the promise, four outbound chores, what Omentir does instead),
 *  laid out on one 1140px grid with normal scrolling: only the statement
 *  between the chores and the features is pinned. HomeScrollActs sets `--p`
 *  on it and `data-in` on every `[data-nx-reveal]`. Styled by new-landing.css.
 *  The mock cards are decoration and hidden from assistive tech. */

const STEPS: Array<[who: string, title: string, note: string]> = [
  ["Omentir", "Find", "People who fit your buyer profile"],
  ["Omentir", "Connect", "Invites from your own account"],
  ["Omentir", "Message", "Follow-ups when they go quiet"],
  ["You", "Book", "You take the call"],
];

function Arrow() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 9l6-6M4 3h5v5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="nl-hero" aria-labelledby="nl-hero-heading">
      <div className="nl-frame nl-hero-frame">
        <div className="nl-sky" aria-hidden="true">
          <i className="nl-cloud nl-cloud-1" />
          <i className="nl-cloud nl-cloud-2" />
          <i className="nl-cloud nl-cloud-3" />
          <i className="nl-cloud nl-cloud-4" />
        </div>
        <div className="nl-grain" aria-hidden="true" />

        <div className="nl-hero-copy">
          <h1 id="nl-hero-heading">
            <span>Omentir will find you customers</span> <span>or you pay nothing.</span>
          </h1>
          <p>
            It finds buyers on LinkedIn, sends invites and follow-ups from your own account, and puts every reply in
            one inbox.
          </p>
          <div className="nl-hero-cta">
            <HeroCta />
          </div>
        </div>

        <div className="nl-steps">
          <p>
            Four steps. <em>You only do the last one.</em>
          </p>
          <ol>
            {STEPS.map(([who, title, note]) => (
              <li key={title}>
                <small>{who}</small>
                <b>{title}</b>
                <span>{note}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function PersonRows({ rows }: { rows: Array<[name: string, role: string, tag: string]> }) {
  return (
    <ul className="nl-mock-rows">
      {rows.map(([name, role, tag]) => (
        <li key={name}>
          <u />
          <span>
            <b>{name}</b>
            {role}
          </span>
          <small>{tag}</small>
        </li>
      ))}
    </ul>
  );
}

function SearchScene() {
  return (
    <div className="nl-mock">
      <div className="nl-mock-bar">
        <i />
        <i />
        <i />
        <span>People search: head of growth, fintech</span>
      </div>
      <PersonRows
        rows={[
          ["Priya Shah", "Head of Growth, fintech", "2nd"],
          ["Marcus Lee", "VP Sales, SaaS", "3rd"],
          ["Ana Costa", "Founder, devtools", "2nd"],
          ["James Okonkwo", "COO, logistics", "3rd"],
          ["Elena Voss", "Head of Sales, healthtech", "2nd"],
        ]}
      />
    </div>
  );
}

function OpenerScene() {
  return (
    <div className="nl-mock nl-mock-chat">
      <p>Hi Priya, I came across your profile and wanted to reach out.</p>
      <p>Hi Marcus, I came across your profile and wanted to reach out.</p>
      <p>Hi Ana, I came across your profile and wanted to reach out.</p>
      <p>Hi James, I came across your profile and wanted to reach out.</p>
      <p>Hi Elena, I came across your profile and wanted to reach out.</p>
      <p>Hi Noah, I came across your profile and wanted to reach out.</p>
    </div>
  );
}

function FollowUpScene() {
  return (
    <div className="nl-mock">
      <div className="nl-mock-bar">
        <span>Invites accepted</span>
      </div>
      <ul className="nl-mock-rows nl-mock-quiet">
        {[
          ["Priya Shah", "No reply, 9 days"],
          ["Marcus Lee", "No reply, 12 days"],
          ["Ana Costa", "No reply, 6 days"],
          ["James Okonkwo", "No reply, 15 days"],
          ["Elena Voss", "No reply, 8 days"],
        ].map(([name, wait]) => (
          <li key={name}>
            <u />
            <span>
              <b>{name}</b>
            </span>
            <small>{wait}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InboxScene() {
  return (
    <div className="nl-mock">
      <div className="nl-mock-bar">
        <span>Messages</span>
        <small>27 unread</small>
      </div>
      <ul className="nl-mock-rows nl-mock-inbox">
        {[
          ["Weekly digest", "12 posts you may have missed", false],
          ["Priya Shah", "Sounds useful. Free Thursday?", true],
          ["Recruiter", "An exciting opportunity for you", false],
          ["Webinar invite", "Join 400 other leaders live", false],
          ["Sponsored", "Grow your pipeline 10x", false],
        ].map(([from, line, hit]) => (
          <li key={String(from)} className={hit ? "is-hit" : undefined}>
            <u />
            <span>
              <b>{from}</b>
              {line}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CHORES: Array<{ lead: string; rest: string; note: string; scene: ReactNode }> = [
  { lead: "Looking for buyers,", rest: "one profile at a time?", note: "which of these would buy?", scene: <SearchScene /> },
  { lead: "Typing the same opener", rest: "for the fortieth time?", note: "copy, paste, again", scene: <OpenerScene /> },
  { lead: "Follow-ups you meant", rest: "to send last week?", note: "meant to do this Tuesday", scene: <FollowUpScene /> },
  { lead: "A real reply, buried", rest: "under everything else?", note: "almost missed this", scene: <InboxScene /> },
];

export function Chores() {
  return (
    <section id="problems" aria-labelledby="nl-chores-heading" className="nl-section nl-section-first">
      <header className="nl-head" data-nx-reveal="">
        <h2 id="nl-chores-heading">
          Outbound by hand <em>is four chores on repeat.</em>
        </h2>
        <p>None of it is hard. It takes the hours you wanted to spend on sales calls.</p>
      </header>
      <ul className="nl-chores" data-nx-reveal="">
        {CHORES.map((chore) => (
          <li key={chore.lead}>
            <div className="nl-chore-stage" aria-hidden="true">
              <p className="nl-hand">{chore.note}</p>
              {chore.scene}
            </div>
            <h3>
              {chore.lead} <em>{chore.rest}</em>
            </h3>
          </li>
        ))}
      </ul>
    </section>
  );
}

const WHY = ["You should be talking to buyers.", "Omentir does the part before that."].map((line) => line.split(" "));

export function Statement() {
  const total = WHY[0].length + WHY[1].length;
  return (
    <section data-nx-act="" className="nl-why">
      <div className="nl-why-pin">
        <p style={{ "--n": total } as CSSProperties}>
          {WHY.map((words, line) => (
            <span key={line}>
              {words.map((word, i) => (
                <i key={i} style={{ "--i": line * WHY[0].length + i } as CSSProperties}>
                  {word}{" "}
                </i>
              ))}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

type Row = [label: string, meta: ReactNode, value: ReactNode];

function Rows({ rows }: { rows: Row[] }) {
  return (
    <ul className="nl-demo-rows">
      {rows.map(([label, meta, value]) => (
        <li key={label}>
          <b>{label}</b>
          {meta ? <span>{meta}</span> : null}
          <strong>{value}</strong>
        </li>
      ))}
    </ul>
  );
}

function Meter({ label, pct, value }: { label: string; pct: number; value: string }) {
  return (
    <div className="nl-demo-meter">
      <p>
        <b>{label}</b>
        <span>{value}</span>
      </p>
      <i>
        <u style={{ width: `${pct}%` }} />
      </i>
    </div>
  );
}

const FEATURES: Array<{ title: string; note: string; href: string; demo: ReactNode }> = [
  {
    title: "Lead groups and scoring",
    note: "See why each lead fits",
    href: "/features/lead-groups-and-scoring",
    demo: (
      <>
        <p className="nl-demo-k">High-intent SaaS leaders</p>
        <Rows
          rows={[
            ["Maya Chen", "Hiring SDRs", <mark key="s">94</mark>],
            ["Daniel Ortiz", "Commented on a competitor", <mark key="s">88</mark>],
            ["Aisha Karim", "Posts about outbound", <mark key="s">81</mark>],
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
        <p className="nl-demo-k">Send window</p>
        <div className="nl-demo-week">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
            <span key={day} className={i < 5 ? "is-on" : undefined}>
              {day}
            </span>
          ))}
        </div>
        <Rows
          rows={[
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
        <p className="nl-demo-k">Today</p>
        <Meter label="Invites" pct={72} value="18 of 25" />
        <Meter label="Messages" pct={55} value="33 of 60" />
        <Rows rows={[["Account health", null, <span key="h" className="nl-demo-ok">Good</span>]]} />
      </>
    ),
  },
  {
    title: "Reply drafts",
    note: "A draft for every reply",
    href: "/features/reply-drafts",
    demo: (
      <>
        <p className="nl-demo-k">Priya replied</p>
        <p className="nl-demo-in">How does pricing work for a team of three?</p>
        <p className="nl-demo-k nl-demo-k-me">Draft</p>
        <p className="nl-demo-me">Happy to explain. Want to grab 15 minutes this week?</p>
      </>
    ),
  },
  {
    title: "Agent API and MCP",
    note: "Run it from Claude, ChatGPT or Cursor",
    href: "/features/agent-api-and-mcp",
    demo: (
      <>
        <p className="nl-demo-k nl-demo-k-me">In Claude</p>
        <p className="nl-demo-me">Any new LinkedIn replies today?</p>
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
        <p className="nl-demo-k">MIT license</p>
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

export function Features() {
  return (
    <section id="features" aria-labelledby="nl-features-heading" className="nl-section">
      <header className="nl-head" data-nx-reveal="">
        <h2 id="nl-features-heading">
          One place for your <em>whole LinkedIn pipeline</em>
        </h2>
        <p>
          Omentir finds people who fit your buyer profile, connects from your own LinkedIn account, and follows up
          when they go quiet. When someone wants to talk, you book the call.
        </p>
      </header>
      <ul className="nl-features" data-nx-reveal="">
        {FEATURES.map((feature) => (
          <li key={feature.href}>
            <div className="nl-demo" aria-hidden="true">
              {feature.demo}
            </div>
            <h3>
              <Link href={feature.href}>{feature.title}</Link>
            </h3>
            <p>{feature.note}</p>
            <span className="nl-more" aria-hidden="true">
              Learn more <Arrow />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const TOOLS = ["Claude", "ChatGPT", "Cursor", "Claude Code", "Codex", "Grok", "OpenClaw", "MCP", "REST API"];

export function Tools() {
  return (
    <section aria-labelledby="nl-tools-heading" className="nl-section nl-split" data-nx-reveal="">
      <header>
        <h2 id="nl-tools-heading">
          Connect Omentir to the tools <em>you already use</em>
        </h2>
        <p className="nl-link">
          <Link href="/integrations">
            View all integrations <Arrow />
          </Link>
        </p>
      </header>
      <ul className="nl-tools">
        {TOOLS.map((tool) => (
          <li key={tool}>{tool}</li>
        ))}
      </ul>
    </section>
  );
}

export function Proof() {
  return (
    <section aria-labelledby="nl-proof-heading" className="nl-section">
      <header className="nl-head" data-nx-reveal="">
        <h2 id="nl-proof-heading">
          Real customers. <em>Real numbers.</em>
        </h2>
      </header>
      <ul className="nl-stats" data-nx-reveal="">
        {PROOF_STATS.map((stat) => (
          <li key={stat.label}>
            <strong>{stat.value}</strong>
            <b>{stat.label}</b>
            <p>{stat.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
