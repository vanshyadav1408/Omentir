"use client";

import { useEffect, useRef, useState } from "react";

/** Fixed shell classes — never rebuild this string per render (hydration-safe). */
const FRAME_BASE =
  "fixed inset-x-0 top-0 z-[100] h-16 w-full transition-[background-color,backdrop-filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";
const FRAME_SOLID = "bg-[var(--md-sys-color-surface-container)]/90 backdrop-blur-xl";
const FRAME_CLEAR = "bg-transparent";

export default function MarketingHeaderFrame({
  transparentAtTop = false,
  children,
}: {
  transparentAtTop?: boolean;
  children: React.ReactNode;
}) {
  // SSR + first client paint must match. Always start "at top" (transparent when
  // requested); only after mount do we read scroll position.
  const [atTop, setAtTop] = useState(true);
  const atTopRef = useRef(true);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!transparentAtTop) return;

    let animationFrame: number | null = null;
    let restorationTimer: number | null = null;
    const update = () => {
      animationFrame = null;
      const nextAtTop = (document.scrollingElement?.scrollTop ?? window.scrollY) < 16;
      const nextClassName = `${FRAME_BASE} ${nextAtTop ? FRAME_CLEAR : FRAME_SOLID}`;
      const frame = frameRef.current;
      if (frame && frame.className !== nextClassName) frame.className = nextClassName;
      if (nextAtTop === atTopRef.current) return;
      atTopRef.current = nextAtTop;
      setAtTop(nextAtTop);
    };
    const scheduleUpdate = () => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(update);
    };
    const syncRestoredPosition = () => {
      update();
      scheduleUpdate();
      if (restorationTimer !== null) window.clearTimeout(restorationTimer);
      restorationTimer = window.setTimeout(update, 150);
    };

    syncRestoredPosition();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    document.addEventListener("scroll", scheduleUpdate, { capture: true, passive: true });
    window.addEventListener("pageshow", syncRestoredPosition);
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    document.addEventListener("visibilitychange", syncRestoredPosition);

    return () => {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      if (restorationTimer !== null) window.clearTimeout(restorationTimer);
      window.removeEventListener("scroll", scheduleUpdate);
      document.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener("pageshow", syncRestoredPosition);
      window.removeEventListener("resize", scheduleUpdate);
      document.removeEventListener("visibilitychange", syncRestoredPosition);
    };
  }, [transparentAtTop]);

  const transparent = transparentAtTop && atTop;

  return (
    <div
      ref={frameRef}
      data-marketing-header=""
      className={`${FRAME_BASE} ${transparent ? FRAME_CLEAR : FRAME_SOLID}`}
    >
      {children}
    </div>
  );
}
