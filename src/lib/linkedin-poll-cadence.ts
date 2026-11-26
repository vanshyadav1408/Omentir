// Every reply check and acceptance sweep is a paid request through the
// account's proxy, and it runs for as long as the account stays connected. An
// account that has sent nothing for two weeks rarely has anything new to
// report, so the tick checks it less often until it sends again. The first
// send (automated or from the Messages inbox) puts it back on the fast cadence
// on the next cycle.
export const IDLE_ACCOUNT_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * `lastSentAt` is the epoch ms of the account's last outbound action, or
 * undefined when it has never sent anything through Omentir.
 */
export function isIdleLinkedInAccount(lastSentAt: number | undefined, now = Date.now()) {
  if (!lastSentAt) return true;
  return now - lastSentAt >= IDLE_ACCOUNT_AFTER_MS;
}
