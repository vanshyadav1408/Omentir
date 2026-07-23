"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

/** Half of the 200ms top-level fade-through (out then in). */
const FADE_HALF_MS = 100;
/** Reduced-motion fallback: single 150ms opacity crossfade. */
const REDUCED_MS = 150;

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function useReducedMotion() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * Pattern A — Fade-Through for top-level app routes (sidebar navigation).
 * Opacity-only transition on a wrapper; **always** renders live `children` so
 * React streaming ($RS) can patch the RSC slot during hydration/resume.
 * Never copy `children` into state — that breaks streaming segment swaps.
 *
 * Visibility is fail-safe: if a transition is aborted mid-fade (fast re-nav,
 * reduced-motion flip, Strict Mode remount), content is restored to visible
 * so dashboard buttons never end up stuck at opacity 0 / unclickable.
 */
export default function AppPageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const mounted = useMounted();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const pathRef = useRef(pathname);

  useEffect(() => {
    if (!mounted) return;

    // Same path (including effect re-runs after pathRef was already updated):
    // never leave the pane stuck faded-out.
    if (pathname === pathRef.current) {
      setVisible(true);
      return;
    }

    pathRef.current = pathname;
    let cancelled = false;
    setVisible(false);
    const outMs = reducedMotion ? REDUCED_MS : FADE_HALF_MS;
    const outTimer = window.setTimeout(() => {
      if (!cancelled) setVisible(true);
    }, outMs);

    return () => {
      cancelled = true;
      window.clearTimeout(outTimer);
      // Aborted transition must not leave the next route invisible/unclickable.
      setVisible(true);
    };
  }, [pathname, mounted, reducedMotion]);

  const show = !mounted || visible;

  return (
    <div
      className={`m3-page-fade-through h-full min-h-0 ${
        show ? "m3-page-fade-through--in" : "m3-page-fade-through--out"
      }`}
      // Ghost of the previous page must not steal clicks while it fades out.
      style={show ? undefined : { pointerEvents: "none" }}
    >
      {children}
    </div>
  );
}
