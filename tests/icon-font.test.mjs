// The self-hosted Material Symbols subset only contains the glyphs listed in
// scripts/build-icon-font.mjs. An icon used in source but missing from that
// list renders as its raw ligature text ("person_search") in the UI, because
// the @font-face uses font-display: block with no fallback glyph.
//
// The script already audits for this, but only when someone runs it - which is
// the one moment the drift cannot exist. These tests move the guarantee onto
// every `npm test`.
import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import { missingIconNames } from "../scripts/build-icon-font.mjs";

test("every icon used in source is in the font subset", () => {
  const missing = missingIconNames();
  assert.deepEqual(
    missing,
    [],
    `Icons used in source but missing from ICON_NAMES in scripts/build-icon-font.mjs:\n  ${missing.join(
      "\n  ",
    )}\n\nAdd them to ICON_NAMES and re-run the script, or they render as plain text.`,
  );
});

test("the generated font references match the committed font file", () => {
  const font = readFileSync("public/fonts/material-symbols-outlined.woff2");
  const hash = createHash("sha256").update(font).digest("hex").slice(0, 8);

  // Both generated files carry the content hash as a cache buster, and
  // next.config.ts serves /fonts/* as immutable for a year - a stale hash means
  // browsers keep an old subset forever, so it must match what is committed.
  for (const path of ["src/app/icon-font.css", "src/app/icon-font-url.ts"]) {
    assert.match(
      readFileSync(path, "utf8"),
      new RegExp(`material-symbols-outlined\\.woff2\\?v=${hash}\\b`),
      `${path} does not reference the committed font's hash (${hash}); re-run scripts/build-icon-font.mjs`,
    );
  }
});
