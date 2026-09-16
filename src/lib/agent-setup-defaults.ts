import type { SendWindow } from "@/lib/server/types";

export type AgentMessageTone = "professional" | "conversational" | "direct";

// Pre-selected when a user creates a Leads + outreach agent and leaves the
// picker alone. Existing campaigns must not pick these up just by being opened.
export const NEW_AGENT_SEND_WINDOW: SendWindow = "extended";
export const NEW_AGENT_MESSAGE_TONE: AgentMessageTone = "conversational";

// Campaigns created before the send-window picker have no stored value and
// already send around the clock. Showing extended on edit would write that
// narrower window on save.
export const EXISTING_AGENT_SEND_WINDOW_FALLBACK: SendWindow = "always";

// Gemini already treats a missing campaign tone as professional. Showing
// conversational on edit would change that voice if the form is saved.
export const EXISTING_AGENT_MESSAGE_TONE_FALLBACK: AgentMessageTone = "professional";

export function sendWindowForAgentForm(
  stored: SendWindow | undefined,
  isEditing: boolean,
): SendWindow {
  return stored ?? (isEditing ? EXISTING_AGENT_SEND_WINDOW_FALLBACK : NEW_AGENT_SEND_WINDOW);
}

export function messageToneForAgentForm(
  stored: string | undefined,
  isEditing: boolean,
): AgentMessageTone {
  if (stored === "professional" || stored === "conversational" || stored === "direct") {
    return stored;
  }
  return isEditing ? EXISTING_AGENT_MESSAGE_TONE_FALLBACK : NEW_AGENT_MESSAGE_TONE;
}
