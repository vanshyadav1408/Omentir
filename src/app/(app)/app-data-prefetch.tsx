"use client";

import { useEffect } from "react";
import { prefetchSidebarResource, whenSidebarRequestsSettle } from "@/app/use-sidebar-resource";
import {
  ACTIVITY_DAYS_RESOURCE,
  AGENTS_RESOURCE,
  DASHBOARD_RESOURCE,
  LEADS_RESOURCE,
  LINKEDIN_INBOX_RESOURCE,
} from "@/app/sidebar-early-fetch";

// Each page's first view, all small since Leads, Overview and Agents are paged
// and counted on the server. The whole lead list (Messages' leadPreviews,
// ~9 MB on the largest workspace) is deliberately not warmed: downloading it in
// the background on every app page is what this change removes.
const FIRESTORE_WARMUP = [
  LEADS_RESOURCE,
  "conversations",
  DASHBOARD_RESOURCE,
  AGENTS_RESOURCE,
  ACTIVITY_DAYS_RESOURCE,
  "agentApiKeys",
];

// LinkedIn calls. Kept off the Firestore warmup so a 3s inbox fetch on
// Overview does not delay /leads, and so we never start a second LinkedIn
// request while one is already in flight.
const LINKEDIN_WARMUP = [LINKEDIN_INBOX_RESOURCE, "linkedinAccounts"];

export async function warmOtherPageData(options: { cancelled?: () => boolean } = {}) {
  const cancelled = options.cancelled ?? (() => false);
  await whenSidebarRequestsSettle(15_000, { ignoreNames: LINKEDIN_WARMUP });
  for (const resource of FIRESTORE_WARMUP) {
    if (cancelled()) return;
    await prefetchSidebarResource(resource);
  }
  await whenSidebarRequestsSettle();
  for (const resource of LINKEDIN_WARMUP) {
    if (cancelled()) return;
    await prefetchSidebarResource(resource);
  }
}

// Warms the sidebar-data cache for every main app page while the user sits on
// whichever page they landed on, so navigating to /leads or /messages feels
// instant. Renders nothing and runs once per app session.
export default function AppDataPrefetch() {
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void warmOtherPageData({ cancelled: () => cancelled });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
