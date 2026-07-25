import type { ReactNode } from "react";
import AgentTypewriter from "./agent-typewriter";
import LinkedInWordmark from "./linkedin-wordmark";

/** The lockup replaces the word "LinkedIn" in the headline, so the word itself
    stays in the markup for crawlers and screen readers via an sr-only span and
    the logo renders aria-hidden alongside it. */
function LinkedInLogo() {
  return (
    <>
      <span className="sr-only">LinkedIn</span>
      <LinkedInWordmark aria-hidden="true" className="hero-linkedin-wordmark" />
    </>
  );
}

export default function HeroCopyToggle({ children }: { children: ReactNode }) {
  return (
    <>
      <style>
        {`
          /* Sized and aligned against the headline face rather than by eye: the
             lockup's cap height is 0.7126 of its box and the face's is 0.716em,
             so 1em tall matches "Convert" exactly. Its letter baseline sits
             84.87% down the box, so the plate overhangs the baseline by the
             remaining 0.151em — vertical-align drops it by that much to put the
             logo's letters on the text baseline instead of the plate's bottom.

             Colour is set here rather than with colour utilities because the
             dark theme remaps blue text utilities globally. */
          .hero-linkedin-wordmark {
            color: #0a66c2;
            display: inline-block;
            height: 1em;
            margin: 0 0.1em;
            vertical-align: -0.151em;
            width: auto;
          }

          /* Dark: keep the brand blue, but paint the "in" counters white so the
             bug stays blue-plate-on-white rather than knocking through to the
             page. */
          html.dark .hero-linkedin-wordmark {
            color: #2f80e8;
          }

          html.dark .hero-linkedin-wordmark .li-in {
            fill: #ffffff;
          }

          .hero-outreach-agentic-copy {
            display: none;
          }

          .hero-outreach-toggle:checked ~ .hero-outreach-normal-copy {
            display: none;
          }

          .hero-outreach-toggle:checked ~ .hero-outreach-agentic-copy {
            display: contents;
          }

          .hero-outreach-switch-row,
          .hero-outreach-mode-label {
            font-family: var(--font-google-sans), var(--font-roboto), "Helvetica Neue", Arial, sans-serif;
            font-weight: 500;
          }

          .hero-outreach-mode-label {
            align-items: center;
            color: var(--md-sys-color-text-disabled);
            display: inline-flex;
            height: 1.35rem;
            line-height: 1;
            transform: translateY(0.1rem);
            transition: color 200ms cubic-bezier(0.2, 0, 0, 1);
          }

          .hero-outreach-toggle:not(:checked) ~ .hero-outreach-switch-row .hero-outreach-normal-label,
          .hero-outreach-toggle:checked ~ .hero-outreach-switch-row .hero-outreach-agentic-label {
            color: var(--md-sys-color-on-surface);
          }

          .hero-outreach-track {
            background: var(--md-sys-color-outline-variant);
            height: 1.35rem;
            transition: background-color 200ms cubic-bezier(0.2, 0, 0, 1);
          }

          .hero-outreach-knob {
            height: 1.125rem;
            box-shadow:
              0 1px 3px 0 rgba(0, 0, 0, 0.1),
              0 1px 2px -1px rgba(0, 0, 0, 0.1);
            transform: translateX(0.125rem);
            transition: transform 200ms cubic-bezier(0.2, 0, 0, 1);
            width: 1.125rem;
          }

          .hero-outreach-toggle:focus-visible ~ .hero-outreach-switch-row .hero-outreach-track {
            outline: 2px solid var(--md-sys-color-on-surface);
            outline-offset: 3px;
          }

          .hero-outreach-toggle:checked ~ .hero-outreach-switch-row .hero-outreach-track {
            background: var(--md-sys-color-primary);
          }

          .hero-outreach-toggle:checked ~ .hero-outreach-switch-row .hero-outreach-knob {
            transform: translateX(1.5rem);
          }
        `}
      </style>
      <input
        id="hero-outreach-mode"
        type="checkbox"
        className="hero-outreach-toggle sr-only"
      />
      <div className="hero-outreach-normal-copy contents">
        <h1
          style={{ fontFamily: "var(--font-google-sans)" }}
          className="hero-enter w-full max-w-5xl text-[clamp(1.5rem,7vw,1.75rem)] leading-[1.15] font-bold tracking-tight text-[var(--md-sys-color-on-surface)] md:text-5xl md:leading-tight lg:text-6xl lg:leading-tight"
        >
          <span className="block whitespace-nowrap">
            Convert <LinkedInLogo /> users
          </span>
          <span className="block whitespace-nowrap">
            into your{" "}
            <span className="text-gradient-brand">customers</span>
          </span>
        </h1>
        <p
          style={{ fontFamily: "var(--font-roboto)" }}
          className="hero-enter hero-enter-delay-1 mt-4 max-w-2xl text-[0.9375rem] leading-6 text-[var(--md-sys-color-on-surface-variant)] md:mt-6 md:text-base md:leading-8 lg:text-lg"
        >
          Omentir continuously scans LinkedIn for users showing intent signals,
          flags the profiles which match your ideal customer profile, and
          reaches out them to sell your product.
        </p>
      </div>
      <div className="hero-outreach-agentic-copy">
        {/* Both copy variants render server-side and are swapped with CSS, so a
            second <h1> here would put two of them in the crawled markup and split
            the page's strongest on-page signal. The normal-outreach copy above
            owns the only <h1>; this variant carries the same heading semantics
            for assistive tech via role/aria-level, which search parsers ignore. */}
        <div
          role="heading"
          aria-level={1}
          style={{ fontFamily: "var(--font-google-sans)" }}
          className="hero-enter w-full max-w-5xl text-[clamp(1.5rem,7vw,1.75rem)] leading-[1.15] font-bold tracking-tight text-[var(--md-sys-color-on-surface)] md:text-5xl md:leading-tight lg:text-6xl lg:leading-tight"
        >
          <span className="block whitespace-nowrap">
            Run <LinkedInLogo /> outreach
          </span>
          <span className="block whitespace-nowrap">
            with{" "}
            <AgentTypewriter
              agents={["OpenClaw", "Cursor", "ChatGPT", "Hermes Agent", "Gemini"]}
            />
          </span>
        </div>
        <p
          style={{ fontFamily: "var(--font-roboto)" }}
          className="hero-enter hero-enter-delay-1 mt-4 max-w-2xl text-[0.9375rem] leading-6 text-[var(--md-sys-color-on-surface-variant)] md:mt-6 md:text-base md:leading-8 lg:text-lg"
        >
          Ask your Claude, ChatGPT, OpenClaw, Hermes, Cursor, or any agent to
          scan LinkedIn, find buyers with intent signals, and contact them on
          your behalf.
        </p>
      </div>
      {children}
      <label
        htmlFor="hero-outreach-mode"
        className="hero-outreach-switch-row hero-enter hero-enter-delay-2 mt-10 inline-flex w-full max-w-sm cursor-pointer items-center justify-center gap-1.5 px-1 md:mt-12 md:w-fit md:gap-2 md:px-0"
      >
        <span className="hero-outreach-mode-label hero-outreach-normal-label text-xs font-semibold">
          Normal outreach
        </span>
        <span
          aria-hidden="true"
          className="hero-outreach-track relative inline-flex w-11 shrink-0 items-center rounded-full"
        >
          <span className="hero-outreach-knob inline-block rounded-full bg-white transition-transform duration-200" />
        </span>
        <span className="hero-outreach-mode-label hero-outreach-agentic-label text-xs font-semibold">
          Agentic outreach
        </span>
      </label>
    </>
  );
}
