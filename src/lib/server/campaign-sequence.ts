import { z } from "zod";
import type { CampaignStep } from "./types";

// nextActionAt can point at a wait step that established the delay. The
// schedule should name the outreach after that wait without inventing a new time.
export function findNextScheduledStep(steps: CampaignStep[], currentStepIndex: number) {
  const index = findNextScheduledStepIndex(steps, currentStepIndex);
  const step = index === -1 ? undefined : steps[index];
  return step?.type === "wait" ? undefined : step;
}

export function findNextScheduledStepIndex(steps: CampaignStep[], currentStepIndex: number) {
  return steps.findIndex((step, index) => index >= currentStepIndex && step.type !== "wait");
}

type CampaignSequenceAction = {
  id?: string;
  kind?: "connect" | "message" | "follow";
  enabled?: boolean;
  mode?: "ai" | "manual";
  manualMessage?: string;
  waitValue?: number;
  waitUnit?: "minutes" | "hours" | "days";
  includeNote?: boolean;
};

const campaignSequenceActionSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(["connect", "message", "follow"]).optional(),
  enabled: z.boolean().optional(),
  mode: z.enum(["ai", "manual"]).optional(),
  manualMessage: z.string().optional(),
  waitValue: z.coerce.number().finite().min(1).max(10_080).optional(),
  waitUnit: z.enum(["minutes", "hours", "days"]).optional(),
  includeNote: z.boolean().optional(),
});

function waitMinutesFromAction(action: CampaignSequenceAction) {
  const value = Math.max(1, Number(action.waitValue || 1));
  const minutes =
    action.waitUnit === "days" ? value * 24 * 60 : action.waitUnit === "minutes" ? value : value * 60;
  return Math.min(10_080, minutes);
}

export function parseCampaignSequence(value: FormDataEntryValue | null): CampaignStep[] | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const parsed = z.array(campaignSequenceActionSchema).safeParse(JSON.parse(value));
    if (!parsed.success) return null;
    const actions = parsed.data;

    const steps: CampaignStep[] = [];
    actions
      .filter((action) => action.enabled !== false)
      .forEach((action, index) => {
        const id = String(action.id || `${action.kind || "step"}-${index}`).trim();
        if (index > 0) {
          steps.push({
            id: `wait-${id}`,
            type: "wait",
            delayMinutes: waitMinutesFromAction(action),
          });
        }

        if (action.kind === "connect") {
          // AI outreach never attaches an invitation note: bare connection
          // requests only. Notes are sent solely when the user wrote one.
          const noteTemplate =
            action.mode === "ai" || action.includeNote === false
              ? ""
              : String(action.manualMessage || "").trim();
          steps.push({
            id,
            type: "connect",
            includeNote: Boolean(noteTemplate),
            noteTemplate,
          });
          return;
        }

        steps.push({
          id,
          type: "message",
          messageTemplate:
            action.mode === "ai" ? "" : String(action.manualMessage || "").trim(),
        });
      });

    return steps.length ? steps : null;
  } catch {
    return null;
  }
}

export function parseBasicCampaignFlow(
  formData: FormData,
  fallbackFirstMessageDelayMinutes: number,
) {
  const connectionNote = String(formData.get("connectionNote") || "").trim();
  const firstMessage = String(formData.get("firstMessage") || "").trim();
  const followUp = String(formData.get("followUpMessage") || "").trim();
  const useAiFirstMessage = formData.get("aiFirstMessage") === "on";
  const useAiFollowUp = formData.get("aiFollowUpMessage") === "on";
  const waitDays = Math.max(1, Number(formData.get("waitDays") || 0));
  const waitMinutes = Number.isFinite(waitDays)
    ? waitDays * 24 * 60
    : fallbackFirstMessageDelayMinutes;
  const steps: CampaignStep[] = [
    {
      id: "connect",
      type: "connect",
      includeNote: connectionNote.length > 0,
      noteTemplate: connectionNote,
    },
    {
      id: "wait-accepted",
      type: "wait",
      delayMinutes: waitMinutes,
    },
    {
      id: "first-message",
      type: "message",
      messageTemplate: useAiFirstMessage ? "" : firstMessage,
    },
  ];

  if (followUp || useAiFollowUp) {
    steps.push(
      { id: "wait-follow-up", type: "wait", delayMinutes: 24 * 60 },
      { id: "follow-up", type: "message", messageTemplate: useAiFollowUp ? "" : followUp },
    );
  }

  return steps;
}

