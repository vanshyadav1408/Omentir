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
  hasExistingCampaign: boolean,
): SendWindow {
  return stored ?? (hasExistingCampaign ? EXISTING_AGENT_SEND_WINDOW_FALLBACK : NEW_AGENT_SEND_WINDOW);
}

export function messageToneForAgentForm(
  stored: string | undefined,
  hasExistingCampaign: boolean,
): AgentMessageTone {
  if (stored === "professional" || stored === "conversational" || stored === "direct") {
    return stored;
  }
  return hasExistingCampaign ? EXISTING_AGENT_MESSAGE_TONE_FALLBACK : NEW_AGENT_MESSAGE_TONE;
}

// Resume-at-plan-limit reuses an agent row that never got a campaign. That is
// first-time outreach, so hasExistingCampaign must be false even though
// initialAgent is set. An agent row is not a campaign to preserve.
export function agentFormOutreachDefaults(input: {
  storedSendWindow?: SendWindow;
  storedMessageTone?: string;
  hasExistingCampaign: boolean;
}): { sendWindow: SendWindow; messageTone: AgentMessageTone } {
  return {
    sendWindow: sendWindowForAgentForm(input.storedSendWindow, input.hasExistingCampaign),
    messageTone: messageToneForAgentForm(input.storedMessageTone, input.hasExistingCampaign),
  };
}

export function sendWindowForOutreachAttach(
  requested: SendWindow | undefined,
  existing: SendWindow | undefined,
): SendWindow {
  return requested ?? existing ?? NEW_AGENT_SEND_WINDOW;
}

export function parseAgentMessageTone(value: string | undefined | null): AgentMessageTone | undefined {
  const raw = String(value || "").trim();
  if (raw === "professional" || raw === "conversational" || raw === "direct") return raw;
  return undefined;
}
