/**
 * Overview activityDays JSON. Durable day totals are enough for first paint;
 * live CRM paging and persist can finish after the response.
 */
export async function loadDurableActivityDays<T>(input: {
  listDays: () => Promise<T>;
  reconcileLive: () => Promise<unknown>;
  scheduleAfter: (work: () => void) => void;
}): Promise<{ activityDays: T }> {
  const activityDays = input.listDays();
  input.scheduleAfter(() => {
    void input.reconcileLive().catch((error) => {
      console.error(
        "[sidebar-data] activity reconcile failed:",
        error instanceof Error ? error.message : error,
      );
    });
  });
  return { activityDays: await activityDays };
}
