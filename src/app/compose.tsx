"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * One writing head moves down the page. Copy above the head is readable.
 * Copy below is not written yet. No per-word spans. The full document stays
 * in the HTML for crawlers; JS only clips what has not been reached.
 */
export default function Compose({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const root = ref.current;
    if (!enabled || !wrap || !root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    wrap.setAttribute("data-compose", "");

    const heading = root.querySelector("h1");
    let y = heading ? Math.max(0, heading.offsetTop - 56) : 0;
    wrap.style.setProperty("--compose-y", `${y}px`);

    let frame = 0;
    let last = performance.now();
    let alive = true;

    const onScreenBottom = () => {
      const top = root.getBoundingClientRect().top;
      // Reveal only what has entered the viewport. Nothing ahead of the
      // screen edge is written yet.
      return window.innerHeight - top;
    };

    const tick = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const height = root.scrollHeight;
      const want = Math.min(height, Math.max(onScreenBottom(), y));

      if (y < want) {
        const behind = want - y;
        // Catch up with scroll so newly visible copy writes as it arrives.
        const pxPerSec = behind > 160 ? 2600 : 720;
        y = Math.min(want, y + pxPerSec * dt);
      }

      wrap.style.setProperty("--compose-y", `${Math.round(y)}px`);

      if (y >= height - 4) {
        wrap.removeAttribute("data-compose");
        wrap.style.removeProperty("--compose-y");
        return;
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      wrap.removeAttribute("data-compose");
      wrap.style.removeProperty("--compose-y");
    };
  }, [enabled]);

  if (!enabled) return children;

  return (
    <div ref={wrapRef} className="compose-wrap">
      <div ref={ref} className="compose">
        {children}
      </div>
    </div>
  );
}
