"use client";

import { useEffect } from "react";
import { prefetchSidebarResource, whenSidebarRequestsSettle } from "@/app/use-sidebar-resource";
import { LINKEDIN_INBOX_RESOURCE } from "@/app/sidebar-early-fetch";

// Every resource the main app pages read, in the order they are most likely to
// be visited. useSidebarResource caches per resource name (and lets a heavier
// projection stand in for a lighter one), so this list is deduped against
// whatever the current page already loaded:
//
//   /leads      groups, leadPreviews
//   /agents     agents, groups, leadAgentRefs*, enrollmentPreviews, linkedinConnected
//   /messages   conversations, leadPreviews, linkedinInbox
//   /overview  agents, groups, leadDashboardPreviews*, enrollmentPreviews,
//               conversations, linkedinInbox
//   /settings   linkedinAccounts
//   /api-keys   agentApiKeys
//
// (*) satisfied by a cached leadPreviews, so the one lead query below warms the
// lead reads on all three of Leads, Agents and Overview.
//
// /campaigns is deliberately absent: it redirects to /agents. Outreach details
// now live on /leads rather than a separate Actions page.
const PAGE_RESOURCES = [
  "groups,leadPreviews",
  "agents,enrollmentPreviews",
  "conversations",
  LINKEDIN_INBOX_RESOURCE,
  "linkedinConnected",
  "linkedinAccounts",
  "agentApiKeys",
];

// Warms the sidebar-data cache for every main app page while the user sits on
// whichever page they landed on, so navigating to the others feels instant.
// Renders nothing and runs once per app session.
export default function AppDataPrefetch() {
  useEffect(() => {
    let cancelled = false;
    // Let the current page's own hooks register their requests, wait for those
    // to finish, and only then warm anything. Starting on a fixed timer alone
    // used to overlap them, so the page the user is staring at had to share
    // bandwidth with - and sometimes duplicate - the background reads. The
    // warming itself stays one request at a time to keep server load gentle.
    const timer = setTimeout(async () => {
      await whenSidebarRequestsSettle();
      for (const resource of PAGE_RESOURCES) {
        if (cancelled) return;
        await prefetchSidebarResource(resource);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
