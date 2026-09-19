import { describe, expect, test } from "bun:test";
import { loadDurableActivityDays } from "./sidebar-activity-days";

describe("loadDurableActivityDays", () => {
  test("returns durable days before live reconcile finishes so Overview JSON is not blocked on paging every conversation", async () => {
    const scheduled: Array<() => void> = [];
    let releaseReconcile!: () => void;
    const reconcileGate = new Promise<void>((resolve) => {
      releaseReconcile = resolve;
    });

    const pending = loadDurableActivityDays({
      listDays: async () => [{ day: "2026-09-19", found: 4 }],
      scheduleAfter: (work) => {
        scheduled.push(work);
      },
      reconcileLive: () => reconcileGate,
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("activityDays JSON waited on reconcile")), 200);
    });

    try {
      const result = await Promise.race([pending, timeout]);
      expect(result).toEqual({ activityDays: [{ day: "2026-09-19", found: 4 }] });
      expect(scheduled).toHaveLength(1);
    } finally {
      if (timer) clearTimeout(timer);
      releaseReconcile();
    }
  });
});
