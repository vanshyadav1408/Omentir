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
 */
export default function AppPageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const mounted = useMounted();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const pathRef = useRef(pathname);

  useEffect(() => {
    if (!mounted) return;
    if (pathname === pathRef.current) return;

    pathRef.current = pathname;
    const outMs = reducedMotion ? REDUCED_MS : FADE_HALF_MS;

    setVisible(false);
    const outTimer = window.setTimeout(() => {
      setVisible(true);
    }, outMs);

    return () => window.clearTimeout(outTimer);
  }, [pathname, mounted, reducedMotion]);

  return (
    <div
      className={`m3-page-fade-through h-full min-h-0 ${
        !mounted || visible ? "m3-page-fade-through--in" : "m3-page-fade-through--out"
      }`}
    >
      {children}
    </div>
  );
}