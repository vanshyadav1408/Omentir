#!/usr/bin/env node
/**
 * Builds the self-hosted Material Symbols Outlined subset.
 *
 * Google's full variable icon font is ~4MB. Loading it from fonts.googleapis.com
 * cost every page three serial hops (DNS/TLS to two Google origins → CSS →
 * font) before a single icon could paint, and `font-display: block` keeps every
 * icon invisible for that whole time. This script pulls the same variable font
 * (all four axes: opsz/wght/FILL/GRAD) subset to the icons this app actually
 * uses — ~50KB — and writes it into public/ so it ships same-origin.
 *
 * Run after adding a new icon:  node scripts/build-icon-font.mjs
 * Then commit public/fonts/, src/app/icon-font.css and src/app/icon-font-url.ts.
 *
 * The audit pass below fails the build if a statically-written icon name is
 * missing from ICON_NAMES, so a new icon can't silently ship as raw ligature
 * text. Names that are only ever chosen at runtime can't be detected — add
 * those to ICON_NAMES by hand.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Every icon ligature rendered anywhere in the app, sorted. */
const ICON_NAMES = [
  "alternate_email",
  "apps",
  "arrow_back",
  "arrow_drop_down",
  "chat_bubble",
  "chat_paste_go",
  "check",
  "check_circle",
  "chevron_left",
  "chevron_right",
  "close",
  "code",
  "content_copy",
  "contrast",
  "dark_mode",
  "edit",
  "error",
  "event_available",
  "event_upcoming",
  "expand_more",
  "forum",
  "help",
  "identity_platform",
  "inbox",
  "info",
  "key",
  "language",
  "light_mode",
  "local_fire_department",
  "lock_clock",
  "logout",
  "mail",
  "menu",
  "model_training",
  "monitoring",
  "open_in_new",
  "package_2",
  "person_add",
  "person_search",
  "send",
  "settings",
  "smart_toy",
  "support_agent",
  "terminal",
  "upload_file",
  "work",
];

const SOURCE_DIR = "src";
const FONT_DIR = join("public", "fonts");
const FONT_FILE = join(FONT_DIR, "material-symbols-outlined.woff2");
const FONT_URL_PATH = "/fonts/material-symbols-outlined.woff2";
const CSS_OUT = join("src", "app", "icon-font.css");
const TS_OUT = join("src", "app", "icon-font-url.ts");

/* Google serves woff2 only to browsers that advertise support. */
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
    else if (/\.tsx?$/.test(path)) out.push(path);
  }
  return out;
}

/** Icon names written literally in JSX — inside a symbols span, or as an
 *  `icon:`/`icon=`/`name=` value on the components that render one. */
function findStaticIconNames() {
  const found = new Map(); // name -> first file it appeared in
  const note = (name, file) => {
    if (!found.has(name)) found.set(name, file);
  };

  for (const file of sourceFiles(SOURCE_DIR)) {
    const src = readFileSync(file, "utf8");

    let cursor = 0;
    while ((cursor = src.indexOf("material-symbols-outlined", cursor)) !== -1) {
      const tagEnd = src.indexOf(">", cursor);
      const spanEnd = src.indexOf("</span>", tagEnd);
      if (tagEnd === -1 || spanEnd === -1) break;
      const body = src.slice(tagEnd + 1, spanEnd);
      if (/[{}]/.test(body)) {
        // Runtime-chosen. In a ternary only the branches hold icon names, so
        // read past the first `?` — the condition's own string literals
        // (`action.kind === "connection"`) are not icons.
        const branches = body.includes("?") ? body.slice(body.indexOf("?")) : body;
        for (const quoted of branches.match(/["'`][a-z][a-z0-9_]*["'`]/g) ?? []) {
          note(quoted.slice(1, -1), file);
        }
      } else if (/^[a-z][a-z0-9_]*$/.test(body.trim())) {
        note(body.trim(), file);
      }
      cursor = spanEnd;
    }

    for (const match of src.matchAll(/\bicon:\s*["']([a-z][a-z0-9_]*)["']/g)) {
      note(match[1], file);
    }
    for (const match of src.matchAll(/<NavIcon[^>]*\sname=["']([a-z][a-z0-9_]*)["']/g)) {
      note(match[1], file);
    }
  }
  return found;
}

/** Icon names written in source but absent from the subset, as `name (file)`
 *  strings. Exported so tests/icon-font.test.mjs enforces this on every `npm
 *  test` — as a script-only check it only ran when someone remembered to run
 *  the script, which is precisely when the drift never happens. */
export function missingIconNames() {
  const declared = new Set(ICON_NAMES);
  const missing = [];
  for (const [name, file] of findStaticIconNames()) {
    // `icon:` also matches unrelated config (favicon paths etc.) — only flag
    // values that look like icon ligatures and aren't already covered.
    if (!declared.has(name) && !name.includes("/") && !name.includes(".")) {
      missing.push(`${name}  (${file})`);
    }
  }
  return missing;
}

function audit() {
  const missing = missingIconNames();
  if (missing.length > 0) {
    console.error(
      "Icon names used in source but missing from ICON_NAMES in this script:\n  " +
        missing.join("\n  ") +
        "\n\nAdd them to ICON_NAMES and re-run, or they will render as plain text.",
    );
    process.exit(1);
  }
}

async function main() {
  audit();

  const axes = "opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
  const cssUrl =
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:" +
    axes +
    `&icon_names=${ICON_NAMES.join(",")}&display=block`;

  const cssResponse = await fetch(cssUrl, { headers: { "User-Agent": BROWSER_UA } });
  if (!cssResponse.ok) {
    throw new Error(`Google Fonts CSS request failed: ${cssResponse.status}`);
  }
  const css = await cssResponse.text();
  const fontUrl = css.match(/url\(([^)]+)\)/)?.[1];
  if (!fontUrl) throw new Error(`No font URL in Google Fonts response:\n${css}`);

  const fontResponse = await fetch(fontUrl, { headers: { "User-Agent": BROWSER_UA } });
  if (!fontResponse.ok) {
    throw new Error(`Font download failed: ${fontResponse.status}`);
  }
  const font = Buffer.from(await fontResponse.arrayBuffer());
  const hash = createHash("sha256").update(font).digest("hex").slice(0, 8);
  const href = `${FONT_URL_PATH}?v=${hash}`;

  mkdirSync(FONT_DIR, { recursive: true });
  writeFileSync(FONT_FILE, font);

  const generated = `/* Generated by scripts/build-icon-font.mjs — do not edit by hand. */\n`;
  writeFileSync(
    CSS_OUT,
    `${generated}@font-face {
  font-family: "Material Symbols Outlined";
  font-style: normal;
  font-weight: 100 700;
  /* block, not swap: the fallback would paint the raw ligature text
     ("person_search") instead of the glyph. The subset is small and preloaded,
     so the block period is effectively invisible. */
  font-display: block;
  src: url("${href}") format("woff2");
}
`,
  );
  writeFileSync(
    TS_OUT,
    `${generated}/* Hash query busts the immutable cache when the icon set changes. */
export const ICON_FONT_URL = "${href}";
`,
  );

  console.log(
    `Wrote ${FONT_FILE} (${(font.length / 1024).toFixed(1)} KB, ${ICON_NAMES.length} icons, v=${hash})`,
  );
}

// Only build when run as a script. Importing it (the test does, for the audit)
// must not reach out to Google Fonts or rewrite the committed subset.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
