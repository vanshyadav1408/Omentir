import Link from "next/link";
import { hostedContactEmail, hostedGithubRepo } from "@/lib/hosted-identity";
import { AskAiMenu } from "./ask-ai-menu";
import GithubStarButton from "./github-star-button";
import HeaderAuth from "./header-auth";
import LogoMark from "./logo-mark";
import MarketingHeaderFrame from "./marketing-header-frame";
import { MarketingMobileMenuButton } from "./marketing-mobile-nav";
import { MarketingThemeButton } from "./theme-toggle";

export function MarketingHeader({ transparentAtTop = false }: { transparentAtTop?: boolean }) {
  return (
    <MarketingHeaderFrame transparentAtTop={transparentAtTop}>
      {/* 16px gutters on mobile (Google M3); 32px from md up.
          Desktop: logo | nav centered in full header | actions */}
      <header className="relative mx-auto flex h-16 w-full max-w-7xl min-w-0 items-center gap-2 px-4 md:gap-4 md:px-8">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 select-none items-center gap-1.5 text-lg font-medium leading-none tracking-tight text-[var(--md-sys-color-on-surface)] md:gap-2 md:text-[22px]"
        >
          <LogoMark className="h-8 w-8 md:h-9 md:w-9" />
          <span className="truncate">Omentir</span>
        </Link>

        <GithubStarButton />

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] md:flex lg:absolute lg:left-1/2 lg:flex-none lg:-translate-x-1/2">
          <Link href="/for-agents" className="m3-state-layer rounded-full px-3 py-2 transition-colors hover:text-[var(--md-sys-color-on-surface)]">For Agents</Link>
          <Link href="/mcp-server" className="m3-state-layer rounded-full px-3 py-2 transition-colors hover:text-[var(--md-sys-color-on-surface)]">Connector/MCP Server</Link>
          <Link href="/pricing" className="m3-state-layer rounded-full px-3 py-2 transition-colors hover:text-[var(--md-sys-color-on-surface)]">Pricing</Link>
          <Link href="/blogs" className="m3-state-layer rounded-full px-3 py-2 transition-colors hover:text-[var(--md-sys-color-on-surface)]">Blogs</Link>
          <AskAiMenu />
        </nav>

        {/* ml-auto keeps actions on the right: on mobile the nav is hidden, and on lg
            the nav is absolutely centered (out of flex flow), so nothing else pushes right */}
        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 md:gap-2">
          {/* Desktop: theme + auth CTAs */}
          <div className="hidden items-center gap-2 md:flex">
            <MarketingThemeButton />
            <HeaderAuth />
          </div>
          {/* Mobile: hamburger on the right → full-screen menu (icon becomes close) */}
          <MarketingMobileMenuButton />
        </div>
      </header>
    </MarketingHeaderFrame>
  );
}

const footerColumns: Array<[string, ...Array<[label: string, href: string]>]> = [
  [
    "Product",
    ["Pricing", "/pricing"],
    ["For Agents", "/for-agents"],
    ["MCP Server", "/mcp-server"],
    ["Blogs", "/blogs"],
    ["Open Source", "/blogs/omentir-is-now-open-source"],
  ],
  [
    "Company",
    ["About", "/about"],
    ["Privacy Policy", "/privacy-policy"],
    ["Terms of Service", "/terms-of-service"],
  ],
];

// Hosted product brand links — intentional in source (public website identity).
// Local mode never renders marketing shell (non-app routes 404).
const footerSocialLinks = [
  { label: "Email", href: `mailto:${hostedContactEmail()}`, orderClassName: "order-3" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/121943897", orderClassName: "order-1" },
  { label: "Twitter", href: "https://x.com/OmentirAI", orderClassName: "order-2" },
  { label: "GitHub", href: `https://github.com/${hostedGithubRepo()}`, orderClassName: "order-4" },
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
    <footer className="marketing-footer overflow-hidden border-t border-white/20 bg-[#111111] px-4 pb-0 pt-14 text-white md:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_2fr]">
        <div className="min-w-0">
          <div className="flex select-none items-center gap-3 text-xl font-normal text-white md:text-2xl">
            <LogoMark className="h-9 w-9 text-white md:h-10 md:w-10" />
            Omentir
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
            Find your next customers with Omentir. Open source and MIT
            licensed.
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
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:pl-16 lg:pl-28">
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
        className="mx-auto mt-10 h-[18vw] max-h-52 max-w-7xl select-none overflow-hidden sm:h-[16vw]"
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
  description?: string;
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
      <h1
        style={titleStyle}
        className={`text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--md-sys-color-on-surface)] md:text-4xl lg:text-5xl ${
          centeredHeader ? "mx-auto max-w-4xl text-center" : "max-w-4xl"
        } ${titleClassName}`}
      >
        {title}
      </h1>
      {description ? (
        <p
          className={`mt-4 max-w-2xl text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)] md:mt-5 md:text-base md:leading-8 lg:text-lg ${
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
      <MarketingHeader />
      {heroFullHeight ? (
        <>
          <section
            className={`mx-auto flex min-h-[100svh] w-full ${contentClassName} min-w-0 flex-col justify-center px-4 pt-14 pb-16 md:px-8`}
          >
            {header}
          </section>
          <section className={`mx-auto w-full ${contentClassName} min-w-0 px-4 pb-16 md:px-8 md:pb-24`}>
            {children}
          </section>
        </>
      ) : (
        <section className={`mx-auto w-full ${contentClassName} min-w-0 px-4 pb-16 pt-28 md:px-8 md:pb-24 md:pt-32`}>
          {header}
          <div className="mt-10 md:mt-12">{children}</div>
        </section>
      )}
      <MarketingFooter />
    </main>
  );
}
