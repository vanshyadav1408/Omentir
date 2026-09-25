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

export function MarketingHeader({ transparentAtTop = false }: { transparentAtTop?: boolean }) {
  return (
    <MarketingHeaderFrame transparentAtTop={transparentAtTop}>
      {/* Width + gutters from .omentir-primary-width.
          Desktop: logo | nav centered in full header | actions */}
      <header className="omentir-primary-width relative flex h-[52px] min-w-0 items-center gap-2 md:gap-4">
        <div className="flex min-w-0 shrink-0 items-center gap-2 md:gap-3">
          <Link
            href="/"
            className="flex min-w-0 shrink-0 select-none items-center gap-1.5 text-[18px] font-medium leading-none tracking-tight text-[var(--md-sys-color-on-surface)] md:gap-2 md:text-[20px]"
          >
            <LogoMark className="h-5 w-5 md:h-6 md:w-6" />
            <span className="truncate">Omentir</span>
          </Link>
          {/* Remote GitHub data is cosmetic. Render the link immediately so a
              slow API response cannot hold back the entire landing header. */}
          <Suspense fallback={<GithubStarButtonFallback />}>
            <GithubStarButton />
          </Suspense>
        </div>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 text-sm font-normal text-[var(--md-sys-color-on-surface)] md:flex lg:absolute lg:left-1/2 lg:flex-none lg:-translate-x-1/2">
          <FeatureMenu />
          <Link href="/integrations" className="site-nav-link">Integrations</Link>
          <Link href="/pricing" className="site-nav-link">Pricing</Link>
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
      <Link href="/login" className="site-nav-link">
        Sign in
      </Link>
      <Link href="/demo" className="site-btn site-btn-sm site-btn-outline">
        Book a demo
      </Link>
      <Link href="/signup" className="site-btn site-btn-sm site-btn-primary">
        Get started
      </Link>
    </>
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
  { label: "LinkedIn", href: "https://www.linkedin.com/company/121943897" },
  { label: "X", href: "https://x.com/OmentirAI" },
  { label: "GitHub", href: `https://github.com/${hostedGithubRepo()}` },
  { label: "Product Hunt", href: "https://www.producthunt.com/products/omentir" },
  { label: "Email", href: `mailto:${hostedContactEmail()}` },
];

function FooterColumn({ heading, links }: { heading: string; links: Array<[string, string]> }) {
  return (
    <div className="min-w-0">
      <h3 className="site-footer-heading mb-4">{heading}</h3>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="site-footer-link">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConnectColumn() {
  return (
    <div className="min-w-0">
      <h3 className="site-footer-heading mb-4">Connect</h3>
      <ul className="space-y-2.5">
        {footerSocialLinks.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              {...(item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="site-footer-link"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Laid out like cursor.com's footer. The theme is chosen in app Settings. */
export function MarketingFooter() {
  return (
    <footer className="site-footer pb-10 pt-14 md:pt-16">
      <div className="omentir-primary-width">
        <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-10 md:hidden">
          {mobileFooterColumns.map(([heading, ...links]) => (
            <FooterColumn key={heading} heading={heading} links={links} />
          ))}
          <ConnectColumn />
        </div>
        <div className="hidden min-w-0 grid-cols-5 gap-8 md:grid">
          {footerColumns.map(([heading, ...links]) => (
            <FooterColumn key={heading} heading={heading} links={links} />
          ))}
          <ConnectColumn />
        </div>
        <div className="mt-14">
          <p className="site-footer-muted flex select-none items-center gap-2">
            <LogoMark className="h-4 w-4" />
            &copy; {new Date().getFullYear()} Omentir. Open Source, MIT licensed.
          </p>
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
    <main className="site-theme min-h-screen overflow-x-hidden">
      <MarketingHeader transparentAtTop />
      {heroFullHeight ? (
        <div className="relative">
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
        <div className="relative">
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
      className={`flex flex-wrap items-center gap-2 text-sm lowercase text-[var(--md-sys-color-on-surface-variant)] ${className}`}
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
    <main className="site-theme min-h-screen overflow-x-hidden">
      <MarketingHeader transparentAtTop />
      {/* cursor.com article layout: crumbs in a sticky left column. */}
      <div className="omentir-primary-width grid min-w-0 gap-6 pb-20 pt-28 md:grid-cols-[12rem_minmax(0,42rem)] md:gap-16 md:pb-28 md:pt-32 lg:grid-cols-[14rem_minmax(0,42rem)] lg:gap-24">
        <div className="md:sticky md:top-28 md:self-start">
          <ArticleCrumbs crumbs={trail} className="" />
        </div>
        <article className="min-w-0">
          <h1 className="text-[1.75rem] leading-tight tracking-[-0.0125em] text-[var(--site-text)] md:text-[2rem]">
            {title}
          </h1>
          {updated ? (
            <p className="mt-2 text-sm text-[var(--site-text-2)]">Last updated {updated}</p>
          ) : null}
          {description ? (
            <p className="mt-6 text-base leading-7 text-[var(--site-text-2)]">{description}</p>
          ) : null}

          <div className="mt-10 md:mt-12">{children}</div>

          <div className="mt-16 rounded-[16px] border border-[var(--site-border)] bg-[var(--site-card)] px-6 py-8 md:px-8">
            <p className="text-lg text-[var(--site-text)]">
              Run the outreach from your own LinkedIn account
            </p>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--site-text-2)]">
              Omentir finds ICP-fit buyers, drafts connection notes and messages, and keeps
              replies in one inbox. You still choose the daily send limits.
            </p>
            <Link href="/signup" className="site-btn site-btn-sm site-btn-primary mt-6">
              Try Omentir
            </Link>
          </div>
        </article>
      </div>
      <MarketingFooter />
    </main>
  );
}
