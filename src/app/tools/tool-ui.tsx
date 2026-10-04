import Link from "next/link";
import { ALL_TOOLS, type FreeTool } from "./tools-data";

/** White card on the cream hero, same surface as the site's link cards. */
export const TOOL_CARD =
  "rounded-[28px] bg-[var(--cal-surface)] shadow-[var(--cal-shadow)]";

/** Inline spinner row for the AI call: no overlay, no dimmed page. */
export function ToolLoadingRow({ label, seconds }: { label: string; seconds: number }) {
  return (
    <div
      role="status"
      className="mt-5 flex items-center gap-3 text-sm text-[var(--cal-muted)]"
    >
      <span
        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--cal-blue-soft)] border-t-[var(--cal-blue)]"
        aria-hidden="true"
      />
      <span>
        <span className="font-medium text-[var(--site-text)]">{label}.</span> Wait for a moment
        ({seconds} seconds).
      </span>
    </div>
  );
}

export function ToolCta({ slug }: { slug: FreeTool["slug"] }) {
  const tool = ALL_TOOLS.find((item) => item.slug === slug);
  if (!tool) return null;
  return (
    <div className="cal-cta-panel !mt-10 !bg-[var(--cal-surface)] shadow-[var(--cal-shadow)]">
      <p
        style={{ fontFamily: "var(--font-cal-display)" }}
        className="text-2xl font-medium tracking-tight text-[var(--site-text)]"
      >
        {tool.ctaTitle}
      </p>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--cal-muted)]">
        {tool.ctaBody}
      </p>
      <Link href="/signup" className="site-btn site-btn-primary mt-6">
        Create a free account
      </Link>
    </div>
  );
}
