"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { StatsInterval } from "@/lib/stats-periods";
import type { StatsAiData, StatsFilter } from "@/lib/stats-types";
import { formatCompact, formatNumber } from "./stats-format";
import { Glyph, aiIcon } from "./stats-icons";
import { StatsLineChart } from "./stats-line-chart";

// DataFast's three AI views, mapped onto the ai_kind values we log.
const KINDS: { kind: string; label: string; icon: ReactNode }[] = [
  { kind: "assistant", label: "AI answers", icon: Glyph.ai },
  { kind: "search", label: "Indexing", icon: Glyph.search },
  { kind: "crawler", label: "Training", icon: Glyph.book },
];

const TOTAL_COLOR = "#8ab8f0";
const AGENT_COLOR = "#f29b82";

type Props = {
  data?: StatsAiData;
  loading: boolean;
  error?: string;
  buckets: string[];
  interval: StatsInterval;
  onFilter: (filter: StatsFilter) => void;
};

export function StatsAiCard({ data, loading, error, buckets, interval, onFilter }: Props) {
  const [kind, setKind] = useState("assistant");
  // null = the Total row: the chart shows every agent of this type added up.
  const [selected, setSelected] = useState<string | null>(null);

  const totals = useMemo(() => {
    const byKind = new Map<string, number>();
    for (const row of data?.rows ?? []) byKind.set(row.kind, (byKind.get(row.kind) ?? 0) + row.fetches);
    return byKind;
  }, [data]);

  const ais = useMemo(() => {
    const byAi = new Map<string, number>();
    for (const row of data?.rows ?? []) {
      if (row.kind === kind) byAi.set(row.ai, (byAi.get(row.ai) ?? 0) + row.fetches);
    }
    return [...byAi.entries()].sort((a, b) => b[1] - a[1]);
  }, [data, kind]);

  // A selection from another tab (or one that vanished after a filter) falls back to Total.
  const agent = selected && ais.some(([ai]) => ai === selected) ? selected : null;

  const series = useMemo(() => {
    const index = new Map(buckets.map((b, i) => [b, i]));
    const values = new Array(buckets.length).fill(0);
    for (const row of data?.rows ?? []) {
      if (row.kind !== kind || (agent && row.ai !== agent)) continue;
      const i = index.get(row.bucket);
      if (i != null) values[i] += row.fetches;
    }
    return [{ key: agent ?? "__total", label: agent ?? "Total", color: agent ? AGENT_COLOR : TOTAL_COLOR, values }];
  }, [data, kind, agent, buckets]);

  const kindTotal = totals.get(kind) ?? 0;

  return (
    <section className={`stats-card stats-full${loading ? " is-loading" : ""}`} aria-label="AI traffic">
      <div className="stats-card-head">
        <div className="stats-tabs" role="tablist" aria-label="AI traffic">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              role="tab"
              aria-selected={kind === k.kind}
              onClick={() => {
                setKind(k.kind);
                setSelected(null);
              }}
            >
              <span className="stats-row-icon" style={{ width: 13, height: 13 }}>{k.icon}</span>
              {k.label}
              <span className="stats-tab-count">{formatCompact(totals.get(k.kind) ?? 0)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="stats-card-body">
        {error ? (
          <div className="stats-empty stats-error">{error}</div>
        ) : ais.length === 0 ? (
          <div className="stats-empty" style={{ minHeight: 280 }}>{loading ? "" : "No AI traffic in this period"}</div>
        ) : (
          <div className="stats-split">
            <StatsLineChart buckets={buckets} interval={interval} series={series} height={270} />
            <div className="stats-split-list">
              <button
                type="button"
                className={`stats-goal stats-ai-total${agent ? "" : " is-selected"}`}
                aria-pressed={!agent}
                onClick={() => setSelected(null)}
              >
                <span className="stats-row-label">
                  <span className="stats-row-icon">{KINDS.find((k) => k.kind === kind)?.icon}</span>
                  <span>Total</span>
                </span>
                <b>{formatNumber(kindTotal)}</b>
              </button>
              {ais.map(([ai, fetches]) => (
                <div key={ai} className="stats-ai-row">
                  <button
                    type="button"
                    className={`stats-goal${agent === ai ? " is-selected" : ""}`}
                    aria-pressed={agent === ai}
                    onClick={() => setSelected(agent === ai ? null : ai)}
                    title={agent === ai ? "Back to the total" : `Show ${ai} on the chart`}
                  >
                    <span className="stats-row-label">
                      {aiIcon(ai)}
                      <span>{ai}</span>
                    </span>
                    <b>{formatNumber(fetches)}</b>
                  </button>
                  <button
                    type="button"
                    className="stats-ai-filter"
                    aria-label={`Filter the page to ${ai}`}
                    title={`Filter the page to ${ai}`}
                    onClick={() => onFilter({ key: "ai_name", value: ai, label: `AI is ${ai}` })}
                  >
                    {Glyph.filter}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
