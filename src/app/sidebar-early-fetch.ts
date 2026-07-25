/**
 * Starts a page's /api/app/sidebar-data request while the HTML is still being
 * parsed, instead of waiting for the client bundle to download and hydrate.
 *
 * The root layout renders the script below once, in <head>; useSidebarResource
 * then adopts the in-flight promise on mount rather than issuing its own
 * request. On a cold load that removes the whole download+hydrate gap from the
 * critical path, which on the dashboard is the difference between the skeleton
 * clearing when the data lands and clearing a second or more after that.
 *
 * Only full page loads are covered, which is why the script picks its resources
 * from location.pathname rather than a page passing them in. React never
 * executes an inline script it creates on the client, so rendering this from a
 * page or the (app) layout meant that on a client-side navigation it did
 * nothing, logged "Encountered a script tag while rendering React component",
 * and left a stray empty <div> behind. The root layout is the only place that is
 * always hydrated and never re-created on the client — you cannot navigate to a
 * different root layout — so emitting it there makes that impossible rather than
 * merely unlikely. Navigations lose nothing: they are already served from the
 * in-memory cache in use-sidebar-resource.
 */

const EARLY_FETCH_KEY = "__omentirSidebarEarlyFetch";

type EarlyFetchStore = Record<string, Promise<Record<string, unknown> | null>>;

/** Resource strings shared by the dashboard page (script) and its view (hook). */
export const DASHBOARD_RESOURCE =
  "agents,groups,leadDashboardPreviews,enrollmentPreviews,conversations";
export const LINKEDIN_INBOX_RESOURCE = "linkedinInbox";

/**
 * Which resources to start for which page. Keyed by pathname because the script
 * runs from the root layout, which has no idea which route it is wrapping — the
 * match happens in the browser against location.pathname.
 *
 * Deliberately short: this only pays off for pages whose first paint is blocked
 * on a large sidebar-data read. Everything else is warmed after the fact by
 * app-data-prefetch.
 */
export const EARLY_FETCH_ROUTES: Record<string, string[]> = {
  "/dashboard": [DASHBOARD_RESOURCE, LINKEDIN_INBOX_RESOURCE],
};

export function buildEarlyFetchScript(routes: Record<string, string[]> = EARLY_FETCH_ROUTES): string {
  const key = JSON.stringify(EARLY_FETCH_KEY);
  return (
    `(function(){try{` +
    // Trailing slashes: Next canonicalises these away, but a hand-typed URL
    // should still match rather than silently skipping the optimisation.
    `var p=location.pathname.replace(/\\/+$/,"")||"/";` +
    `var r=(${JSON.stringify(routes)})[p];if(!r)return;` +
    `var s=window[${key}]=window[${key}]||{};` +
    `for(var i=0;i<r.length;i++){if(s[r[i]])continue;` +
    `s[r[i]]=fetch("/api/app/sidebar-data?resource="+encodeURIComponent(r[i]),{credentials:"same-origin"})` +
    `.then(function(x){return x.ok?x.json():null})` +
    `.catch(function(){return null});}` +
    `}catch(e){}})();`
  );
}

/**
 * Hand the pre-hydration promise for `resource` to the caller, once. Later
 * mounts fall through to a normal fetch so the data still revalidates.
 */
export function adoptEarlyFetch(
  resource: string,
): Promise<Record<string, unknown> | null> | undefined {
  if (typeof window === "undefined") return undefined;
  const store = (window as unknown as Record<string, EarlyFetchStore | undefined>)[EARLY_FETCH_KEY];
  const pending = store?.[resource];
  if (pending) delete store[resource];
  return pending;
}
