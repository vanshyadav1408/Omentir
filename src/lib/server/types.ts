export type WorkspaceSettings = {
  dailyInviteLimit: number;
  dailyMessageLimit: number;
  firstMessageDelayMinutes: number;
  aiFollowUpEnabled: boolean;
  aiFollowUpDelayMinutes: number;
};

export type WorkspaceBilling = {
  provider: "manual" | "whop";
  plan: "solo" | "startup" | "enterprise";
  status:
    | "pending"
    | "active"
    | "bypassed"
    | "approval_pending"
    | "suspended"
    | "cancelled"
    | "expired";
  payerEmail?: string;
  currentPeriodEnd?: string;
  updatedAt: string;
};

export type WorkspaceOnboarding = {
  source: string;
  role: string;
  companySize: string;
  goal: string;
  updatedAt: string;
};

export type Workspace = {
  id: string;
  ownerId: string;
  name: string;
  notificationEmail?: string;
  // IANA timezone (e.g. "America/New_York") used for local-time features like
  // the daily digest send hour. Unset means UTC.
  timezone?: string;
  billing?: WorkspaceBilling;
  onboarding?: WorkspaceOnboarding;
  createdAt: string;
  updatedAt: string;
  settings: WorkspaceSettings;
};

export type AgentApiKey = {
  id: string;
  workspaceId: string;
  label: string;
  tokenHash: string;
  tokenPrefix: string;
  status: "active" | "revoked";
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductProfile = {
  id: string;
  workspaceId: string;
  websiteUrl: string;
  description: string;
  companyName: string;
  industry: string;
  companySize: string;
  painPointsText: string;
  keyFeatures: string[];
  socialProof: string[];
  linkedInCompanyPage: string;
  targetBuyers: string[];
  buyerTitles: string[];
  industries: string[];
  companySizes: string[];
  painPoints: string[];
  keywords: string[];
  preferredLocations: string[];
  averageTicketSize?: number;
  createdAt: string;
  updatedAt: string;
};

export type AgentSignalSources = {
  competitorUrls: string[];
  founderUrls: string[];
  keywords: string[];
};

export type PeopleEngineCursor = {
  sourceKey: string;
  updatedAt: string;
};

export type LinkedInAccount = {
  id: string;
  workspaceId: string;
  provider: "unipile";
  accountId: string;
  displayName: string;
  avatarUrl?: string;
  status: "connected" | "disconnected" | "error";
  createdAt: string;
  updatedAt: string;
};

export type Agent = {
  id: string;
  workspaceId: string;
  name: string;
  linkedInAccountId?: string;
  mode: "prompt" | "filters" | "signals" | "outreach";
  prompt: string;
  filters: {
    titles: string[];
    industries: string[];
    locations: string[];
    keywords: string[];
  };
  signalSources?: AgentSignalSources;
  peopleEngineCursor?: PeopleEngineCursor;
  targetGroupId: string;
  targetGroupName: string;
  status: "active" | "paused" | "running" | "error";
  lastRunAt?: string;
  runStartedAt?: string;
  nextRunAt: string;
  createdAt: string;
  updatedAt: string;
};

export type Group = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  leadCount: number;
  createdAt: string;
  updatedAt: string;
};

// Minimal lead shape for agent metrics: only the fields needed to map a lead
// to its source agent, so pages can avoid pulling full lead documents.
export type LeadAgentRef = { id: string; sourceAgentId?: string };

export type Lead = {
  id: string;
  workspaceId: string;
  groupIds: string[];
  linkedInUrl: string;
  providerProfileId?: string;
  avatarUrl?: string;
  name: string;
  title: string;
  company: string;
  location: string;
  summary: string;
  fitScore: number;
  scoreReasons: string[];
  signalType?: LeadSignalType;
  signalSource?: string;
  signalText?: string;
  signalUrl?: string;
  signalObservedAt?: string;
  leadReason?: string;
  sourceAgentId?: string;
  outreachStatus:
    | "new"
    | "invited"
    | "connected"
    | "messaged"
    | "replied"
    | "declined"
    | "stopped";
  createdAt: string;
  updatedAt: string;
};

export type LeadPreview = Pick<
  Lead,
  | "id"
  | "groupIds"
  | "linkedInUrl"
  | "avatarUrl"
  | "name"
  | "title"
  | "company"
  | "location"
  | "summary"
  | "fitScore"
  | "scoreReasons"
  | "signalText"
  | "signalUrl"
  | "sourceAgentId"
  | "outreachStatus"
  | "createdAt"
  | "updatedAt"
>;

