import { isLocalMode } from "../runtime-mode.ts";

export type AutomationSafetyOptions = {
  dryRun?: boolean;
};

export type AutomationSafetyMode = {
  disabled: boolean;
  dryRun: boolean;
  pausedWorkspaceIds: Set<string>;
};

function truthy(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes((value || "").trim().toLowerCase());
}

function parseWorkspaceIds(value: string | undefined) {
  return new Set(
    (value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function getAutomationSafetyMode(options: AutomationSafetyOptions = {}): AutomationSafetyMode {
  const localDryRun =
    isLocalMode() && process.env.ENABLE_LIVE_AUTOMATION?.trim().toLowerCase() !== "true";
  return {
    disabled: truthy(process.env.AUTOMATION_DISABLED) || truthy(process.env.AUTOMATION_PAUSED),
    dryRun: Boolean(options.dryRun) || localDryRun || truthy(process.env.AUTOMATION_DRY_RUN),
    pausedWorkspaceIds: parseWorkspaceIds(process.env.AUTOMATION_PAUSED_WORKSPACE_IDS),
  };
}

export function isWorkspaceAutomationPaused(
  mode: Pick<AutomationSafetyMode, "pausedWorkspaceIds">,
  workspaceId: string,
) {
  return mode.pausedWorkspaceIds.has(workspaceId);
}

export function automationDecisionMessage(input: {
  dryRun?: boolean;
  enrollmentId?: string;
  campaignId?: string;
  leadId?: string;
  result: string;
}) {
  const prefix = input.dryRun ? "DRY RUN " : "";
  return `${prefix}Enrollment ${input.enrollmentId || "unknown"} campaign ${
    input.campaignId || "unknown"
  } lead ${input.leadId || "unknown"} -> ${input.result}`;
}
