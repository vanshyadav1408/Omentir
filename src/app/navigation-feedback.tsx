"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const MIN_VISIBLE_MS = 180;
const MAX_VISIBLE_MS = 4500;

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function isInternalNavigation(url: URL) {
  return url.origin === window.location.origin;
}

export default function NavigationFeedback() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const startedAtRef = useRef(0);
  const sourcePathRef = useRef("");
  const fallbackTimerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const pendingElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current);
      if (finishTimerRef.current !== null) window.clearTimeout(finishTimerRef.current);
    };
  }, []);

  const clearPressedElement = useCallback(() => {
    pendingElementRef.current?.removeAttribute("data-navigation-pending");
    pendingElementRef.current = null;
  }, []);

  const finishNavigation = useCallback(() => {
    if (finishTimerRef.current !== null) window.clearTimeout(finishTimerRef.current);

    const elapsed = Date.now() - startedAtRef.current;
    const delay = Math.max(MIN_VISIBLE_MS - elapsed, 0);
    finishTimerRef.current = window.setTimeout(() => {
      setPending(false);
      clearPressedElement();
    }, delay);
  }, [clearPressedElement]);

  const startNavigation = useCallback((element: HTMLElement | null) => {
    if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current);
    if (finishTimerRef.current !== null) window.clearTimeout(finishTimerRef.current);

    clearPressedElement();
    if (element) {
      pendingElementRef.current = element;
      element.setAttribute("data-navigation-pending", "true");
    }

    sourcePathRef.current = window.location.pathname;
    startedAtRef.current = Date.now();
    setPending(true);
    fallbackTimerRef.current = window.setTimeout(finishNavigation, MAX_VISIBLE_MS);
  }, [clearPressedElement, finishNavigation]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) return;

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (!isInternalNavigation(url)) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      startNavigation(anchor);
    };

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) return;
      if (form.target && form.target !== "_self") return;

      const method = (form.getAttribute("method") || "get").toLowerCase();
      if (method !== "get") return;

      let url: URL;
      try {
        url = new URL(form.getAttribute("action") || window.location.href, window.location.href);
      } catch {
        return;
      }

      if (!isInternalNavigation(url)) return;

      const submitter = event.submitter instanceof HTMLElement ? event.submitter : form;
      // This capture-phase listener fires before React onSubmit handlers, so
      // defaultPrevented isn't final yet. Decide after dispatch completes:
      // client-handled forms (e.g. the agent setup wizard's step changes)
      // prevent default and must not flash the page-navigation feedback.
      window.setTimeout(() => {
        if (event.defaultPrevented) return;
        startNavigation(submitter);
      }, 0);
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, [startNavigation]);

  useEffect(() => {
    if (!pending || pathname === sourcePathRef.current) return;
    finishNavigation();
  }, [finishNavigation, pathname, pending]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5 overflow-hidden transition-opacity duration-100 ${
        pending ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="navigation-feedback-bar h-full w-full" />
    </div>
  );
}
