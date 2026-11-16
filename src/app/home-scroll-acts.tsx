"use client";

import { useEffect } from "react";

/** Drives the homepage's pinned scroll sections. Each `[data-nx-act]` gets
 *  `--p` (0 to 1: how far the viewport has moved through it) and, when it
 *  declares `data-nx-steps`, a `data-step` index; globals.css does the rest.
 *  Each `[data-nx-reveal]` gets `data-in` once its top passes 80% of the
 *  viewport, which starts its build-in animation (it stays on after that). */
export default function HomeScrollActs() {
  useEffect(() => {
    const acts = Array.from(document.querySelectorAll<HTMLElement>("[data-nx-act]"));
    const reveals = Array.from(document.querySelectorAll<HTMLElement>("[data-nx-reveal]"));
    let pending: number | null = null;

    const run = () => {
      pending = null;
      const viewport = window.innerHeight;
      for (const act of acts) {
        const rect = act.getBoundingClientRect();
        const span = rect.height - viewport;
        const p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
        act.style.setProperty("--p", p.toFixed(4));
        const steps = Number(act.dataset.nxSteps ?? 0);
        if (steps > 0) {
          const step = String(Math.min(steps - 1, Math.floor(p * steps)));
          if (act.dataset.step !== step) act.dataset.step = step;
        }
      }
      for (const el of reveals) {
        if (!el.hasAttribute("data-in") && el.getBoundingClientRect().top < viewport * 0.8) {
          el.setAttribute("data-in", "");
        }
      }
    };
    const schedule = () => {
      if (pending === null) pending = window.requestAnimationFrame(run);
    };

    run();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (pending !== null) window.cancelAnimationFrame(pending);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return null;
}
