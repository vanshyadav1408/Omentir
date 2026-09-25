// The whole product (marketing site and app) follows this preference; see
// the "Site theme" block in globals.css.
export const SITE_THEME_STORAGE_KEY = "omentir-site-theme";

/** Runs in <head> before paint so a light visitor never sees a dark flash.
 *  While the preference is "system" it also follows OS changes live; the
 *  toggle only lives on the Settings page, so this is the one global hook. */
export function siteThemeScript() {
  const key = JSON.stringify(SITE_THEME_STORAGE_KEY);
  return `(function(){try{var k=${key},d=document.documentElement,m=window.matchMedia("(prefers-color-scheme: light)");function a(){var p=localStorage.getItem(k);var r=p==="light"||p==="dark"?p:(m.matches?"light":"dark");d.setAttribute("data-site-theme",r);d.style.colorScheme=r;}a();m.addEventListener("change",a);}catch(e){}})();`;
}
