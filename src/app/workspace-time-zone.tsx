"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { saveWorkspaceTimeZoneAction } from "@/app/actions";
import { DEFAULT_TIME_ZONE, detectTimeZone, isValidTimeZone } from "@/lib/time-zone";

const WorkspaceTimeZoneContext = createContext<string>(DEFAULT_TIME_ZONE);

// The browser's zone is an external value the server cannot know, so it is read
// through useSyncExternalStore: the server snapshot is empty and the client
// snapshot is the real zone, which keeps hydration clean without an effect that
// re-renders the tree. Nothing ever changes it, so the subscribe is a no-op.
const subscribe = () => () => {};
const browserZone = () => detectTimeZone();
const serverZone = () => "";

/**
 * Makes the workspace's timezone the default for every date and time the app
 * renders. Mounted once in the authenticated layout so pages read it from
 * context instead of each one threading a `timezone` prop down its tree.
 *
 * A workspace that has never had a zone stored (every workspace before the
 * Settings picker started saving one) falls back to the browser's zone and
 * writes it back, so the scheduler's send windows and quota resets line up with
 * the clock the user is reading.
 */
export function WorkspaceTimeZoneProvider({
  timeZone,
  children,
}: {
  timeZone?: string;
  children: React.ReactNode;
}) {
  const stored = isValidTimeZone(timeZone) ? timeZone : "";
  const detected = useSyncExternalStore(subscribe, browserZone, serverZone);

  useEffect(() => {
    if (stored || !detected) return;
    // Best-effort: a failed write only means the next load detects again.
    void Promise.resolve(saveWorkspaceTimeZoneAction(detected)).catch(() => {});
  }, [stored, detected]);

  return (
    <WorkspaceTimeZoneContext.Provider value={stored || detected || DEFAULT_TIME_ZONE}>
      {children}
    </WorkspaceTimeZoneContext.Provider>
  );
}

/** IANA zone every timestamp in the app is formatted in. Never empty. */
export function useWorkspaceTimeZone() {
  return useContext(WorkspaceTimeZoneContext);
}
