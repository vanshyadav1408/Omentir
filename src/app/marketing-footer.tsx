import Link from "next/link";
import { hostedContactEmail, hostedGithubRepo } from "@/lib/hosted-identity";

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
    ["Security", "/security"],
    ["LinkedIn Account Safety", "/linkedin-account-safety"],
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

const WORKS_WITH: Array<[label: string, slug: string]> = [
  ["Claude", "claude"],
  ["ChatGPT", "chatgpt"],
  ["Cursor", "cursor"],
  ["Claude Code", "claude-code"],
  ["Codex", "codex"],
  ["MCP", "mcp"],
  ["REST API", "rest-api"],
];

/** Marketing footer: a flat pale band (dark band in dark mode) with a
 *  statement and wordmark on the left, grouped link columns on the right,
 *  then text-only integration and social links and the legal row. */
export default function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="cal-footer-wrap">
      <div className="cal-footer">
        <div className="cal-footer-top">
          <div className="cal-footer-brand">
            <p className="cal-footer-statement">More calls with the right people.</p>
            <Link href="/" className="cal-footer-wordmark">
              Omentir
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
          <p className="cal-footer-inline">
            <span className="cal-footer-label">Works with</span>
            {WORKS_WITH.map(([label, slug]) => (
              <Link key={slug} href={`/integrations/${slug}`}>
                {label}
              </Link>
            ))}
          </p>
          <p className="cal-footer-inline">
            <span className="cal-footer-label">Follow</span>
            {footerSocialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                {...(item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {item.label}
              </a>
            ))}
          </p>
        </div>

        <div className="cal-footer-legal">
          <nav aria-label="Legal" className="cal-footer-legal-links">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-service">Terms of Service</Link>
            <Link href="/minimum-booking-guarantee">Minimum Booking Guarantee</Link>
            <Link href="/security">Security</Link>
          </nav>
          <p>&copy; {year} Omentir. Open Source, MIT licensed.</p>
        </div>
      </div>
    </footer>
  );
}
