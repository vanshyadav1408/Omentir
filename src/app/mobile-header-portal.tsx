"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { useHydrated } from "./use-hydrated";

export default function MobileHeaderPortal({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();

  if (!hydrated) return null;

  return createPortal(children, document.body);
}
