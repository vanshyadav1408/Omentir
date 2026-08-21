"use client";

import Image from "next/image";
import type { KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import LogoMark from "./logo-mark";

const FACE_SRC: Record<string, string> = {
  You: "/home-mock/you.jpg",
  "Priya Nair": "/home-mock/priya-nair.jpg",
  "James Okonkwo": "/home-mock/james-okonkwo.jpg",
  "Elena Voss": "/home-mock/elena-voss.jpg",
  "Chris Pell": "/home-mock/chris-pell.jpg",
  "Amina Rahman": "/home-mock/amina-rahman.jpg",
  "Noah Berg": "/home-mock/noah-berg.jpg",
  Latticeway: "/home-mock/latticeway.jpg",
};

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "agents", label: "AI Agents" },
  { id: "messages", label: "Messages" },
  { id: "leads", label: "Leads" },
] as const;

const LEADS = [
  { name: "Priya Nair", title: "Head of Growth", score: 94, status: "Messaged" },
  { name: "James Okonkwo", title: "Founder", score: 91, status: "Invited" },
  { name: "Elena Voss", title: "VP Sales", score: 88, status: "Replied" },
  { name: "Noah Berg", title: "CRO", score: 86, status: "Messaged" },
  { name: "Amina Rahman", title: "Head of Sales", score: 84, status: "New" },
  { name: "Dana Whitfield", title: "VP Revenue", score: 79, status: "New" },
  { name: "Marco Silva", title: "Sales Director", score: 74, status: "New" },
  { name: "Tomas Keller", title: "Account Manager", score: 52, status: "Low fit" },
  { name: "Chris Pell", title: "Sales intern", score: 41, status: "Low fit" },
] as const;

const FILTERS = ["VP Sales", "Head of Growth", "B2B SaaS", "United States"] as const;

const MATCHES = [
  { label: "Title", value: "VP Sales" },
  { label: "Industry", value: "B2B SaaS" },
  { label: "Location", value: "United States" },
  { label: "Company size", value: "11 - 50" },
] as const;

type ChatEvent =
  | { kind: "sys"; text: string; focusOnly?: boolean }
  | { kind: "you"; text: string; when?: string }
  | { kind: "them"; text: string; when?: string };

type Thread = {
  name: string;
  title: string;
  preview: string;
  time: string;
  booked?: boolean;
  interested?: boolean;
  log: ChatEvent[];
};

