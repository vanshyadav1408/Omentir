"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import {
  MockInboxScreen,
  MockLeadsScreen,
  MockProductScreen,
} from "./home-product-mock";

const SLIDES = [
  {
    id: "share",
    caption: "Briefly describe your product",
  },
  {
    id: "filter",
    caption: "Watch Omentir find matching leads",
  },
  {
    id: "contact",
    caption: "See Omentir book you meetings.",
  },
] as const;

const SLIDE_INTERVAL_MS = 7500;

export default function HeroProductStage() {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [index]);

  return (
    <figure className="hero-product-frame">
      <div
        id={`${labelId}-panel`}
        className="hero-app-stage"
        role="tabpanel"
        aria-labelledby={`${labelId}-${slide.id}`}
      >
        <Image
          src="/hero-lake.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 80rem) 76rem, calc(100vw - 32px)"
          quality={90}
          className="hero-product-frame-media"
        />
        <div
          className="hero-app"
          aria-hidden={slide.id === "filter" || slide.id === "contact" ? undefined : true}
        >
          <div className="hero-app-canvas">
            {slide.id === "share" ? <MockProductScreen /> : null}
            {slide.id === "filter" ? <MockLeadsScreen filters interactive /> : null}
            {slide.id === "contact" ? <MockInboxScreen interactive /> : null}
          </div>
        </div>
      </div>
      <nav className="hero-app-navigation" aria-label="Slideshow navigation">
        <div className="hero-app-navigation-list" role="tablist" aria-label="Slides">
          {SLIDES.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={itemIndex === index}
              aria-controls={`${labelId}-panel`}
              id={`${labelId}-${item.id}`}
              className={itemIndex === index ? "is-active" : undefined}
              onClick={() => setIndex(itemIndex)}
              aria-label={`Slide ${itemIndex + 1}: ${item.caption}`}
            >
              <span className="sr-only">{item.caption}</span>
            </button>
          ))}
        </div>
      </nav>
    </figure>
  );
}
