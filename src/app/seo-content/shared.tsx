import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { agentPasteTarget } from "../agent-paste-target";
import { PromptCopyBox } from "../grok-bot-setup-block";
import { linkifyProducts, linkifySeoCopy } from "./product-links";
import type { SeoContentPage, SeoFamily, SeoRelatedLink } from "./types";
import {
  createBreadcrumbJsonLd,
  createFAQJsonLd,
  createWebPageJsonLd,
  siteUrl,
} from "../seo";
import FaqAccordion from "../faq-accordion";
import JsonLd from "../json-ld";
import {
  ArticleCrumbs,
  articlePathCrumbs,
  CalLinkCards,
  CalPageHero,
  MarketingFooter,
  MarketingHeader,
  type ArticleCrumb,
} from "../marketing-shell";
import { isSanityCdnUrl } from "@/sanity/lib/image";

export const familyLabels: Record<SeoFamily, string> = {
  features: "Features",
  comparisons: "Alternatives",
  integrations: "Integrations",
  "use-cases": "Use cases",
  alternatives: "Tool roundups",
};

export const familyPaths: Record<SeoFamily, string> = {
  features: "/features",
  comparisons: "/comparisons",
  integrations: "/integrations",
  "use-cases": "/use-cases",
  alternatives: "/alternatives",
};

export function familyCrumbs(family: SeoFamily, slug?: string) {
  const section = familyPaths[family].slice(1);
  return slug ? articlePathCrumbs(section, slug) : articlePathCrumbs(section);
}

export function pageJsonLd(family: SeoFamily, page: SeoContentPage) {
  const path = `${familyPaths[family]}/${page.slug}`;
  const pageUrl = `${siteUrl}${path}`;
  const breadcrumbs = [
    { name: "Home", url: siteUrl },
    { name: familyLabels[family], url: `${siteUrl}${familyPaths[family]}` },
    { name: page.title, url: pageUrl },
  ];

  return [
    createWebPageJsonLd({
      name: page.title,
      description: page.description,
      url: pageUrl,
      dateModified: page.updatedDate || page.publishedDate,
    }),
    createBreadcrumbJsonLd(breadcrumbs),
    ...(page.faqItems.length > 0 ? [createFAQJsonLd(page.faqItems)] : []),
  ];
}

export function SeoPageChrome({
  jsonLdId,
  jsonLd,
  children,
}: {
  jsonLdId: string;
  jsonLd: unknown;
  children: ReactNode;
}) {
  return (
    <>
      <JsonLd id={jsonLdId} data={jsonLd} />
      {/* overflow-x-clip, not hidden: hidden makes <main> a scroll box and
          sticky sidebars (integration facts) would stop sticking. */}
      <main className="site-theme min-h-screen overflow-x-clip">
        <MarketingHeader transparentAtTop />
        {children}
        <MarketingFooter />
      </main>
    </>
  );
}

function SeoHeroCrumbs({
  crumbs,
  className = "mb-6",
}: {
  crumbs: ReadonlyArray<ArticleCrumb>;
  className?: string;
}) {
  return <ArticleCrumbs crumbs={crumbs} className={className} />;
}

export function MarkdownTwinLink({
  path,
  title,
}: {
  path: string;
  title: string;
}) {
  return (
    <p className="mt-10 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
      Prefer markdown?{" "}
      <a
        href={`${path}.md`}
        className="font-medium text-[var(--md-sys-color-primary)] underline-offset-4 hover:underline"
      >
        {title}.md
      </a>
    </p>
  );
}

export function SeoDocLayout({
  as: Tag = "div",
  crumbs,
  title,
  description,
  afterTitle,
  children,
  path,
  width = "secondary",
}: {
  as?: "div" | "article";
  crumbs: ReadonlyArray<ArticleCrumb>;
  title: string;
  description?: string;
  afterTitle?: ReactNode;
  children: ReactNode;
  path?: string;
  width?: "primary" | "moderate" | "secondary";
}) {
  // Calendly-style: the cream hero panel on top, then one centered column
  // (reading width for articles, wider for directories).
  const widthClass =
    width === "primary" ? "cal-read-wide" : width === "moderate" ? "cal-read-moderate" : "";
  return (
    <>
      <CalPageHero crumbs={crumbs} title={title} description={description} />
      <Tag className={`cal-read ${widthClass} min-w-0 text-left`}>
        {/* afterTitle is the page banner: first thing in the column. */}
        {afterTitle ? <div className="mb-14 md:mb-16">{afterTitle}</div> : null}
        <div className="space-y-14 md:space-y-16">{children}</div>
        {path ? <MarkdownTwinLink path={path} title={title} /> : null}
      </Tag>
    </>
  );
}

