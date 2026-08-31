import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { hostedContactEmail, hostedGithubRepo } from "@/lib/hosted-identity";
import { AskAiMenu } from "./ask-ai-menu";
import FeatureMenu from "./feature-menu";
import GithubStarButton from "./github-star-button";
import HeaderAuth from "./header-auth";
import LogoMark from "./logo-mark";
import MarketingHeaderFrame from "./marketing-header-frame";
import { MarketingMobileMenuButton } from "./marketing-mobile-nav";
import { brandTagline } from "./seo";

export function MarketingHeader({ transparentAtTop = false }: { transparentAtTop?: boolean }) {
  return (
    <MarketingHeaderFrame transparentAtTop={transparentAtTop}>
      {/* Width + gutters from .omentir-primary-width.
          Desktop: logo | nav centered in full header | actions */}
      <header className="omentir-primary-width relative flex h-16 min-w-0 items-center gap-2 md:gap-4">
        <div className="flex min-w-0 shrink-0 items-center gap-2 md:gap-3">
          <Link
            href="/"
            className="flex min-w-0 shrink-0 select-none items-center gap-1.5 text-[20px] font-medium leading-none tracking-tight text-[var(--md-sys-color-on-surface)] md:gap-2 md:text-[24px]"
          >
            <LogoMark className="h-6 w-6 md:h-7 md:w-7" />
            <span className="truncate">Omentir</span>
          </Link>
          {/* Remote GitHub data is cosmetic. Render the link immediately so a
              slow API response cannot hold back the entire landing header. */}
          <Suspense fallback={<GithubStarButtonFallback />}>
            <GithubStarButton />
          </Suspense>
        </div>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] md:flex lg:absolute lg:left-1/2 lg:flex-none lg:-translate-x-1/2">
          <FeatureMenu />
          <Link href="/integrations" className="m3-state-layer rounded-md px-3 py-2 transition-colors hover:text-[var(--md-sys-color-on-surface)]">Integrations</Link>
          <Link href="/pricing" className="m3-state-layer rounded-md px-3 py-2 transition-colors hover:text-[var(--md-sys-color-on-surface)]">Pricing</Link>
          <AskAiMenu />
        </nav>

        {/* ml-auto keeps actions on the right: on mobile the nav is hidden, and on lg
            the nav is absolutely centered (out of flex flow), so nothing else pushes right */}
        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 md:gap-2">
          {/* Desktop: auth CTAs */}
          <div className="hidden items-center gap-2 md:flex">
            {/* Session resolution is allowed to finish after the usable header
                has streamed. Signed-out CTAs are the safe initial fallback. */}
            <Suspense fallback={<HeaderAuthFallback />}>
              <HeaderAuth />
            </Suspense>
          </div>
          {/* Mobile: hamburger on the right → full-screen menu (icon becomes close) */}
          <MarketingMobileMenuButton />
        </div>
      </header>
    </MarketingHeaderFrame>
  );
}

