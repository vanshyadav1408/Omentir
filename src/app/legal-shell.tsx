import Link from "next/link";
import type { ReactNode } from "react";
import { CalPageHero, MarketingFooter, MarketingHeader } from "./marketing-shell";

// One layout for every legal and trust page: cream hero with the "Last
// updated" line and a switcher between the documents, then a plain reading
// column of numbered sections. No sign-up box on these pages.

export type LegalSection = { title: string; paragraphs: ReactNode[] };

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Security", href: "/security" },
  { label: "LinkedIn account safety", href: "/linkedin-account-safety" },
  { label: "Booking guarantee", href: "/minimum-booking-guarantee" },
];

export function LegalShell({
  path,
  title,
  updated,
  lede,
  sections,
}: {
  path: string;
  title: string;
  updated?: string;
  lede?: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <main className="site-theme min-h-screen overflow-x-hidden">
      <MarketingHeader transparentAtTop />
      <CalPageHero title={title}>
        {updated ? <p className="cal-page-meta">Last updated {updated}</p> : null}
        <nav aria-label="Legal" className="mt-6">
          <ul className="flex flex-wrap justify-center gap-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={link.href === path ? "page" : undefined}
                  className="cal-filter-pill inline-block"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </CalPageHero>

      <article className="site-legal-body cal-read">
        {lede ? <p>{lede}</p> : null}
        {sections.map((section, index) => (
          <section key={section.title} className="mt-8">
            <h2>
              {index + 1}. {section.title}
            </h2>
            {section.paragraphs.map((paragraph, i) => (
              <p key={i} className="mt-3">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
      <MarketingFooter />
    </main>
  );
}
