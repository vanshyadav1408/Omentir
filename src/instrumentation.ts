// Built-in scheduler for the automation tick. Production previously relied on
// an external cron calling /api/jobs/automation-tick; when that cron was lost
// (last run 2026-05-18), all outreach silently stopped. Running the schedule
// inside the server process removes that infra dependency. The Firestore tick
// lock still guarantees a single tick runs at a time, even if an external cron
// is also configured or several server processes are up.

// Faster than the historical 10-minute external cron so replies and follow-ups
// move promptly. Invite volume is NOT tied to this cadence: connection requests
// are spaced by the persistent per-account gate in automation.ts
// (INVITE_SPACING_MINUTES), so a quicker tick never sends invites faster.
// Must stay above TICK_SCHEDULE_MIN_INTERVAL_MS in automation.ts (1.75 min),
// which gates scheduled starts across processes.
const TICK_INTERVAL_MS = 2 * 60 * 1000;
// The async endpoint responds as soon as the tick is started (the tick itself
// runs after the response), so this only covers request/route startup.
const TICK_REQUEST_TIMEOUT_MS = 60 * 1000;
// Small startup delay so the server is fully ready before the first tick.
const FIRST_TICK_DELAY_MS = 30 * 1000;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const [{ validateRuntimeConfig }, { isAutomationDisabled }] = await Promise.all([
    import("@/lib/server/runtime-config"),
    import("@/lib/runtime-mode"),
  ]);
  validateRuntimeConfig();
  if (isAutomationDisabled()) {
    console.warn("[automation] AUTOMATION_DISABLED=true; scheduler and job execution are disabled.");
    return;
  }

  const secret = process.env.CRON_SECRET || process.env.AUTOMATION_JOB_SECRET;
  if (!secret) {
    console.warn(
      "[automation] CRON_SECRET/AUTOMATION_JOB_SECRET is not set; built-in automation scheduler disabled.",
    );
    return;
  }

  // Dev restarts and multiple imports must not stack extra timers.
  const globalState = globalThis as typeof globalThis & {
    __omentirAutomationScheduler?: boolean;
  };
  if (globalState.__omentirAutomationScheduler) return;
  globalState.__omentirAutomationScheduler = true;

  const port = process.env.PORT || "3000";
  const url = `http://127.0.0.1:${port}/api/jobs/automation-tick?async=1&scheduled=1`;

  const tick = async () => {
    try {
      const response = await fetch(url, {
        headers: { "x-cron-secret": secret },
        signal: AbortSignal.timeout(TICK_REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.error(
          `[automation] scheduled tick returned ${response.status}${body ? `: ${body.slice(0, 500)}` : ""}`,
        );
      }
    } catch (error) {
      console.error("[automation] scheduled tick failed:", error);
    }
  };

  setTimeout(tick, FIRST_TICK_DELAY_MS).unref();
  setInterval(tick, TICK_INTERVAL_MS).unref();
  console.log(
    `[automation] built-in scheduler started: GET ${url} every ${TICK_INTERVAL_MS / 60000} minutes.`,
  );
}
