"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";

// Copies of the app's other pages for the homepage demo window, with made-up
// data laid out like the real pages. Tabs, switches, rows and the reply box
// respond so people can poke around, but nothing is saved or sent anywhere.

export type DemoView =
  | "overview"
  | "agents"
  | "messages"
  | "leads"
  | "api"
  | "settings"
  | "workspace";

export type DemoFocus = { lead?: string; thread?: string; group?: GroupId };
export type DemoGo = (view: DemoView, focus?: DemoFocus) => void;

type GroupId = "saas" | "logistics" | "commenters";

const GROUPS: Array<{ id: GroupId; label: string; total: number }> = [
  { id: "saas", label: "SaaS founders in the US", total: 412 },
  { id: "logistics", label: "Heads of Sales at logistics companies", total: 230 },
  { id: "commenters", label: "People commenting on competitor posts", total: 48 },
];

export type Person = {
  name: string;
  role: string;
  avatar?: string;
  score: number;
  group: GroupId;
  // How far outreach got: 0 invited, 1 accepted, 2 messaged, 3 replied.
  stage: number;
  reason: string;
};

export const PEOPLE: Person[] = [
  {
    name: "Priya Nair",
    role: "Head of Growth at Northwind Freight",
    avatar: "priya-nair",
    score: 96,
    group: "logistics",
    stage: 3,
    reason: "Wrote a post about onboarding carriers by hand. Runs growth at a freight company in your target size.",
  },
  {
    name: "Elena Voss",
    role: "VP Sales at Cobalt Health",
    avatar: "elena-voss",
    score: 93,
    group: "saas",
    stage: 3,
    reason: "Title and company match the agent. Her team is hiring two AEs, so outbound volume is going up.",
  },
  {
    name: "James Okonkwo",
    role: "Founder at Brightpath Labs",
    avatar: "james-okonkwo",
    score: 91,
    group: "saas",
    stage: 3,
    reason: "Founder of a seed-stage SaaS company. Asked for tool recommendations in a founders thread.",
  },
  {
    name: "Amina Rahman",
    role: "Director of Sales at Tessellate",
    avatar: "amina-rahman",
    score: 88,
    group: "saas",
    stage: 3,
    reason: "Leads a sales team that is expanding into EMEA, and nobody owns outbound there yet.",
  },
  {
    name: "Noah Berg",
    role: "Sales Lead at Fernhill Capital",
    avatar: "noah-berg",
    score: 86,
    group: "commenters",
    stage: 3,
    reason: "Commented on a competitor's post asking how they handle LinkedIn limits.",
  },
  {
    name: "Chris Pell",
    role: "Head of Partnerships at Quayside",
    avatar: "chris-pell",
    score: 84,
    group: "commenters",
    stage: 3,
    reason: "Reacted to a competitor's post about outbound. Team size fits your best customers.",
  },
  {
    name: "Maya Lindqvist",
    role: "COO at Harlow Logistics",
    score: 83,
    group: "logistics",
    stage: 3,
    reason: "Runs sales and operations at a regional logistics company that just opened a second hub.",
  },
  {
    name: "Daniel Ortiz",
    role: "Founder at Tidewater Analytics",
    score: 81,
    group: "saas",
    stage: 3,
    reason: "Posted that most of their pipeline still comes from referrals and he wants a second channel.",
  },
  {
    name: "Sofia Marchetti",
    role: "Revenue Lead at Pinecrest",
    score: 79,
    group: "saas",
    stage: 3,
    reason: "Owns revenue at a 30-person SaaS company in your target market.",
  },
  {
    name: "Ravi Menon",
    role: "Head of Sales at Keel Systems",
    score: 77,
    group: "logistics",
    stage: 1,
    reason: "Accepted your invite this week. Sells software to shipping companies.",
  },
  {
    name: "Hannah Cole",
    role: "VP Business Development at Ardent Freight",
    score: 76,
    group: "logistics",
    stage: 2,
    reason: "Title matches the agent and the company is growing its sales team.",
  },
  {
    name: "Leo Tanaka",
    role: "Co-founder at Driftwood",
    score: 74,
    group: "commenters",
    stage: 0,
    reason: "Commented on a competitor's pricing post. Early-stage founder doing sales himself.",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function DemoFace({ person, size = 32 }: { person: Pick<Person, "name" | "avatar">; size?: number }) {
  if (person.avatar) {
    return (
      <Image
        src={`/home-mock/${person.avatar}.jpg`}
        alt=""
        width={size}
        height={size}
        className="hero-dash-face"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className="hero-dash-face hero-dash-initials" style={{ width: size, height: size }}>
      {initials(person.name)}
    </span>
  );
}

function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="hero-dash-page-head">
      <h2 className="hero-dash-page-title">{title}</h2>
      {children ? <div className="hero-dash-toolbar-actions">{children}</div> : null}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 translate-x-px" fill="currentColor" aria-hidden="true">
      <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" />
    </svg>
  );
}

function SearchBox({ placeholder }: { placeholder: string }) {
  return (
    <span className="hero-dash-field hero-dash-search">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      {placeholder}
    </span>
  );
}

function Toggle({ on, label, onChange }: { on: boolean; label?: string; onChange?: () => void }) {
  if (!onChange) return <span className={`hero-dash-toggle${on ? " is-on" : ""}`} aria-hidden="true" />;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`hero-dash-toggle${on ? " is-on" : ""}`}
      onClick={onChange}
    />
  );
}

