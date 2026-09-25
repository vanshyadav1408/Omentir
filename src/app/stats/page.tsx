import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { statsAccess } from "@/lib/server/stats/access";
import { parseStatsQuery } from "@/lib/stats-periods";
import StatsDashboard from "./stats-dashboard";
import "./stats.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Omentir stats",
  robots: { index: false, follow: false },
};

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await statsAccess();
  if (access === "denied") notFound();
  if (access === "signed-out") {
    // stats.omentir.com has no /login of its own; sign-in lives on the main site.
    const host = (await headers()).get("host") ?? "";
    const base = host.startsWith("stats.") ? `https://${host.slice("stats.".length)}` : "";
    return (
      <div className="stats-root">
        <div className="stats-signin">
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>Omentir stats</h1>
            <p style={{ color: "var(--st-muted)", margin: "8px 0 0" }}>Sign in to Omentir first, then come back to this page.</p>
            <a href={`${base}/login`}>Sign in</a>
          </div>
        </div>
      </div>
    );
  }
  const params = await searchParams;
  const initialQuery = parseStatsQuery((name) => {
    const value = params[name];
    return Array.isArray(value) ? value[0] : value;
  });
  return <StatsDashboard initialQuery={initialQuery} initialView={params.view === "product" ? "product" : "web"} />;
}
