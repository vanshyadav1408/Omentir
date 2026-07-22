"use client";

import { useEffect } from "react";
import { prefetchSidebarResource } from "@/app/use-sidebar-resource";

// These match the resource sets used by each view. useSidebarResource splits
// them into reusable pieces, so overlapping pages only warm what is missing.
const PAGE_RESOURCES = [
  "groups,leadPreviews", // leads
  "conversations,leadPreviews", // messages
  "linkedinInbox", // messages + dashboard
  "agents,groups,leadAgentRefs,enrollmentPreviews", // agents
  "linkedinConnected", // agents + campaigns
  "campaigns,groups,enrollmentPreviews", // campaigns
  "activityItems", // activity
  "agents,leadPreviews,enrollmentPreviews,conversations", // dashboard
];

// Warms the sidebar-data cache for every main app page while the user sits on
// whichever page they landed on, so navigating to the others feels instant.
// Renders nothing and runs once per app session.
export default function AppDataPrefetch() {
  useEffect(() => {
    let cancelled = false;
    // Give the current page's own requests a head start, then warm only the
    // still-missing resources one at a time to keep the server load gentle.
    const timer = setTimeout(async () => {
      for (const resource of PAGE_RESOURCES) {
        if (cancelled) return;
        await prefetchSidebarResource(resource);
      }
    }, 1000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
