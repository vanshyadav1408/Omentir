import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  formatZonedDate,
  formatZonedTime,
  isValidTimeZone,
  resolveTimeZone,
  zonedDayKey,
} from "../src/lib/time-zone.ts";

const IST = "Asia/Kolkata";
const NY = "America/New_York";
// 2026-07-27T23:40Z: already the 28th in India, still the 27th in New York.
const LATE_UTC = "2026-07-27T23:40:00.000Z";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("timestamps render on the workspace's calendar day, not UTC's or the browser's", () => {
  assert.equal(zonedDayKey(LATE_UTC, IST), "2026-07-28");
  assert.equal(zonedDayKey(LATE_UTC, NY), "2026-07-27");
  assert.equal(formatZonedDate(LATE_UTC, IST), "Jul 28, 2026");
  assert.equal(formatZonedDate(LATE_UTC, NY), "Jul 27, 2026");
  assert.equal(formatZonedTime(LATE_UTC, IST), "5:10 AM");
});

test("an empty or unusable stored zone degrades to UTC instead of throwing", () => {
  assert.equal(resolveTimeZone(undefined), "UTC");
  assert.equal(resolveTimeZone("Mars/Olympus_Mons"), "UTC");
  assert.equal(isValidTimeZone("Mars/Olympus_Mons"), false);
  assert.equal(isValidTimeZone(IST), true);
  // Missing timestamps render as the caller's fallback rather than "Invalid Date".
  assert.equal(formatZonedDate(undefined, IST), "");
  assert.equal(formatZonedDate("not a date", IST, undefined, "-"), "-");
});

test("the Settings time zone picker persists its choice", () => {
  const view = read("src/app/(app)/settings/settings-view.tsx");
  // The picker used to be local state only, so a chosen zone was lost on save
  // while the scheduler kept running on UTC.
  assert.match(view, /formData\.set\("timezone", timezoneName\(timezone\)\)/);

  const actions = read("src/app/actions.ts");
  assert.match(actions, /updateWorkspaceTimezone\(workspace\.id, timezone\)/);
});

test("a workspace with no stored zone adopts the browser's and writes it back", () => {
  const provider = read("src/app/workspace-time-zone.tsx");
  assert.match(provider, /saveWorkspaceTimeZoneAction\(detected\)/);
  // An explicit choice must never be overwritten by detection.
  assert.match(provider, /if \(stored \|\| !detected\) return;/);

  const actions = read("src/app/actions.ts");
  const guard = actions.slice(actions.indexOf("export async function saveWorkspaceTimeZoneAction"));
  assert.match(guard.slice(0, 400), /if \(workspace\.timezone\) return;/);
});

test("the authenticated shell provides the workspace zone to every page", () => {
  const layout = read("src/app/(app)/layout.tsx");
  assert.match(layout, /<WorkspaceTimeZoneProvider timeZone=\{timeZone\}>/);

  // Every app surface that prints an absolute date reads the zone from context
  // rather than formatting in whatever zone the browser happens to be in.
  for (const path of [
    "src/app/(app)/settings/settings-view.tsx",
    "src/app/(app)/messages/messages-view.tsx",
    "src/app/(app)/leads/leads-view.tsx",
    "src/app/(app)/agents/agents-view.tsx",
    "src/app/(app)/api-keys/api-keys-view.tsx",
    "src/app/(app)/actions/activity-dashboard.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /useWorkspaceTimeZone\(\)/, `${path} must read the workspace zone`);
    assert.doesNotMatch(
      source,
      /toLocaleDateString|toLocaleTimeString|toDateString/,
      `${path} must not format dates in the browser's zone`,
    );
  }
});
