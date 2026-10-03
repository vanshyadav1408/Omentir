import Link from "next/link";
import { hostedContactEmail, hostedGithubRepo } from "@/lib/hosted-identity";
import type { ReactNode } from "react";
import { LinkedInMark, XMark } from "./brand-marks";
import IntegrationLogo from "./integrations/integration-logo";
import LogoMark from "./logo-mark";
import SiteThemeToggle from "./site-theme-toggle";

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
    ["Meta Muse outbound", "/use-cases/meta-muse-outbound"],
    ["OpenAI Dots outbound", "/use-cases/openai-dots-outbound"],
    ["Manus Cue outbound", "/use-cases/manus-cue-outbound"],
    ["Claude Code outbound", "/use-cases/claude-code-outbound"],
    ["Cursor outbound", "/use-cases/cursor-outbound"],
    ["Codex outbound", "/use-cases/codex-outbound"],
    ["Book LinkedIn demos", "/use-cases/book-linkedin-demos"],
    ["Blogs", "/blogs"],
    ["Guides", "/guides"],
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
    ["Meta Muse", "/integrations/meta-muse"],
    ["OpenAI Dots", "/integrations/openai-dots"],
    ["Manus Cue", "/integrations/manus-cue"],
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
    ["Meta Muse Alternatives", "/alternatives/meta-muse"],
    ["OpenAI Dots Alternatives", "/alternatives/openai-dots"],
    ["Manus Cue Alternatives", "/alternatives/manus-cue"],
  ],
];

// Hosted product brand links: intentional in source (public website identity).
// Local mode never renders marketing shell (non-app routes 404).
const footerSocialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/121943897" },
  { label: "X", href: "https://x.com/OmentirAI" },
  { label: "GitHub", href: `https://github.com/${hostedGithubRepo()}` },
  { label: "Product Hunt", href: "https://www.producthunt.com/products/omentir" },
  { label: "Email", href: `mailto:${hostedContactEmail()}` },
];

type Column = (typeof footerColumns)[number];
const byHeading = (heading: string) => footerColumns.find(([h]) => h === heading) as Column;

/** Same links as the site footer, stacked into three columns. */
const COLUMNS: Column[][] = [
  [byHeading("Product")],
  [byHeading("Integrations"), byHeading("Company")],
  [byHeading("Alternatives")],
];

const WORKS_WITH = ["claude", "chatgpt", "cursor", "claude-code", "codex", "mcp", "rest-api"];

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function ProductHuntMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm1.6 13.8H10.2V18H7.8V6h5.8a3.9 3.9 0 0 1 0 7.8Zm0-5.4H10.2v3h3.4a1.5 1.5 0 0 0 0-3Z" />
    </svg>
  );
}

function MailMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </svg>
  );
}

const SOCIAL_ICONS: Record<string, (props: { className?: string }) => ReactNode> = {
  LinkedIn: LinkedInMark,
  X: XMark,
  GitHub: GithubMark,
  "Product Hunt": ProductHuntMark,
  Email: MailMark,
};

/** Marketing footer: a navy card with a statement and wordmark on the left,
 *  grouped link columns on the right, then integrations, social links and
 *  the legal row. */
export default function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="cal-footer-wrap">
      <div className="cal-footer">
        <div className="cal-footer-top">
          <div className="cal-footer-brand">
            <p className="cal-footer-statement">More calls with the right people.</p>
            <Link href="/" className="cal-footer-wordmark" aria-label="Omentir home">
              <LogoMark className="h-11 w-11 md:h-14 md:w-14" />
              <span>Omentir</span>
            </Link>
          </div>
          <div className="cal-footer-columns">
            {COLUMNS.map((groups, i) => (
              <div key={i} className="cal-footer-column">
                {groups.map(([heading, ...links]) => (
                  <div key={heading}>
                    <h3 className="cal-footer-heading">{heading}</h3>
                    <ul className="cal-footer-links">
                      {links.map(([label, href]) => (
                        <li key={href}>
                          <Link href={href}>{label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="cal-footer-row">
          <div>
            <p className="cal-footer-label">Works with</p>
            <ul className="cal-footer-tiles is-logos">
              {WORKS_WITH.map((slug) => (
                <li key={slug}>
                  <Link href={`/integrations/${slug}`} className="cal-footer-tile">
                    <IntegrationLogo slug={slug} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="cal-footer-social">
            <p className="cal-footer-label">Join us on social</p>
            <ul className="cal-footer-tiles">
              {footerSocialLinks.map((item) => {
                const Icon = SOCIAL_ICONS[item.label];
                return (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      aria-label={item.label}
                      {...(item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="cal-footer-tile"
                    >
                      {Icon ? <Icon className="h-5 w-5" /> : item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="cal-footer-legal">
          <SiteThemeToggle />
          <nav aria-label="Legal" className="cal-footer-legal-links">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-service">Terms of Service</Link>
            <Link href="/minimum-booking-guarantee">Minimum Booking Guarantee</Link>
          </nav>
          <p>&copy; {year} Omentir. Open Source, MIT licensed.</p>
        </div>
      </div>
    </footer>
  );
}