function Tabs<T extends string>({
  items,
  value,
  onChange,
  plain,
}: {
  items: Array<{ id: T; label: string; count?: number }>;
  value: T;
  onChange: (id: T) => void;
  plain?: boolean;
}) {
  return (
    <div className={`hero-dash-tabs${plain ? " is-plain" : ""}`} role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === value}
          className={item.id === value ? "is-on" : undefined}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          {item.count !== undefined ? <b>{item.count}</b> : null}
        </button>
      ))}
    </div>
  );
}

/* ── AI Agents ───────────────────────────────────────────────────────── */

const AGENTS: Array<{
  name: string;
  group: GroupId;
  on: boolean;
  activeNote: [string, string];
  stats: Array<[string, string, string, string]>;
  meta: string;
  created: string;
}> = [
  {
    name: "SaaS founders in the US",
    group: "saas",
    on: true,
    activeNote: ["Sending:", "Next connection request today at 10:40 AM."],
    stats: [
      ["Contacted", "186", "/ 412", "45% contacted"],
      ["Accepted", "64", "", "34% accept rate"],
      ["Messaged", "58", "", "total messaged"],
      ["Replied", "17", "", "29% reply rate"],
    ],
    meta: "Founders and CEOs, 11-50 employees",
    created: "Created Aug 12",
  },
  {
    name: "Heads of Sales at logistics companies",
    group: "logistics",
    on: true,
    activeNote: ["Finding leads:", "Next lead search today at 9:00 AM."],
    stats: [
      ["Contacted", "75", "/ 230", "33% contacted"],
      ["Accepted", "22", "", "29% accept rate"],
      ["Messaged", "19", "", "total messaged"],
      ["Replied", "6", "", "32% reply rate"],
    ],
    meta: "Sales leaders in freight and logistics",
    created: "Created Aug 30",
  },
  {
    name: "People commenting on competitor posts",
    group: "commenters",
    on: false,
    activeNote: ["Sending:", "Next connection request today at 11:15 AM."],
    stats: [
      ["Contacted", "21", "/ 48", "44% contacted"],
      ["Accepted", "9", "", "43% accept rate"],
      ["Messaged", "8", "", "total messaged"],
      ["Replied", "3", "", "38% reply rate"],
    ],
    meta: "Steal customers",
    created: "Created Sep 9",
  },
];