export type LeadSignalType =
  | "post_comment"
  | "post_reaction"
  | "keyword_search"
  | "profile_search";

export type LeadSignal = {
  id: string;
  workspaceId: string;
  agentId: string;
  groupId: string;
  personKey: string;
  linkedInUrl: string;
  providerProfileId?: string;
  personName: string;
  personTitle: string;
  personCompany: string;
  signalType: LeadSignalType;
  signalSource: string;
  signalText: string;
  signalUrl: string;
  signalObservedAt: string;
  leadReason: string;
  leadId?: string;
  fitScore?: number;
  promotedToLead: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CampaignStep =
  | {
      id: string;
      type: "connect";
      includeNote: boolean;
      noteTemplate: string;
    }
  | {
      id: string;
      type: "wait";
      delayMinutes: number;
    }
  | {
      id: string;
      type: "message";
      messageTemplate: string;
    };

export type Campaign = {
  id: string;
  workspaceId: string;
  name: string;
  linkedInAccountId?: string;
  groupId: string;
  status: "draft" | "active" | "paused";
  steps: CampaignStep[];
  // Who owns the conversation once a lead replies. "ai" (default, also for
  // campaigns created before this field existed): the sequence stops and AI
  // handles the conversation until hot or terminal intent. "handoff": all
  // automation stops at the first reply and the user is emailed to take over.
  replyHandling?: "ai" | "handoff";
  // The user's intent captured at campaign creation - what the sequence should
  // achieve and how it should sound. Fed into every AI message prompt.
  campaignGoal?: "warm" | "demo";
  messageTone?: string;
  createdAt: string;
  updatedAt: string;
};

export type CampaignEnrollment = {
  id: string;
  workspaceId: string;
  campaignId: string;
  leadId: string;
  status:
    | "queued"
    | "connection_sent"
    | "connected"
    | "message_sent"
    | "reply_received"
    | "replied"
    | "stopped"
    | "error";
  currentStepIndex: number;
  nextActionAt: string;
  // Set when the tick parked this enrollment only because its campaign was
  // paused - marks it safe to wake immediately on resume without disturbing
  // enrollments whose nextActionAt is a real wait-step / pacing schedule.
  pausedDeferredAt?: string;
  lastError?: string;
  retryCount?: number;
  connectionSentAt?: string;
  // AI message drafted ahead of time (when the preceding wait step starts) so
  // the Actions page can show exactly what will be sent; the send path reuses
  // it when stepIndex still matches, then clears it.
  nextMessageDraft?: {
    stepIndex: number;
    body: string;
    createdAt: string;
  };
  pendingAction?: {
    kind: "connection" | "message" | "reply";
    stepIndex: number;
    startedAt: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type CampaignEnrollmentPreview = Pick<
  CampaignEnrollment,
  | "id"
  | "workspaceId"
  | "campaignId"
  | "leadId"
  | "status"
  | "lastError"
  | "connectionSentAt"
  | "createdAt"
  | "updatedAt"
>;

export type ConversationMessage = {
  id: string;
  direction: "inbound" | "outbound";
  senderName: string;
  body: string;
  createdAt: string;
};

// Intent of the lead's latest inbound message - drives AI reply branch and the
// interested-lead email. Classified once when the reply is stored.
export type ReplyIntent =
  | "hot"
  | "warm"
  | "question"
  | "neutral"
  | "not_now"
  | "negative"
  | "ooo";

export type Conversation = {
  id: string;
  workspaceId: string;
  leadId: string;
  campaignId?: string;
  userId: string;
  status: "open" | "closed";
  messages: ConversationMessage[];
  // Latest classified intent (overwritten on each new inbound reply).
  replyIntent?: ReplyIntent;
  replyIntentReason?: string;
  replyIntentConfidence?: number;
  replyIntentNextStepHint?: string;
  replyIntentAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type LinkedInInboxMessage = {
  id: string;
  chatId: string;
  direction: "inbound" | "outbound";
  senderName: string;
  body: string;
  createdAt: string;
};

export type LinkedInInboxThread = {
  id: string;
  providerChatId: string;
  accountId: string;
  title: string;
  profileName?: string;
  profileHeadline?: string;
  profileUrl?: string;
  avatarUrl?: string;
  unread: boolean;
  updatedAt: string;
  messages: LinkedInInboxMessage[];
};

export type AutomationRun = {
  id: string;
  workspaceId?: string;
  kind: "cron" | "agent" | "campaign" | "webhook" | "people_engine" | "digest";
  status: "started" | "completed" | "error";
  message: string;
  createdAt: string;
};
