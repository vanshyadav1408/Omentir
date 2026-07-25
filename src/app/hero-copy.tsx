import type { ReactNode } from "react";
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

export default function HeroCopy({ children }: { children: ReactNode }) {
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

          /* The audience words carry the hero's only emphasis, so they get the
             seed pink and a heavier weight. Nowrap keeps each phrase on one
             line rather than splitting "Sales Teams" across the wrap. Deep
             seed pink in both themes — no pastel remap in dark, same as
             .hero-brand-word below. The connecting "and" stays body ink. */
          .hero-audience {
            color: #ba3871;
            font-weight: 700;
            white-space: nowrap;
          }

          /* "customers" keeps the deep seed pink in both themes. It gets its
             own class rather than .text-gradient-brand because the dark theme
             remaps that class to the pastel primary with !important — this
             word is meant to stay the darker pink instead. */
          .hero-brand-word {
            color: #ba3871;
          }
        `}
      </style>
      {/* .hero-display / .hero-lede own the face, weight, tracking and the
          responsive steps (globals.css) - this hero is the reference every other
          marketing hero uses, so the scale lives there rather than here. */}
      <h1 className="hero-display hero-enter w-full max-w-5xl text-[var(--md-sys-color-on-surface)]">
        <span className="block whitespace-nowrap">
          Convert <LinkedInLogo /> users
        </span>
        <span className="block whitespace-nowrap">
          into your{" "}
          <span className="hero-brand-word">customers</span>
        </span>
      </h1>
      <p className="hero-lede hero-enter hero-enter-delay-1 mt-4 max-w-2xl text-[var(--md-sys-color-on-surface-variant)] md:mt-6">
        For <span className="hero-audience">Solo Founders</span>,{" "}
        <span className="hero-audience">Agencies</span> and{" "}
        <span className="hero-audience">Sales Teams</span> who want to automate
        LinkedIn outreach, reach 1000+ leads weekly, and book more meetings.
      </p>
      {children}
    </>
  );
}
