"use client";

import { useCallback, useRef, useState } from "react";

/** Width of an element, kept current with a ResizeObserver, so SVG charts draw at real pixel size. */
export function useElementWidth<T extends HTMLElement>(): [(node: T | null) => void, number] {
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback((node: T | null) => {
    observer.current?.disconnect();
    if (!node) return;
    setWidth(Math.round(node.getBoundingClientRect().width));
    observer.current = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.current.observe(node);
  }, []);
  return [ref, width];
}
