import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { linkifyProducts } from "./product-links";
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
  HeroGridBackdrop,
  MarketingFooter,
  MarketingHeader,
} from "../marketing-shell";

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
      <main className="min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
        <MarketingHeader transparentAtTop />
        {children}
        <MarketingFooter />
      </main>
    </>
  );
}

function SeoHeroCrumbs({
  crumbs,
}: {
  crumbs: ReadonlyArray<{ label: string; href?: string }>;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]"
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

export function SeoHero({
  title,
  description,
  actions,
  crumbs,
  media,
  fullHeight = false,
  compact = false,
  sentence = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  crumbs?: ReadonlyArray<{ label: string; href?: string }>;
  /** Optional hero media. Laptop and up place it on the right. */
  media?: ReactNode;
  /** Full-viewport marketing hero. Comparison and integration pages use this. */
  fullHeight?: boolean;
  /** Title and lede stay in the hero, without filling half the viewport. */
  compact?: boolean;
  /** Smaller title and lede. Feature pages use this so longer H1s fit. */
  sentence?: boolean;
}) {
  if (fullHeight) {
    return (
      <section className="relative w-full">
        <HeroGridBackdrop height="h-[130vh]" />
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
    <section className="relative w-full border-b border-[var(--md-sys-color-outline-variant)]">
      <HeroGridBackdrop height="h-full" />
      <div
        className={`grid w-full ${compact ? "" : "min-h-[52vh] sm:min-h-[58vh]"}`}
        style={{ gridTemplate: '"hero" 1fr / 1fr' }}
      >
        <div
          className="relative z-10 flex min-w-0 flex-col justify-center pb-12 pt-28 sm:pb-16 sm:pt-36 lg:pt-40"
          style={{ gridArea: "hero" }}
        >
          <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col items-start px-4 text-left sm:px-8">
            {crumbs && crumbs.length > 0 ? <SeoHeroCrumbs crumbs={crumbs} /> : null}
            <h1
              style={{ fontFamily: "var(--font-varta)" }}
              className="w-full min-w-0 max-w-5xl text-[2rem] font-semibold leading-[1.12] tracking-tight text-[var(--md-sys-color-on-surface)] min-[380px]:text-[2.25rem] sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight"
            >
              {title}
            </h1>
            {description ? (
              <p className="mt-6 w-full min-w-0 max-w-3xl text-base leading-8 text-[var(--md-sys-color-on-surface-variant)] sm:text-lg">
                {description}
              </p>
            ) : null}
            {actions ? (
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                {actions}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
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
    <figure className="overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 1280px) 1152px, calc(100vw - 2rem)"
        className="h-auto w-full"
        priority
      />
    </figure>
  );
}

export function SetupSteps({ steps }: { steps: ReadonlyArray<{ title: string; description: string }> }) {
  if (steps.length === 0) return null;
  return (
    <section id="setup-steps">
      <h2
        style={{ fontFamily: "var(--font-varta)" }}
        className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
      >
        Setup
      </h2>
      <ol className="mt-6 space-y-4">
        {steps.map((step, index) => {
          const seen = new Set<string>();
          return (
          <li
            key={step.title}
            className="grid gap-3 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-5 sm:grid-cols-[auto_1fr] sm:gap-5"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--md-sys-color-primary)] text-sm font-semibold text-[var(--md-sys-color-on-primary)]">
              {index + 1}
            </span>
            <div>
              <p className="font-semibold text-[var(--md-sys-color-on-surface)]">
                {linkifyProducts(step.title, seen)}
              </p>
              <p className="mt-1 text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)]">
                {linkifyProducts(step.description, seen)}
              </p>
            </div>
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
      <h2
        style={{ fontFamily: "var(--font-varta)" }}
        className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
      >
        Related
      </h2>
      <ul className="mt-6 divide-y divide-[var(--md-sys-color-outline-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="group block py-4">
              <span className="font-semibold text-[var(--md-sys-color-on-surface)] transition-colors group-hover:text-[var(--md-sys-color-primary)]">
                {link.label}
              </span>
              {link.description ? (
                <span className="mt-1 block text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
                  {link.description}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FaqBlock({ page }: { page: SeoContentPage }) {
  if (page.faqItems.length === 0) return null;
  return (
    <section id="faq">
      <h2
        style={{ fontFamily: "var(--font-varta)" }}
        className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
      >
        Frequently asked questions
      </h2>
      <div className="mt-2">
        <FaqAccordion
          items={page.faqItems.map((item) => {
            const seen = new Set<string>();
            return {
              question: linkifyProducts(item.question, seen),
              answer: linkifyProducts(item.answer, seen),
            };
          })}
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
          />
        ))}
    </>
  );
}

export function ArticleSection({
  id,
  heading,
  paragraphs,
  bullets,
}: {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}) {
  const seen = new Set<string>();
  return (
    <section id={id} className="scroll-mt-28">
      <h2
        style={{ fontFamily: "var(--font-varta)" }}
        className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
      >
        {heading}
      </h2>
      <div className="mt-5 space-y-4 text-base leading-8 text-[var(--md-sys-color-on-surface)]">
        {paragraphs.map((paragraph, index) => (
          <p key={`${id}-p-${index}`}>{linkifyProducts(paragraph, seen)}</p>
        ))}
        {bullets && bullets.length > 0 ? (
          <ul className="list-disc space-y-2 pl-5 text-[var(--md-sys-color-on-surface-variant)]">
            {bullets.map((bullet, index) => (
              <li key={`${id}-b-${index}`} className="leading-7">
                {linkifyProducts(bullet, seen)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export function CtaBlock({
  page,
  title,
  body,
}: {
  page: SeoContentPage;
  title: string;
  body: string;
}) {
  const primary = page.primaryCta ?? { label: "Start with Omentir", href: "/signup" };
  const secondary = page.secondaryCta ?? { label: "See pricing", href: "/pricing" };
  return (
    <section
      aria-label="Get started"
      className="border-t border-[var(--md-sys-color-outline-variant)] pt-10"
    >
      <h2
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
      >
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-base leading-7 text-[var(--md-sys-color-on-surface-variant)]">
        {body}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href={primary.href} className="m3-btn m3-btn-filled w-full sm:w-auto">
          {primary.label}
        </Link>
        <Link
          href={secondary.href}
          className="m3-btn m3-btn-outlined h-12 w-full px-6 text-sm font-semibold sm:w-auto"
        >
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
      <Link href={primary.href} className="m3-btn m3-btn-filled m3-btn--hero w-full sm:w-auto">
        {primary.label}
      </Link>
      <Link
        href={secondary.href}
        className="m3-btn m3-btn-outlined m3-btn--hero w-full sm:w-auto"
      >
        {secondary.label}
      </Link>
    </>
  );
}
