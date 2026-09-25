"use client";

import { useMemo, useState } from "react";
import type { StatsInterval } from "@/lib/stats-periods";
import type { StatsGoalsData } from "@/lib/stats-types";
import { formatNumber, formatPercent } from "./stats-format";
import { LINE_COLORS, StatsLineChart } from "./stats-line-chart";

const GOAL_NAMES: Record<string, string> = {
  signed_up: "Signed up",
  checkout_started: "Started checkout",
  payment_succeeded: "Paid",
  subscription_cancelled: "Cancelled subscription",
  agent_activated: "Agent activated",
  agent_paused: "Agent paused",
  lead_found: "Lead found",
  connection_request_sent: "Invite sent",
  connection_request_accepted: "Invite accepted",
  message_sent: "Message sent",
  "survey sent": "Survey answered",
};

const goalName = (event: string) => GOAL_NAMES[event] ?? event;

const FUNNEL = [
  { event: "$visitors", label: "Visited the site" },
  { event: "signed_up", label: "Signed up" },
  { event: "checkout_started", label: "Started checkout" },
  { event: "payment_succeeded", label: "Paid" },
];

type Props = {
  data?: StatsGoalsData;
  visitors?: number;
  loading: boolean;
  error?: string;
  buckets: string[];
  interval: StatsInterval;
};

export function StatsGoalsCard({ data, visitors, loading, error, buckets, interval }: Props) {
  const [tab, setTab] = useState<"goal" | "funnel">("goal");
  const [selected, setSelected] = useState<string | null>(null);

  const goals = useMemo(() => (data?.totals ?? []).slice(0, 10), [data]);
  const colors = useMemo(() => new Map(goals.map((g, i) => [g.event, LINE_COLORS[i % LINE_COLORS.length]])), [goals]);

  const series = useMemo(() => {
    const index = new Map(buckets.map((b, i) => [b, i]));
    return goals.map((goal) => {
      const values = new Array(buckets.length).fill(0);
      for (const row of data?.series ?? []) {
        if (row.event !== goal.event) continue;
        const i = index.get(row.bucket);
        if (i != null) values[i] = row.people;
      }
      return { key: goal.event, label: goalName(goal.event), color: colors.get(goal.event) ?? LINE_COLORS[0], values };
    });
  }, [goals, data, buckets, colors]);

  const people = (event: string) =>
    event === "$visitors" ? visitors ?? 0 : data?.totals.find((t) => t.event === event)?.people ?? 0;

  return (
    <section className={`stats-card stats-full${loading ? " is-loading" : ""}`} aria-label="Goals">
      <div className="stats-card-head">
        <div className="stats-tabs" role="tablist" aria-label="Goals">
          <button type="button" role="tab" aria-selected={tab === "goal"} onClick={() => setTab("goal")}>Goal</button>
          <button type="button" role="tab" aria-selected={tab === "funnel"} onClick={() => setTab("funnel")}>Funnel</button>
        </div>
      </div>
      <div className="stats-card-body">
        {error ? (
          <div className="stats-empty stats-error">{error}</div>
        ) : tab === "goal" ? (
          goals.length === 0 ? (
            <div className="stats-empty" style={{ minHeight: 280 }}>{loading ? "" : "No goals completed in this period"}</div>
          ) : (
            <div className="stats-split">
              <StatsLineChart buckets={buckets} interval={interval} series={series} highlight={selected} height={270} />
              <div className="stats-split-list">
                {goals.map((goal) => {
                  const color = colors.get(goal.event) ?? LINE_COLORS[0];
                  const active = selected === goal.event;
                  return (
                    <button
                      key={goal.event}
                      type="button"
                      className={`stats-goal${selected && !active ? " is-dim" : ""}`}
                      style={{ background: `${color}22`, borderColor: active ? color : "transparent" }}
                      onClick={() => setSelected(active ? null : goal.event)}
                      title={`${formatNumber(goal.completions)} times by ${formatNumber(goal.people)} people`}
                    >
                      <span>{goalName(goal.event)}</span>
                      <b>{formatNumber(goal.people)}</b>
                    </button>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          <div className="stats-funnel">
            {FUNNEL.map((step, i) => {
              const count = people(step.event);
              const first = people(FUNNEL[0].event);
              const prev = i === 0 ? count : people(FUNNEL[i - 1].event);
              return (
                <div key={step.event} className="stats-funnel-step">
                  <span>{step.label}</span>
                  <div className="stats-funnel-track">
                    <div className="stats-funnel-fill" style={{ width: `${first ? Math.max(0.6, (count / first) * 100) : 0}%` }} />
                    <span className="stats-funnel-num">{formatNumber(count)}</span>
                  </div>
                  <span className="stats-funnel-rate">
                    {i === 0 ? "" : <><b>{formatPercent(prev ? count / prev : 0)}</b> of prev.</>}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
