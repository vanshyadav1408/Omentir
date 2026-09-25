"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { StatsInterval } from "@/lib/stats-periods";
import type { StatsAiData, StatsFilter } from "@/lib/stats-types";
import { formatCompact, formatNumber } from "./stats-format";
import { Glyph, aiIcon } from "./stats-icons";
import { LINE_COLORS, StatsLineChart } from "./stats-line-chart";

// DataFast's three AI views, mapped onto the ai_kind values we log.
const KINDS: { kind: string; label: string; icon: ReactNode }[] = [
  { kind: "assistant", label: "AI answers", icon: Glyph.ai },
  { kind: "search", label: "Indexing", icon: Glyph.search },
  { kind: "crawler", label: "Training", icon: Glyph.book },
];

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
  const [hover, setHover] = useState<string | null>(null);

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

  const series = useMemo(() => {
    const index = new Map(buckets.map((b, i) => [b, i]));
    return ais.slice(0, 6).map(([ai], n) => {
      const values = new Array(buckets.length).fill(0);
      for (const row of data?.rows ?? []) {
        if (row.kind !== kind || row.ai !== ai) continue;
        const i = index.get(row.bucket);
        if (i != null) values[i] += row.fetches;
      }
      return { key: ai, label: ai, color: LINE_COLORS[n % LINE_COLORS.length], values };
    });
  }, [ais, data, kind, buckets]);
  const colorOf = new Map(series.map((s) => [s.key, s.color]));

  return (
    <section className={`stats-card stats-full${loading ? " is-loading" : ""}`} aria-label="AI traffic">
      <div className="stats-card-head">
        <div className="stats-tabs" role="tablist" aria-label="AI traffic">
          {KINDS.map((k) => (
            <button key={k.kind} type="button" role="tab" aria-selected={kind === k.kind} onClick={() => setKind(k.kind)}>
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
            <StatsLineChart buckets={buckets} interval={interval} series={series} highlight={hover} height={270} />
            <div className="stats-split-list" onMouseLeave={() => setHover(null)}>
              {ais.map(([ai, fetches]) => (
                <button
                  key={ai}
                  type="button"
                  className="stats-goal"
                  style={{ borderColor: hover === ai && colorOf.has(ai) ? colorOf.get(ai) : "transparent" }}
                  onMouseEnter={() => setHover(ai)}
                  onClick={() => onFilter({ key: "ai_name", value: ai, label: `AI is ${ai}` })}
                  title={`Filter to ${ai}`}
                >
                  <span className="stats-row-label">
                    {aiIcon(ai)}
                    <span>{ai}</span>
                  </span>
                  <b>{formatNumber(fetches)}</b>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
