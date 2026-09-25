import "fake-indexeddb/auto";
import { afterEach, describe, expect, test } from "bun:test";
import {
  clearStoredResources,
  pruneOtherUsers,
  readStoredResource,
  storeResource,
} from "./sidebar-resource-store";

const LEADS = "groups,leadPreviews";
const alice = "user_alice:ws_1";
const aliceOther = "user_alice:ws_2";
const bob = "user_bob:ws_9";

// storeResource defers the write to idle time; bun has no requestIdleCallback,
// so it falls back to setTimeout(0).
const flushWrites = () => new Promise((resolve) => setTimeout(resolve, 20));

afterEach(async () => {
  await clearStoredResources();
});

describe("persisted sidebar data", () => {
  test("paints a workspace's last data only for that same user and workspace", async () => {
    storeResource(alice, LEADS, { leads: [{ id: "lead-1" }] });
    await flushWrites();

    expect(await readStoredResource(alice, LEADS)).toEqual({ leads: [{ id: "lead-1" }] });
    // Another person on this browser, or Alice's other workspace, must never
    // see these leads, even for the instant before the fresh request lands.
    expect(await readStoredResource(bob, LEADS)).toBeUndefined();
    expect(await readStoredResource(aliceOther, LEADS)).toBeUndefined();
  });

  test("signing in as someone else wipes the previous person's data from the device", async () => {
    storeResource(alice, LEADS, { leads: [] });
    storeResource(aliceOther, LEADS, { leads: [] });
    storeResource(bob, LEADS, { leads: [] });
    await flushWrites();

    await pruneOtherUsers("user_bob");

    expect(await readStoredResource(alice, LEADS)).toBeUndefined();
    expect(await readStoredResource(aliceOther, LEADS)).toBeUndefined();
    expect(await readStoredResource(bob, LEADS)).toEqual({ leads: [] });
  });

  test("keeps every workspace of the same user so switching back is still instant", async () => {
    storeResource(alice, LEADS, { leads: [] });
    storeResource(aliceOther, LEADS, { leads: [] });
    await flushWrites();

    await pruneOtherUsers("user_alice");

    expect(await readStoredResource(alice, LEADS)).toEqual({ leads: [] });
    expect(await readStoredResource(aliceOther, LEADS)).toEqual({ leads: [] });
  });

  test("sign-out leaves nothing behind", async () => {
    storeResource(alice, LEADS, { leads: [] });
    await flushWrites();

    await clearStoredResources();

    expect(await readStoredResource(alice, LEADS)).toBeUndefined();
  });

  test("data older than a week is not shown, a skeleton beats week-old numbers", async () => {
    const realNow = Date.now;
    try {
      Date.now = () => realNow() - 8 * 24 * 60 * 60 * 1000;
      storeResource(alice, LEADS, { leads: [] });
      await flushWrites();
      Date.now = realNow;

      expect(await readStoredResource(alice, LEADS)).toBeUndefined();
    } finally {
      Date.now = realNow;
    }
  });
});
