import type { CampaignStep } from "./types";

// When a campaign's steps are edited, an in-flight enrollment's
// currentStepIndex still points into the OLD steps array. Remap it to the same
// logical step in the NEW array by matching step id, so leads mid-sequence
// continue gracefully instead of drifting onto the wrong step (or repeating /
// skipping one) when the campaign resumes.
//
// Policy: keep the enrollment on the step it was about to run if that step still
// exists; if it was removed, advance to the first surviving step at-or-after it
// (never go backwards, never repeat a completed step); if nothing after it
// survives, the enrollment is past the new end and is treated as complete
// (index === newSteps.length, which runEnrollment stops as "complete").
export function remapStepIndex(
  oldSteps: CampaignStep[],
  newSteps: CampaignStep[],
  currentStepIndex: number,
): number {
  const newIndexById = new Map(newSteps.map((step, index) => [step.id, index]));

  for (let i = currentStepIndex; i < oldSteps.length; i += 1) {
    const target = newIndexById.get(oldSteps[i].id);
    if (target !== undefined) return target;
  }

  return newSteps.length;
}
