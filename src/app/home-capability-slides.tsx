import type { ReactNode } from "react";
import {
  MockInboxScreen,
  MockLeadsScreen,
} from "./home-product-mock";

export const homeSlides = [
  {
    id: "find",
    title: "Find people who match buyer profile",
  },
  {
    id: "message",
    title: "Automated outreach with human-sounding AI texts",
  },
  {
    id: "book",
    title: "Manage all the outreach conversations in one UI",
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
        className="text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]"
      >
        How it works
      </p>
      <div className="home-green-panels mt-8 md:mt-10">
        <Slide
          copy={homeSlides[0]}
          live
          draw={<MockLeadsScreen funnel compact interactive />}
        />
        <Slide copy={homeSlides[1]} flip draw={<MockInboxScreen compact focus />} />
        <Slide
          copy={homeSlides[2]}
          live
          draw={<MockInboxScreen booked compact interactive />}
        />
      </div>
    </section>
  );
}
