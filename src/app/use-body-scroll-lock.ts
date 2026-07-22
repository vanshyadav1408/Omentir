"use client";

import { useEffect } from "react";

/**
 * M3 modal rule: freeze the document behind an open dialog
 * (`overflow: hidden` on body) so the page cannot scroll under the scrim.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}
