// How far a lead actually got, as a number so counts can be cumulative
// (contacted >= accepted >= messaged >= replied).
//
// Two stored fields describe this and neither is a high-water mark on its own:
// - campaignEnrollment.status collapses to "stopped"/"error" the moment a
//   sequence completes, an invite expires, the lead leaves the group or a reply
//   is intent-stopped, which erased every stage the lead had already reached.
// - lead.outreachStatus gets written back down: the acceptance sweep sets
//   "connected" and a follow-up send sets "messaged", both of which can land
//   after the lead already replied.
// Statuses absent from a map score 0 and defer to the other field.

export const STAGE_CONTACTED = 1;
export const STAGE_ACCEPTED = 2;
export const STAGE_MESSAGED = 3;
export const STAGE_REPLIED = 4;

const LEAD_STAGE: Record<string, number> = {
  invited: STAGE_CONTACTED,
  // The invite was sent and turned down - still a contact attempt.
  declined: STAGE_CONTACTED,
  connected: STAGE_ACCEPTED,
  messaged: STAGE_MESSAGED,
  replied: STAGE_REPLIED,
};

const ENROLLMENT_STAGE: Record<string, number> = {
  connection_sent: STAGE_CONTACTED,
  connected: STAGE_ACCEPTED,
  message_sent: STAGE_MESSAGED,
  reply_received: STAGE_REPLIED,
  replied: STAGE_REPLIED,
};

export function leadStage(outreachStatus?: string) {
  return LEAD_STAGE[outreachStatus ?? ""] ?? 0;
}

export function enrollmentStage(status?: string) {
  return ENROLLMENT_STAGE[status ?? ""] ?? 0;
}

export function combinedOutreachStage(enrollmentStatus?: string, outreachStatus?: string) {
  return Math.max(enrollmentStage(enrollmentStatus), leadStage(outreachStatus));
}

// A finished or failed enrollment collapses to stopped/error, which scores 0.
// connectionSentAt is the durable proof an invite went out, so those leads
// still count as contacted on the Agents page.
export function enrollmentProgressStage(status?: string, connectionSentAt?: string) {
  const stage = enrollmentStage(status);
  return connectionSentAt ? Math.max(stage, STAGE_CONTACTED) : stage;
}
