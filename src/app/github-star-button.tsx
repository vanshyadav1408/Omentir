import { hostedGithubRepo } from "@/lib/hosted-identity";

/**
 * Star count for the public repository, refreshed hourly.
 *
 * Unauthenticated GitHub API calls are limited to 60/hour per IP, so this must
 * stay cached rather than run per request. A failure here is cosmetic: the
 * button still renders, just without a number, and the header never breaks
 * because GitHub is slow or rate-limiting us.
 */
async function getStarCount(repo: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    const count = (data as { stargazers_count?: unknown }).stargazers_count;
    return typeof count === "number" && Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

function formatStars(count: number) {
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  // 1.2k up to 9.9k, then 10k+ without the decimal.
  return `${thousands < 10 ? thousands.toFixed(1).replace(/\.0$/, "") : Math.round(thousands)}k`;
}

export default async function GithubStarButton() {
  const repo = hostedGithubRepo();
  const stars = await getStarCount(repo);

  return (
    <a
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        stars === null
          ? "Omentir on GitHub"
          : `Star Omentir on GitHub. ${stars} ${stars === 1 ? "star" : "stars"}.`
      }
      className="m3-state-layer inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--md-sys-color-outline-variant)] px-2.5 py-1.5 text-xs font-medium leading-none text-black transition-colors dark:text-[var(--md-sys-color-on-surface-variant)] dark:hover:text-[var(--md-sys-color-on-surface)] md:gap-2 md:px-3 md:py-2 md:text-sm"
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="h-4 w-4 shrink-0 fill-current md:h-[18px] md:w-[18px]"
      >
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
      <span className="hidden sm:inline">Star</span>
      {stars !== null && (
        <span className="tabular-nums" title={`${stars} stars on GitHub`}>
          {formatStars(stars)}
        </span>
      )}
    </a>
  );
}