function GithubStarButtonFallback() {
  return (
    <a
      href={`https://github.com/${hostedGithubRepo()}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Omentir on GitHub"
      className="m3-state-layer inline-flex shrink-0 items-center justify-center gap-1 rounded-md border border-[var(--md-sys-color-outline-variant)] px-[9px] py-[5px] text-[11px] font-medium leading-none text-[var(--md-sys-color-on-surface-variant)] transition-colors hover:text-[var(--md-sys-color-on-surface)] md:gap-1.5 md:px-[11px] md:py-[7px] md:text-[13px]"
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0 fill-current md:h-4 md:w-4"
      >
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
    </a>
  );
}

function HeaderAuthFallback() {
  return (
    <>
      <Link
        href="/login"
        className="m3-btn h-9 px-4 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] transition-colors hover:bg-[var(--md-sys-state-hover)] hover:text-[var(--md-sys-color-on-surface)]"
      >
        Sign in
      </Link>
      <Link href="/signup" className="m3-btn m3-btn-filled h-9 cursor-pointer px-4 text-sm">
        Get started
      </Link>
    </>
  );
}

/**
 * The diamond-grid hero backdrop (`.hero-grid-bg` in globals.css). Shared so
 * every marketing hero draws the same pattern at the same intensity instead of
 * each page keeping its own copy of the positioning.
 *
 * Drop it as the first child of a `relative` wrapper around the hero. It is
 * taller than the hero on purpose: its mask fades the lines out across the
 * section below, so that section belongs inside the wrapper too. Because it is
 * positioned, siblings that must paint above the lines need `relative z-10`.
 */
export function HeroGridBackdrop({ height = "h-[175vh]" }: { height?: string }) {
  return (
    <div
      aria-hidden
      className={`hero-grid-bg pointer-events-none absolute inset-x-0 top-0 z-0 ${height}`}
    />
  );
}

const footerColumns: Array<[string, ...Array<[label: string, href: string]>]> = [
  [
    "Product",
    ["Features", "/features"],
    ["Free tools", "/tools"],
    ["LinkedIn profile rating", "/tools/linkedin-profile-rating"],
    ["Improve LinkedIn profile", "/tools/improve-linkedin-profile"],
    ["Find leads", "/tools/find-leads"],
    ["Pricing", "/pricing"],
    ["Use cases", "/use-cases"],
    ["Founder outbound", "/use-cases/outbound-for-founders"],
    ["Grok Bot outbound", "/use-cases/grok-bot-outbound"],
    ["Grok Bot cold messaging", "/use-cases/grok-bot-cold-messaging"],
    ["Grok Bot Sales Navigator", "/use-cases/grok-bot-sales-navigator"],
    ["Claude Code outbound", "/use-cases/claude-code-outbound"],
    ["Cursor outbound", "/use-cases/cursor-outbound"],
    ["Codex outbound", "/use-cases/codex-outbound"],
    ["Book LinkedIn demos", "/use-cases/book-linkedin-demos"],
    ["Blogs", "/blogs"],
    ["Open Source", "/blogs/omentir-is-now-open-source"],
  ],
  [
    "Company",
    ["About", "/about"],
    ["Help", "/help"],
    ["Minimum Booking Guarantee", "/minimum-booking-guarantee"],
    ["Privacy Policy", "/privacy-policy"],
    ["Terms of Service", "/terms-of-service"],
  ],
  [
    "Integrations",
    ["Claude", "/integrations/claude"],
    ["ChatGPT", "/integrations/chatgpt"],
    ["Cursor", "/integrations/cursor"],
    ["MCP", "/integrations/mcp"],
    ["Grok", "/integrations/grok"],
    ["Grok Bot", "/integrations/grok-bot"],
    ["OpenClaw", "/integrations/openclaw"],
    ["REST API", "/integrations/rest-api"],
    ["Claude Code", "/integrations/claude-code"],
    ["Codex", "/integrations/codex"],
  ],
  [
    "Alternatives",
    ["All matchups", "/comparisons"],
    ["Gojiberry Alternatives", "/comparisons/omentir-vs-gojiberry"],
    ["Apollo Alternatives", "/comparisons/omentir-vs-apollo"],
    ["Instantly Alternatives", "/comparisons/omentir-vs-instantly"],
    ["Smartlead Alternatives", "/comparisons/omentir-vs-smartlead"],
    ["Artisan AI Alternatives", "/comparisons/omentir-vs-artisan"],
    ["11x AI Alternatives", "/comparisons/omentir-vs-11x"],
    ["Lusha Alternatives", "/comparisons/omentir-vs-lusha"],
    ["Clay Alternatives", "/comparisons/omentir-vs-clay"],
    ["Cognism Alternatives", "/comparisons/omentir-vs-cognism"],
    ["HeyReach Alternatives", "/comparisons/omentir-vs-heyreach"],
    ["Expandi Alternatives", "/comparisons/omentir-vs-expandi"],
    ["Dripify Alternatives", "/comparisons/omentir-vs-dripify"],
    ["Waalaxy Alternatives", "/comparisons/omentir-vs-waalaxy"],
    ["LinkedHelper Alternatives", "/comparisons/omentir-vs-linkedhelper"],
    ["Self-Host vs Hosted Omentir", "/comparisons/self-host-vs-hosted"],
    ["Lemlist Alternatives", "/comparisons/omentir-vs-lemlist"],
    ["Sales Navigator Alternatives", "/comparisons/omentir-vs-sales-navigator"],
    ["Category roundups", "/alternatives"],
    ["Grok Bot Alternatives", "/alternatives/grok-bot"],
  ],
];

const mobileProductLabels = new Set([
  "Features",
  "Free tools",
  "LinkedIn profile rating",
  "Improve LinkedIn profile",
  "Find leads",
  "Pricing",
  "Use cases",
  "Blogs",
  "Open Source",
]);

const mobileFooterColumns = footerColumns
  .filter(([heading]) => heading !== "Alternatives")
  .map(([heading, ...links]) =>
    heading === "Product"
      ? ([heading, ...links.filter(([label]) => mobileProductLabels.has(label))] as (typeof footerColumns)[number])
      : ([heading, ...links] as (typeof footerColumns)[number]),
  );

// Hosted product brand links — intentional in source (public website identity).
// Local mode never renders marketing shell (non-app routes 404).
const footerSocialLinks = [
  { label: "Email", href: `mailto:${hostedContactEmail()}`, orderClassName: "order-3" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/121943897", orderClassName: "order-1" },
  { label: "Twitter", href: "https://x.com/OmentirAI", orderClassName: "order-2" },
  { label: "GitHub", href: `https://github.com/${hostedGithubRepo()}`, orderClassName: "order-4" },
  { label: "Product Hunt", href: "https://www.producthunt.com/products/omentir", orderClassName: "order-5" },
];

function FooterSocialIcon({ label }: { label: string }) {
  if (label === "LinkedIn") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M5.4 8.7h3.3V19H5.4V8.7Zm1.7-5A1.9 1.9 0 1 1 7 7.5a1.9 1.9 0 0 1 .1-3.8ZM10.7 8.7h3.1v1.4h.1a3.4 3.4 0 0 1 3.1-1.7c3.3 0 3.9 2.2 3.9 5V19h-3.3v-5c0-1.2 0-2.7-1.7-2.7s-1.9 1.3-1.9 2.7v5h-3.3V8.7Z" />
      </svg>
    );
  }

  if (label === "Twitter") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="m14.2 10.6 6.6-7.6h-1.6l-5.7 6.6L8.9 3H3.6l6.9 10-6.9 8h1.6l6-7 4.8 7h5.3l-7.1-10.4Zm-2.1 2.5-.7-1L5.9 4.2h2.2l4.5 6.4.7 1 5.8 8.2h-2.2l-4.8-6.7Z" />
      </svg>
    );
  }

  if (label === "Product Hunt") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M13.604 8.4h-3.405V12h3.405c.995 0 1.801-.806 1.801-1.801 0-.993-.805-1.799-1.801-1.799zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.804c2.319 0 4.2 1.88 4.2 4.199 0 2.321-1.881 4.201-4.201 4.201z" />
      </svg>
    );
  }

  if (label === "GitHub") {
    return (
      <svg viewBox="0 0 16 16" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function MarketingFooter() {
  // Always the same near-black “light-theme” footer in light and dark site themes.
  return (
    <footer className="marketing-footer overflow-hidden border-t border-white/20 bg-[#111111] pb-0 pt-14 text-white">
      <div className="omentir-primary-width flex flex-col gap-10 md:flex-row md:items-start md:gap-12 lg:gap-16">
        <div className="min-w-0 md:w-56 md:shrink-0 lg:w-64">
          <div className="flex select-none items-center gap-3 text-xl font-normal text-white md:text-2xl">
            <LogoMark className="h-9 w-9 text-white md:h-10 md:w-10" />
            Omentir
          </div>
          {/* The headline itself, not a paraphrase of it: the footer is the
              last thing on every marketing page, so it repeats the one line the
              tab title and social cards carry. */}
          <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
            {brandTagline}.
            <span className="block">Open Source. MIT licensed.</span>
          </p>
          <div className="mt-5 flex items-center gap-6">
            {footerSocialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                aria-label={item.label}
                className={`${item.orderClassName} grid h-8 w-8 place-items-center text-zinc-400 transition hover:text-white`}
              >
                <FooterSocialIcon label={item.label} />
              </a>
            ))}
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-8 md:hidden">
          {mobileFooterColumns.map(([heading, ...links]) => {
            const fullRow = heading === "Integrations";
            return (
              <div key={heading} className={fullRow ? "col-span-2 min-w-0" : "min-w-0"}>
                <h3 className="mb-4 text-sm font-semibold text-white">{heading}</h3>
                <div
                  className={`text-sm text-zinc-400 ${
                    fullRow ? "grid grid-cols-2 gap-x-6 gap-y-3" : "space-y-3"
                  }`}
                >
                  {links.map(([label, href]) => (
                    <div key={label}>
                      <Link href={href} className="transition-colors hover:text-white">
                        {label}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="hidden min-w-0 flex-1 grid-cols-1 gap-8 md:grid md:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map(([heading, ...links]) => (
            <div key={heading} className="min-w-0">
              <h3 className="mb-4 text-sm font-semibold text-white">{heading}</h3>
              <div className="space-y-3 text-sm text-zinc-400">
                {links.map(([label, href]) => (
                  <div key={label}>
                    <Link href={href} className="transition-colors hover:text-white">
                      {label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="omentir-primary-width mt-10 h-[18vw] max-h-52 select-none overflow-hidden sm:h-[16vw]"
      >
        <div className="bg-[linear-gradient(180deg,#8f8f8f_0%,#d6d6d6_45%,#ffffff_100%)] bg-clip-text text-center text-[23vw] font-semibold leading-[0.78] tracking-tight text-transparent sm:text-[21vw] lg:text-[17rem]">
          Omentir
        </div>
      </div>
    </footer>
  );
}

type MarketingPageProps = {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  centeredHeader?: boolean;
  contentClassName?: string;
  titleClassName?: string;
  titleStyle?: React.CSSProperties;
  heroFullHeight?: boolean;
  heroActions?: React.ReactNode;
  children: React.ReactNode;
};

export function MarketingPage({
  title,
  description,
  centeredHeader = false,
  contentClassName = "max-w-5xl",
  titleClassName = "",
  titleStyle,
  heroFullHeight = false,
  heroActions,
  children,
}: MarketingPageProps) {
  const header = (
    <>
      {/* Same hero type as the landing page (globals.css): identical face,
          weight, tracking and mobile step. These titles are full sentences, so
          they take the -sentence display step from md up. */}
      <h1
        style={titleStyle}
        className={`hero-display-sentence text-[var(--md-sys-color-on-surface)] ${
          centeredHeader ? "mx-auto max-w-4xl text-center" : "max-w-4xl"
        } ${titleClassName}`}
      >
        {title}
      </h1>
      {description ? (
        <p
          className={`hero-lede mt-4 max-w-2xl text-[var(--md-sys-color-on-surface-variant)] md:mt-5 ${
            centeredHeader ? "mx-auto text-center" : ""
          }`}
        >
          {description}
        </p>
      ) : null}
      {heroActions ? (
        <div className={`mt-8 ${centeredHeader ? "flex justify-center" : ""}`}>
          {heroActions}
        </div>
      ) : null}
    </>
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      <MarketingHeader transparentAtTop />
      {heroFullHeight ? (
        <div className="relative">
          {/* Diamond grid behind the full-height hero, fading into the content. */}
          <HeroGridBackdrop height="h-[130vh]" />
          <section
            className={`relative z-10 mx-auto flex min-h-[100svh] w-full ${contentClassName} min-w-0 flex-col justify-center px-4 pt-14 pb-16 md:px-8`}
          >
            {header}
          </section>
          <section
            className={`relative z-10 mx-auto w-full ${contentClassName} min-w-0 px-4 pb-16 md:px-8 md:pb-24`}
          >
            {children}
          </section>
        </div>
      ) : (
        // Short hero: the grid covers the heading block and fades before the
        // body copy starts, so long legal text never reads through the lines.
        <div className="relative">
          <HeroGridBackdrop height="h-[60vh]" />
          <section
            className={`relative z-10 mx-auto w-full ${contentClassName} min-w-0 px-4 pb-16 pt-28 md:px-8 md:pb-24 md:pt-32`}
          >
            {header}
            <div className="mt-10 md:mt-12">{children}</div>
          </section>
        </div>
      )}
      <MarketingFooter />
    </main>
  );
}

export type ArticleCrumb = { label: string; href?: string };

/** Visible path crumbs. Labels stay lowercase: home / help / slug. */
export function articlePathCrumbs(...parts: string[]): ArticleCrumb[] {
  const crumbs: ArticleCrumb[] = [{ label: "home", href: "/" }];
  let acc = "";
  parts.forEach((part, index) => {
    acc += `/${part}`;
    crumbs.push(index === parts.length - 1 ? { label: part } : { label: part, href: acc });
  });
  return crumbs;
}

export function ArticleCrumbs({
  crumbs,
  className = "mb-8",
}: {
  crumbs: ReadonlyArray<ArticleCrumb>;
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-2 text-xs font-semibold lowercase text-[var(--md-sys-color-on-surface-variant)] ${className}`}
    >
      {crumbs.map((crumb, index) => (
        <span key={`${crumb.label}-${index}`} className="flex items-center gap-2">
          {index > 0 ? (
            <span className="font-normal text-[var(--md-sys-color-outline)]" aria-hidden="true">
              /
            </span>
          ) : null}
          {crumb.href ? (
            <Link href={crumb.href} className="transition-colors hover:text-[var(--md-sys-color-on-surface)]">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-[var(--md-sys-color-on-surface)]">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Narrow article chrome shared with /help pages. */
export function MarketingArticle({
  title,
  path,
  crumbs,
  description,
  updated,
  children,
}: {
  title: string;
  path: string;
  crumbs?: ReadonlyArray<ArticleCrumb>;
  description?: ReactNode;
  updated?: string;
  children: ReactNode;
}) {
  const trail = crumbs ?? articlePathCrumbs(path);
  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      <MarketingHeader transparentAtTop />
      <div className="relative">
        <HeroGridBackdrop height="h-[60vh]" />
        <article className="omentir-secondary-width relative z-10 min-w-0 pb-16 pt-28 md:pb-24 md:pt-32">
          <ArticleCrumbs crumbs={trail} />

          <h1
            style={{ fontFamily: "var(--font-varta)" }}
            className="max-w-2xl text-2xl font-semibold leading-snug tracking-tight text-[var(--md-sys-color-on-surface)] md:text-3xl md:leading-snug"
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--md-sys-color-on-surface-variant)]">
              {description}
            </p>
          ) : null}
          {updated ? (
            <p className="mt-4 text-sm text-[var(--md-sys-color-on-surface-variant)]">
              Last updated: {updated}
            </p>
          ) : null}

          <div className="mt-12 md:mt-16">{children}</div>

          <div className="mt-16 rounded-3xl border-2 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] px-6 py-8 text-center md:mt-20 md:px-10 md:py-10">
            <p className="text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">
              Run the outreach from your own LinkedIn account
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
              Omentir finds ICP-fit buyers, drafts connection notes and messages, and keeps
              replies in one inbox. You still choose the daily send limits.
            </p>
            <Link
              href="/signup"
              className="m3-btn m3-btn-filled-secondary mt-6 inline-flex h-11 cursor-pointer px-6 text-sm"
            >
              Try Omentir
            </Link>
          </div>
        </article>
      </div>
      <MarketingFooter />
    </main>
  );
}