export function SeoTitleList({
  items,
}: {
  items: ReadonlyArray<{ href: string; label: string }>;
}) {
  return <CalLinkCards links={items} />;
}

export function SeoHero({
  title,
  description,
  actions,
  crumbs,
  media,
  fullHeight = false,
  sentence = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  crumbs?: ReadonlyArray<ArticleCrumb>;
  /** Optional hero media. Laptop and up place it on the right. */
  media?: ReactNode;
  /** Full-viewport marketing hero. Comparison and integration pages use this. */
  fullHeight?: boolean;
  /** Unused since the hero became the compact Calendly panel; kept so
   *  existing callers still type-check. */
  compact?: boolean;
  /** Smaller title and lede. Feature pages use this so longer H1s fit. */
  sentence?: boolean;
}) {
  if (fullHeight) {
    return (
      <section className="relative w-full">
        <div
          className={`relative z-10 mx-auto grid min-h-[100svh] w-full min-w-0 content-center items-center gap-10 px-4 pt-28 pb-16 sm:px-8 sm:pt-32 ${
            media
              ? "max-w-7xl lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)] lg:items-start lg:gap-10 xl:gap-12"
              : "max-w-6xl"
          }`}
        >
          <div className="min-w-0">
            {crumbs && crumbs.length > 0 ? <SeoHeroCrumbs crumbs={crumbs} /> : null}
            <h1
              className={`${sentence ? "hero-display-sentence" : "hero-display"} max-w-5xl text-[var(--md-sys-color-on-surface)]`}
            >
              {title}
            </h1>
            {description ? (
              <p
                className={
                  sentence
                    ? "mt-3 max-w-xl text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)] md:mt-4 md:text-base md:leading-7"
                    : "hero-lede mt-4 max-w-2xl text-[var(--md-sys-color-on-surface-variant)] md:mt-5"
                }
              >
                {description}
              </p>
            ) : null}
            {actions ? (
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">{actions}</div>
            ) : null}
          </div>
          {media ? <div className="hidden min-w-0 lg:mt-16 lg:block">{media}</div> : null}
        </div>
      </section>
    );
  }

  return (
    <CalPageHero crumbs={crumbs} title={title} description={description}>
      {actions ? (
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          {actions}
        </div>
      ) : null}
    </CalPageHero>
  );
}

export function SeoArticle({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-0 mx-auto w-full min-w-0 max-w-6xl space-y-12 px-4 py-12 sm:px-8 sm:py-16">
      {children}
    </div>
  );
}

export function SeoBanner({
  src,
  alt,
  width = 1672,
  height = 941,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}) {
  return (
    <figure className="overflow-hidden rounded-[24px] bg-[var(--cal-surface)] shadow-[var(--cal-shadow)]">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 1280px) 1152px, calc(100vw - 2rem)"
        className="h-auto w-full"
        priority
        unoptimized={isSanityCdnUrl(src)}
      />
    </figure>
  );
}

