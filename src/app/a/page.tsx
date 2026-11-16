import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowIcon } from "../hero-cta-controls";
import { MarketingFooter, MarketingHeader } from "../marketing-shell";
import { createPageMetadata } from "../seo";
import {
  ALWAYS_ON,
  DECK_CLOSE,
  DECK_HERO,
  DECK_META,
  DECK_PATH,
  FEATURES,
  MCP_URL,
  SAFETY,
  SETUP_GUIDES,
  SOURCE_LINK,
  STEPS,
  STEPS_HEADING,
  WHY,
  type Statement,
} from "./agents-deck-data";
import AgentsMotion from "./agents-motion";
import "./agents-deck.css";

/** /a: "Omentir for AI agents". Same minimal shape as the homepage: a sky
 *  hero, a statement that lights up as you scroll, centered sections that
 *  build in, and one pinned section that steps through what it does.
 *  AgentsMotion sets `--p`, `data-step` and `data-in`; agents-deck.css does
 *  the rest. Copy lives in agents-deck-data.ts (shared with /a.md). The
 *  sample cards are decoration and hidden from assistive tech. */

export const metadata = createPageMetadata({
  title: DECK_META.title,
  description: DECK_META.description,
  path: DECK_PATH,
  keywords: [
    "ChatGPT LinkedIn outreach",
    "Claude MCP lead generation",
    "AI sales agent MCP",
    "LinkedIn outreach from ChatGPT",
  ],
});

const WHY_WORDS = WHY.split(" ");

/** `--i` orders a part's entrance inside its section. */
function order(i: number) {
  return { "--i": i } as CSSProperties;
}

function StatementHeading({ statement, id }: { statement: Statement; id?: string }) {
  return (
    <h2 id={id} className="ag-say">
      {statement.lead}
      <br />
      <span>{statement.rest}</span>
    </h2>
  );
}

export default function AgentsLandingPage() {
  return (
    <main className="site-theme ag-page min-h-screen" data-ag-page="">
      <MarketingHeader transparentAtTop />
      <AgentsMotion />

      <section className="ag-hero" aria-labelledby="ag-hero-h">
        <div className="ag-sky">
          <i className="ag-cloud ag-cloud-1" aria-hidden="true" />
          <i className="ag-cloud ag-cloud-2" aria-hidden="true" />
          <h1 id="ag-hero-h" className="ag-enter" style={order(0)}>
            {DECK_HERO.title}
          </h1>
          <p className="ag-enter" style={order(1)}>
            {DECK_HERO.sub}
          </p>
          {/* nx-hero-cta: the homepage hero's button styles (globals.css). */}
          <div className="ag-cta nx-hero-cta ag-enter" style={order(2)}>
            <Link href="/signup" className="site-btn site-btn-primary">
              Get started
            </Link>
            <Link href="#how" className="site-btn site-btn-secondary">
              See how it works
              <ArrowIcon />
            </Link>
          </div>
          <a href="#how" className="ag-down">
            Scroll
            <svg viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3 5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>

      {/* Lights up word by word while it is pinned. */}
      <section className="ag-why-act" data-ag-act="">
        <div className="ag-pin">
          <h2 className="ag-why" style={{ "--n": WHY_WORDS.length } as CSSProperties}>
            {WHY_WORDS.map((word, i) => (
              <span key={i} style={order(i)}>
                {word}{" "}
              </span>
            ))}
          </h2>
        </div>
      </section>

      <section id="how" className="ag-slide" aria-labelledby="ag-how-h" data-ag-reveal="">
        <div className="ag-block">
          <StatementHeading statement={STEPS_HEADING} id="ag-how-h" />
          <ol className="ag-steps">
            {STEPS.map((step, i) => (
              <li key={step.word} className="ag-in" style={order(i + 1)}>
                <small>{step.where}</small>
                <b>{step.word}</b>
                <span>{step.note}</span>
                {i === 1 ? <code className="ag-url">{MCP_URL.replace(/^https?:\/\//, "")}</code> : null}
              </li>
            ))}
          </ol>
          <p className="ag-note ag-in" style={order(5)}>
            Setup guides:{" "}
            {SETUP_GUIDES.map((guide, i) => (
              <span key={guide.href}>
                <Link href={guide.href}>{guide.name}</Link>
                {i < SETUP_GUIDES.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* Pinned: one feature per step, the text on the left, its card on the right. */}
      <section
        className="ag-feats-act"
        data-ag-act=""
        data-ag-steps={FEATURES.length}
        data-step="0"
        aria-labelledby="ag-feats-h"
      >
        <div className="ag-pin">
          <div className="ag-feats">
            <h2 id="ag-feats-h" className="ag-eyebrow">
              What it does
            </h2>
            <ol className="ag-dots" aria-hidden="true">
              {FEATURES.map((feature) => (
                <li key={feature.title} />
              ))}
            </ol>
            {FEATURES.map((feature) => (
              <article key={feature.title} className="ag-feat">
                <div className="ag-feat-text">
                  <h3>{feature.title}</h3>
                  <p>{feature.note}</p>
                </div>
                <div className="ag-card" aria-hidden="true">
                  <p className="ag-card-k">{feature.label}</p>
                  <ul>
                    {feature.rows.map(([name, detail, value], i) => (
                      <li key={name} style={order(i)}>
                        <span>{name}</span>
                        <span>{detail}</span>
                        <b>{value}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ag-slide" data-ag-reveal="">
        <div className="ag-block">
          <StatementHeading statement={ALWAYS_ON} />
          <ul className="ag-steps ag-facts">
            {ALWAYS_ON.facts.map((fact, i) => (
              <li key={fact.word} className="ag-in" style={order(i + 1)}>
                <b>{fact.word}</b>
                <span>{fact.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ag-slide" data-ag-reveal="">
        <div className="ag-block">
          <StatementHeading statement={SAFETY} />
          <p className="ag-note ag-in" style={order(1)}>
            <a href={SOURCE_LINK.href} target="_blank" rel="noopener noreferrer">
              {SOURCE_LINK.label}
            </a>
          </p>
        </div>
      </section>

      <section className="ag-slide" aria-labelledby="ag-end-h" data-ag-reveal="">
        <div className="ag-block">
          <h2 id="ag-end-h" className="ag-say">
            {DECK_CLOSE.title}
          </h2>
          <p className="ag-note ag-in" style={order(1)}>
            {DECK_CLOSE.sub}
          </p>
          <div className="ag-cta ag-in" style={order(2)}>
            <Link href="/signup" className="site-btn site-btn-primary">
              Get started
            </Link>
            <Link href="/demo" className="site-btn site-btn-outline">
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
