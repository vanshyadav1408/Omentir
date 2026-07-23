export function isLocalMode(env: NodeJS.ProcessEnv = process.env) {
  return env.RUN_LOCALLY?.trim().toUpperCase() === "TRUE";
}

/** Explicit opt-in for a passwordless self-hosted welcome screen. */
export function isLocalOpenAccessAllowed(env: NodeJS.ProcessEnv = process.env) {
  return env.LOCAL_ALLOW_OPEN_ACCESS?.trim().toLowerCase() === "true";
}

/**
 * Password is required unless the operator explicitly allows open access.
 * Blank LOCAL_APP_PASSWORD alone is no longer enough to expose a public instance.
 */
export function isLocalPasswordRequired(env: NodeJS.ProcessEnv = process.env) {
  if (isLocalOpenAccessAllowed(env)) {
    return Boolean(env.LOCAL_APP_PASSWORD?.trim());
  }
  return true;
}

export function isAutomationDisabled(env: NodeJS.ProcessEnv = process.env) {
  return env.AUTOMATION_DISABLED?.trim().toLowerCase() === "true";
}