export function AgentsScreen({ go }: { go: DemoGo }) {
  const [on, setOn] = useState(() => AGENTS.map((agent) => agent.on));
  return (
    <>
      <PageHeader title="AI Agents">
        <span className="hero-dash-btn">
          <PlusIcon />
          Create an agent
        </span>
      </PageHeader>
      {AGENTS.map((agent, index) => {
        const active = on[index];
        return (
          <div key={agent.name} className="hero-dash-card hero-dash-agent">
            <div className="hero-dash-agent-head">
              <p className="hero-dash-strong">{agent.name}</p>
              <span className={`hero-dash-pill${active ? " is-good" : ""}`}>
                {active ? <i aria-hidden="true" /> : null}
                {active ? "Active" : "Paused"}
              </span>
              <span className="ml-auto">
                <Toggle
                  on={active}
                  label={`${active ? "Pause" : "Resume"} ${agent.name}`}
                  onChange={() =>
                    setOn((current) => current.map((value, i) => (i === index ? !value : value)))
                  }
                />
              </span>
            </div>
            <p className="hero-dash-sub hero-dash-agent-note">
              {active ? (
                <>
                  <b className="is-good">{agent.activeNote[0]}</b> {agent.activeNote[1]}
                </>
              ) : (
                <>
                  <b>Paused:</b> You paused this agent. Nothing sends until you turn it back on.
                </>
              )}
            </p>
            <div className="hero-dash-agent-stats">
              {agent.stats.map(([label, value, total, caption]) => (
                <div key={label}>
                  <p className="hero-dash-eyebrow">{label}</p>
                  <p className="hero-dash-agent-value">
                    {value}
                    {total ? <span> {total}</span> : null}
                  </p>
                  <p className="hero-dash-caption">{caption}</p>
                </div>
              ))}
            </div>
            <div className="hero-dash-agent-foot">
              <span className="hero-dash-caption">
                {agent.meta} · {agent.created}
              </span>
              <span className="hero-dash-toolbar-actions">
                <button
                  type="button"
                  className="hero-dash-btn"
                  onClick={() => go("leads", { group: agent.group })}
                >
                  View leads
                </button>
                <span className="hero-dash-btn">Edit</span>
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ── Messages ────────────────────────────────────────────────────────── */

type Line = { from: "you" | "them"; text: string; when: string };
type ThreadCategory = "successful" | "interested" | "follow" | "denied";

export type DemoThread = {
  person: Person;
  when: string;
  unread?: boolean;
  booked?: boolean;
  category: ThreadCategory;
  lines: Line[];
};

function person(name: string) {
  const found = PEOPLE.find((item) => item.name === name);
  if (!found) throw new Error(`Unknown demo person: ${name}`);
  return found;
}

export const THREADS: DemoThread[] = [
  {
    person: person("Elena Voss"),
    when: "2h",
    unread: true,
    category: "interested",
    lines: [
      { from: "you", when: "Sep 22", text: "Hi Elena, saw your team is hiring two more AEs. Are you still sourcing outbound pipeline by hand, or do you have something running on LinkedIn?" },
      { from: "them", when: "Sep 23", text: "Mostly by hand, honestly. Our SDR spends half the day on it." },
      { from: "you", when: "Sep 23", text: "That is the part we take off her plate. Happy to show you how it looks on your account. Would a 20 minute call work?" },
      { from: "them", when: "2h", text: "Sure, send over a time next week. Tuesday works best for me." },
    ],
  },
  {
    person: person("Maya Lindqvist"),
    when: "4h",
    unread: true,
    booked: true,
    category: "successful",
    lines: [
      { from: "you", when: "Sep 21", text: "Hi Maya, congrats on the new hub in Gothenburg. Who is filling the pipeline for it?" },
      { from: "them", when: "Sep 22", text: "Mostly me, which is the problem. What do you have in mind?" },
      { from: "you", when: "Sep 22", text: "Here is a 20 minute slot to walk through it: cal.com/harborline/intro" },
      { from: "them", when: "4h", text: "Booked Thursday at 2pm. Invite accepted on my side too." },
    ],
  },
  {
    person: person("James Okonkwo"),
    when: "5h",
    unread: true,
    category: "interested",
    lines: [
      { from: "you", when: "Sep 24", text: "Hi James, congrats on the seed round. How are you finding your first customers right now?" },
      { from: "them", when: "5h", text: "We are looking at tools for this right now. What does it cost for 3 seats?" },
    ],
  },
  {
    person: person("Priya Nair"),
    when: "1d",
    booked: true,
    category: "successful",
    lines: [
      { from: "you", when: "Sep 20", text: "Hi Priya, your post about carrier onboarding was spot on. Do you also own outbound at Northwind?" },
      { from: "them", when: "Sep 21", text: "I do. We have been meaning to fix how we prospect shippers." },
      { from: "you", when: "Sep 21", text: "Here is my calendar if you want to walk through it: cal.com/harborline/intro" },
      { from: "them", when: "1d", text: "Booked for Thursday. Talk then." },
    ],
  },
  {
    person: person("Daniel Ortiz"),
    when: "1d",
    booked: true,
    category: "successful",
    lines: [
      { from: "you", when: "Sep 23", text: "Hi Daniel, saw your post about referrals drying up. Want to see what a steady LinkedIn channel looks like for a team your size?" },
      { from: "them", when: "1d", text: "Yes. Grabbed the Monday 11am slot on your calendar." },
    ],
  },
  {
    person: person("Amina Rahman"),
    when: "1d",
    category: "interested",
    lines: [
      { from: "you", when: "Sep 23", text: "Hi Amina, saw Tessellate is expanding into EMEA. Who handles outbound for the new region?" },
      { from: "them", when: "1d", text: "Happy to take a look. Do you have a short demo I can watch first?" },
    ],
  },
  {
    person: person("Chris Pell"),
    when: "3d",
    category: "follow",
    lines: [
      { from: "you", when: "Sep 22", text: "Hi Chris, thanks for connecting. Are partner intros or direct outbound bigger for you this quarter?" },
      { from: "them", when: "3d", text: "Partner intros for now, but ask me again in January." },
    ],
  },
  {
    person: person("Noah Berg"),
    when: "4d",
    category: "follow",
    lines: [
      { from: "you", when: "Sep 19", text: "Hi Noah, saw your question about LinkedIn limits. We keep every account under them by default. Want to see how?" },
      { from: "them", when: "4d", text: "Interesting. We are mid planning cycle, can you circle back in two weeks?" },
    ],
  },
  {
    person: person("Sofia Marchetti"),
    when: "5d",
    category: "denied",
    lines: [
      { from: "you", when: "Sep 18", text: "Hi Sofia, how is Pinecrest filling pipeline this year?" },
      { from: "them", when: "5d", text: "Thanks, but we just signed with another vendor. Not a fit right now." },
    ],
  },
];

type MessageTab = "all" | ThreadCategory | "booked";

const MESSAGE_TABS: Array<{ id: MessageTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "successful", label: "Successful" },
  { id: "booked", label: "Meetings booked" },
  { id: "interested", label: "Interested" },
  { id: "follow", label: "Needs a follow up" },
  { id: "denied", label: "Denied" },
];

function inTab(thread: DemoThread, tab: MessageTab) {
  if (tab === "all") return true;
  if (tab === "booked") return Boolean(thread.booked);
  return thread.category === tab;
}

export function MessagesScreen({ focus }: { focus?: string }) {
  const [tab, setTab] = useState<MessageTab>("all");
  const [selected, setSelected] = useState(focus || THREADS[0].person.name);
  const [open, setOpen] = useState(Boolean(focus));
  const [sent, setSent] = useState<Record<string, Line[]>>({});
  const [draft, setDraft] = useState("");
  const visible = THREADS.filter((thread) => inTab(thread, tab));
  const thread =
    visible.find((item) => item.person.name === selected) ?? visible[0] ?? THREADS[0];
  const lines = [...thread.lines, ...(sent[thread.person.name] || [])];
  const chatRef = useRef<HTMLDivElement>(null);

  // Open on the newest message, and follow new ones, like the real inbox.
  useEffect(() => {
    const node = chatRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [thread, lines.length, open]);

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSent((current) => ({
      ...current,
      [thread.person.name]: [...(current[thread.person.name] || []), { from: "you", text, when: "now" }],
    }));
    setDraft("");
  }

  return (
    <div className="hero-dash-messages">
      <PageHeader title="Messages">
        <SearchBox placeholder="Search conversations" />
      </PageHeader>
      <Tabs
        items={MESSAGE_TABS.map((item) => ({
          ...item,
          count: THREADS.filter((thread) => inTab(thread, item.id)).length,
        }))}
        value={tab}
        onChange={(next) => {
          setTab(next);
          setOpen(false);
        }}
      />
      <div className="hero-dash-card hero-dash-split" data-open={open || undefined}>
        <div className="hero-dash-split-list">
          <p className="hero-dash-eyebrow hero-dash-split-head">Inbox</p>
          {visible.map((item) => {
            const last = [...item.lines, ...(sent[item.person.name] || [])].at(-1);
            return (
              <button
                key={item.person.name}
                type="button"
                className={`hero-dash-thread${item === thread ? " is-on" : ""}`}
                onClick={() => {
                  setSelected(item.person.name);
                  setOpen(true);
                }}
              >
                <DemoFace person={item.person} />
                <span className="min-w-0 flex-1">
                  <span className="hero-dash-thread-top">
                    <span className="hero-dash-strong truncate">{item.person.name}</span>
                    <span className="hero-dash-caption">{item.when}</span>
                  </span>
                  <span className="hero-dash-sub block truncate">{item.person.role}</span>
                  <span className="hero-dash-body block truncate">
                    {last?.from === "you" ? "You: " : ""}
                    {last?.text}
                  </span>
                  {item.unread || item.booked ? (
                    <span className="hero-dash-pills">
                      {item.unread ? <span className="hero-dash-pill is-hot">Unread</span> : null}
                      {item.booked ? <span className="hero-dash-pill is-good">Meeting booked</span> : null}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
        <div className="hero-dash-split-detail">
          <div className="hero-dash-chat-head">
            <button type="button" className="hero-dash-back" onClick={() => setOpen(false)}>
              Back
            </button>
            <DemoFace person={thread.person} />
            <div className="min-w-0 flex-1">
              <p className="hero-dash-strong">
                {thread.person.name}
                {thread.booked ? <span className="hero-dash-pill is-good ml-2">Meeting booked</span> : null}
              </p>
              <p className="hero-dash-sub truncate">{thread.person.role}</p>
            </div>
          </div>
          <div ref={chatRef} className="hero-dash-chat">
            {lines.map((line, index) => (
              <div key={index} className={`hero-dash-bubble-row${line.from === "you" ? " is-you" : ""}`}>
                {line.from === "them" ? <DemoFace person={thread.person} size={24} /> : null}
                <div className="hero-dash-bubble">
                  {line.text}
                  <span className="hero-dash-caption block">{line.when}</span>
                </div>
              </div>
            ))}
          </div>
          <form className="hero-dash-composer" onSubmit={send}>
            <input
              className="hero-dash-field hero-dash-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Reply to ${thread.person.name}...`}
              aria-label={`Reply to ${thread.person.name} (demo, nothing is sent)`}
            />
            <button type="submit" className="hero-dash-send" aria-label="Send" disabled={!draft.trim()}>
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Leads ───────────────────────────────────────────────────────────── */

const STEPS = ["Invited", "Accepted", "Messaged", "Replied"];

export function LeadsScreen({ focus, group }: { focus?: string; group?: GroupId }) {
  const [tab, setTab] = useState<"all" | GroupId>(group || "all");
  const [selected, setSelected] = useState(focus || PEOPLE[0].name);
  const [open, setOpen] = useState(Boolean(focus));
  const visible = PEOPLE.filter((item) => tab === "all" || item.group === tab);
  const lead = visible.find((item) => item.name === selected) ?? visible[0];
  const total =
    tab === "all"
      ? GROUPS.reduce((sum, item) => sum + item.total, 0)
      : GROUPS.find((item) => item.id === tab)?.total || visible.length;
  const replied = lead.stage >= 3;

  return (
    <div className="hero-dash-leads">
      <PageHeader title="Leads">
        <span className="hero-dash-btn">
          <PlusIcon />
          Add leads
        </span>
        <SearchBox placeholder="Search leads" />
      </PageHeader>
      <Tabs
        items={[{ id: "all" as const, label: "All contacts" }, ...GROUPS]}
        value={tab}
        onChange={(next) => {
          setTab(next);
          setOpen(false);
        }}
      />
      <div className="hero-dash-card hero-dash-split" data-open={open || undefined}>
        <div className="hero-dash-split-list">
          <p className="hero-dash-eyebrow hero-dash-split-head">Contact</p>
          {visible.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`hero-dash-thread is-row${item === lead ? " is-on" : ""}`}
              onClick={() => {
                setSelected(item.name);
                setOpen(true);
              }}
            >
              <span className="hero-dash-check" aria-hidden="true" />
              <DemoFace person={item} />
              <span className="min-w-0 flex-1">
                <span className="hero-dash-strong block truncate">{item.name}</span>
                <span className="hero-dash-sub block truncate">{item.role}</span>
              </span>
              <span className="hero-dash-score">{item.score}</span>
            </button>
          ))}
          <p className="hero-dash-caption hero-dash-split-foot">
            1-{visible.length} of {total.toLocaleString("en-US")}
          </p>
        </div>
        <div className="hero-dash-split-detail hero-dash-lead">
          <div className="hero-dash-chat-head">
            <button type="button" className="hero-dash-back" onClick={() => setOpen(false)}>
              Back
            </button>
            <DemoFace person={lead} size={40} />
            <div className="min-w-0">
              <p className="hero-dash-strong">
                {lead.name} <span className="hero-dash-caption">Fit {lead.score}</span>
              </p>
              <p className="hero-dash-sub truncate">{lead.role}</p>
            </div>
          </div>
          <div className="hero-dash-lead-body">
            <p className="hero-dash-eyebrow">Why they&apos;re a lead</p>
            <p className="hero-dash-body is-full">{lead.reason}</p>
            <p className="hero-dash-eyebrow mt-5">Progress</p>
            <div className="hero-dash-progress">
              {STEPS.map((step, index) => (
                <div key={step} className={index <= lead.stage ? "is-done" : undefined}>
                  <span />
                  {step}
                </div>
              ))}
            </div>
            <div className="hero-dash-steps">
              {[
                ["Connection request", "Sent Sep 18"],
                ["Message 1", lead.stage >= 2 ? "Sent Sep 21" : "Sends after they accept"],
                ["Message 2", replied ? "Stopped: they replied" : "3 days after message 1"],
              ].map(([title, detail]) => (
                <div key={title}>
                  <p className="hero-dash-strong">{title}</p>
                  <p className="hero-dash-sub">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── API ─────────────────────────────────────────────────────────────── */

const CONNECT_GUIDES = [
  {
    id: "chat",
    label: "Claude, ChatGPT, Grok and other chat apps",
    lead: "Paste one URL and sign in. These apps have no place to put an API key.",
    steps: [
      "In Claude: Settings, then Connectors, then Add custom connector. Paste this URL:",
      "https://omentir.com/api/agent/v1/mcp",
      "The app sends you to Omentir. Sign in and choose the workspace to connect.",
      "Back in the app, ask \"what's my Omentir context?\" to confirm it works.",
    ],
  },
  {
    id: "code",
    label: "Claude Code, Cursor and other MCP clients",
    lead: "Clients that support headers keep your key out of the URL.",
    steps: [
      "Add Omentir to the client's MCP config (Cursor: Settings, then MCP):",
      '"omentir": { "url": "https://omentir.com/api/agent/v1/mcp", "headers": { "Authorization": "Bearer <your-key>" } }',
      "Reload the client, then ask it to run get_context.",
      "A reply with your workspace details means you're connected.",
    ],
  },
];

export function ApiScreen() {
  const [guide, setGuide] = useState(CONNECT_GUIDES[0].id);
  const active = CONNECT_GUIDES.find((item) => item.id === guide) ?? CONNECT_GUIDES[0];
  return (
    <>
      <PageHeader title="API" />
      <section className="hero-dash-section">
        <h3 className="hero-dash-section-title">API keys</h3>
        <p className="hero-dash-sub">Connect Omentir to your favorite AI app.</p>
        <p className="hero-dash-label mt-4">Key label</p>
        <div className="hero-dash-inline">
          <span className="hero-dash-field flex-1">Claude, Hermes, my-script...</span>
          <span className="hero-dash-btn">Create</span>
        </div>
        <div className="hero-dash-card mt-3">
          {[
            ["Claude", "Created Sep 12 · Last used 2h ago"],
            ["Cursor", "Created Sep 3 · Last used yesterday"],
          ].map(([name, detail]) => (
            <div key={name} className="hero-dash-row">
              <div className="min-w-0 flex-1">
                <p className="hero-dash-strong">{name}</p>
                <p className="hero-dash-sub">{detail}</p>
              </div>
              <span className="hero-dash-btn">Revoke</span>
            </div>
          ))}
        </div>
      </section>
      <section className="hero-dash-section">
        <h3 className="hero-dash-section-title">How to connect</h3>
        <p className="hero-dash-sub">Create a key above, then pick the app you&apos;re connecting.</p>
        <div className="hero-dash-seg mt-3">
          {CONNECT_GUIDES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === guide ? "is-on" : undefined}
              aria-pressed={item.id === guide}
              onClick={() => setGuide(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="hero-dash-card mt-3">
          <p className="hero-dash-strong">{active.label}</p>
          <p className="hero-dash-sub">{active.lead}</p>
          <ol className="hero-dash-numbered">
            {active.steps.map((step, index) => (
              <li key={step} className={index === 1 ? "is-code" : undefined}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

/* ── Settings ────────────────────────────────────────────────────────── */

function Field({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div>
      <p className="hero-dash-label">{label}</p>
      <span className="hero-dash-field">
        <span className="flex-1 truncate">{value}</span>
        {suffix ? <span className="hero-dash-caption">{suffix}</span> : null}
      </span>
    </div>
  );
}

type SettingsTab = "profile" | "accounts" | "subscription";

export function SettingsScreen() {
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [appearance, setAppearance] = useState("System");
  const [followUp, setFollowUp] = useState(true);
  const [digest, setDigest] = useState(true);
  return (
    <>
      <PageHeader title="Settings">
        <span className="hero-dash-btn">Save settings</span>
      </PageHeader>
      <Tabs
        plain
        items={[
          { id: "profile" as const, label: "Profile" },
          { id: "accounts" as const, label: "Connected Accounts" },
          { id: "subscription" as const, label: "Subscription" },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "profile" ? (
        <>
          <section className="hero-dash-section">
            <h3 className="hero-dash-section-title">Profile</h3>
            <p className="hero-dash-sub">Your personal information and workspace preferences.</p>
            <div className="hero-dash-card hero-dash-profile">
              <DemoFace person={{ name: "Alex Morgan", avatar: "you" }} size={36} />
              <div>
                <p className="hero-dash-strong">Alex Morgan</p>
                <p className="hero-dash-sub">alex@example.com</p>
              </div>
            </div>
            <div className="hero-dash-form">
              <Field label="Language" value="English" />
              <Field label="Time zone" value="(GMT-4:00) America/New_York" />
            </div>
          </section>
          <section className="hero-dash-section">
            <h3 className="hero-dash-section-title">Appearance</h3>
            <p className="hero-dash-sub">Pick light or dark, or match your device.</p>
            <div className="hero-dash-seg mt-3">
              {["System", "Light", "Dark"].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={option === appearance ? "is-on" : undefined}
                  aria-pressed={option === appearance}
                  onClick={() => setAppearance(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>
          <section className="hero-dash-section">
            <h3 className="hero-dash-section-title">Automation limits</h3>
            <p className="hero-dash-sub">Control how fast your agents and campaigns reach out.</p>
            <div className="hero-dash-form">
              <Field label="Daily connection invites" value="25" suffix="invites / day" />
              <Field label="Daily messages" value="40" suffix="messages / day" />
              <Field label="First message delay" value="1" suffix="hours after connect" />
            </div>
            <div className="hero-dash-setting">
              <div>
                <p className="hero-dash-strong">AI follow-up</p>
                <p className="hero-dash-sub">Let AI write follow-up messages when no reply has come in.</p>
              </div>
              <Toggle on={followUp} label="AI follow-up" onChange={() => setFollowUp((value) => !value)} />
            </div>
            <div className="hero-dash-setting">
              <div>
                <p className="hero-dash-strong">Daily summary email</p>
                <p className="hero-dash-sub">One email a day with new replies and booked meetings.</p>
              </div>
              <Toggle on={digest} label="Daily summary email" onChange={() => setDigest((value) => !value)} />
            </div>
          </section>
        </>
      ) : null}
      {tab === "accounts" ? (
        <section className="hero-dash-section">
          <h3 className="hero-dash-section-title">LinkedIn accounts</h3>
          <p className="hero-dash-sub">Invites and messages go out from these accounts.</p>
          <div className="hero-dash-card mt-3">
            <div className="hero-dash-row">
              <DemoFace person={{ name: "Alex Morgan", avatar: "you" }} />
              <div className="min-w-0 flex-1">
                <p className="hero-dash-strong">
                  Alex Morgan <span className="hero-dash-pill is-good ml-1">Connected</span>
                </p>
                <p className="hero-dash-sub">86 of 100 weekly invites used · Account health: good</p>
              </div>
              <span className="hero-dash-btn">Disconnect</span>
            </div>
          </div>
          <span className="hero-dash-btn mt-3">
            <PlusIcon />
            Connect another account
          </span>
        </section>
      ) : null}
      {tab === "subscription" ? (
        <section className="hero-dash-section">
          <h3 className="hero-dash-section-title">Subscription</h3>
          <p className="hero-dash-sub">Your plan and billing.</p>
          <div className="hero-dash-card mt-3">
            <div className="hero-dash-row">
              <div className="min-w-0 flex-1">
                <p className="hero-dash-strong">
                  Pro <span className="hero-dash-pill is-good ml-1">Active</span>
                </p>
                <p className="hero-dash-sub">$49/month · 1 LinkedIn account · Renews Oct 26</p>
              </div>
              <span className="hero-dash-btn">Manage billing</span>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

/* ── Workspace ───────────────────────────────────────────────────────── */

export function WorkspaceScreen() {
  return (
    <>
      <PageHeader title="Workspace">
        <span className="hero-dash-btn">Save changes</span>
      </PageHeader>
      <section className="hero-dash-section">
        <h3 className="hero-dash-section-title">Company information</h3>
        <p className="hero-dash-sub">
          These details power outreach from this workspace. Update them when the offer changes.
        </p>
        <div className="hero-dash-form">
          <Field label="Company name" value="Harborline" />
          <Field label="Website" value="harborline.com" />
          <Field label="Industry" value="Software Development & SaaS" />
          <Field label="Company size" value="11-50 employees" />
          <Field label="Average ticket size" value="$ 600" />
        </div>
        <p className="hero-dash-label mt-4">Company description</p>
        <p className="hero-dash-field is-text">
          Harborline helps B2B sales teams book more first calls on LinkedIn. It finds people who match
          your best customers, writes the first message, and follows up until they reply.
        </p>
        <p className="hero-dash-label mt-4">Pain points</p>
        <p className="hero-dash-field is-text">
          Small sales teams spend hours finding leads and writing messages by hand. Cold email reply rates
          keep dropping, and hiring another SDR costs more than the pipeline it adds.
        </p>
        <p className="hero-dash-label mt-4">Demo booking link</p>
        <span className="hero-dash-field">https://cal.com/harborline/intro</span>
      </section>
    </>
  );
}
