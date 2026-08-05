export type WorkspaceSettings = {
  dailyInviteLimit: number;
  dailyMessageLimit: number;
  firstMessageDelayMinutes: number;
  aiFollowUpEnabled: boolean;
  aiFollowUpDelayMinutes: number;
};

export type WorkspaceBilling = {
  provider: "manual" | "whop";
  // "startup" and "enterprise" are retired from sale but still held by
  // existing workspaces. "lifetime" is the one-time plan.
  plan: "solo" | "lifetime" | "startup" | "enterprise";
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

/**
 * A client registered through OAuth dynamic client registration (RFC 7591).
 * Hosted AI apps (Claude, ChatGPT, Grok) register themselves on first connect,
 * so there is nothing for a user to configure by hand.
 */
export type OAuthClient = {
  id: string;
  clientName: string;
  redirectUris: string[];
  createdAt: string;
};

/**
 * A pending authorization code. The document id is the SHA-256 of the code, so
 * a database leak never yields a usable code. Single-use and short-lived.
 */
export type OAuthAuthorizationCode = {
  id: string;
  clientId: string;
  workspaceId: string;
  redirectUri: string;
  codeChallenge: string;
  expiresAt: string;
  createdAt: string;
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
  // Plain-language pricing facts the AI may quote when a lead asks. Free text
  // supports monthly, annual, usage-based, and custom pricing without forcing
  // every product into one numeric field.
  pricingDetails?: string;
  // Workspace default for campaigns that let AI carry a conversation through
  // booking. Each campaign snapshots the link it launches with.
  schedulingLink?: string;
  keyFeatures: string[];
  socialProof: string[];
  linkedInCompanyPage: string;
  targetBuyers: string[];
  buyerTitles: string[];
  // The concrete jobs people hire this product to do. Buyer titles are derived
  // from these rather than guessed from the industry, so discovery works the
  // same way for a warehouse tool as for a sales tool.
  useCases?: string[];
  // Words that show up inside the job titles of people who perform those use
  // cases ("dispatcher", "paralegal", "colorist"). Feeds the title matcher so it
  // recognizes a domain nobody hardcoded a synonym list for.
  roleVocabulary?: string[];
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
  // Legacy: hour of the local day (0-23, workspace timezone) this agent runs
  // lead discovery, from back when setup asked for one. Agents created since
  // then carry runAnchorAt instead and never set this. Kept so existing agents
  // keep discovering at the hour their owner chose - nothing writes it anymore.
  runAtHour?: number;
  // The instant the agent was created. Discovery runs immediately at setup and
  // then daily at this wall-clock time in the workspace's zone. Unset on agents
  // predating this, which fall back to runAtHour.
  runAnchorAt?: string;
  // The user chose the leads-only flow: this agent finds leads and stops. It
  // has no campaign by design, which is otherwise indistinguishable from a
  // half-finished full setup, so nothing may attach outreach to its group
  // without the user asking. Unset on agents created before this existed and
  // on full find-plus-outreach agents.
  leadsOnly?: boolean;
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
export type LeadAgentRef = {
  id: string;
  sourceAgentId?: string;
  outreachStatus?: Lead["outreachStatus"];
};

export type LinkedInProfileContext = {
  about: string;
  experience: string[];
  education: string[];
  skills: string[];
  certifications: string[];
  projects: string[];
  volunteering: string[];
  languages: string[];
  recentPosts: string[];
  capturedAt: string;
};

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
  profileContext?: LinkedInProfileContext;
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

// Narrower projection for the dashboard, which never renders the long-form
// fields. summary/scoreReasons/signalUrl alone are ~55% of a LeadPreview
// payload, so dropping them roughly halves the dashboard's slowest query.
export type LeadDashboardPreview = Pick<
  Lead,
  | "id"
  | "linkedInUrl"
  | "avatarUrl"
  | "name"
  | "title"
  | "company"
  | "fitScore"
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

// When this campaign is allowed to send, interpreted in each LEAD's local
// timezone (resolved from their profile location; the workspace's zone is the
// fallback for leads we can't place). The window protects the recipient's
// evening, so it is read on the recipient's clock - daily caps and per-account
// spacing stay on the workspace's, since those protect the sending account.
// "always" is the historical behaviour (24/7, including 3am Sunday);
// "business" is Mon-Fri 09:00-18:00; "extended" is every day 07:00-22:00.
// Campaigns sharing a LinkedIn account may disagree - each action is checked
// against its own campaign's window, so no arbitration is needed.
export type SendWindow = "always" | "business" | "extended";

export type CampaignReplyHandling =
  | "ai"
  | "handoff"
  | "ai_until_interest"
  | "ai_until_booked";

export type Campaign = {
  id: string;
  workspaceId: string;
  name: string;
  linkedInAccountId?: string;
  groupId: string;
  status: "draft" | "active" | "paused";
  steps: CampaignStep[];
  // Unset means "always", so campaigns created before this field keep their
  // existing round-the-clock behaviour until the user picks a window.
  sendWindow?: SendWindow;
  // Who owns the conversation once a lead replies. Legacy "ai" behaves like
  // ai_until_interest. Handoff stops after the first reply; ai_until_interest
  // stops at qualified interest; ai_until_booked continues until confirmation.
  replyHandling?: CampaignReplyHandling;
  // Only used by ai_until_booked. Kept on the campaign so a later My Product
  // edit does not silently change the link used by an active conversation.
  bookingLink?: string;
  // Only consulted on "handoff" campaigns, where the user owns the conversation
  // from the first reply. Unset means "email me" so campaigns created before
  // this field keep notifying; false is the manual user who watches LinkedIn
  // themselves and does not want an email for every reply.
  notifyOnReply?: boolean;
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
  | "meeting_booked"
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
