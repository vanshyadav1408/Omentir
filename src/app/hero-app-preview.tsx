"use client";

import { useState } from "react";
import AnalysisChart from "./analysis-chart";
import ActivityHeatmap from "./(app)/overview/activity-heatmap";
import { LogoGlyph } from "./logo-mark";
import type { ActivityDay } from "@/lib/server/types";
import {
  AgentsScreen,
  ApiScreen,
  DemoFace,
  LeadsScreen,
  MessagesScreen,
  PEOPLE,
  SettingsScreen,
  THREADS,
  WorkspaceScreen,
  type DemoFocus,
  type DemoGo,
  type DemoView,
} from "./hero-app-screens";

// A copy of the logged-in app for the homepage hero, fed made-up numbers. The
// sidebar switches between copies of each page (the Overview uses the app's
// own chart and heatmap components). Nothing saves or sends; the main pane
// scrolls so every page can be seen in full.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const HISTORY_DAYS = 170;
const DEAL_SIZE = 600;

type View = DemoView;

const RANGES = [
  { key: "7d", label: "7d", caption: "Last 7 days", days: 7 },
  { key: "30d", label: "30d", caption: "Last 30 days", days: 30 },
  { key: "3m", label: "3m", caption: "Last 3 months", days: 90 },
  { key: "month", label: "MTD", caption: "This month", days: 0 },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

const NAV: Array<{ id: View; label: string; icon: string }> = [
  { id: "overview", label: "Overview", icon: "apps" },
  { id: "agents", label: "AI Agents", icon: "model_training" },
  { id: "messages", label: "Messages", icon: "inbox" },
  { id: "leads", label: "Leads", icon: "identity_platform" },
];

const BOTTOM_NAV: Array<{ id: View; label: string; icon: string }> = [
  { id: "api", label: "API", icon: "key" },
  { id: "settings", label: "Settings", icon: "settings" },
];

// Overview lists come from the same demo people and conversations as the
// Leads and Messages pages, so clicking a row opens that exact record.
const HOT_LEADS = PEOPLE.slice(0, 5);
const REPLIES = THREADS.filter((thread) => thread.lines.at(-1)?.from === "them").slice(0, 4);

function addDays(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function shortDate(key: string) {
  const [, month, day] = key.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}`;
}

// Stable pseudo-random value in [0, 1) per day and field, so the numbers look
// organic but come out identical on the server and in the browser.
function noise(key: string, salt: number) {
  let hash = 2166136261 ^ salt;
  for (let i = 0; i < key.length; i += 1) {
    hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function demoActivityDays(todayKey: string): ActivityDay[] {
  const days: ActivityDay[] = [];
  for (let back = HISTORY_DAYS; back >= 0; back -= 1) {
    const key = addDays(todayKey, -back);
    const weekday = new Date(`${key}T00:00:00Z`).getUTCDay();
    // Outreach ramps up over the first two months, and weekends stay quiet.
    const ramp = Math.min(1, 0.25 + (HISTORY_DAYS - back) / 70);
    const pace = (weekday === 0 ? 0.08 : weekday === 6 ? 0.2 : 1) * ramp;
    if (noise(key, 7) > 0.93) continue;
    days.push({
      id: `demo-${key}`,
      workspaceId: "demo",
      day: key,
      found: Math.round((9 + noise(key, 1) * 16) * pace),
      contacted: Math.round((7 + noise(key, 2) * 12) * pace),
      // Meetings stay below replies: every booking starts as a reply.
      replies: Math.round((3 + noise(key, 3) * 6) * pace),
      meetingsBooked: Math.round((1 + noise(key, 4) * 3.5) * pace),
      updatedAt: `${key}T00:00:00.000Z`,
    });
  }
  return days;
}

function Icon({ name }: { name: string }) {
  return (
    <span className="material-symbols-outlined hero-dash-icon" aria-hidden="true">
      {name}
    </span>
  );
}

function OverviewScreen({ todayKey, go }: { todayKey: string; go: DemoGo }) {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const range = RANGES.find((option) => option.key === rangeKey) ?? RANGES[1];
  const activityDays = demoActivityDays(todayKey);
  const rangeStart =
    range.key === "month" ? `${todayKey.slice(0, 8)}01` : addDays(todayKey, -(range.days - 1));
  const rangeDays = range.key === "month" ? Number(todayKey.slice(8, 10)) : range.days;
  const inRange = activityDays.filter((day) => day.day >= rangeStart);
  const invitations = inRange.reduce((sum, day) => sum + Number(day.contacted || 0), 0);
  const messages = Math.round(invitations * 0.56);
  const accepted = Math.round(invitations * 0.31);
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <>
      <div className="hero-dash-toolbar">
        <p>
          {shortDate(rangeStart)} - {shortDate(todayKey)}
        </p>
        <div className="hero-dash-toolbar-actions">
          <div className="hero-dash-seg" role="group" aria-label="Date range">
            {RANGES.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={option.key === range.key}
                className={option.key === range.key ? "is-on" : undefined}
                onClick={() => setRangeKey(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button type="button" className="hero-dash-btn is-filled" onClick={() => go("agents")}>
            New agent
          </button>
        </div>
      </div>

      <div className="hero-dash-stats">
        <div className="hero-dash-card">
          <p className="hero-dash-label">Hot opportunities</p>
          <p className="hero-dash-value">128</p>
        </div>
        <div className="hero-dash-card">
          <p className="hero-dash-label">Invitations sent</p>
          <p className="hero-dash-value">{invitations.toLocaleString("en-US")}</p>
          <p className="hero-dash-caption">{range.caption}</p>
        </div>
        <div className="hero-dash-card">
          <p className="hero-dash-label">Messages sent</p>
          <p className="hero-dash-value">{messages.toLocaleString("en-US")}</p>
          <p className="hero-dash-caption">{range.caption}</p>
        </div>
        <div className="hero-dash-card">
          <p className="hero-dash-label">Pipeline</p>
          <p className="hero-dash-value">{money.format(accepted * DEAL_SIZE)}</p>
          <p className="hero-dash-caption">{accepted} accepted connections</p>
        </div>
      </div>

      <div className="hero-dash-card hero-dash-panel">
        <h2 className="hero-dash-title">Your activity</h2>
        <p className="hero-dash-sub">Leads, outreach, and replies for this range.</p>
        <div className="mt-4">
          <AnalysisChart
            leads={[]}
            conversations={[]}
            enrollments={[]}
            activityDays={activityDays}
            maxDays={rangeDays}
            startDateKey={rangeStart}
            endDateKey={todayKey}
          />
        </div>
      </div>

      <div className="hero-dash-card hero-dash-connect">
        <span className="hero-dash-connect-icon">
          <Icon name="smart_toy" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="hero-dash-strong">Connect an AI app</p>
          <p className="hero-dash-sub">
            Claude, ChatGPT, and Cursor can run this workspace from chat.
          </p>
        </div>
        <button type="button" className="hero-dash-btn" onClick={() => go("api")}>
          Connect
        </button>
      </div>

      <div className="hero-dash-card hero-dash-panel">
        <p className="hero-dash-label">Outreach</p>
        <p className="hero-dash-value">
          {activityDays
            .reduce(
              (sum, day) =>
                sum +
                Number(day.found || 0) +
                Number(day.contacted || 0) +
                Number(day.replies || 0) +
                Number(day.meetingsBooked || 0),
              0,
            )
            .toLocaleString("en-US")}
        </p>
        <div className="mt-4 min-w-0">
          <ActivityHeatmap days={activityDays} todayKey={todayKey} />
        </div>
      </div>

      <div className="hero-dash-lists">
        <div className="hero-dash-card hero-dash-list">
          <div className="hero-dash-list-head">
            <span>Hot leads</span>
            <button type="button" className="hero-dash-btn" onClick={() => go("leads")}>
              View all
            </button>
          </div>
          {HOT_LEADS.map((lead) => (
            <button
              key={lead.name}
              type="button"
              className="hero-dash-row is-button"
              onClick={() => go("leads", { lead: lead.name })}
            >
              <DemoFace person={lead} />
              <span className="min-w-0 flex-1">
                <span className="hero-dash-strong block">{lead.name}</span>
                <span className="hero-dash-sub block truncate">{lead.role}</span>
              </span>
              <span className="hero-dash-score">{lead.score}</span>
            </button>
          ))}
        </div>

        <div className="hero-dash-card hero-dash-list">
          <div className="hero-dash-list-head">
            <span>Replies</span>
            <button type="button" className="hero-dash-btn" onClick={() => go("messages")}>
              Inbox
            </button>
          </div>
          {REPLIES.map((reply) => (
            <button
              key={reply.person.name}
              type="button"
              className="hero-dash-row is-top is-button"
              onClick={() => go("messages", { thread: reply.person.name })}
            >
              <DemoFace person={reply.person} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="hero-dash-strong truncate">{reply.person.name}</span>
                  <span className="hero-dash-caption">{reply.when}</span>
                </span>
                <span className="hero-dash-sub block truncate">{reply.person.role}</span>
                <span className="hero-dash-body">{reply.lines.at(-1)?.text}</span>
                {reply.booked ? (
                  <span className="hero-dash-pills">
                    <span className="hero-dash-pill is-good">Meeting booked</span>
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default function HeroAppPreview({ todayKey }: { todayKey: string }) {
  const [view, setView] = useState<View>("overview");
  // Which lead, conversation or group a cross-page click should open.
  const [focus, setFocus] = useState<DemoFocus>({});
  const go: DemoGo = (next, nextFocus = {}) => {
    setFocus(nextFocus);
    setView(next);
  };
  const navButton = (item: { id: View; label: string; icon: string }) => (
    <button
      key={item.id}
      type="button"
      title={item.label}
      aria-current={view === item.id ? "page" : undefined}
      className={view === item.id ? "is-active" : undefined}
      onClick={() => go(item.id)}
    >
      <Icon name={item.icon} />
      <span className="hero-dash-nav-label">{item.label}</span>
    </button>
  );

  return (
    <div className="hero-dash">
      <nav className="hero-dash-sidebar" aria-label="Demo app pages">
        <div className="hero-dash-brand">
          <LogoGlyph className="h-5 w-5" />
          <span className="hero-dash-nav-label">Omentir</span>
          <Icon name="chevron_left" />
        </div>
        <div className="hero-dash-nav">{NAV.map(navButton)}</div>
        <div className="hero-dash-nav hero-dash-nav-bottom">
          {BOTTOM_NAV.map(navButton)}
          <button
            type="button"
            title="Workspace"
            aria-current={view === "workspace" ? "page" : undefined}
            className={view === "workspace" ? "is-active" : undefined}
            onClick={() => go("workspace")}
          >
            <span className="hero-dash-workspace-mark" aria-hidden="true">
              H
            </span>
            <span className="hero-dash-nav-label">
              Harborline <span className="hero-dash-pill">Demo</span>
            </span>
            <Icon name="expand_more" />
          </button>
        </div>
      </nav>

      {/* Keyed by page so switching pages starts at the top. */}
      <div key={view} className="hero-dash-main">
        <div className="hero-dash-content">
          {view === "overview" ? <OverviewScreen todayKey={todayKey} go={go} /> : null}
          {view === "agents" ? <AgentsScreen go={go} /> : null}
          {view === "messages" ? <MessagesScreen focus={focus.thread} /> : null}
          {view === "leads" ? <LeadsScreen focus={focus.lead} group={focus.group} /> : null}
          {view === "api" ? <ApiScreen /> : null}
          {view === "settings" ? <SettingsScreen /> : null}
          {view === "workspace" ? <WorkspaceScreen /> : null}
        </div>
      </div>
    </div>
  );
}
