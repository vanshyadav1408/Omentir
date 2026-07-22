"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** True when any part of the node intersects the visual viewport. */
function isInViewport(node: HTMLElement) {
  const rect = node.getBoundingClientRect();
  // display:none / not laid out → zero box; treat as not in view so IO can pick it up later
  if (rect.width === 0 && rect.height === 0) return false;

  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  return rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw;
}

export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Fail-safe model: content is VISIBLE by default (see globals.css). This
    // effect only opts an offscreen section into the entrance animation by
    // hiding it once JS is provably running. If the bundle is slow, 404s
    // after a deploy, or crashes, nothing here executes and the page simply
    // shows everything — content can never be stuck at opacity: 0.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;
    // Already on screen when the effect runs (common just below a short
    // hero): leave it visible rather than hiding painted content.
    if (isInViewport(node)) return;

    let done = false;
    let observer: IntersectionObserver | null = null;
    let fallbackTimer = 0;
    let frame = 0;

    node.setAttribute("data-reveal-pending", "");

    const reveal = () => {
      if (done) return;
      done = true;
      node.removeAttribute("data-reveal-pending");
      observer?.disconnect();
      observer = null;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (frame) window.cancelAnimationFrame(frame);
    };

    // Re-check after layout settles (mobile address bar / late font metrics).
    frame = window.requestAnimationFrame(() => {
      if (isInViewport(node)) reveal();
    });

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Any visible pixel is enough. Avoid high thresholds that miss
          // tall sections on short mobile viewports.
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            reveal();
            break;
          }
        }
      },
      // Positive rootMargin: trigger slightly before/after the edge so iOS
      // toolbar resize and overflow ancestors are less likely to skip us.
      { threshold: 0, rootMargin: "120px 0px 120px 0px" },
    );
    observer.observe(node);

    // Hard safety net: never leave landing content stuck at opacity: 0 if IO
    // fails (known intermittent issue with overflow + mobile Safari).
    fallbackTimer = window.setTimeout(reveal, 2500);

    return () => {
      done = true;
      observer?.disconnect();
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (frame) window.cancelAnimationFrame(frame);
      node.removeAttribute("data-reveal-pending");
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
