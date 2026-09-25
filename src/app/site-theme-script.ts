// Marketing pages marked `.site-theme` follow this preference (globals.css).
// The app itself stays dark-only and ignores it.
export const SITE_THEME_STORAGE_KEY = "omentir-site-theme";

/** Runs in <head> before paint so a light visitor never sees a dark flash. */
export function siteThemeScript() {
  return `(function(){try{var p=localStorage.getItem(${JSON.stringify(SITE_THEME_STORAGE_KEY)});var r=p==="light"||p==="dark"?p:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.setAttribute("data-site-theme",r);}catch(e){}})();`;
}
