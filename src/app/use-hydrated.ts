"use client";

import { useSyncExternalStore } from "react";

/** True only after the client has mounted — use to gate browser-only UI state. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}