const THREADS: Thread[] = [
  {
    name: "Elena Voss",
    title: "VP Sales",
    preview: "Yes, booked Thursday 11am PT.",
    time: "2m",
    log: [
      { kind: "sys", text: "Invite sent Monday 8:04am", focusOnly: true },
      { kind: "sys", text: "Connection request accepted" },
      {
        kind: "you",
        text: "Hi, saw you're hiring AEs. Will the new reps be building their own pipeline too?",
        when: "Tue 9:12am",
      },
      {
        kind: "them",
        text: "Yes, for now. We don't have SDR coverage yet.",
        when: "Wed 4:18pm",
      },
      { kind: "sys", text: "Follow-up sent after 3 days" },
      {
        kind: "you",
        text: "That's the gap I'm working on at Harborline. Want to see how we find buyers on LinkedIn without adding an SDR team?",
        when: "Fri 9:02am",
      },
      {
        kind: "them",
        text: "Yes, that'd be useful. Thursday morning?",
        when: "Fri 11:41am",
      },
      {
        kind: "you",
        text: "Thursday works. Here's my calendar: calendly.com/you/20min",
        when: "Fri 11:58am",
      },
      {
        kind: "them",
        text: "Yes, booked Thursday 11am PT.",
        when: "Fri 12:06pm",
      },
    ],
  },
  {
    name: "Priya Nair",
    title: "Head of Growth",
    preview: "You: Harborline just opened an AE seat.",
    time: "1h",
    log: [
      { kind: "sys", text: "Connection request accepted" },
      {
        kind: "you",
        text: "Harborline just opened an AE seat. Who owns filling it?",
      },
    ],
  },
  {
    name: "Dana Whitfield",
    title: "VP Revenue",
    preview: "Interested. What does setup look like?",
    time: "2h",
    interested: true,
    log: [
      { kind: "sys", text: "Connection request accepted" },
      {
        kind: "you",
        text: "Saw the AE roles. Do new reps have to build pipeline themselves right now?",
      },
      { kind: "them", text: "Interested. What does setup look like?" },
    ],
  },
  {
    name: "Noah Berg",
    title: "CRO",
    preview: "Next quarter is tight on new tools.",
    time: "3h",
    log: [
      { kind: "sys", text: "Connection request accepted" },
      {
        kind: "you",
        text: "If AE hires are expected to find their own meetings, that's the part we help with.",
      },
      { kind: "them", text: "Next quarter is tight on new tools." },
    ],
  },
  {
    name: "James Okonkwo",
    title: "Founder",
    preview: "Connection request sent",
    time: "1d",
    log: [{ kind: "sys", text: "Connection request sent" }],
  },
  {
    name: "Marco Silva",
    title: "Sales Director",
    preview: "Follow-up scheduled for Monday",
    time: "2d",
    log: [
      { kind: "sys", text: "Connection request accepted" },
      {
        kind: "you",
        text: "Curious how new AEs get their first meetings in the first 90 days.",
      },
      { kind: "sys", text: "Follow-up scheduled for Monday" },
    ],
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Face({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const src = FACE_SRC[name];
  return (
    <span className={`home-mock-face is-${size}`}>
      {src ? (
        <Image src={src} alt="" width={size === "sm" ? 28 : 36} height={size === "sm" ? 28 : 36} />
      ) : (
        initials(name)
      )}
    </span>
  );
}

function LinkedInMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/linkedin-in-mark.svg" alt="" className="home-mock-in" />
  );
}

function ScoreCell({ score }: { score: number }) {
  const tone = score < 60 ? " is-low" : score >= 85 ? " is-high" : "";
  return (
    <i className={`home-mock-scorecell${tone}`}>
      {score}
      <span className="home-mock-scorebar">
        <b style={{ width: `${score}%` }} />
      </span>
    </i>
  );
}

function FitRing({ score, low = false }: { score: number; low?: boolean }) {
  return (
    <span className={`home-mock-ring${low ? " is-low" : ""}`}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15.9" />
        <circle cx="18" cy="18" r="15.9" strokeDasharray={`${score} 100`} />
      </svg>
      <b>{score}</b>
    </span>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.5 6.5 5 9l4.5-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MatchList({ title }: { title: string }) {
  return (
    <ul className="home-mock-match">
      {MATCHES.map((row) => (
        <li key={row.label}>
          <CheckMark />
          {row.label}
          <b>{row.label === "Title" ? title : row.value}</b>
        </li>
      ))}
    </ul>
  );
}

function OutreachSteps({ status }: { status: (typeof LEADS)[number]["status"] }) {
  const inviteOn = status === "Invited";
  const inviteDone = status === "Messaged" || status === "Replied";
  const messageOn = status === "Messaged";
  const messageDone = status === "Replied";
  const repliedOn = status === "Replied";
  return (
    <ol className="home-mock-steps">
      <li className={inviteDone ? "is-done" : inviteOn ? "is-on" : undefined}>Invite sent</li>
      <li className={messageDone ? "is-done" : messageOn ? "is-on" : undefined}>Message sent</li>
      <li className={repliedOn ? "is-on" : undefined}>Replied</li>
    </ol>
  );
}

const SCAN_FACES = [
  "Priya Nair",
  "James Okonkwo",
  "Elena Voss",
  "Noah Berg",
  "Amina Rahman",
  "Chris Pell",
] as const;

function ScanStrip() {
  return (
    <div className="home-mock-scan">
      <span className="home-mock-scan-faces" aria-hidden="true">
        {SCAN_FACES.map((name) => (
          <Face key={name} name={name} size="sm" />
        ))}
        <span className="home-mock-scan-more">+2k</span>
      </span>
      <p>
        <b>2,184 profiles scanned</b>9 match who you sell to
      </p>
    </div>
  );
}

function Shell({
  page,
  title,
  action,
  search,
  compact,
  live,
  children,
}: {
  page: "overview" | "agents" | "messages" | "leads" | "product";
  title: string;
  action?: string;
  search?: string;
  compact?: boolean;
  live?: boolean;
  children: ReactNode;
}) {
  const active = page === "product" ? "" : page;
  return (
    <div className={`home-mock-app${compact ? " is-compact" : ""}${live ? " is-live" : ""}`}>
      {compact ? null : (
        <aside className="home-mock-rail">
          <p className="home-mock-brand">
            <LogoMark className="h-4 w-4" />
            Omentir
          </p>
          <ul>
            {NAV.map((item) => (
              <li key={item.id} className={item.id === active ? "is-on" : undefined}>
                {item.label}
              </li>
            ))}
          </ul>
          <p className={page === "product" ? "is-on" : undefined}>My Product</p>
        </aside>
      )}
      <div className="home-mock-stage">
        <header className="home-mock-top">
          <h3>{title}</h3>
          {search ? <p className="home-mock-search">{search}</p> : null}
          {action ? <span className="home-mock-btn">{action}</span> : null}
        </header>
        {children}
      </div>
    </div>
  );
}

export function MockProductScreen() {
  return (
    <Shell page="product" title="My Product" action="Save changes">
      <div className="home-mock-product">
        <div className="home-mock-fields">
          <label>
            <span>Company Name</span>
            <b>Harborline</b>
          </label>
          <label>
            <span>Website</span>
            <b>harborline.com</b>
          </label>
          <label>
            <span>Industry</span>
            <b>Software Development &amp; SaaS</b>
          </label>
          <label>
            <span>Company Size</span>
            <b>11 - 50 employees</b>
          </label>
          <label className="is-wide">
            <span>Company Description</span>
            <b>We help VP Sales fill AE pipeline from LinkedIn without an SDR team.</b>
          </label>
          <label className="is-wide">
            <span>Pain Points</span>
            <b>AE seats open, no SDR team, outbound lives in the founder&apos;s LinkedIn.</b>
          </label>
          <label className="is-wide">
            <span>Demo booking link</span>
            <b>calendly.com/you/20min</b>
          </label>
          <div className="home-mock-connected">
            <Face name="You" size="sm" />
            <span>
              <strong>
                Your LinkedIn
                <LinkedInMark />
              </strong>
              Invites and messages go out as you
            </span>
            <em>Connected</em>
          </div>
        </div>
        <aside className="home-mock-target">
          <p className="home-mock-kicker">Who you want</p>
          <ul className="home-mock-chips">
            {FILTERS.map((chip) => (
              <li key={chip}>{chip}</li>
            ))}
          </ul>
          <p className="home-mock-kicker">How people score against it</p>
          <ul className="home-mock-preview">
            <li>
              <Face name="Priya Nair" />
              <span>
                <strong>
                  Priya Nair
                  <LinkedInMark />
                </strong>
                Head of Growth
              </span>
              <FitRing score={94} />
            </li>
            <li>
              <Face name="Elena Voss" />
              <span>
                <strong>
                  Elena Voss
                  <LinkedInMark />
                </strong>
                VP Sales
              </span>
              <FitRing score={88} />
            </li>
            <li className="is-dim">
              <Face name="Chris Pell" />
              <span>
                <strong>Chris Pell</strong>
                Sales intern
              </span>
              <FitRing score={41} low />
            </li>
          </ul>
        </aside>
      </div>
    </Shell>
  );
}

function pickLeadKey(event: KeyboardEvent<HTMLLIElement>, pick: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    pick();
  }
}

export function MockLeadsScreen({
  filters = false,
  funnel = false,
  compact = false,
  interactive = false,
  groupName = "High-intent SaaS leaders",
}: {
  filters?: boolean;
  funnel?: boolean;
  compact?: boolean;
  interactive?: boolean;
  groupName?: string;
}) {
  const [selectedName, setSelectedName] = useState<(typeof LEADS)[number]["name"]>(LEADS[2].name);
  const selected = LEADS.find((lead) => lead.name === selectedName) ?? LEADS[2];
  return (
    <Shell page="leads" title="Leads" action="Add leads" compact={compact} live={interactive}>
      {funnel ? <ScanStrip /> : null}
      {filters ? (
        <ul className="home-mock-chips is-bar">
          {FILTERS.map((chip) => (
            <li key={chip}>{chip}</li>
          ))}
        </ul>
      ) : null}
      <div className="home-mock-tabs">
        <span>All contacts</span>
        <span className="is-on">{groupName}</span>
      </div>
      <div className="home-mock-split">
        <ul className="home-mock-people">
          {LEADS.map((lead) => {
            const on = lead.name === selected.name;
            const pick = interactive ? () => setSelectedName(lead.name) : undefined;
            return (
              <li
                key={lead.name}
                className={on ? "is-on" : lead.status === "Low fit" ? "is-dim" : undefined}
                role={pick ? "button" : undefined}
                tabIndex={pick ? 0 : undefined}
                aria-pressed={pick ? on : undefined}
                aria-label={pick ? `${lead.name}, ${lead.title}` : undefined}
                onClick={pick}
                onKeyDown={pick ? (event) => pickLeadKey(event, pick) : undefined}
              >
                <Face name={lead.name} />
                <span>
                  <strong>
                    {lead.name}
                    <LinkedInMark />
                  </strong>
                  {lead.title}
                </span>
                <ScoreCell score={lead.score} />
                <em data-status={lead.status}>{lead.status}</em>
              </li>
            );
          })}
        </ul>
        <div className="home-mock-detail is-fill">
          <div className="home-mock-person">
            <Face name={selected.name} />
            <div>
              <strong>
                {selected.name}
                <LinkedInMark />
              </strong>
              <p>{selected.title}</p>
            </div>
            <FitRing score={selected.score} low={selected.score < 60} />
          </div>
          <div className="home-mock-sect">
            <p className="home-mock-kicker">Why this score</p>
            <MatchList title={selected.title} />
          </div>
          <div className="home-mock-sect">
            <p className="home-mock-kicker">Outreach so far</p>
            <OutreachSteps status={selected.status} />
          </div>
          <p className="home-mock-note">Continue the thread in Messages.</p>
        </div>
      </div>
    </Shell>
  );
}

function ChatLog({ thread, focus }: { thread: Thread; focus: boolean }) {
  return (
    <div className="home-mock-log">
      <div className="home-mock-log-stack">
        {thread.log.map((event, index) => {
          if (event.kind === "sys") {
            if (event.focusOnly && !focus) return null;
            return (
              <p key={index} className="home-mock-sys">
                {event.text}
              </p>
            );
          }
          const you = event.kind === "you";
          return (
            <div key={index} className={`home-mock-line${you ? " is-you" : " is-them"}`}>
              {you ? null : <Face name={thread.name} size="sm" />}
              {you && focus && event.when ? (
                <time className="home-mock-when">{event.when}</time>
              ) : null}
              <p className="home-mock-bubble">{event.text}</p>
              {you ? <Face name="You" size="sm" /> : null}
              {!you && focus && event.when ? (
                <time className="home-mock-when">{event.when}</time>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InboxBody({
  booked,
  focus,
  tab,
  interactive = false,
}: {
  booked: boolean;
  focus: boolean;
  tab: "All" | "Meetings booked" | "Interested";
  interactive?: boolean;
}) {
  const threads = booked
    ? THREADS.map((thread) =>
        thread.name === "Elena Voss" ? { ...thread, booked: true } : thread,
      )
    : THREADS;
  const [selectedName, setSelectedName] = useState(threads[0].name);
  const selected = threads.find((thread) => thread.name === selectedName) ?? threads[0];
  const bookedCount = threads.filter((thread) => thread.booked).length;
  const interestedCount = threads.filter((thread) => thread.interested).length;

  return (
    <>
      <div className="home-mock-tabs">
        {(["All", "Meetings booked", "Interested"] as const).map((item) => (
          <span key={item} className={item === tab ? "is-on" : undefined}>
            {item}
            <b>
              {item === "All"
                ? threads.length
                : item === "Meetings booked"
                  ? bookedCount
                  : interestedCount}
            </b>
          </span>
        ))}
      </div>
      <div className={`home-mock-split is-inbox${focus ? " is-focus" : ""}`}>
        {focus ? null : (
          <div className="home-mock-threadcol">
            <ul className="home-mock-threads">
              {threads.map((thread) => {
                const on = thread.name === selected.name;
                const pick = interactive ? () => setSelectedName(thread.name) : undefined;
                return (
                  <li
                    key={thread.name}
                    className={on ? "is-on" : undefined}
                    role={pick ? "button" : undefined}
                    tabIndex={pick ? 0 : undefined}
                    aria-pressed={pick ? on : undefined}
                    aria-label={
                      pick
                        ? `${thread.name}, ${thread.title}${thread.booked ? ", meeting booked" : ""}`
                        : undefined
                    }
                    onClick={pick}
                    onKeyDown={pick ? (event) => pickLeadKey(event, pick) : undefined}
                  >
                    <Face name={thread.name} />
                    <span>
                      <strong>
                        {thread.name}
                        {thread.booked ? <em>Meeting booked</em> : null}
                      </strong>
                      {thread.title}
                      <small>{thread.preview}</small>
                    </span>
                    <time>{thread.time}</time>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="home-mock-chat">
          <header>
            <Face name={selected.name} />
            <div>
              <strong>
                {selected.name}
                <LinkedInMark />
                {selected.booked ? <em>Meeting booked</em> : null}
              </strong>
              <p>{selected.title}</p>
            </div>
          </header>
          <ChatLog key={selected.name} thread={selected} focus={focus} />
          <p className="home-mock-composer">Write a message</p>
        </div>
      </div>
    </>
  );
}

export function MockInboxScreen({
  booked = false,
  compact = false,
  focus = false,
  interactive = false,
}: {
  booked?: boolean;
  compact?: boolean;
  focus?: boolean;
  interactive?: boolean;
}) {
  return (
    <Shell
      page="messages"
      title="Messages"
      search={focus ? undefined : "Search conversations"}
      compact={compact}
      live={interactive}
    >
      <InboxBody booked={booked} focus={focus} tab="All" interactive={interactive} />
    </Shell>
  );
}

export function MockStealScreen({ compact = false }: { compact?: boolean }) {
  return (
    <Shell page="leads" title="Leads" action="Add leads" compact={compact}>
      <div className="home-mock-tabs">
        <span>All contacts</span>
        <span className="is-on">Latticeway commenters</span>
      </div>
      <div className="home-mock-split is-steal">
        <article className="home-mock-post">
          <p className="home-mock-kicker">Competitor post</p>
          <header>
            <Face name="Latticeway" />
            <span>
              <strong>Latticeway</strong>
              Company page
            </span>
          </header>
          <p>
            We just shipped the new AE onboarding track. Ramp still takes too long. What are you
            using for the first 10 hires?
          </p>
          <ul>
            <li className="is-on">
              <Face name="Elena Voss" size="sm" />
              <span>
                <strong>Elena Voss</strong>
                We are hiring AEs and the ramp is the hard part.
              </span>
            </li>
            <li>
              <Face name="Noah Berg" size="sm" />
              <span>
                <strong>Noah Berg</strong>
                Same bottleneck. Pipeline is the constraint.
              </span>
            </li>
            <li>
              <Face name="Amina Rahman" size="sm" />
              <span>
                <strong>Amina Rahman</strong>
                Same here. Ramp is the slow part for us too.
              </span>
            </li>
          </ul>
        </article>
        <div className="home-mock-detail is-fill">
          <div className="home-mock-person">
            <Face name="Elena Voss" />
            <div>
              <strong>
                Elena Voss
                <LinkedInMark />
              </strong>
              <p>VP Sales</p>
            </div>
            <FitRing score={88} />
          </div>
          <p className="home-mock-note">
            <strong>Post:</strong> We just shipped the new AE onboarding track. Ramp still takes too
            long.
          </p>
          <p className="home-mock-note">
            <strong>Their comment:</strong> We are hiring AEs and the ramp is the hard part.
          </p>
          <div className="home-mock-sect">
            <div className="home-mock-draft">
              <span>Draft, from your LinkedIn</span>
              Saw your comment on Latticeway&apos;s onboarding post. Open to 20 minutes?
            </div>
            <div className="home-mock-actions">
              <span className="home-mock-btn">Approve and send</span>
              <span className="home-mock-btn is-ghost">Edit draft</span>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
