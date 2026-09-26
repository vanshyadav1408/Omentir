import Link from "next/link";
import type { ReactNode } from "react";
import {
  MockInboxScreen,
  MockLeadsScreen,
} from "./home-product-mock";
import Reveal from "./scroll-reveal";

export const homeSlides = [
  {
    id: "find",
    title: "Find people who match your buyer profile",
    body: "Agents search LinkedIn and score every lead against your ideal customer profile.",
    link: { label: "Learn about lead finders", href: "/features/lead-finders" },
  },
  {
    id: "message",
    title: "Automated outreach with human-sounding AI texts",
    body: "Connection requests, messages and follow-ups go out from your own account, inside daily limits.",
    link: { label: "Learn about AI outreach", href: "/features/ai-linkedin-outreach" },
  },
  {
    id: "book",
    title: "Manage all the outreach conversations in one UI",
    body: "Every reply lands in one inbox, sorted by intent.",
    link: { label: "Learn about the unified inbox", href: "/features/unified-inbox" },
  },
] as const;

function Slide({
  copy,
  flip,
  draw,
  live,
}: {
  copy: (typeof homeSlides)[number];
  flip?: boolean;
  draw: ReactNode;
  live?: boolean;
}) {
  return (
    <article className={`home-green-panel home-slide${flip ? " is-flip" : ""}`}>
      <div className="home-slide-copy">
        <h3>{copy.title}</h3>
        <p className="home-slide-body">{copy.body}</p>
        <div className="home-slide-links">
          <Link href={copy.link.href} className="home-slide-link">
            {copy.link.label} &rarr;
          </Link>
        </div>
      </div>
      <div className="home-slide-rule" aria-hidden="true" />
      <div className="home-slide-draw" aria-hidden={live ? undefined : true}>
        {draw}
      </div>
    </article>
  );
}

export default function HomeCapabilitySlides() {
  return (
    <section
      id="features"
      aria-labelledby="how-it-works-heading"
      className="omentir-primary-width min-w-0 scroll-mt-24 py-12 md:py-20"
    >
      <p
        id="how-it-works-heading"
        className="text-left text-sm font-normal text-[var(--md-sys-color-on-surface)]"
      >
        How it works
      </p>
      <div className="home-green-panels mt-8 md:mt-10">
        <Reveal>
          <Slide
            copy={homeSlides[0]}
            live
            draw={<MockLeadsScreen funnel compact interactive />}
          />
        </Reveal>
        <Reveal>
          <Slide copy={homeSlides[1]} flip draw={<MockInboxScreen compact focus />} />
        </Reveal>
        <Reveal>
          <Slide
            copy={homeSlides[2]}
            live
            draw={<MockInboxScreen booked compact interactive />}
          />
        </Reveal>
      </div>
    </section>
  );
}
