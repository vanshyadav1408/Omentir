export function isLocalMode(env: NodeJS.ProcessEnv = process.env) {
  return env.RUN_LOCALLY?.trim().toUpperCase() === "TRUE";
}

export function isLocalPasswordRequired(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.LOCAL_APP_PASSWORD?.trim());
}

export function isAutomationDisabled(env: NodeJS.ProcessEnv = process.env) {
  return env.AUTOMATION_DISABLED?.trim().toLowerCase() === "true";
}
