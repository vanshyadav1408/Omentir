"use client";

import { useEffect } from "react";

/** Drives the scroll motion on /a, the same way the homepage does it:
 *  - each `[data-ag-act]` gets `--p` (0 to 1: how far the screen has moved
 *    through it) and, when it declares `data-ag-steps`, a `data-step` index;
 *  - each `[data-ag-reveal]` gets `data-in` once its top passes 85% of the
 *    screen, which starts its build-in (it stays on after that);
 *  - the page gets `data-ready`, which is what lets agents-deck.css hide
 *    reveal items before they enter. Without JavaScript nothing is hidden. */
export default function AgentsMotion() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>("[data-ag-page]");
    if (!page) return;
    const acts = Array.from(page.querySelectorAll<HTMLElement>("[data-ag-act]"));
    const reveals = Array.from(page.querySelectorAll<HTMLElement>("[data-ag-reveal]"));
    page.setAttribute("data-ready", "");
    let pending: number | null = null;

    const run = () => {
      pending = null;
      const viewport = window.innerHeight;
      for (const act of acts) {
        const rect = act.getBoundingClientRect();
        const span = rect.height - viewport;
        const p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 1;
        act.style.setProperty("--p", p.toFixed(4));
        const steps = Number(act.dataset.agSteps ?? 0);
        if (steps > 0) {
          const step = String(Math.min(steps - 1, Math.floor(p * steps)));
          if (act.dataset.step !== step) act.dataset.step = step;
        }
      }
      for (const el of reveals) {
        if (!el.hasAttribute("data-in") && el.getBoundingClientRect().top < viewport * 0.85) {
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
