/**
 * Starts a page's /api/app/sidebar-data request while the HTML is still being
 * parsed, instead of waiting for the client bundle to download and hydrate.
 *
 * Pages render the script below in their server output; useSidebarResource then
 * adopts the in-flight promise on mount rather than issuing its own request. On
 * a cold load that removes the whole download+hydrate gap from the critical
 * path, which on the dashboard is the difference between the skeleton clearing
 * when the data lands and clearing a second or more after that.
 *
 * Only full page loads are covered: React does not execute inline scripts that
 * arrive through a client-side navigation, and those pages are already served
 * from the in-memory cache in use-sidebar-resource.
 */

const EARLY_FETCH_KEY = "__omentirSidebarEarlyFetch";

type EarlyFetchStore = Record<string, Promise<Record<string, unknown> | null>>;

/** Resource strings shared by the dashboard page (script) and its view (hook). */
export const DASHBOARD_RESOURCE =
  "agents,groups,leadDashboardPreviews,enrollmentPreviews,conversations";
export const LINKEDIN_INBOX_RESOURCE = "linkedinInbox";

export function buildEarlyFetchScript(resources: string[]): string {
  const urls = resources.map(
    (resource) => `/api/app/sidebar-data?resource=${encodeURIComponent(resource)}`,
  );
  return (
    `(function(){try{` +
    `var s=window[${JSON.stringify(EARLY_FETCH_KEY)}]=window[${JSON.stringify(EARLY_FETCH_KEY)}]||{};` +
    `var r=${JSON.stringify(resources)},u=${JSON.stringify(urls)};` +
    `for(var i=0;i<r.length;i++){if(s[r[i]])continue;` +
    `s[r[i]]=fetch(u[i],{credentials:"same-origin"})` +
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