export function buildCampaignSteps(formData: FormData, fallbackFirstMessageDelayMinutes: number) {
  const connectionNote = String(formData.get("connectionNote") || "").trim();
  const includeNote = connectionNote.length > 0;
  const followUp = String(formData.get("followUpMessage") || "").trim();
  const useAiDefaultOutreach = formData.get("aiDefaultOutreach") === "on";
  const useManualDefaultOutreach = formData.get("manualDefaultOutreach") === "on";
  const useAiFirstMessage = formData.get("aiFirstMessage") === "on";
  const useAiFollowUp = formData.get("aiFollowUpMessage") === "on";
  const waitDaysRaw = formData.get("waitDays");
  const waitMinutes = waitDaysRaw ? Number(waitDaysRaw) * 24 * 60 : fallbackFirstMessageDelayMinutes;
  const afterApprovalMinutes = Math.max(
    1,
    Number(formData.get("afterApprovalMinutes") || 15) || 15,
  );
  const secondWaitMinutes =
    Math.max(1, Number(formData.get("secondWaitHours") || 18) || 18) * 60;
  const thirdWaitMinutes =
    Math.max(1, Number(formData.get("thirdWaitHours") || 30) || 30) * 60;
  const firstMessage = String(formData.get("firstMessage") || "").trim();
  const secondMessage = String(formData.get("secondMessage") || "").trim();
  const thirdMessage = String(formData.get("thirdMessage") || "").trim();

  const sequenceSteps = parseCampaignSequence(formData.get("sequence"));
  const steps: CampaignStep[] =
    sequenceSteps ||
    (useAiDefaultOutreach
      ? [
          {
            // AI outreach sends a bare connection request - no invitation note.
            id: "connect",
            type: "connect",
            includeNote: false,
            noteTemplate: "",
          },
          { id: "wait-after-approval", type: "wait", delayMinutes: afterApprovalMinutes },
          { id: "first-message", type: "message", messageTemplate: "" },
          { id: "wait-second-message", type: "wait", delayMinutes: secondWaitMinutes },
          { id: "second-message", type: "message", messageTemplate: "" },
          { id: "wait-third-message", type: "wait", delayMinutes: thirdWaitMinutes },
          { id: "third-message", type: "message", messageTemplate: "" },
        ]
      : useManualDefaultOutreach
        ? [
            {
              id: "connect",
              type: "connect",
              includeNote,
              noteTemplate: connectionNote,
            },
            { id: "wait-after-approval", type: "wait", delayMinutes: afterApprovalMinutes },
            { id: "first-message", type: "message", messageTemplate: firstMessage },
            { id: "wait-second-message", type: "wait", delayMinutes: secondWaitMinutes },
            { id: "second-message", type: "message", messageTemplate: secondMessage },
            { id: "wait-third-message", type: "wait", delayMinutes: thirdWaitMinutes },
            { id: "third-message", type: "message", messageTemplate: thirdMessage },
          ]
        : [
            {
              id: "connect",
              type: "connect",
              includeNote,
              noteTemplate: connectionNote,
            },
            {
              id: "wait-accepted",
              type: "wait",
              delayMinutes: Number.isFinite(waitMinutes)
                ? waitMinutes
                : fallbackFirstMessageDelayMinutes,
            },
            {
              id: "first-message",
              type: "message",
              messageTemplate: useAiFirstMessage ? "" : firstMessage,
            },
          ]);

  if (
    !sequenceSteps &&
    !useAiDefaultOutreach &&
    !useManualDefaultOutreach &&
    (followUp || useAiFollowUp)
  ) {
    steps.push(
      { id: "wait-follow-up", type: "wait", delayMinutes: 24 * 60 },
      { id: "follow-up", type: "message", messageTemplate: useAiFollowUp ? "" : followUp },
    );
  }

  return steps;
}

export function trailingStepsAfterSecondMessage(steps: CampaignStep[]) {
  let messagesSeen = 0;

  for (let index = 0; index < steps.length; index += 1) {
    if (steps[index].type !== "message") continue;
    messagesSeen += 1;

    if (messagesSeen === 2) {
      return steps.slice(index + 1);
    }
  }

  return [];
}
