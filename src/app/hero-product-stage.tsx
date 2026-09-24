"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import {
  MockInboxScreen,
  MockLeadsScreen,
  MockProductScreen,
} from "./home-product-mock";

const SLIDES = [
  {
    id: "share",
    caption: "Describe what you sell",
  },
  {
    id: "filter",
    caption: "Get leads that fit",
  },
  {
    id: "contact",
    caption: "Book the meetings",
  },
] as const;

const SLIDE_INTERVAL_MS = 7500;
const SWIPE_MIN_PX = 40;

export default function HeroProductStage() {
  const labelId = useId();
  const frameRef = useRef<HTMLElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [inView, setInView] = useState(true);
  // Once someone clicks into the mock or picks a slide, autoplay stops for
  // good so the screen never jumps away from what they are looking at.
  const [stopped, setStopped] = useState(false);
  const slide = SLIDES[index];
  const paused = stopped || hovering || !inView;

  useEffect(() => {
    const node = frameRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const go = (next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  };

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return;
    setStopped(true);
    go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <figure
      ref={frameRef}
      className="hero-product-frame"
      style={{ "--hero-slide-ms": `${SLIDE_INTERVAL_MS}ms` } as CSSProperties}
    >
      <div
        id={`${labelId}-panel`}
        className="hero-app-stage"
        role="tabpanel"
        aria-labelledby={`${labelId}-${slide.id}`}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHovering(true);
        }}
        onPointerLeave={() => setHovering(false)}
        onPointerDown={() => setStopped(true)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
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
          <div key={slide.id} className="hero-app-canvas">
            {slide.id === "share" ? <MockProductScreen /> : null}
            {slide.id === "filter" ? <MockLeadsScreen filters interactive /> : null}
            {slide.id === "contact" ? <MockInboxScreen interactive /> : null}
          </div>
        </div>
      </div>
      <nav className="hero-app-navigation" aria-label="Slideshow navigation">
        <div
          className={`hero-app-navigation-list${stopped ? " is-stopped" : paused ? " is-paused" : ""}`}
          role="tablist"
          aria-label="Slides"
        >
          {SLIDES.map((item, itemIndex) => {
            const active = itemIndex === index;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`${labelId}-panel`}
                id={`${labelId}-${item.id}`}
                className={active ? "is-active" : itemIndex < index ? "is-done" : undefined}
                onClick={() => {
                  setStopped(true);
                  go(itemIndex);
                }}
              >
                <span className="hero-app-navigation-track" aria-hidden="true">
                  {active ? (
                    <span
                      key={index}
                      className="hero-app-navigation-fill"
                      onAnimationEnd={() => go(index + 1)}
                    />
                  ) : null}
                </span>
                <span className="hero-app-navigation-caption">
                  <b>{itemIndex + 1}</b>
                  {item.caption}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </figure>
  );
}
