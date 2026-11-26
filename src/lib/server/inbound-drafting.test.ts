import { afterAll, expect, mock, test } from "bun:test";
import type { Lead, LinkedInAccount } from "./types";

mock.module("server-only", () => ({}));

// Stands in for the real profile read: once lead discovery has spent the
// account's daily profile views it answers null, unless the caller says the
// read must not count against that budget.
const discoverySpentTodaysViews = true;
const retrieveLinkedInProfile = mock(async (input: { ignoreViewBudget?: boolean }) =>
  discoverySpentTodaysViews && !input.ignoreViewBudget
    ? null
    : { name: "Ana Ruiz", title: "Head of Operations", company: "Acme" },
);
const updateLead = mock(async () => undefined);

mock.module("./data", () => ({
  claimLeadOutcomeNotification: async () => false,
  claimOwnerRequestNotification: async () => false,
  claimReplyNotification: async () => false,
  createConversationMessage: async () => true,
  findLeadForWorkspace: async () => null,
  getConversation: async () => null,
  getLeadsByIds: async () => [],
  getLinkedInAccountForWorkspace: async () => null,
  getProductProfile: async () => ({}),
  getWorkspace: async () => ({ id: "workspace", billing: {} }),
  listCampaignEnrollments: async () => [],
  listCampaigns: async () => [],
  listWorkspaceIdsSharingLinkedIn: async () => ["workspace"],
  logAutomationRun: async () => undefined,
  planActionSlots: async () => [],
  releaseLeadOutcomeNotification: async () => undefined,
  releaseOwnerRequestNotification: async () => undefined,
  releaseReplyNotification: async () => undefined,
  setConversationReplyIntent: async () => undefined,
  updateEnrollment: async () => undefined,
  updateLead,
}));
mock.module("./gemini", () => ({ classifyReplyIntent: async () => ({}), draftCampaignMessage: async () => "" }));
mock.module("./email", () => ({
  emailWasSkipped: () => false,
  sendInterestedLeadNotification: async () => ({}),
  sendOwnerRequestNotification: async () => ({}),
  sendReplyNotification: async () => ({}),
}));
mock.module("./linkedin", () => ({
  getLinkedInPostCreatedAt: () => undefined,
  getLinkedInPostText: () => "",
  isFirstDegreeConnection: async () => null,
  listLinkedInPostsForProfile: async () => [],
  retrieveLinkedInProfile,
}));
mock.module("./lead-avatar-cache", () => ({ leadAvatarBytes: async () => null }));
mock.module("@/lib/posthog-server", () => ({ capturePostHogEvent: () => undefined }));

const { refreshLeadProfileForDrafting } = await import("./inbound");

afterAll(() => {
  mock.restore();
});

const account = { id: "account", accountId: "own_member" } as LinkedInAccount;
// Found by discovery with no stored profile context, like most new leads.
const lead = {
  id: "lead",
  workspaceId: "workspace",
  name: "Ana",
  linkedInUrl: "https://www.linkedin.com/in/ana",
} as Lead;

// Discovery spends the day's 75 profile views in its first hours. Read under
// that budget, the first message to everyone who accepted later that day
// failed with "profile context is not available yet", and did so again every
// day after: 131 accepted leads were left without a first message.
test("an accepted lead still gets their profile read for the first message after discovery spent the day's profile views", async () => {
  const refreshed = await refreshLeadProfileForDrafting(lead, account);
  expect(refreshed.title).toBe("Head of Operations");
  expect(updateLead).toHaveBeenCalledTimes(1);
});