export function SetupSteps({ steps }: { steps: ReadonlyArray<{ title: string; description: string }> }) {
  if (steps.length === 0) return null;
  return (
    <section id="setup-steps">
      <h2 className="cal-read-h2">Setup</h2>
      {/* Step cards in a grid with a big step number, so setup reads at a
          glance instead of as a stacked list. */}
      <ol className="cal-steps-grid mt-6">
        {steps.map((step, index) => {
          return (
            <li key={step.title} className="cal-step-card">
              <span className="cal-step-num" aria-hidden="true">
                {index + 1}
              </span>
              <p className="font-medium text-[var(--site-text)]">
                {linkifyProducts(step.title)}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--cal-muted)]">
                {linkifyProducts(step.description)}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function LandingShot({
  href,
  src,
  alt,
  label,
}: {
  href: string;
  src: string;
  alt: string;
  label: string;
}) {
  const host = new URL(href).hostname.replace(/^www\./, "");
  return (
    <figure className="m-0 overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
      <a href={href} target="_blank" rel="noopener" className="block no-underline">
        <Image
          src={src}
          alt={alt}
          width={1440}
          height={900}
          className="h-auto w-full"
          sizes="(min-width: 1024px) 560px, calc(100vw - 32px)"
        />
      </a>
      <figcaption className="flex items-center justify-between gap-3 border-t border-[var(--md-sys-color-outline-variant)] px-4 py-3">
        <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{label}</span>
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className="shrink-0 text-sm font-medium text-blue-600 no-underline hover:underline"
        >
          Visit {host}
        </a>
      </figcaption>
    </figure>
  );
}

export function RelatedLinks({ links }: { links: SeoRelatedLink[] }) {
  if (links.length === 0) return null;
  return (
    <section id="related">
      <h2 className="cal-read-h2">Related</h2>
      <div className="mt-6">
        <CalLinkCards links={links} />
      </div>
    </section>
  );
}

export function FaqBlock({
  page,
  branded = false,
}: {
  page: SeoContentPage;
  branded?: boolean;
}) {
  if (page.faqItems.length === 0) return null;
  return (
    <section id="faq">
      <h2 className="cal-read-h2">Frequently asked questions</h2>
      <div className={branded ? "mt-6 md:mt-8" : "mt-4"}>
        <FaqAccordion
          items={page.faqItems.map((item) => ({
            question: linkifyProducts(item.question),
            answer: linkifyProducts(item.answer),
          }))}
        />
      </div>
    </section>
  );
}

export function SectionProse({
  page,
  skipIds = [],
}: {
  page: SeoContentPage;
  skipIds?: string[];
}) {
  return (
    <>
      {page.sections
        .filter((section) => !skipIds.includes(section.id))
        .map((section) => (
          <ArticleSection
            key={section.id}
            id={section.id}
            heading={section.heading}
            paragraphs={section.paragraphs}
            bullets={section.bullets}
            code={section.code}
            codeLabel={
              agentPasteTarget(page.slug) && `Paste into ${agentPasteTarget(page.slug)}`
            }
          />
        ))}
    </>
  );
}

/** A section's body without its heading: paragraphs, a checklist for any
 *  bullets, and a prompt box for code. Shared by ArticleSection and the
 *  feature page's cards. */
export function SectionBody({
  id,
  paragraphs,
  bullets,
  code,
  codeLabel,
  className = "",
}: {
  id: string;
  paragraphs: string[];
  bullets?: string[];
  code?: string;
  codeLabel?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-4 text-left ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={`${id}-p-${index}`}>{linkifySeoCopy(paragraph)}</p>
      ))}
      {bullets && bullets.length > 0 ? (
        <ul className="cal-checklist">
          {bullets.map((bullet, index) => (
            <li key={`${id}-b-${index}`}>{linkifySeoCopy(bullet)}</li>
          ))}
        </ul>
      ) : null}
      {code ? (
        codeLabel ? <PromptCopyBox prompt={code} label={codeLabel} /> : <PromptCopyBox prompt={code} />
      ) : null}
    </div>
  );
}

export function ArticleSection({
  id,
  heading,
  paragraphs,
  bullets,
  code,
  codeLabel,
}: {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  code?: string;
  codeLabel?: string;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="cal-read-h2 text-left">{heading}</h2>
      <SectionBody
        id={id}
        paragraphs={paragraphs}
        bullets={bullets}
        code={code}
        codeLabel={codeLabel}
        className="mt-5 text-base leading-8 text-[var(--md-sys-color-on-surface)]"
      />
    </section>
  );
}

export function CtaBlock({
  page,
  title,
  body,
  boxed = false,
}: {
  page: SeoContentPage;
  title: string;
  body: string;
  boxed?: boolean;
}) {
  const primary = page.primaryCta ?? { label: "Start with Omentir", href: "/signup" };
  const secondary = page.secondaryCta ?? { label: "See pricing", href: "/pricing" };
  // Same rounded closing panel either way; `boxed` only tightens the gap
  // above it on pages that already end in a card.
  return (
    <section aria-label="Get started" className={`cal-cta-panel ${boxed ? "!mt-0" : ""}`}>
      <h2 className="cal-read-h2">{title}</h2>
      <p className="cal-lead">{body}</p>
      <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
        <Link href={primary.href} className="site-btn site-btn-primary w-full sm:w-auto">
          {primary.label}
        </Link>
        <Link href={secondary.href} className="site-btn site-btn-outline w-full sm:w-auto">
          {secondary.label}
        </Link>
      </div>
    </section>
  );
}

export function HeroActions({
  primary,
  secondary,
}: {
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}) {
  return (
    <>
      <Link href={primary.href} className="site-btn site-btn-primary w-full sm:w-auto">
        {primary.label}
      </Link>
      <Link
        href={secondary.href}
        className="site-btn site-btn-outline w-full sm:w-auto"
      >
        {secondary.label}
      </Link>
    </>
  );
}
