"use client";

import { useEffect } from "react";
import { prefetchSidebarResource, whenSidebarRequestsSettle } from "@/app/use-sidebar-resource";
import { ACTIVITY_DAYS_RESOURCE, LINKEDIN_INBOX_RESOURCE } from "@/app/sidebar-early-fetch";

// /leads and /messages first. Overview's dashboard projection cannot fill
// leadPreviews, so that query is the one that makes those two pages instant.
const FIRESTORE_WARMUP = [
  "groups,leadPreviews",
  "conversations",
  "agents,enrollmentPreviews",
  ACTIVITY_DAYS_RESOURCE,
  "agentApiKeys",
];

// Unipile calls. Kept off the Firestore warmup so a 3s inbox fetch on
// Overview does not delay /leads, and so we never start a second Unipile
// request while one is already in flight.
const UNIPILE_WARMUP = [LINKEDIN_INBOX_RESOURCE, "linkedinAccounts"];

export async function warmOtherPageData(options: { cancelled?: () => boolean } = {}) {
  const cancelled = options.cancelled ?? (() => false);
  await whenSidebarRequestsSettle(15_000, { ignoreNames: UNIPILE_WARMUP });
  for (const resource of FIRESTORE_WARMUP) {
    if (cancelled()) return;
    await prefetchSidebarResource(resource);
  }
  await whenSidebarRequestsSettle();
  for (const resource of UNIPILE_WARMUP) {
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
