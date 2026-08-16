import "server-only";

import { createHash, randomBytes } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { hashAgentApiToken } from "@/lib/agent-api-token";
import { planHasApiAccess, planLimits } from "@/lib/plan-limits";
import { isValidTimeZone } from "@/lib/time-zone";
import { getDb, nowIso, cleanId, normalizeLinkedInProfileUrl } from "./firebase";
import { hasIntervalElapsed, isAgentDueForRun, nextDailyAgentRunAt } from "./scheduling";
import {
  DEFAULT_AGENT_RUN_HOUR,
  SPACING_MINUTES,
  nextAnchoredAgentRunAt,
  nextLocalAgentRunAt,
  planSendSchedule,
  zonedParts,
  type SendActionKind,
} from "./send-schedule";
import { remapStepIndex } from "./enrollment-remap";
import { sendWindowTimeZoneForLead } from "./lead-time-zone";
import { addInviteLimitSignal } from "./outreach-rules";
import {
  leadOutcomeNotificationLockId,
  MEETING_BOOKED_CONFIDENCE,
  type LeadOutcomeNotificationKind,
} from "./reply-automation-policy";
import type {
  ActivityDay,
  Agent,
  AgentApiKey,
  AgentSignalSources,
  AutomationRun,
  Campaign,
  CampaignEnrollment,
  CampaignEnrollmentPreview,
  CampaignStep,
  Conversation,
  Group,
  Lead,
  LeadAgentRef,
  LeadDashboardPreview,
  LeadPreview,
  LeadSignal,
  LinkedInAccount,
  OAuthAuthorizationCode,
  OAuthClient,
  ProductProfile,
  SendWindow,
  Workspace,
  WorkspaceBilling,
  WorkspaceOnboarding,
  WorkspaceSettings,
} from "./types";
import {
  buildActivityTotalsFromLive,
  type ActivityDayTotals,
} from "@/lib/activity-overview";

const DEFAULT_SETTINGS: WorkspaceSettings = {
  dailyInviteLimit: 10,
  dailyMessageLimit: 20,
  firstMessageDelayMinutes: 60,
  aiFollowUpEnabled: true,
  aiFollowUpDelayMinutes: 30,
};

function collection<T>(name: string) {
  return getDb().collection(name) as FirebaseFirestore.CollectionReference<T>;
}

// Firestore rejects undefined anywhere in a document (including nested maps).
// Top-level-only stripping left profileContext/enrichment payloads able to throw
// INVALID_ARGUMENT mid agent run and mark the whole agent Error.
function omitUndefinedDeep(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;
  // Preserve FieldValue sentinels (delete, increment, arrayUnion, ...).
  if (typeof (value as { isEqual?: unknown }).isEqual === "function") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => omitUndefinedDeep(item))
      .filter((item) => item !== undefined);
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, omitUndefinedDeep(item)] as const)
      .filter(([, item]) => item !== undefined),
  );
}

function omitUndefined<T extends Record<string, unknown>>(value: T) {
  return omitUndefinedDeep(value) as T;
}

function updatePatch<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      item === undefined ? FieldValue.delete() : item,
    ]),
  );
}

function withDefaultSettings(settings?: Partial<WorkspaceSettings>) {
  const next = { ...(settings || {}) } as Partial<WorkspaceSettings> & {
    dailyLeadLimit?: unknown;
  };
  delete next.dailyLeadLimit;
  return { ...DEFAULT_SETTINGS, ...next };
}

function hasAllSettings(settings?: Partial<WorkspaceSettings>) {
  return Object.keys(DEFAULT_SETTINGS).every(
    (key) => settings?.[key as keyof WorkspaceSettings] !== undefined,
  );
}

function hasLegacySettings(settings?: Partial<WorkspaceSettings> & { dailyLeadLimit?: unknown }) {
  return settings?.dailyLeadLimit !== undefined;
}

type LegacyProductProfile = ProductProfile & {
  selling?: unknown;
  status?: unknown;
  error?: unknown;
};

type CreateAgentInput = Pick<Agent, "name" | "mode" | "prompt" | "filters" | "targetGroupName"> & {
  linkedInAccountId?: string;
  signalSources?: AgentSignalSources;
  leadsOnly?: boolean;
};

type UpsertLeadSignalInput = Omit<
  LeadSignal,
  "id" | "createdAt" | "updatedAt" | "promotedToLead"
> & {
  promotedToLead?: boolean;
};

const LEGACY_PRODUCT_PROFILE_FIELDS = ["selling", "status", "error"] as const;
const AGENT_API_TOKEN_PREFIX = "omentir_agent_";

function removeLegacyProductProfileFields(profile: LegacyProductProfile): ProductProfile {
  const next = { ...profile };
  for (const field of LEGACY_PRODUCT_PROFILE_FIELDS) {
    delete next[field];
  }
  return next as ProductProfile;
}

function withDefaultSignalSources(signalSources?: Partial<AgentSignalSources>) {
  return {
    competitorUrls: signalSources?.competitorUrls || [],
    founderUrls: signalSources?.founderUrls || [],
    keywords: signalSources?.keywords || [],
  };
}

function hashId(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function newAgentApiToken() {
  return `${AGENT_API_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

function agentTokenPrefix(token: string) {
  return `${token.slice(0, AGENT_API_TOKEN_PREFIX.length + 8)}...`;
}

function linkedInAccountLimit(plan: WorkspaceBilling["plan"] | undefined) {
  return planLimits(plan).linkedInAccounts;
}

function limitMessage(resource: string, limit: number) {
  return `Your current plan supports up to ${limit} ${resource}${limit === 1 ? "" : "s"}.`;
}

async function countPlanResource(
  workspaceId: string,
  resource: "agent" | "campaign",
  fetchLimit: number,
) {
  const snap = await collection(resource === "agent" ? "agents" : "campaigns")
    .where("workspaceId", "==", workspaceId)
    .limit(fetchLimit)
    .get();
  return snap.size;
}

async function assertBelowPlanLimit(
  workspaceId: string,
  resource: "agent" | "campaign",
  limit: number,
) {
  if (!Number.isFinite(limit)) return;

  // Fetch limit + 1 so we can tell "at capacity" from "under capacity" without
  // loading every document for large workspaces.
  const size = await countPlanResource(workspaceId, resource, limit + 1);
  if (size >= limit) {
    throw new Error(limitMessage(resource, limit));
  }
}

function leadSignalId(input: Pick<LeadSignal, "workspaceId" | "agentId" | "personKey" | "signalType" | "signalSource" | "signalUrl" | "signalText">) {
  return `${input.workspaceId}-${hashId(
    [
      input.agentId,
      input.personKey,
      input.signalType,
      input.signalSource,
      input.signalUrl,
      input.signalText,
    ].join("|"),
  )}`;
}

export async function ensureWorkspace(userId: string, name = "Omentir workspace") {
  const ref = collection<Workspace>("workspaces").doc(userId);

  // Hot path: this runs on every authenticated page load, so avoid the cost of
  // a Firestore transaction (~2x the latency of a plain get) when there is
  // nothing to write. The transaction is only needed to create the workspace on
  // first touch or to backfill settings, both of which happen at most once.
  const snap = await ref.get();
  if (snap.exists) {
    const workspace = snap.data() as Workspace;
    if (hasAllSettings(workspace.settings) && !hasLegacySettings(workspace.settings)) {
      return workspace;
    }

    // Settings backfill is idempotent (withDefaultSettings only fills defaults),
    // so a plain update is safe here without transactional read-modify-write.
    const settings = withDefaultSettings(workspace.settings);
    await ref.update({ settings, updatedAt: nowIso() });
    return { ...workspace, settings };
  }

  // Create-on-first-touch stays transactional to avoid two concurrent loads
  // racing to create (and clobber) the same workspace document.
  const workspace = await getDb().runTransaction(async (transaction) => {
    const fresh = await transaction.get(ref);
    const timestamp = nowIso();

    if (!fresh.exists) {
      const workspace: Workspace = {
        id: userId,
        ownerId: userId,
        name,
        settings: DEFAULT_SETTINGS,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      transaction.set(ref, workspace);
      return workspace;
    }

    const workspace = fresh.data() as Workspace;
    if (!hasAllSettings(workspace.settings) || hasLegacySettings(workspace.settings)) {
      const settings = withDefaultSettings(workspace.settings);
      transaction.update(ref, { settings, updatedAt: timestamp });
      return { ...workspace, settings };
    }

    return workspace;
  });
  return workspace;
}

export async function getWorkspace(userId: string) {
  return ensureWorkspace(userId);
}

export async function createLinkedInConnectToken(workspaceId: string) {
  await ensureWorkspace(workspaceId);
  const token = randomBytes(32).toString("base64url");
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  await collection<{
    workspaceId: string;
    createdAt: string;
    expiresAt: string;
    consumedAt?: string;
  }>("linkedInConnectTokens").doc(hashId(token)).set({ workspaceId, createdAt, expiresAt });
  return token;
}

export async function consumeLinkedInConnectToken(token: string) {
  if (!token) return null;
  const ref = collection<{
    workspaceId: string;
    createdAt: string;
    expiresAt: string;
    consumedAt?: string;
  }>("linkedInConnectTokens").doc(hashId(token));

  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const value = snap.data();
    if (!value || value.consumedAt || Date.parse(value.expiresAt) <= Date.now()) return null;
    transaction.update(ref, { consumedAt: nowIso() });
    return value.workspaceId;
  });
}

// Raw scan for tick-level features that visit every workspace (e.g. daily
// digests). Docs are returned as stored - callers needing default-filled
// settings should go through getWorkspace for that workspace instead.
export async function listWorkspaces(limit?: number) {
  let query: FirebaseFirestore.Query<Workspace> = collection<Workspace>("workspaces");
  if (limit != null && limit > 0) query = query.limit(limit);
  const snap = await query.get();
  return snap.docs.map((doc) => doc.data());
}

export async function listAgentApiKeys(workspaceId: string) {
  const snap = await collection<AgentApiKey>("agentApiKeys")
    .where("workspaceId", "==", workspaceId)
    .where("status", "==", "active")
    .get();
  return snap.docs.map((doc) => doc.data());
}

export async function createAgentApiKey(workspaceId: string, label: string) {
  const workspace = await ensureWorkspace(workspaceId);
  if (!planHasApiAccess(workspace.billing?.plan)) {
    throw new Error("API access is available on every paid Omentir plan.");
  }
  const token = newAgentApiToken();
  const timestamp = nowIso();
  const ref = collection<AgentApiKey>("agentApiKeys").doc();
  const key: AgentApiKey = {
    id: ref.id,
    workspaceId,
    label: label.trim() || "AI agent",
    tokenHash: hashAgentApiToken(token),
    tokenPrefix: agentTokenPrefix(token),
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await ref.set(key);
  return { key, token };
}

export async function revokeAgentApiKey(workspaceId: string, keyId: string) {
  const ref = collection<AgentApiKey>("agentApiKeys").doc(keyId);
  const snap = await ref.get();
  const key = snap.data();

  if (!key || key.workspaceId !== workspaceId) {
    throw new Error("Agent token not found.");
  }

  await ref.update({
    status: "revoked",
    updatedAt: nowIso(),
  });
}

export async function authenticateAgentApiToken(token: string) {
  const cleanToken = token.trim();
  if (!cleanToken.startsWith(AGENT_API_TOKEN_PREFIX)) return null;

  const snap = await collection<AgentApiKey>("agentApiKeys")
    .where("tokenHash", "==", hashAgentApiToken(cleanToken))
    .where("status", "==", "active")
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return null;

  const key = doc.data();
  // Throttled: agent clients call the API in bursts (MCP tools/list polling),
  // and a Firestore write per request would dominate auth latency and cost.
  const lastUsedMs = key.lastUsedAt ? Date.parse(key.lastUsedAt) : 0;
  if (!lastUsedMs || Date.now() - lastUsedMs > 5 * 60 * 1000) {
    await doc.ref.update({ lastUsedAt: nowIso(), updatedAt: nowIso() });
  }
  return { key, workspace: await getWorkspace(key.workspaceId) };
}

export async function registerOAuthClient(clientName: string, redirectUris: string[]) {
  const ref = collection<OAuthClient>("oauthClients").doc();
  const client: OAuthClient = {
    id: ref.id,
    clientName: clientName.trim().slice(0, 120) || "AI app",
    redirectUris,
    createdAt: nowIso(),
  };
  await ref.set(client);
  return client;
}

export async function getOAuthClient(clientId: string) {
  // Not cleanId: these are Firestore auto-ids, which are case-sensitive, and
  // lower-casing them makes every lookup miss.
  const id = clientId.trim();
  if (!id || id.length > 128 || id.includes("/")) return null;
  return (await collection<OAuthClient>("oauthClients").doc(id).get()).data() || null;
}

export async function createOAuthAuthorizationCode(input: {
  code: string;
  clientId: string;
  workspaceId: string;
  redirectUri: string;
  codeChallenge: string;
  ttlSeconds: number;
}) {
  const id = hashAgentApiToken(input.code);
  const record: OAuthAuthorizationCode = {
    id,
    clientId: input.clientId,
    workspaceId: input.workspaceId,
    redirectUri: input.redirectUri,
    codeChallenge: input.codeChallenge,
    expiresAt: new Date(Date.now() + input.ttlSeconds * 1000).toISOString(),
    createdAt: nowIso(),
  };
  await collection<OAuthAuthorizationCode>("oauthCodes").doc(id).set(record);
  return record;
}

/**
 * Reads and deletes an authorization code in one transaction. Codes are
 * single-use by spec: a replayed code must fail even if two token requests
 * arrive at the same instant, which a read-then-delete would not guarantee.
 */
export async function consumeOAuthAuthorizationCode(code: string) {
  const ref = collection<OAuthAuthorizationCode>("oauthCodes").doc(hashAgentApiToken(code));
  const record = await getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const value = snap.data();
    if (!value) return null;
    transaction.delete(ref);
    return value;
  });

  if (!record) return null;
  if (Date.parse(record.expiresAt) <= Date.now()) return null;
  return record;
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  settings: Partial<WorkspaceSettings>,
) {
  const workspace = await ensureWorkspace(workspaceId);
  const next = withDefaultSettings({ ...workspace.settings, ...settings });
  await collection<Workspace>("workspaces").doc(workspaceId).update({
    settings: next,
    updatedAt: nowIso(),
  });
  return next;
}

// The workspace timezone is what send windows, daily quota resets and every
// date shown in the app are expressed in, so an unparseable value is rejected
// rather than stored - a bad zone would silently reinterpret every schedule.
export async function updateWorkspaceTimezone(workspaceId: string, timezone: string) {
  if (!isValidTimeZone(timezone)) throw new Error("Unknown time zone.");
  await ensureWorkspace(workspaceId);
  await collection<Workspace>("workspaces").doc(workspaceId).set(
    {
      timezone,
      updatedAt: nowIso(),
    },
    { merge: true },
  );
  return timezone;
}

export async function updateWorkspaceNotificationEmail(workspaceId: string, email: string) {
  if (!email) return;
  await collection<Workspace>("workspaces").doc(workspaceId).set(
    {
      notificationEmail: email,
      updatedAt: nowIso(),
    },
    { merge: true },
  );
}

export async function updateWorkspaceBilling(
  workspaceId: string,
  billing: Omit<WorkspaceBilling, "updatedAt">,
) {
  const next = omitUndefined({
    ...billing,
    updatedAt: nowIso(),
  }) as WorkspaceBilling;

  await collection<Workspace>("workspaces").doc(workspaceId).set(
    {
      billing: next,
      updatedAt: next.updatedAt,
    },
    { merge: true },
  );

  return next;
}

export async function updateWorkspaceOnboarding(
  workspaceId: string,
  onboarding: Omit<WorkspaceOnboarding, "updatedAt">,
) {
  const next: WorkspaceOnboarding = {
    ...onboarding,
    updatedAt: nowIso(),
  };

  await collection<Workspace>("workspaces").doc(workspaceId).set(
    {
      onboarding: next,
      updatedAt: next.updatedAt,
    },
    { merge: true },
  );

  return next;
}

export async function getProductProfile(workspaceId: string) {
  const snap = await collection<ProductProfile>("productProfiles")
    .where("workspaceId", "==", workspaceId)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return null;

  const profile = doc.data() as LegacyProductProfile;
  const legacyFields = LEGACY_PRODUCT_PROFILE_FIELDS.filter((field) => field in profile);

  if (legacyFields.length > 0) {
    const timestamp = nowIso();
    const cleanup: Record<string, unknown> = { updatedAt: timestamp };
    for (const field of legacyFields) {
      cleanup[field] = FieldValue.delete();
    }

    await doc.ref.update(cleanup);
    return { ...removeLegacyProductProfileFields(profile), updatedAt: timestamp };
  }

  return profile;
}

export async function upsertProductProfile(
  workspaceId: string,
  input: Omit<ProductProfile, "id" | "workspaceId" | "createdAt" | "updatedAt">,
  // Callers that already read the profile (the form actions merge their fields
  // over the stored ones) pass it in so this doesn't repeat the query. Pass
  // null for "known to not exist"; omit to let this read it.
  knownExisting?: ProductProfile | null,
) {
  const existing = knownExisting === undefined ? await getProductProfile(workspaceId) : knownExisting;
  const timestamp = nowIso();
  const id = existing?.id || workspaceId;
  const profile: ProductProfile = {
    ...input,
    id,
    workspaceId,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  };

  await collection<ProductProfile>("productProfiles").doc(id).set(omitUndefined(profile), { merge: true });
  return profile;
}

// Focused partial update so the dashboard "deal size" modal can set the ticket
// size without having to round-trip the entire product profile.
export async function setAverageTicketSize(workspaceId: string, value: number) {
  const existing = await getProductProfile(workspaceId);
  const id = existing?.id || workspaceId;
  const timestamp = nowIso();
  const fallback: ProductProfile = {
    id,
    workspaceId,
    websiteUrl: "",
    description: "",
    companyName: "",
    industry: "",
    companySize: "",
    painPointsText: "",
    pricingDetails: "",
    schedulingLink: "",
    keyFeatures: [],
    socialProof: [],
    linkedInCompanyPage: "",
    useCases: [],
    targetBuyers: [],
    buyerTitles: [],
    roleVocabulary: [],
    industries: [],
    companySizes: [],
    painPoints: [],
    keywords: [],
    preferredLocations: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await collection<ProductProfile>("productProfiles")
    .doc(id)
    .set(
      existing
        ? { averageTicketSize: value, updatedAt: timestamp }
        : { ...fallback, averageTicketSize: value },
      { merge: true },
    );
}

export async function getLinkedInAccount(workspaceId: string) {
  const accounts = await listLinkedInAccounts(workspaceId);
  return accounts[0] || null;
}

export async function listLinkedInAccounts(workspaceId: string) {
  const snap = await collection<LinkedInAccount>("linkedinAccounts")
    .where("workspaceId", "==", workspaceId)
    .where("status", "==", "connected")
    .get();
  return snap.docs
    .map((doc) => doc.data())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getLinkedInAccountForWorkspace(workspaceId: string, linkedInAccountId?: string) {
  if (!linkedInAccountId) return getLinkedInAccount(workspaceId);

  const ref = collection<LinkedInAccount>("linkedinAccounts").doc(linkedInAccountId);
  const snap = await ref.get();
  const account = snap.data();
  if (account?.workspaceId === workspaceId && account.status === "connected") {
    return account;
  }

  return null;
}

export async function getLinkedInAccountByAccountId(accountId: string) {
  const cleanAccountId = accountId.trim();
  if (!cleanAccountId) return null;

  const snap = await collection<LinkedInAccount>("linkedinAccounts")
    .where("accountId", "==", cleanAccountId)
    .where("status", "==", "connected")
    .limit(1)
    .get();
  return snap.docs[0]?.data() || null;
}

export async function saveLinkedInAccount(
  workspaceId: string,
  input: Pick<LinkedInAccount, "accountId" | "displayName" | "status"> & {
    avatarUrl?: string;
  },
) {
  const workspace = await getWorkspace(workspaceId);
  const limit = linkedInAccountLimit(workspace.billing?.plan);
  const timestamp = nowIso();
  const id = `${workspaceId}-${cleanId(input.accountId) || "linkedin"}`;
  const accountRef = collection<LinkedInAccount>("linkedinAccounts").doc(id);
  const existing = await accountRef.get();
  const existingAccount = existing.exists ? (existing.data() as LinkedInAccount) : null;
  if (!existingAccount && input.status === "connected") {
    const connectedAccounts = await listLinkedInAccounts(workspaceId);
    if (connectedAccounts.length >= limit) {
      throw new Error(`Your current plan supports up to ${limit} LinkedIn account${limit === 1 ? "" : "s"}.`);
    }
  }
  const account: LinkedInAccount = {
    id,
    workspaceId,
    provider: "unipile",
    accountId: input.accountId,
    displayName: input.displayName,
    ...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
    status: input.status,
    createdAt: existingAccount?.createdAt || timestamp,
    updatedAt: timestamp,
  };

  const ownerRef = collection<{ accountId: string; workspaceId: string; createdAt: string }>(
    "linkedInAccountOwners",
  ).doc(hashId(input.accountId));
  await getDb().runTransaction(async (transaction) => {
    const ownerSnap = await transaction.get(ownerRef);
    const owner = ownerSnap.data();
    if (owner && (owner.accountId !== input.accountId || owner.workspaceId !== workspaceId)) {
      throw new Error("This LinkedIn account is already connected to another workspace.");
    }
    transaction.set(
      ownerRef,
      { accountId: input.accountId, workspaceId, createdAt: owner?.createdAt || timestamp },
      { merge: true },
    );
    transaction.set(accountRef, account, { merge: true });
  });
  return account;
}

export async function disconnectLinkedInAccount(workspaceId: string, linkedInAccountId?: string) {
  const account = await getLinkedInAccountForWorkspace(workspaceId, linkedInAccountId);
  if (!account) return null;

  const timestamp = nowIso();
  await collection<LinkedInAccount>("linkedinAccounts").doc(account.id).set(
    {
      status: "disconnected",
      updatedAt: timestamp,
    },
    { merge: true },
  );

  return {
    ...account,
    status: "disconnected" as const,
    updatedAt: timestamp,
  };
}

export async function listAgents(workspaceId: string) {
  const snap = await collection<Agent>("agents").where("workspaceId", "==", workspaceId).get();
  return snap.docs.map((doc) => doc.data());
}

export async function getAgent(workspaceId: string, agentId: string) {
  if (!agentId) return null;
  const snap = await collection<Agent>("agents").doc(agentId).get();
  const agent = snap.data();
  return agent && agent.workspaceId === workspaceId ? agent : null;
}

export async function getDueAgents(limit = 25) {
  const snap = await collection<Agent>("agents")
    .where("status", "in", ["active", "error", "running"])
    .get();
  return snap.docs
    .map((doc) => doc.data())
    .filter((agent) => agent.mode !== "outreach" && isAgentDueForRun(agent))
    .sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt))
    .slice(0, limit);
}

// An agent may not start without a complete targeting setup - every entry
// point (UI, agent API, MCP) funnels through createAgent/updateAgent, so this
// is the single gate. Partial setups produce network-biased, off-ICP leads.
function normalizeRunAtHour(hour: number | undefined) {
  if (hour === undefined || !Number.isFinite(hour)) return DEFAULT_AGENT_RUN_HOUR;
  return Math.min(23, Math.max(0, Math.trunc(hour)));
}

function assertAgentSetupComplete(input: CreateAgentInput) {
  if (input.mode === "outreach") return;

  const competitors = input.signalSources?.competitorUrls?.some((value) => value.trim());
  const founders = input.signalSources?.founderUrls?.some((value) => value.trim());
  // Steal Customers (or a create that forgot mode but still sent competitor
  // sources): no ICP form. Commenters are the pool; My Product fills the prompt.
  const isSteal =
    input.mode === "steal_customers" ||
    Boolean((competitors || founders) && !input.filters?.titles?.some((value) => value.trim()));

  if (isSteal) {
    const missing: string[] = [];
    if (!input.prompt?.trim()) missing.push("product profile context (prompt)");
    if (!competitors && !founders) {
      missing.push("competitor or founder/employee LinkedIn URLs");
    }
    if (missing.length) {
      throw new Error(
        `Steal Customers setup is incomplete. Fill in: ${missing.join(", ")}.`,
      );
    }
    return;
  }

  const missing: string[] = [];
  if (!input.prompt?.trim()) missing.push("prospect definition (prompt)");
  if (!input.filters?.titles?.some((value) => value.trim())) missing.push("job titles");
  if (!input.filters?.industries?.some((value) => value.trim())) missing.push("industries");
  if (!input.filters?.locations?.some((value) => value.trim())) missing.push("locations");
  if (!input.filters?.keywords?.some((value) => value.trim())) missing.push("keywords");

  if (missing.length) {
    throw new Error(
      `Agent setup is incomplete. Fill in: ${missing.join(", ")}. Every field is required before an agent can start.`,
    );
  }
}

function coerceAgentMode(input: CreateAgentInput): Agent["mode"] {
  if (input.mode === "outreach" || input.mode === "steal_customers") return input.mode;
  const competitors = input.signalSources?.competitorUrls?.some((value) => value.trim());
  const founders = input.signalSources?.founderUrls?.some((value) => value.trim());
  // Competitor/founder sources with no title ICP always mean Steal Customers.
  if ((competitors || founders) && !input.filters?.titles?.some((value) => value.trim())) {
    return "steal_customers";
  }
  return input.mode;
}

export async function createAgent(
  workspaceId: string,
  input: CreateAgentInput,
) {
  assertAgentSetupComplete(input);
  const mode = coerceAgentMode(input);
  const workspace = await getWorkspace(workspaceId);
  const agentLimit = planLimits(workspace.billing?.plan).agents;
  await assertBelowPlanLimit(workspaceId, "agent", agentLimit);

  const group = await createOrGetGroup(workspaceId, input.targetGroupName, "Created by AI Agent");
  // Group ids are name-derived, so two agents with the same group name share a
  // bucket. A leads-only agent must never land on a group that already has
  // (or will get) outreach, and a full agent must never reuse a leads-only
  // group's bucket - enrollNewLeadsInCampaign would otherwise message people
  // the user only asked to have found.
  await assertAgentMayUseGroup(workspaceId, group, Boolean(input.leadsOnly));
  const timestamp = nowIso();
  const ref = collection<Agent>("agents").doc();
  const agent: Agent = {
    id: ref.id,
    workspaceId,
    name: input.name || input.targetGroupName,
    // Spread conditionally: Firestore rejects undefined values outright.
    ...(input.linkedInAccountId ? { linkedInAccountId: input.linkedInAccountId } : {}),
    mode,
    ...(input.leadsOnly ? { leadsOnly: true } : {}),
    prompt: input.prompt,
    filters: input.filters,
    signalSources: withDefaultSignalSources(input.signalSources),
    // Setup no longer asks when to look for leads: the agent starts working the
    // moment it is created and repeats at that time every day. nextRunAt is now
    // so the next automation tick picks it up instead of leaving the user in
    // front of an empty lead group until some scheduled hour.
    runAnchorAt: timestamp,
    targetGroupId: group.id,
    targetGroupName: group.name,
    status: "active",
    nextRunAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await ref.set(agent);

  // Concurrent creates can both pass the pre-check. Re-count after write and
  // roll back the excess so plan limits stay hard even under parallel submits.
  if (Number.isFinite(agentLimit)) {
    const size = await countPlanResource(workspaceId, "agent", agentLimit + 1);
    if (size > agentLimit) {
      await ref.delete();
      throw new Error(limitMessage("agent", agentLimit));
    }
  }

  return agent;
}

export async function updateAgent(
  workspaceId: string,
  agentId: string,
  input: CreateAgentInput,
) {
  assertAgentSetupComplete(input);
  const mode = coerceAgentMode(input);
  const ref = collection<Agent>("agents").doc(agentId);
  const snap = await ref.get();
  const agent = snap.data();

  if (!agent || agent.workspaceId !== workspaceId) {
    throw new Error("Agent not found.");
  }

  const group =
    input.targetGroupName && input.targetGroupName !== agent.targetGroupName
      ? await renameGroup(workspaceId, agent.targetGroupId, input.targetGroupName)
      : { id: agent.targetGroupId, name: agent.targetGroupName };

  // Editing an agent never moves its daily run. nextRunAt used to be reset to
  // now on every save, so tweaking job titles at 11pm permanently moved
  // discovery to 11pm; the schedule now comes from creation time alone (or,
  // for older agents, the hour their owner picked back when setup asked).
  const patch: Partial<Agent> = {
    name: input.name || input.targetGroupName || agent.name,
    // Spread conditionally: Firestore rejects undefined values, and an update
    // without a selection should keep the agent's current account.
    ...(input.linkedInAccountId ? { linkedInAccountId: input.linkedInAccountId } : {}),
    mode,
    // Only ever set, never cleared: re-preparing a leads-only agent must not
    // drop the flag, and a full agent never sends it in the first place.
    ...(input.leadsOnly ? { leadsOnly: true } : {}),
    prompt: input.prompt,
    filters: input.filters,
    signalSources: withDefaultSignalSources(input.signalSources),
    targetGroupId: group.id,
    targetGroupName: group.name,
    status: agent.status === "paused" ? "paused" : "active",
    runStartedAt: FieldValue.delete() as unknown as string,
    updatedAt: nowIso(),
  };

  await ref.update(patch);
  return { ...agent, ...patch } as Agent;
}

// Tomorrow's occurrence of the agent's daily discovery time: the wall-clock
// time it was created at, or - for agents from when setup asked for one - the
// hour their owner picked. Falls back to the old "+24h from the last slot"
// arithmetic if the workspace can't be read, so a transient Firestore error can
// never leave nextRunAt in the past (which would keep the agent due on every
// tick).
async function nextAgentSlot(agent: Agent) {
  try {
    const workspace = await getWorkspace(agent.workspaceId);
    return agent.runAnchorAt
      ? nextAnchoredAgentRunAt(agent.runAnchorAt, workspace.timezone)
      : nextLocalAgentRunAt(normalizeRunAtHour(agent.runAtHour), workspace.timezone);
  } catch {
    return nextDailyAgentRunAt(agent.nextRunAt);
  }
}

// Firestore update() throws NOT_FOUND (code 5) when the doc is gone. Agents can
// be deleted mid-tick (user deletes while discovery is still running, or the
// cascade finishes after getDueAgents already returned the row). Lifecycle
// writes must no-op rather than fail the whole agent phase and spam logs.
function isNotFoundError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: number | string }).code;
  const message = (error as { message?: string }).message || "";
  return code === 5 || code === "5" || /NOT_FOUND|No document to update/i.test(message);
}

async function updateAgentDoc(agentId: string, patch: Record<string, unknown>): Promise<boolean> {
  try {
    await collection<Agent>("agents").doc(agentId).update(patch);
    return true;
  } catch (error) {
    if (isNotFoundError(error)) return false;
    throw error;
  }
}

export async function markAgentRun(agent: Agent, ok: boolean) {
  return updateAgentDoc(agent.id, {
    status: ok ? "active" : "error",
    lastRunAt: nowIso(),
    runStartedAt: FieldValue.delete(),
    nextRunAt: await nextAgentSlot(agent),
    updatedAt: nowIso(),
  });
}

// Push an agent's next run to its next daily slot without recording a run or
// changing its status - for agents the tick skips (e.g. workspace without an
// active subscription). Leaving nextRunAt in the past keeps the agent due on
// every tick, re-reading its workspace forever for nothing.
export async function deferAgentRun(agent: Agent) {
  return updateAgentDoc(agent.id, {
    nextRunAt: await nextAgentSlot(agent),
    updatedAt: nowIso(),
  });
}

export async function markAgentStarted(agent: Agent) {
  return updateAgentDoc(agent.id, {
    status: "running",
    runStartedAt: nowIso(),
    updatedAt: nowIso(),
  });
}

export async function updateAgentPeopleEngineCursor(agentId: string, sourceKey: string) {
  return updateAgentDoc(agentId, {
    peopleEngineCursor: {
      sourceKey,
      updatedAt: nowIso(),
    },
    updatedAt: nowIso(),
  });
}

export async function pauseAgent(workspaceId: string, agentId: string) {
  const ref = collection<Agent>("agents").doc(agentId);
  const snap = await ref.get();
  const agent = snap.data();

  if (!agent || agent.workspaceId !== workspaceId) {
    throw new Error("Agent not found.");
  }

  await ref.update({
    status: "paused",
    runStartedAt: FieldValue.delete(),
    updatedAt: nowIso(),
  });
}

export async function resumeAgent(workspaceId: string, agentId: string) {
  const ref = collection<Agent>("agents").doc(agentId);
  const snap = await ref.get();
  const agent = snap.data();

  if (!agent || agent.workspaceId !== workspaceId) {
    throw new Error("Agent not found.");
  }

  // Resume deliberately runs once straight away - the user just pressed
  // Resume and expects to see activity. Unlike the old updateAgent behaviour
  // this is not a permanent re-anchor: markAgentRun snaps the following run
  // back to the agent's chosen local hour.
  // Clears error status the same way as paused: a failed discovery run must
  // not trap the agent forever when the user hits resume.
  await ref.update({
    status: "active",
    runStartedAt: FieldValue.delete(),
    nextRunAt: nowIso(),
    updatedAt: nowIso(),
  });
  // Mirrors the tick: pause parks the enrollments of every lead this agent
  // sourced, leads-only included, so resume has to wake them or they idle for
  // the full 24-hour pause defer. Enrollments a leads-only agent must never
  // drive (its own group) are stopped outright by the tick, not parked, so
  // waking cannot re-queue those.
  //
  // Never fail the resume itself if enrollment wake fails: the agent is
  // already active and due. A large campaignEnrollments scan can time out or
  // hit transient Firestore errors; that must not surface as "resume failed"
  // and flip the UI back to Error/Paused.
  try {
    await wakeAgentPausedEnrollments(workspaceId, agent);
  } catch (error) {
    console.error(
      `[data] resumeAgent wake enrollments failed for ${agentId}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

// The tick parks enrollments of a paused agent's leads a day out (marked with
// pausedDeferredAt, like a paused campaign's), so resume must pull them back
// into the due window or the agent's outreach sits idle for up to a day.
// Waking an enrollment whose campaign is itself paused is harmless: the next
// tick re-parks it.
async function wakeAgentPausedEnrollments(workspaceId: string, agent: Agent) {
  const leads = await listLeads(workspaceId, agent.targetGroupId, 5000);
  const leadIds = new Set(
    leads.filter((lead) => lead.sourceAgentId === agent.id).map((lead) => lead.id),
  );
  if (leadIds.size === 0) return 0;

  const snap = await collection<CampaignEnrollment>("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .get();
  const parked = snap.docs.filter((doc) => {
    const enrollment = doc.data();
    return Boolean(enrollment.pausedDeferredAt) && leadIds.has(enrollment.leadId);
  });

  const now = nowIso();
  for (let index = 0; index < parked.length; index += 450) {
    const batch = getDb().batch();
    parked.slice(index, index + 450).forEach((doc) =>
      batch.update(doc.ref, {
        nextActionAt: now,
        pausedDeferredAt: FieldValue.delete(),
        updatedAt: now,
      }),
    );
    await batch.commit();
  }
  return parked.length;
}

// Deleting an agent removes everything it drives, permanently: outreach to
// every lead it sourced stops (in whatever campaign it sits), and its lead
// group plus the campaigns contacting that group are deleted. If another
// agent still feeds the same group, the group and its campaigns belong to
// that agent and are kept. Otherwise deleteGroup permanently removes the
// group's leads and related outreach rows.
export async function deleteAgent(workspaceId: string, agentId: string) {
  const ref = collection<Agent>("agents").doc(agentId);
  const snap = await ref.get();
  const agent = snap.data();

  if (!agent || agent.workspaceId !== workspaceId) {
    throw new Error("Agent not found.");
  }

  // Pause before anything else so a tick running mid-delete can't start new
  // sends for this agent's leads while the cascade below is still writing.
  await ref.update({
    status: "paused",
    runStartedAt: FieldValue.delete(),
    updatedAt: nowIso(),
  });
  await stopEnrollmentsForAgentLeads(workspaceId, agentId);
  await ref.delete();

  const groupStillFed = (await listAgents(workspaceId)).some(
    (other) => other.id !== agentId && other.targetGroupId === agent.targetGroupId,
  );
  if (groupStillFed) return;

  const campaigns = await listCampaigns(workspaceId);
  for (const campaign of campaigns) {
    if (campaign.groupId === agent.targetGroupId) {
      await deleteCampaign(workspaceId, campaign.id);
    }
  }
  await deleteGroup(workspaceId, agent.targetGroupId);
}

// A deleted agent must leave no outreach behind. Stop every non-stopped
// enrollment of the leads it sourced - including "replied" ones, which the
// unibox webhook would otherwise re-arm into another AI reply when the lead
// writes back.
async function stopEnrollmentsForAgentLeads(workspaceId: string, agentId: string) {
  const leads = await listLeads(workspaceId, undefined, 5000);
  const leadIds = new Set(
    leads.filter((lead) => lead.sourceAgentId === agentId).map((lead) => lead.id),
  );
  if (leadIds.size === 0) return 0;

  const snap = await collection<CampaignEnrollment>("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .get();
  const live = snap.docs.filter((doc) => {
    const enrollment = doc.data();
    return leadIds.has(enrollment.leadId) && enrollment.status !== "stopped";
  });

  const now = nowIso();
  for (let index = 0; index < live.length; index += 450) {
    const batch = getDb().batch();
    live.slice(index, index + 450).forEach((doc) =>
      batch.update(doc.ref, {
        status: "stopped",
        pendingAction: FieldValue.delete(),
        pausedDeferredAt: FieldValue.delete(),
        lastError: "The agent that sourced this lead was deleted; outreach stopped.",
        updatedAt: now,
      }),
    );
    await batch.commit();
  }
  return live.length;
}

export async function listGroups(workspaceId: string) {
  const snap = await collection<Group>("groups").where("workspaceId", "==", workspaceId).get();
  return snap.docs.map((doc) => doc.data());
}

export async function createOrGetGroup(workspaceId: string, name: string, description: string) {
  const normalized = cleanId(name) || "leads";
  const id = `${workspaceId}-${normalized}`;
  const ref = collection<Group>("groups").doc(id);
  const existing = await ref.get();
  if (existing.exists) return existing.data() as Group;

  const timestamp = nowIso();
  const group: Group = {
    id,
    workspaceId,
    name: name.trim(),
    description,
    leadCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await ref.set(group);
  return group;
}

// Renames an agent's existing target group in place - keeps the group id, its
// leads, and any campaign attached to it. Used on agent edit so renaming the
// target does NOT orphan prior leads into a brand-new group. Falls back to
// creating a group only if the expected one is missing.
export async function renameGroup(workspaceId: string, groupId: string, name: string) {
  const ref = collection<Group>("groups").doc(groupId);
  const snap = await ref.get();
  const group = snap.data();

  if (!group || group.workspaceId !== workspaceId) {
    return createOrGetGroup(workspaceId, name, "Created by AI Agent");
  }

  const trimmed = name.trim();
  await ref.update({ name: trimmed, updatedAt: nowIso() });
  return { ...group, name: trimmed };
}

/** Commit deletes/updates in chunks of 450 (Firestore batch max is 500). */
async function commitInBatches(
  refs: FirebaseFirestore.DocumentReference[],
  apply: (batch: FirebaseFirestore.WriteBatch, ref: FirebaseFirestore.DocumentReference) => void,
) {
  for (let index = 0; index < refs.length; index += 450) {
    const batch = getDb().batch();
    refs.slice(index, index + 450).forEach((ref) => apply(batch, ref));
    await batch.commit();
  }
}

// Permanently delete leads in a group and their enrollments, conversations,
// and discovery signals. Used when a lead group is removed so nothing about
// those people stays in the workspace (no orphaned groupIds-only rows).
async function deleteLeadsBelongingToGroup(workspaceId: string, groupId: string) {
  const leads = await listLeads(workspaceId, groupId);
  if (!leads.length) return 0;

  const leadIds = leads.map((lead) => lead.id);
  const leadIdSet = new Set(leadIds);

  // Enrollments are keyed by campaign+lead; scan workspace and drop matches.
  const enrollmentSnap = await collection<CampaignEnrollment>("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .get();
  const enrollmentDocs = enrollmentSnap.docs.filter((doc) =>
    leadIdSet.has(doc.data().leadId),
  );
  const enrollments = enrollmentDocs.map((doc) => doc.data());

  // Conversations use `${workspaceId}-${leadId}`.
  const conversationRefs = leadIds.map((leadId) =>
    collection<Conversation>("conversations").doc(`${workspaceId}-${leadId}`),
  );
  const conversationSnaps = await Promise.all(conversationRefs.map((ref) => ref.get()));
  const conversations = conversationSnaps
    .map((snap) => snap.data())
    .filter((conversation): conversation is Conversation => Boolean(conversation));

  // Freeze this cohort's contribution into durable activity days BEFORE deletes
  // so the Activity Overview chart keeps history after agents are removed.
  await persistActivityTotals(
    workspaceId,
    buildActivityTotalsFromLive({ leads, enrollments, conversations }),
  ).catch((error) => {
    console.error(
      "[data] failed to snapshot activity before lead delete:",
      error instanceof Error ? error.message : error,
    );
  });

  await commitInBatches(
    enrollmentDocs.map((doc) => doc.ref),
    (batch, ref) => batch.delete(ref),
  );
  await commitInBatches(conversationRefs, (batch, ref) => batch.delete(ref));

  // Discovery signals are tagged with the group's id.
  try {
    const signalSnap = await collection<LeadSignal>("leadSignals")
      .where("workspaceId", "==", workspaceId)
      .where("groupId", "==", groupId)
      .get();
    await commitInBatches(
      signalSnap.docs.map((doc) => doc.ref),
      (batch, ref) => batch.delete(ref),
    );
  } catch (error) {
    // Missing composite index must not block group delete; leads still go.
    console.error(
      "[data] deleteLeadsBelongingToGroup leadSignals cleanup failed:",
      error instanceof Error ? error.message : error,
    );
  }

  await commitInBatches(
    leadIds.map((id) => collection<Lead>("leads").doc(id)),
    (batch, ref) => batch.delete(ref),
  );

  return leads.length;
}

export async function deleteGroup(workspaceId: string, groupId: string) {
  const ref = collection<Group>("groups").doc(groupId);
  const snap = await ref.get();
  const group = snap.data();

  if (!group || group.workspaceId !== workspaceId) {
    throw new Error("Lead group not found.");
  }

  const [agents, campaigns] = await Promise.all([
    listAgents(workspaceId),
    listCampaigns(workspaceId),
  ]);
  if (agents.some((agent) => agent.targetGroupId === groupId)) {
    throw new Error("Delete or reassign the agent connected to this lead group first.");
  }
  if (campaigns.some((campaign) => campaign.groupId === groupId)) {
    throw new Error("Delete or reassign the campaign connected to this lead group first.");
  }

  await deleteLeadsBelongingToGroup(workspaceId, groupId);
  await ref.delete();
}

export async function listLeads(workspaceId: string, groupId?: string, limit?: number) {
  let query: FirebaseFirestore.Query<Lead> = collection<Lead>("leads").where(
    "workspaceId",
    "==",
    workspaceId,
  );
  if (groupId) query = query.where("groupIds", "array-contains", groupId);
  // No default page size: the Leads UI and group delete must see every lead.
  // Callers that need a bound can still pass limit.
  if (limit != null && Number.isFinite(limit) && limit > 0) {
    query = query.limit(limit);
  }
  const snap = await query.get();
  return snap.docs.map((doc) => doc.data());
}

export async function listLeadPreviews(
  workspaceId: string,
  groupId?: string,
  // No default cap. A 500-page left Steal Customers groups half-empty on
  // Leads once a workspace grew large; load every preview for the UI.
  limit?: number,
): Promise<LeadPreview[]> {
  let query: FirebaseFirestore.Query<Lead> = collection<Lead>("leads").where(
    "workspaceId",
    "==",
    workspaceId,
  );
  if (groupId) query = query.where("groupIds", "array-contains", groupId);
  let projected = query.select(
    "id",
    "groupIds",
    "linkedInUrl",
    "avatarUrl",
    "name",
    "title",
    "company",
    "location",
    "summary",
    "fitScore",
    "scoreReasons",
    "signalText",
    "signalUrl",
    "leadReason",
    "engagementContext",
    "sourceAgentId",
    "outreachStatus",
    "createdAt",
    "updatedAt",
  );
  if (limit != null && Number.isFinite(limit) && limit > 0) {
    projected = projected.limit(limit);
  }
  const snap = await projected.get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as LeadPreview);
}

// Dashboard projection. The dashboard is the slowest page to first paint and
// leads are its heaviest read, so it selects only the fields its stat cards,
// hot-lead list, activity chart and reply matching actually render. On a
// 367-lead workspace this cuts the response from ~630 KB to ~230 KB and the
// query from ~2.9s to ~1.5s.
export async function listLeadDashboardPreviews(
  workspaceId: string,
  // No default page: invitations/messages totals need every lead's stage.
  // Pass limit only when a caller intentionally wants a bound.
  limit?: number,
): Promise<LeadDashboardPreview[]> {
  // .select() widens the Firestore generic to DocumentData; keep the query
  // untyped and cast the projected row after merge.
  let query: FirebaseFirestore.Query = collection<Lead>("leads")
    .where("workspaceId", "==", workspaceId)
    .select(
      "linkedInUrl",
      "avatarUrl",
      "name",
      "title",
      "company",
      "fitScore",
      "sourceAgentId",
      "outreachStatus",
      "createdAt",
      "updatedAt",
    );
  if (limit != null && Number.isFinite(limit) && limit > 0) {
    query = query.limit(limit);
  }
  const snap = await query.get();
  return snap.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id }) as LeadDashboardPreview,
  );
}

// Resolve specific leads by id in batches. List views load the full workspace
// set; this still exists for activity rows that only have a lead id.
export async function getLeadsByIds(workspaceId: string, ids: string[]): Promise<Lead[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return [];

  const leadsCollection = collection<Lead>("leads");
  const out: Lead[] = [];
  for (let i = 0; i < unique.length; i += 300) {
    const refs = unique.slice(i, i + 300).map((id) => leadsCollection.doc(id));
    const snaps = await getDb().getAll(...refs);
    for (const snap of snaps) {
      const data = snap.data() as Lead | undefined;
      // Guard against cross-workspace reads if an id is ever spoofed upstream.
      if (data && data.workspaceId === workspaceId) out.push(data);
    }
  }
  return out;
}

// Lightweight projection used for agent metrics. Selecting a single field makes
// this ~2-3x faster than listLeads because it avoids transferring full lead
// documents (which dominates the agents page load; see agents/page.tsx).
export async function listLeadAgentRefs(
  workspaceId: string,
  // Every lead has to come back: the Agents page attributes outreach by
  // sourceAgentId, so a truncated page silently drops those leads from each
  // agent's Contacted/Accepted/Messaged/Replied counts.
  limit?: number,
): Promise<LeadAgentRef[]> {
  let query: FirebaseFirestore.Query = collection<Lead>("leads")
    .where("workspaceId", "==", workspaceId)
    .select("sourceAgentId", "outreachStatus");
  if (limit != null && Number.isFinite(limit) && limit > 0) {
    query = query.limit(limit);
  }
  const snap = await query.get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    sourceAgentId: (doc.data() as Partial<Lead>).sourceAgentId,
    outreachStatus: (doc.data() as Partial<Lead>).outreachStatus,
  }));
}

export async function findLeadForWorkspace(input: {
  workspaceId: string;
  leadId?: string;
  linkedInUrl?: string;
  providerProfileId?: string;
  publicIdentifier?: string;
}) {
  if (input.leadId) {
    const snap = await collection<Lead>("leads").doc(input.leadId).get();
    const lead = snap.data();
    if (lead?.workspaceId === input.workspaceId) return lead;
  }

  const providerProfileId = input.providerProfileId?.trim();
  if (providerProfileId) {
    const snap = await collection<Lead>("leads")
      .where("workspaceId", "==", input.workspaceId)
      .where("providerProfileId", "==", providerProfileId)
      .limit(1)
      .get();
    if (snap.docs[0]) return snap.docs[0].data();
  }

  const linkedInCandidates = [
    normalizeLinkedInProfileUrl(input.linkedInUrl),
    input.publicIdentifier
      ? normalizeLinkedInProfileUrl(`https://www.linkedin.com/in/${input.publicIdentifier}`)
      : "",
  ].filter(Boolean);

  for (const linkedInUrl of linkedInCandidates) {
    const snap = await collection<Lead>("leads")
      .where("workspaceId", "==", input.workspaceId)
      .where("linkedInUrl", "==", linkedInUrl)
      .limit(1)
      .get();
    if (snap.docs[0]) return snap.docs[0].data();
  }

  return null;
}

// The Firestore document id upsertLead will use for this lead. Exported so
// discovery paths can check "do we already have this person" before spending
// an AI scoring call on a search result.
export function leadDocId(workspaceId: string, lead: Partial<Lead>) {
  const linkedInUrl = normalizeLinkedInProfileUrl(lead.linkedInUrl) || "";
  const identity =
    linkedInUrl ||
    lead.providerProfileId ||
    [lead.name, lead.title, lead.company].filter(Boolean).join("|") ||
    lead.name ||
    "lead";
  return `${workspaceId}-${cleanId(identity)}`;
}

export async function upsertLead(workspaceId: string, groupId: string, lead: Partial<Lead>) {
  const linkedInUrl = normalizeLinkedInProfileUrl(lead.linkedInUrl) || "";
  let id = leadDocId(workspaceId, lead);
  if (lead.providerProfileId || linkedInUrl) {
    const identityMatch = lead.providerProfileId
      ? await collection<Lead>("leads")
          .where("workspaceId", "==", workspaceId)
          .where("providerProfileId", "==", lead.providerProfileId)
          .limit(1)
          .get()
      : null;
    const urlMatch =
      identityMatch?.docs[0] || !linkedInUrl
        ? null
        : await collection<Lead>("leads")
            .where("workspaceId", "==", workspaceId)
            .where("linkedInUrl", "==", linkedInUrl)
            .limit(1)
            .get();
    if (identityMatch?.docs[0]) id = identityMatch.docs[0].id;
    else if (urlMatch?.docs[0]) id = urlMatch.docs[0].id;
  }
  const ref = collection<Lead>("leads").doc(id);
  const groupRef = collection<Group>("groups").doc(groupId);
  let created = false;

  const result = await getDb().runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    const timestamp = nowIso();

    if (existing.exists) {
      const existingLead = existing.data() as Lead;
      const existingGroupIds = existingLead.groupIds || [];
      const alreadyInGroup = existingGroupIds.includes(groupId);

      // Never let a re-discovery overwrite the outreach status of a lead that's
      // already being worked (invited/messaged/replied/stopped). Re-applying the
      // discovery default ("new") would reset history and re-contact someone
      // mid-sequence. Status transitions go through updateLead, not upsertLead.
      const leadFields = { ...lead };
      delete leadFields.outreachStatus;
      // First finder keeps ownership. A later leads-only re-discovery used to
      // steal sourceAgentId, so Actions / agent metrics attributed connect and
      // message work to an agent that is only allowed to find leads.
      if (existingLead.sourceAgentId) {
        delete leadFields.sourceAgentId;
      }

      transaction.update(ref, omitUndefined({
        ...leadFields,
        groupIds: FieldValue.arrayUnion(groupId),
        updatedAt: timestamp,
      }));

      if (!alreadyInGroup) {
        transaction.update(groupRef, {
          leadCount: FieldValue.increment(1),
          updatedAt: timestamp,
        });
      }

      return {
        ...existingLead,
        ...leadFields,
        id,
        groupIds: alreadyInGroup ? existingGroupIds : [...existingGroupIds, groupId],
      };
    }

    created = true;
    const next = omitUndefined({
      id,
      workspaceId,
      groupIds: [groupId],
      linkedInUrl,
      providerProfileId: lead.providerProfileId,
      avatarUrl: lead.avatarUrl,
      name: lead.name || "Unknown lead",
      title: lead.title || "",
      company: lead.company || "",
      location: lead.location || "",
      summary: lead.summary || "",
      profileContext: lead.profileContext,
      fitScore: lead.fitScore || 0,
      scoreReasons: lead.scoreReasons || [],
      signalType: lead.signalType,
      signalSource: lead.signalSource,
      signalText: lead.signalText,
      signalUrl: lead.signalUrl,
      signalObservedAt: lead.signalObservedAt,
      leadReason: lead.leadReason,
      engagementContext: lead.engagementContext,
      linkedinActivityAt: lead.linkedinActivityAt,
      linkedinActivitySource: lead.linkedinActivitySource,
      sourceAgentId: lead.sourceAgentId,
      outreachStatus: lead.outreachStatus || "new",
      createdAt: timestamp,
      updatedAt: timestamp,
    }) as Lead;

    transaction.set(ref, next);
    transaction.update(groupRef, {
      leadCount: FieldValue.increment(1),
      updatedAt: timestamp,
    });
    return next;
  });
  if (created) {
    await recordActivityEvent(workspaceId, `lead-${result.id}`, "found", result.createdAt);
  }
  return result;
}

export async function updateLead(workspaceId: string, id: string, patch: Partial<Lead>) {
  const ref = collection<Lead>("leads").doc(id);
  const safePatch = { ...patch };
  delete safePatch.id;
  delete safePatch.workspaceId;
  delete safePatch.createdAt;

  await getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const lead = snap.data();

    if (!lead || lead.workspaceId !== workspaceId) {
      throw new Error("Lead not found.");
    }

    transaction.update(ref, updatePatch({
      ...safePatch,
      workspaceId: lead.workspaceId,
      updatedAt: nowIso(),
    }));
  });
}

export async function upsertLeadSignal(input: UpsertLeadSignalInput) {
  const timestamp = nowIso();
  const id = leadSignalId(input);
  const ref = collection<LeadSignal>("leadSignals").doc(id);
  const snap = await ref.get();
  const existing = snap.exists ? (snap.data() as LeadSignal) : null;
  const signal = omitUndefined({
    ...input,
    id,
    promotedToLead: input.promotedToLead ?? existing?.promotedToLead ?? false,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  }) as LeadSignal;

  await ref.set(signal, { merge: true });
  return { signal, isNew: !existing };
}

export async function markLeadSignalPromoted(
  signalId: string,
  input: { leadId: string; fitScore: number },
) {
  await collection<LeadSignal>("leadSignals").doc(signalId).set(
    {
      leadId: input.leadId,
      fitScore: input.fitScore,
      promotedToLead: true,
      updatedAt: nowIso(),
    },
    { merge: true },
  );
}

export async function listCampaigns(workspaceId: string) {
  const snap = await collection<Campaign>("campaigns")
    .where("workspaceId", "==", workspaceId)
    .get();
  return snap.docs.map((doc) => doc.data());
}

export async function getCampaign(workspaceId: string, campaignId: string) {
  if (!campaignId) return null;
  const snap = await collection<Campaign>("campaigns").doc(campaignId).get();
  const campaign = snap.data();
  return campaign && campaign.workspaceId === workspaceId ? campaign : null;
}

export async function getActiveCampaigns(limit?: number) {
  let query: FirebaseFirestore.Query<Campaign> = collection<Campaign>("campaigns")
    .where("status", "==", "active")
  if (limit != null && limit > 0) query = query.limit(limit);
  const snap = await query.get();
  return snap.docs.map((doc) => doc.data());
}

// Reuses listAgents rather than a targetGroupId query: agents are plan-limited
// to a handful per workspace, so the filter is cheap and needs no index.
async function assertGroupAllowsOutreach(workspaceId: string, groupId: string) {
  if (!groupId) return;
  const agents = await listAgents(workspaceId);
  const owner = agents.find(
    (agent) => agent.leadsOnly && agent.targetGroupId === groupId,
  );
  if (!owner) return;
  throw new Error(
    `The lead group "${owner.targetGroupName}" belongs to "${owner.name}", a leads-only agent set up to find leads without messaging them. Use a different lead group name for outreach, or delete that agent first.`,
  );
}

// createOrGetGroup reuses groups by normalized name. A leads-only agent sharing
// a group with a campaign (or a full agent that will create one) silently feeds
// people into outreach. Block that mix at agent creation.
async function assertAgentMayUseGroup(
  workspaceId: string,
  group: Pick<Group, "id" | "name">,
  leadsOnly: boolean,
) {
  if (!group.id) return;
  if (leadsOnly) {
    const [campaigns, agents] = await Promise.all([
      listCampaigns(workspaceId),
      listAgents(workspaceId),
    ]);
    if (campaigns.some((campaign) => campaign.groupId === group.id)) {
      throw new Error(
        `The lead group "${group.name}" already has outreach. Pick a different group name for a leads-only agent so those people are not messaged automatically.`,
      );
    }
    const fullOwner = agents.find(
      (agent) => agent.targetGroupId === group.id && !agent.leadsOnly,
    );
    if (fullOwner) {
      throw new Error(
        `The lead group "${group.name}" belongs to "${fullOwner.name}", which can run outreach. Pick a different group name for a leads-only agent.`,
      );
    }
    return;
  }
  await assertGroupAllowsOutreach(workspaceId, group.id);
}

// True when a leads-only agent sourced this lead: those people must never enter
// connect/message sequences. Deliberately group-independent - the check used to
// also require the campaign to sit on the agent's own group, which let a lead
// that belongs to a second group be invited and messaged by that group's
// campaign, exactly the outreach the user opted out of when picking "Only Lead".
export function isSourcedByLeadsOnlyAgent(
  lead: Pick<Lead, "sourceAgentId">,
  agents: Array<Pick<Agent, "id" | "leadsOnly">>,
) {
  if (!lead.sourceAgentId) return false;
  const source = agents.find((agent) => agent.id === lead.sourceAgentId);
  return Boolean(source?.leadsOnly);
}

export async function createCampaign(
  workspaceId: string,
  input: Omit<Campaign, "id" | "workspaceId" | "createdAt" | "updatedAt">,
) {
  // A leads-only agent's group must never gain a campaign: enrollNewLeadsInCampaign
  // sweeps in every lead in the group, so one campaign here silently messages
  // people the user asked only to have found. Two routes reach this - the
  // plan-limit resume flow in agents/new, and createOrGetGroup handing a new
  // agent the same group because the name matched - so the check lives at the
  // single choke point rather than on each caller.
  await assertGroupAllowsOutreach(workspaceId, input.groupId);

  const workspace = await getWorkspace(workspaceId);
  const campaignLimit = planLimits(workspace.billing?.plan).campaigns;
  await assertBelowPlanLimit(workspaceId, "campaign", campaignLimit);

  const timestamp = nowIso();
  const generatedId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  const ref = collection<Campaign>("campaigns").doc(generatedId);
  const campaign: Campaign = {
    ...input,
    id: ref.id,
    workspaceId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await ref.set(campaign);

  // Same post-write reconcile as createAgent: concurrent submits can both clear
  // the pre-check, so re-count and roll back the excess to keep the cap hard.
  if (Number.isFinite(campaignLimit)) {
    const size = await countPlanResource(workspaceId, "campaign", campaignLimit + 1);
    if (size > campaignLimit) {
      await ref.delete();
      throw new Error(limitMessage("campaign", campaignLimit));
    }
  }

  return campaign;
}

export async function updateCampaign(
  workspaceId: string,
  campaignId: string,
  patch: Partial<
    Pick<
      Campaign,
      | "name"
      | "status"
      | "steps"
      | "linkedInAccountId"
      | "replyHandling"
      | "bookingLink"
      | "sendWindow"
      | "notifyOnReply"
    >
  >,
) {
  const ref = collection<Campaign>("campaigns").doc(campaignId);
  const snap = await ref.get();
  const campaign = snap.data();

  if (!campaign || campaign.workspaceId !== workspaceId) {
    throw new Error("Campaign not found.");
  }

  const next = omitUndefined({
    ...patch,
    updatedAt: nowIso(),
  });

  await ref.update(next);
  if (patch.steps) {
    await remapCampaignEnrollments(workspaceId, campaignId, campaign.steps, patch.steps);
  }
  return { ...campaign, ...next } as Campaign;
}

// The agent editor owns the send window, but the window lives on the campaign
// (each campaign's actions are checked against its own window). An agent drives
// every campaign built on its lead group, so a window change on the edit form
// applies to all of them - otherwise the picker silently does nothing once the
// agent exists, which is exactly what it did before this.
export async function setSendWindowForGroup(
  workspaceId: string,
  groupId: string,
  sendWindow: SendWindow,
) {
  if (!groupId) return 0;
  const campaigns = (await listCampaigns(workspaceId)).filter(
    (campaign) => campaign.groupId === groupId && (campaign.sendWindow || "always") !== sendWindow,
  );

  await Promise.all(
    campaigns.map((campaign) => updateCampaign(workspaceId, campaign.id, { sendWindow })),
  );
  return campaigns.length;
}

// Same ownership model as the send-window picker: reply handling, booking link,
// and handoff email preference live on campaigns, but the agent editor applies
// them to every sequence built on the agent's lead group.
export async function setOutreachPolicyForGroup(
  workspaceId: string,
  groupId: string,
  patch: Partial<Pick<Campaign, "replyHandling" | "bookingLink" | "notifyOnReply" | "sendWindow">>,
) {
  if (!groupId) return 0;
  const campaigns = (await listCampaigns(workspaceId)).filter(
    (campaign) => campaign.groupId === groupId,
  );
  if (!campaigns.length) return 0;

  await Promise.all(
    campaigns.map((campaign) => updateCampaign(workspaceId, campaign.id, patch)),
  );
  return campaigns.length;
}

// After a campaign's steps are edited, realign every in-flight enrollment's
// currentStepIndex (which indexes the OLD steps array) to the matching step in
// the NEW array, so leads mid-sequence resume on the right step instead of
// drifting. Terminal enrollments (stopped/replied) are left alone.
export async function remapCampaignEnrollments(
  workspaceId: string,
  campaignId: string,
  oldSteps: CampaignStep[],
  newSteps: CampaignStep[],
) {
  const snap = await collection<CampaignEnrollment>("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .where("campaignId", "==", campaignId)
    .get();

  const batch = getDb().batch();
  let remapped = 0;

  for (const doc of snap.docs) {
    const enrollment = doc.data();
    if (enrollment.status === "stopped" || enrollment.status === "replied") continue;

    const nextIndex = remapStepIndex(oldSteps, newSteps, enrollment.currentStepIndex);
    if (nextIndex !== enrollment.currentStepIndex) {
      batch.update(doc.ref, { currentStepIndex: nextIndex, updatedAt: nowIso() });
      remapped += 1;
    }
  }

  if (remapped > 0) await batch.commit();
  return remapped;
}

export async function pauseCampaign(workspaceId: string, campaignId: string) {
  const ref = collection<Campaign>("campaigns").doc(campaignId);
  const snap = await ref.get();
  const campaign = snap.data();

  if (!campaign || campaign.workspaceId !== workspaceId) {
    throw new Error("Campaign not found.");
  }

  await ref.update({
    status: "paused",
    updatedAt: nowIso(),
  });
}

export async function resumeCampaign(workspaceId: string, campaignId: string) {
  const ref = collection<Campaign>("campaigns").doc(campaignId);
  const snap = await ref.get();
  const campaign = snap.data();

  if (!campaign || campaign.workspaceId !== workspaceId) {
    throw new Error("Campaign not found.");
  }

  await ref.update({
    status: "active",
    updatedAt: nowIso(),
  });
  await wakePausedCampaignEnrollments(workspaceId, campaignId);
}

// The tick parks a paused campaign's due enrollments a day out (marking them
// with pausedDeferredAt), so on resume they must be pulled back into the due
// window or the campaign sits idle for up to a day. Only marked enrollments
// are touched - a nextActionAt that encodes a real wait step or send pacing
// stays as scheduled.
export async function wakePausedCampaignEnrollments(workspaceId: string, campaignId: string) {
  const snap = await collection<CampaignEnrollment>("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .where("campaignId", "==", campaignId)
    .get();

  const now = nowIso();
  const batch = getDb().batch();
  let woken = 0;

  for (const doc of snap.docs) {
    const enrollment = doc.data();
    if (!enrollment.pausedDeferredAt) continue;
    batch.update(doc.ref, {
      nextActionAt: now,
      pausedDeferredAt: FieldValue.delete(),
      updatedAt: now,
    });
    woken += 1;
  }

  if (woken > 0) await batch.commit();
  return woken;
}

export async function deleteCampaign(workspaceId: string, campaignId: string) {
  const ref = collection<Campaign>("campaigns").doc(campaignId);
  const snap = await ref.get();
  const campaign = snap.data();

  if (!campaign || campaign.workspaceId !== workspaceId) {
    throw new Error("Campaign not found.");
  }

  const enrollmentSnap = await collection<CampaignEnrollment>("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .where("campaignId", "==", campaignId)
    .get();
  const enrollments = enrollmentSnap.docs.map((doc) => doc.data());
  // Contacted counts for Activity Overview come from enrollments. Snapshot
  // before delete so the chart does not lose outreach history.
  if (enrollments.length) {
    await persistActivityTotals(
      workspaceId,
      buildActivityTotalsFromLive({ leads: [], enrollments, conversations: [] }),
    ).catch((error) => {
      console.error(
        "[data] failed to snapshot activity before campaign delete:",
        error instanceof Error ? error.message : error,
      );
    });
  }
  for (let index = 0; index < enrollmentSnap.docs.length; index += 450) {
    const batch = getDb().batch();
    enrollmentSnap.docs.slice(index, index + 450).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  await ref.delete();
}

// Enrolls every group lead that isn't already enrolled in this campaign and
// hasn't already entered outreach elsewhere. Used both at campaign creation and
// every tick (so leads the agent discovers later get contacted too). Existence
// is checked per-lead by document id, so it is exact regardless of how many
// enrollments a campaign has, and it never re-writes - and thus never resets -
// an in-progress enrollment.
export async function enrollNewLeadsInCampaign(workspaceId: string, campaign: Campaign) {
  const leads = await listLeads(workspaceId, campaign.groupId);
  if (leads.length === 0) return 0;

  // Leads-only agents can share a group name with a campaign when older data
  // predates the create-time guard. Never pull their people into connect /
  // message sequences - createCampaign already refuses new campaigns on those
  // groups; this is the runtime backstop for existing ones.
  const agents = await listAgents(workspaceId);
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

  // A lead whose agent is paused or deleted must not START outreach here.
  // The tick's own guard only defers or stops enrollments once they exist, so
  // without this a deleted agent's lead sitting in a second group was enrolled
  // fresh - and messaged - after the delete had already stopped its outreach.
  const sourceAgentStopsOutreach = (lead: Lead) => {
    if (!lead.sourceAgentId) return false;
    const source = agentsById.get(lead.sourceAgentId);
    return !source || source.status === "paused";
  };

  const refs = leads.map((lead) =>
    collection<CampaignEnrollment>("campaignEnrollments").doc(`${campaign.id}-${lead.id}`),
  );
  const snaps = await getDb().getAll(...refs);

  const timestamp = nowIso();
  const pending = snaps
    .map((snap, index) => ({ snap, ref: refs[index], lead: leads[index] }))
    // Skip if already enrolled in this campaign, or already being contacted by
    // any campaign (prevents the same person getting hit by two campaigns).
    // Also skip every lead a leads-only agent sourced, including ones that
    // reached this group by also belonging to it.
    .filter(
      ({ snap, lead }) =>
        !snap.exists &&
        lead.outreachStatus === "new" &&
        !isSourcedByLeadsOnlyAgent(lead, agents) &&
        !sourceAgentStopsOutreach(lead),
    );

  if (pending.length === 0) return 0;

  // Every new enrollment gets its real send time up front, from the same
  // planner the Actions page reads. The old ladder stamped `now + position *
  // 10min` regardless of the daily cap, so with a 10/day limit lead 40 of 75
  // advertised a slot 6.5 hours out that it could not possibly hit, then
  // churned on hourly defers for days. The planner spreads them across as many
  // local days as the caps and the send window actually require.
  const startsWithConnect = campaign.steps[0]?.type === "connect";
  const workspace = await getWorkspace(workspaceId);
  const plan = await planActionSlots({
    workspace,
    campaign,
    actions: pending.map(({ ref, lead }) => ({
      id: ref.id,
      kind: startsWithConnect ? "invite" : "message",
      earliestAt: Date.parse(timestamp),
      // Each lead's own window: a queue spanning several timezones spreads
      // across each recipient's morning, not all into the workspace's.
      timezone: sendWindowTimeZoneForLead(lead.location, workspace.timezone),
    })),
  });

  // Chunked at 450: Firestore rejects a batch of more than 500 writes, and a
  // group large enough to exceed that is exactly the case this path exists for.
  for (let index = 0; index < pending.length; index += 450) {
    const batch = getDb().batch();
    for (const { ref, lead } of pending.slice(index, index + 450)) {
      const enrollment: CampaignEnrollment = {
        id: ref.id,
        workspaceId,
        campaignId: campaign.id,
        leadId: lead.id,
        status: "queued",
        currentStepIndex: 0,
        nextActionAt: new Date(plan.get(ref.id) ?? Date.parse(timestamp)).toISOString(),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      batch.set(ref, enrollment);
    }
    await batch.commit();
  }

  return pending.length;
}

// Future slots already reserved on a LinkedIn account's line, so a new plan
// never lands on top of outreach that is already scheduled. Scoped to the
// account rather than the campaign because the spacing rule is per-account:
// two campaigns sharing one LinkedIn account share one drip.
//
// Read earliest-first, so a queue deeper than this loses only its far tail -
// the slots a new action would never be planned into anyway.
const RESERVED_SLOT_SCAN_LIMIT = 1000;

async function listReservedActionSlots(workspaceId: string, linkedInAccountId?: string) {
  const campaigns = await listCampaigns(workspaceId);
  const sharingAccount = new Set(
    campaigns
      .filter((entry) => (entry.linkedInAccountId || "") === (linkedInAccountId || ""))
      .map((entry) => entry.id),
  );
  if (sharingAccount.size === 0) return [];

  try {
    // The campaign filter runs IN the query, not after it. Filtering a
    // workspace-wide `limit(1000)` in memory meant a workspace with more than
    // 1000 future enrollments spread across campaigns silently lost this
    // account's reservations - the planner then happily double-booked slots it
    // simply could not see. Chunked because Firestore caps `in` at 30 values.
    // The `in` field must lead the composite index:
    // (campaignId ASC, workspaceId ASC, nextActionAt ASC).
    const campaignIds = [...sharingAccount];
    const chunks: string[][] = [];
    for (let index = 0; index < campaignIds.length; index += 30) {
      chunks.push(campaignIds.slice(index, index + 30));
    }

    const since = nowIso();
    const results = await Promise.all(
      chunks.map((chunk) =>
        collection<CampaignEnrollment>("campaignEnrollments")
          .where("workspaceId", "==", workspaceId)
          .where("campaignId", "in", chunk)
          .where("nextActionAt", ">=", since)
          .orderBy("nextActionAt", "asc")
          .select("campaignId", "nextActionAt", "status")
          .limit(RESERVED_SLOT_SCAN_LIMIT)
          .get(),
      ),
    );

    return results
      .flatMap((snap) => snap.docs.map((doc) => doc.data()))
      .filter((enrollment) => !["stopped", "replied"].includes(enrollment.status))
      .map((enrollment) => Date.parse(enrollment.nextActionAt))
      .filter((ms) => Number.isFinite(ms));
  } catch (error) {
    // Keep the schedule accurate while the composite index is still building.
    // This equality-only query uses Firestore's automatic single-field index;
    // filtering in memory costs extra reads briefly, but returning no
    // reservations would let every scheduler tick book another action at
    // "now" and make the Actions timeline contradict the five-minute send gate.
    console.warn(
      "[data] reserved slot lookup failed; using index-free fallback:",
      error instanceof Error ? error.message : error,
    );
    const fallback = await collection<CampaignEnrollment>("campaignEnrollments")
      .where("workspaceId", "==", workspaceId)
      .select("campaignId", "nextActionAt", "status")
      .get();
    const now = Date.now();
    return fallback.docs
      .map((doc) => doc.data())
      .filter(
        (enrollment) =>
          sharingAccount.has(enrollment.campaignId) &&
          !["stopped", "replied"].includes(enrollment.status),
      )
      .map((enrollment) => Date.parse(enrollment.nextActionAt))
      .filter((ms) => Number.isFinite(ms) && ms >= now)
      .sort((a, b) => a - b)
      .slice(0, RESERVED_SLOT_SCAN_LIMIT);
  }
}

// The Firestore half of planning: reserved slots plus today's spent quota.
// Split out from planActionSlots so a caller processing many enrollments (the
// tick) can fetch it ONCE per account and reuse it. Doing it per enrollment
// meant two queries for every deferral, every two minutes.
export type SchedulingContext = {
  reservedSlots: number[];
  usedByDay: Record<string, { invites: number; messages: number }>;
};

export async function loadSchedulingContext(
  workspace: Workspace,
  campaign: Campaign,
): Promise<SchedulingContext> {
  const [reservedSlots, usedByDay] = await Promise.all([
    listReservedActionSlots(workspace.id, campaign.linkedInAccountId),
    getDailyQuotaUsage(workspace.id, workspace.timezone),
  ]);
  return { reservedSlots, usedByDay };
}

// Single entry point for "when should these actions actually fire". Gathers the
// live constraints (window, timezone, caps, already-spent quota, reserved
// slots) and hands them to the pure planner.
export async function planActionSlots(input: {
  workspace: Workspace;
  campaign: Campaign;
  // `timezone` is the recipient's, for the send window. Callers derive it with
  // sendWindowTimeZoneForLead; omitting it means "use the workspace's zone".
  actions: {
    id: string;
    kind: SendActionKind;
    earliestAt: number;
    timezone?: string;
  }[];
  // Extra slots claimed earlier in the same tick that are not yet persisted.
  additionalReserved?: number[];
  // Pre-fetched context, to avoid re-reading it per enrollment.
  context?: SchedulingContext;
}) {
  const { workspace, campaign } = input;
  const context = input.context || (await loadSchedulingContext(workspace, campaign));

  return planSendSchedule({
    nowMs: Date.now(),
    timezone: workspace.timezone,
    window: campaign.sendWindow || "always",
    dailyInviteLimit: workspace.settings.dailyInviteLimit,
    dailyMessageLimit: workspace.settings.dailyMessageLimit,
    usedByDay: context.usedByDay,
    reservedSlots: [...context.reservedSlots, ...(input.additionalReserved || [])],
    actions: input.actions,
  });
}

// Initial enrollment at campaign creation is just the incremental enroller with
// no existing enrollments yet.
export async function enrollGroupInCampaign(workspaceId: string, campaign: Campaign) {
  return enrollNewLeadsInCampaign(workspaceId, campaign);
}

export async function listCampaignEnrollments(workspaceId: string) {
  const snap = await collection<CampaignEnrollment>("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .get();
  return snap.docs.map((doc) => doc.data());
}

export async function getCampaignEnrollment(workspaceId: string, enrollmentId: string) {
  if (!enrollmentId) return null;
  const snap = await collection<CampaignEnrollment>("campaignEnrollments").doc(enrollmentId).get();
  const enrollment = snap.data();
  return enrollment && enrollment.workspaceId === workspaceId ? enrollment : null;
}

// A manual send may move past a wait step, but it must not race an automation
// tick or overwrite a send that has already been claimed.
export async function prepareEnrollmentActionNow(input: {
  workspaceId: string;
  id: string;
  expectedStepIndex: number;
  actionStepIndex: number;
}) {
  const ref = collection<CampaignEnrollment>("campaignEnrollments").doc(input.id);
  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const enrollment = snap.data();

    if (!enrollment || enrollment.workspaceId !== input.workspaceId) return null;
    if (enrollment.currentStepIndex !== input.expectedStepIndex || enrollment.pendingAction) {
      return null;
    }

    const timestamp = nowIso();
    transaction.update(ref, {
      currentStepIndex: input.actionStepIndex,
      nextActionAt: timestamp,
      updatedAt: timestamp,
    });
    return {
      ...enrollment,
      currentStepIndex: input.actionStepIndex,
      nextActionAt: timestamp,
      updatedAt: timestamp,
    };
  });
}

export async function listCampaignEnrollmentPreviews(
  workspaceId: string,
): Promise<CampaignEnrollmentPreview[]> {
  const snap = await collection<CampaignEnrollment>("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .select(
      "id",
      "workspaceId",
      "campaignId",
      "leadId",
      "status",
      "lastError",
      "connectionSentAt",
      "createdAt",
      "updatedAt",
    )
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as CampaignEnrollmentPreview);
}

const DUE_ENROLLMENT_STATUSES: CampaignEnrollment["status"][] = [
  "queued",
  "connection_sent",
  "connected",
  "message_sent",
  "reply_received",
  // Recoverable failures (e.g. unconfirmed pendingAction) used to park here
  // forever because "error" was excluded from the due query.
  "error",
];

function dueEnrollmentsFromSnapshot(
  snap: FirebaseFirestore.QuerySnapshot<CampaignEnrollment>,
  now: string,
) {
  return snap.docs
    .map((doc) => doc.data())
    .filter(
      (enrollment) =>
        DUE_ENROLLMENT_STATUSES.includes(enrollment.status) && enrollment.nextActionAt <= now,
    )
    .sort((a, b) => a.nextActionAt.localeCompare(b.nextActionAt));
}

// Firestore raises FAILED_PRECONDITION (code 9) when a query needs a composite
// index that doesn't exist yet, and INVALID_ARGUMENT (code 3) when it can't run
// as written. Either way we degrade to an unordered scan so a missing or
// still-building index can never break the live automation tick.
function isUnsupportedQueryError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: number | string }).code;
  const message = (error as { message?: string }).message || "";
  return code === 9 || code === 3 || /requires an index|FAILED_PRECONDITION/i.test(message);
}

// Selects a workspace's due enrollments oldest-first. Prefers an indexed
// orderBy(nextActionAt) so the soonest-due rows are returned even when a
// workspace holds more enrollments than the page size - closing the starvation
// gap of an unordered page. Falls back to the original unordered scan until the
// composite (workspaceId, status, nextActionAt) index on campaignEnrollments is
// in place, then activates automatically once it is.
// Logged to automationRuns once per process: the unordered fallback can starve
// genuinely-due enrollments once a workspace holds more due-eligible rows than
// the page size, so a missing index must be visible in the activity ground
// truth, not only in stdout.
let dueIndexFallbackReported = false;

async function dueEnrollmentsForWorkspace(workspaceId: string, now: string, limit: number) {
  const base = collection<CampaignEnrollment>("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .where("status", "in", DUE_ENROLLMENT_STATUSES);

  try {
    const snap = await base.orderBy("nextActionAt").limit(limit).get();
    return dueEnrollmentsFromSnapshot(snap, now);
  } catch (error) {
    if (!isUnsupportedQueryError(error)) throw error;
    console.warn(
      "[data] getDueEnrollments fell back to an unordered scan; create composite index " +
        "(workspaceId ASC, status ASC, nextActionAt ASC) on campaignEnrollments to fix the " +
        "due-selection ceiling.",
    );
    if (!dueIndexFallbackReported) {
      dueIndexFallbackReported = true;
      logAutomationRun({
        kind: "cron",
        status: "error",
        message:
          "campaignEnrollments composite index (workspaceId, status, nextActionAt) is missing; " +
          "due enrollments are selected from an unordered scan and can be starved. Deploy " +
          "firestore.indexes.json (firebase deploy --only firestore:indexes).",
      }).catch((logError) => {
        console.error("[data] failed to report missing due-enrollment index:", logError);
      });
    }
    const snap = await base.limit(limit).get();
    return dueEnrollmentsFromSnapshot(snap, now);
  }
}

function roundRobinEnrollmentsByWorkspace(enrollments: CampaignEnrollment[], limit: number) {
  const byWorkspace = new Map<string, CampaignEnrollment[]>();

  for (const enrollment of enrollments) {
    const queue = byWorkspace.get(enrollment.workspaceId) || [];
    queue.push(enrollment);
    byWorkspace.set(enrollment.workspaceId, queue);
  }

  const queues = Array.from(byWorkspace.values())
    .map((queue) => queue.sort((a, b) => a.nextActionAt.localeCompare(b.nextActionAt)))
    .sort((a, b) => a[0].nextActionAt.localeCompare(b[0].nextActionAt));
  const result: CampaignEnrollment[] = [];

  while (result.length < limit && queues.length) {
    for (let index = 0; index < queues.length && result.length < limit; ) {
      const next = queues[index].shift();
      if (next) result.push(next);
      if (queues[index].length === 0) {
        queues.splice(index, 1);
      } else {
        index += 1;
      }
    }
  }

  return result;
}

// All of a workspace's invites still waiting on acceptance. Read by the
// per-account acceptance sweep, which detects accepted invites in one batched
// sent-invitations comparison instead of a live profile view per pending lead.
export async function listConnectionSentEnrollments(workspaceId: string, limit?: number) {
  let query: FirebaseFirestore.Query<CampaignEnrollment> = collection<CampaignEnrollment>("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .where("status", "==", "connection_sent");
  if (limit != null && limit > 0) query = query.limit(limit);
  const snap = await query.get();
  return snap.docs.map((doc) => doc.data());
}

export async function getDueEnrollments(limit = 50, workspaceIds?: string[]) {
  const now = nowIso();
  const uniqueWorkspaceIds = Array.from(new Set((workspaceIds || []).filter(Boolean)));

  if (uniqueWorkspaceIds.length) {
    const perWorkspaceLimit = Math.max(limit, 50);
    const perWorkspace = await Promise.all(
      uniqueWorkspaceIds.map((workspaceId) =>
        dueEnrollmentsForWorkspace(workspaceId, now, perWorkspaceLimit),
      ),
    );
    return roundRobinEnrollmentsByWorkspace(perWorkspace.flat(), limit);
  }

  // Fetch a wide candidate window and pick the oldest-due in memory. Avoids a
  // composite (status + nextActionAt) index, at the cost of this ceiling: if a
  // workspace ever exceeds this many active-status enrollments, paginate or add
  // the index instead.
  const snap = await collection<CampaignEnrollment>("campaignEnrollments")
    .where("status", "in", DUE_ENROLLMENT_STATUSES)
    .limit(2000)
    .get();
  return roundRobinEnrollmentsByWorkspace(dueEnrollmentsFromSnapshot(snap, now), limit);
}

export async function updateEnrollment(
  workspaceId: string,
  id: string,
  patch: Partial<CampaignEnrollment>,
) {
  const ref = collection<CampaignEnrollment>("campaignEnrollments").doc(id);
  const safePatch = { ...patch };
  delete safePatch.id;
  delete safePatch.workspaceId;
  delete safePatch.campaignId;
  delete safePatch.leadId;
  delete safePatch.createdAt;

  await getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const enrollment = snap.data();

    if (!enrollment || enrollment.workspaceId !== workspaceId) {
      throw new Error("Enrollment not found.");
    }

    transaction.update(ref, updatePatch({
      ...safePatch,
      workspaceId: enrollment.workspaceId,
      updatedAt: nowIso(),
    }));
  });
}

export async function claimEnrollmentAction(input: {
  workspaceId: string;
  id: string;
  expectedStatus: CampaignEnrollment["status"];
  expectedStepIndex: number;
  kind: NonNullable<CampaignEnrollment["pendingAction"]>["kind"];
}) {
  const ref = collection<CampaignEnrollment>("campaignEnrollments").doc(input.id);
  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const enrollment = snap.data();

    if (!enrollment || enrollment.workspaceId !== input.workspaceId) return false;
    if (enrollment.status !== input.expectedStatus) return false;
    if (enrollment.currentStepIndex !== input.expectedStepIndex) return false;
    if (enrollment.pendingAction) return false;

    transaction.update(ref, {
      pendingAction: {
        kind: input.kind,
        stepIndex: input.expectedStepIndex,
        startedAt: nowIso(),
      },
      lastError: FieldValue.delete(),
      updatedAt: nowIso(),
    });
    return true;
  });
}

export async function stopLeadEnrollments(workspaceId: string, leadId: string) {
  const snap = await collection<CampaignEnrollment>("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .where("leadId", "==", leadId)
    .get();
  const batch = getDb().batch();
  for (const doc of snap.docs) {
    batch.update(doc.ref, { status: "replied", updatedAt: nowIso() });
  }
  await batch.commit();
}

// One-shot claim per (workspace, kind, day) so notifications triggered from
// the automation tick, such as the daily digest and invite-limit alert, send exactly
// once per day even across overlapping or restarted ticks.
export async function claimDailyNotification(workspaceId: string, kind: string, day: string) {
  const ref = getDb()
    .collection("notificationLocks")
    .doc(`${workspaceId}-${kind}-${day}`);

  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.exists) return false;
    transaction.set(ref, { workspaceId, kind, day, lastSentAt: Date.now(), updatedAt: nowIso() });
    return true;
  });
}

// A calendar-day lock can send twice only hours apart across midnight. This
// stable lock enforces an actual elapsed interval. The legacy day documents
// are read during migration so a recent digest is not duplicated on deploy.
export async function claimNotificationAfterInterval(
  workspaceId: string,
  kind: string,
  day: string,
  intervalMs: number,
) {
  const locks = getDb().collection("notificationLocks");
  const ref = locks.doc(`${workspaceId}-${kind}`);
  const currentDayRef = locks.doc(`${workspaceId}-${kind}-${day}`);
  const previousDay = new Date(`${day}T00:00:00.000Z`);
  previousDay.setUTCDate(previousDay.getUTCDate() - 1);
  const previousDayRef = locks.doc(
    `${workspaceId}-${kind}-${previousDay.toISOString().slice(0, 10)}`,
  );
  const now = Date.now();

  return getDb().runTransaction(async (transaction) => {
    const stableSnap = await transaction.get(ref);
    const currentDaySnap = await transaction.get(currentDayRef);
    const previousDaySnap = await transaction.get(previousDayRef);
    const lastSentAt = Math.max(
      Number(stableSnap.data()?.lastSentAt || 0),
      Number(currentDaySnap.data()?.lastSentAt || 0),
      Number(previousDaySnap.data()?.lastSentAt || 0),
    );
    if (!hasIntervalElapsed(lastSentAt, intervalMs, now)) return false;

    transaction.set(ref, {
      workspaceId,
      kind,
      day,
      lastSentAt: now,
      updatedAt: nowIso(),
    });
    return true;
  });
}

export async function claimReplyNotification(
  workspaceId: string,
  leadId: string,
  throttleMs = 10 * 60 * 1000,
) {
  const ref = getDb().collection("notificationLocks").doc(`${workspaceId}-${leadId}-reply`);
  const now = Date.now();

  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const lastSentAt = snap.exists ? Number(snap.data()?.lastSentAt || 0) : 0;
    if (lastSentAt && now - lastSentAt < throttleMs) return false;

    transaction.set(ref, {
      workspaceId,
      leadId,
      kind: "reply",
      lastSentAt: now,
      updatedAt: nowIso(),
    });
    return true;
  });
}

// Once per lead and outcome: a hot-interest email must not consume the later
// confirmed-booking notification. Both remain individually idempotent.
export async function claimLeadOutcomeNotification(
  workspaceId: string,
  leadId: string,
  kind: LeadOutcomeNotificationKind,
) {
  const ref = getDb()
    .collection("notificationLocks")
    .doc(leadOutcomeNotificationLockId(workspaceId, leadId, kind));

  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.exists) return false;
    transaction.set(ref, {
      workspaceId,
      leadId,
      kind,
      lastSentAt: Date.now(),
      updatedAt: nowIso(),
    });
    return true;
  });
}

export async function createConversationMessage(input: {
  workspaceId: string;
  leadId: string;
  campaignId?: string;
  userId: string;
  senderName: string;
  body: string;
  direction?: "inbound" | "outbound";
  // Stable provider message id (e.g. Unipile's). When set, a retried webhook
  // delivery is recognized and skipped instead of appending a duplicate.
  providerMessageId?: string;
  // Optional intent classification for the latest inbound reply.
  replyIntent?: Conversation["replyIntent"];
  replyIntentReason?: string;
  replyIntentConfidence?: number;
  replyIntentNextStepHint?: string;
}) {
  const id = `${input.workspaceId}-${input.leadId}`;
  const timestamp = nowIso();
  const ref = collection<Conversation>("conversations").doc(id);
  const inserted = await getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);

    if (snap.exists && input.providerMessageId) {
      const existingMessages = (snap.data() as Conversation).messages || [];
      if (existingMessages.some((message) => message.id === input.providerMessageId)) {
        return false;
      }
    }

    const message = {
      id: input.providerMessageId || `${Date.now()}`,
      direction: input.direction || "inbound",
      senderName: input.senderName,
      body: input.body,
      createdAt: timestamp,
    };

    const intentPatch =
      input.replyIntent && (input.direction || "inbound") === "inbound"
        ? {
            replyIntent: input.replyIntent,
            replyIntentReason: input.replyIntentReason || "",
            replyIntentConfidence: input.replyIntentConfidence ?? 0,
            replyIntentNextStepHint: input.replyIntentNextStepHint || "",
            replyIntentAt: timestamp,
            ...(input.replyIntent === "meeting_booked" &&
            (input.replyIntentConfidence ?? 1) >= MEETING_BOOKED_CONFIDENCE
              ? { meetingBookedAt: timestamp }
              : {}),
          }
        : {};

    if (snap.exists) {
      transaction.update(ref, {
        status: "open",
        messages: FieldValue.arrayUnion(message),
        updatedAt: timestamp,
        ...intentPatch,
      });
    } else {
      transaction.set(ref, {
        id,
        workspaceId: input.workspaceId,
        leadId: input.leadId,
        campaignId: input.campaignId,
        userId: input.userId,
        status: "open",
        messages: [message],
        createdAt: timestamp,
        updatedAt: timestamp,
        ...intentPatch,
      } satisfies Conversation);
    }

    return true;
  });
  if (inserted) {
    const eventId = `message-${input.providerMessageId || `${input.leadId}-${timestamp}`}`;
    await recordActivityEvent(
      input.workspaceId,
      eventId,
      input.direction === "outbound" ? "contacted" : "replies",
      timestamp,
    );
    if (
      input.replyIntent === "meeting_booked" &&
      (input.replyIntentConfidence ?? 1) >= MEETING_BOOKED_CONFIDENCE
    ) {
      await recordActivityEvent(input.workspaceId, `${eventId}-meeting`, "meetingsBooked", timestamp);
    }
  }
  return inserted;
}

export async function setConversationReplyIntent(
  workspaceId: string,
  leadId: string,
  intent: {
    intent: NonNullable<Conversation["replyIntent"]>;
    reason: string;
    confidence: number;
    nextStepHint?: string;
  },
) {
  const id = `${workspaceId}-${leadId}`;
  const timestamp = nowIso();
  await collection<Conversation>("conversations")
    .doc(id)
    .set(
      {
        replyIntent: intent.intent,
        replyIntentReason: intent.reason,
        replyIntentConfidence: intent.confidence,
        replyIntentNextStepHint: intent.nextStepHint || "",
        replyIntentAt: timestamp,
        ...(intent.intent === "meeting_booked" &&
        intent.confidence >= MEETING_BOOKED_CONFIDENCE
          ? { meetingBookedAt: timestamp }
          : {}),
        updatedAt: timestamp,
      },
      { merge: true },
    );
}

export async function completeConversationManualFollowUp(workspaceId: string, leadId: string) {
  const timestamp = nowIso();
  await collection<Conversation>("conversations")
    .doc(`${workspaceId}-${leadId}`)
    .update({
      manualFollowUpCompletedAt: timestamp,
      updatedAt: timestamp,
    });
}

export async function listConversations(workspaceId: string, limit = 100) {
  const capped = Math.min(Math.max(limit, 1), 500);
  try {
    const snap = await collection<Conversation>("conversations")
      .where("workspaceId", "==", workspaceId)
      .orderBy("updatedAt", "desc")
      .limit(capped)
      .get();
    return snap.docs.map((doc) => doc.data());
  } catch (error) {
    console.warn(
      "[data] ordered conversation query failed; using capped scan:",
      error instanceof Error ? error.message : error,
    );
    const snap = await collection<Conversation>("conversations")
      .where("workspaceId", "==", workspaceId)
      .limit(capped)
      .get();
    return snap.docs
      .map((doc) => doc.data())
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

/** Server-side paginated conversation read for complete activity aggregation. */
export async function listConversationsForActivity(workspaceId: string) {
  const conversations: Conversation[] = [];
  const pageSize = 250;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot<Conversation> | undefined;

  while (true) {
    let query: FirebaseFirestore.Query<Conversation> = collection<Conversation>("conversations")
      .where("workspaceId", "==", workspaceId)
      .orderBy("__name__", "asc")
      .limit(pageSize);
    if (lastDoc) query = query.startAfter(lastDoc);
    const snap = await query.get();
    conversations.push(...snap.docs.map((doc) => doc.data()));
    if (snap.size < pageSize) break;
    lastDoc = snap.docs[snap.docs.length - 1];
  }

  return conversations;
}

export async function getConversation(workspaceId: string, leadId: string) {
  const snap = await collection<Conversation>("conversations")
    .doc(`${workspaceId}-${leadId}`)
    .get();
  return snap.exists ? snap.data() || null : null;
}

// When a message actually went out, per lead. The Actions page marks completed
// steps with their real send time, and the conversation is the only record of
// it (enrollments keep just connectionSentAt). Batched by doc id so it reads
// exactly the enrolled leads instead of scanning the collection.
export async function getOutboundMessageTimesByLeadIds(
  workspaceId: string,
  leadIds: string[],
): Promise<Map<string, string[]>> {
  const unique = [...new Set(leadIds.filter(Boolean))];
  const out = new Map<string, string[]>();
  if (!unique.length) return out;

  const conversations = collection<Conversation>("conversations");
  for (let i = 0; i < unique.length; i += 300) {
    const refs = unique.slice(i, i + 300).map((leadId) => conversations.doc(`${workspaceId}-${leadId}`));
    const snaps = await getDb().getAll(...refs);
    for (const snap of snaps) {
      const data = snap.data() as Conversation | undefined;
      if (!data || data.workspaceId !== workspaceId) continue;
      out.set(
        data.leadId,
        (data.messages || [])
          .filter((message) => message.direction === "outbound")
          .map((message) => message.createdAt)
          .sort((a, b) => a.localeCompare(b)),
      );
    }
  }
  return out;
}

export async function logAutomationRun(run: Omit<AutomationRun, "id" | "createdAt">) {
  const ref = collection<AutomationRun>("automationRuns").doc();
  // Callers pass workspaceId: undefined for global events (e.g. webhook events
  // that arrive without one); Firestore rejects undefined properties outright.
  await ref.set(omitUndefined({ ...run, id: ref.id, createdAt: nowIso() }));
}

// Cap is intentional: activity feeds and digests only need recent runs. A
// full-collection scan per workspace previously loaded 10k+ docs (30s–300s)
// and surfaced as browser "TypeError: network error" when the tunnel/SSR
// request died mid-flight.
const AUTOMATION_RUNS_MAX_LIMIT = 2000;

export async function listAutomationRuns(workspaceId: string, limit = 100) {
  const capped = Math.min(Math.max(limit, 1), AUTOMATION_RUNS_MAX_LIMIT);
  const fields = ["id", "workspaceId", "kind", "status", "message", "createdAt"] as const;

  try {
    // Requires composite index (workspaceId ASC, createdAt DESC).
    const snap = await collection<AutomationRun>("automationRuns")
      .where("workspaceId", "==", workspaceId)
      .orderBy("createdAt", "desc")
      .limit(capped)
      .select(...fields)
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AutomationRun);
  } catch (error) {
    // Index may still be building after deploy. Never fall back to an unbounded
    // scan - that is the failure mode that hung page loads for minutes.
    console.warn(
      "[data] listAutomationRuns ordered query failed; using capped scan:",
      error instanceof Error ? error.message : error,
    );
    const scanLimit = Math.min(Math.max(capped, 100), 500);
    const snap = await collection<AutomationRun>("automationRuns")
      .where("workspaceId", "==", workspaceId)
      .select(...fields)
      .limit(scanLimit)
      .get();
    return snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as AutomationRun)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, capped);
  }
}

// Durable Activity Overview: per-day found/contacted/replies/bookings that outlive
// agent and lead deletes. Docs are never deleted with agents; merge uses max()
// so a later live recompute cannot shrink history after a delete snapshot.
async function recordActivityEvent(
  workspaceId: string,
  eventId: string,
  metric: "found" | "contacted" | "replies" | "meetingsBooked",
  timestamp = nowIso(),
) {
  const day = timestamp.slice(0, 10);
  await getDb()
    .collection("activityEvents")
    .doc(`${workspaceId}-${eventId}`)
    .set({ workspaceId, day, metric, createdAt: timestamp }, { merge: true });
}

export async function listActivityDays(workspaceId: string, limit = 120) {
  const [snap, eventSnap] = await Promise.all([
    getDb()
    .collection("activityDays")
    .where("workspaceId", "==", workspaceId)
    .limit(Math.max(1, Math.min(limit, 400)))
    .get(),
    getDb()
      .collection("activityEvents")
      .where("workspaceId", "==", workspaceId)
      .limit(5000)
      .get(),
  ]);

  const days = snap.docs
    .map((doc) => {
      const data = doc.data() as ActivityDay;
      return {
        id: doc.id,
        workspaceId: data.workspaceId || workspaceId,
        day: data.day || "",
        found: Number(data.found || 0),
        contacted: Number(data.contacted || 0),
        replies: Number(data.replies || 0),
        meetingsBooked: Number(data.meetingsBooked || 0),
        updatedAt: data.updatedAt || "",
      } satisfies ActivityDay;
    })
    .filter((day) => Boolean(day.day))
    .sort((a, b) => a.day.localeCompare(b.day));
  const byDay = new Map(days.map((day) => [day.day, day]));
  const eventCounts = new Map<string, Record<string, number>>();
  for (const doc of eventSnap.docs) {
    const event = doc.data();
    if (!event.day || !event.metric) continue;
    const counts = eventCounts.get(event.day) || {};
    counts[event.metric] = (counts[event.metric] || 0) + 1;
    eventCounts.set(event.day, counts);
  }
  for (const [day, counts] of eventCounts) {
    const current = byDay.get(day) || {
      id: `${workspaceId}-${day}`,
      workspaceId,
      day,
      found: 0,
      contacted: 0,
      replies: 0,
      meetingsBooked: 0,
      updatedAt: "",
    };
    for (const metric of ["found", "contacted", "replies", "meetingsBooked"] as const) {
      current[metric] = Math.max(current[metric], counts[metric] || 0);
    }
    byDay.set(day, current);
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

/** Max-merge day totals into activityDays. Safe to call before deletes. */
export async function persistActivityTotals(
  workspaceId: string,
  points: ActivityDayTotals[],
) {
  if (!points.length) return 0;

  let written = 0;
  for (const point of points) {
    if (!point.dateKey) continue;
    const ref = getDb().collection("activityDays").doc(`${workspaceId}-${point.dateKey}`);
    await getDb().runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      const existing = snap.exists ? (snap.data() as ActivityDay) : null;
      transaction.set(
        ref,
        {
          workspaceId,
          day: point.dateKey,
          found: Math.max(Number(existing?.found || 0), Number(point.found || 0)),
          contacted: Math.max(
            Number(existing?.contacted || 0),
            Number(point.contacted || 0),
          ),
          replies: Math.max(Number(existing?.replies || 0), Number(point.replies || 0)),
          meetingsBooked: Math.max(
            Number(existing?.meetingsBooked || 0),
            Number(point.meetingsBooked || 0),
          ),
          updatedAt: nowIso(),
        },
        { merge: true },
      );
    });
    written += 1;
  }
  return written;
}

/**
 * Recompute durable activity from whatever CRM rows still exist and max-merge.
 * Safe to call on dashboard load: never shrinks history after a prior snapshot.
 */
export async function reconcileActivityFromLive(
  workspaceId: string,
  input: {
    leads: Array<Pick<Lead, "id" | "createdAt" | "updatedAt" | "outreachStatus">>;
    enrollments: Array<
      Pick<CampaignEnrollment, "leadId" | "status" | "createdAt" | "updatedAt">
    >;
    conversations: Array<
      Pick<Conversation, "messages" | "replyIntent" | "replyIntentAt" | "meetingBookedAt">
    >;
  },
) {
  const points = buildActivityTotalsFromLive(input);
  if (!points.length) return 0;
  return persistActivityTotals(workspaceId, points);
}

// The quota day is the workspace's LOCAL calendar day. Keying on the UTC day
// meant a US workspace's "daily" allowance reset mid-afternoon, and because
// quota-blocked enrollments retry hourly, the whole day's volume resumed the
// moment the UTC boundary passed - a ~100-minute burst at 00:00 UTC (20:00
// local in New York, 05:30 in Kolkata) rather than a drip through the day.
// The doc id keeps its `${workspaceId}-YYYY-MM-DD` shape; only the date it
// resolves to moves, so a workspace may get one extra partial day's allowance
// on rollout. Under-sending is the only alternative and a single day's overlap
// is the cheaper side of that trade.
//
// `timezone` is required on every caller rather than defaulting to UTC: a
// caller that forgets it would silently count against a DIFFERENT usageDays
// document than the automation tick, so the same day's limit could be spent
// twice. Pass `undefined` explicitly only where no workspace is in scope.
function quotaDayKey(timezone: string | undefined) {
  return zonedParts(timezone, Date.now()).dayKey;
}

export async function hasDailyQuotaRemaining(
  workspaceId: string,
  kind: "invites" | "messages",
  limit: number,
  timezone: string | undefined,
) {
  const today = quotaDayKey(timezone);
  const snap = await getDb().collection("usageDays").doc(`${workspaceId}-${today}`).get();
  const current = Number(snap.data()?.[kind] || 0);
  return current < limit;
}

// How much of each local day's allowance is already spent, for the planner's
// usedByDay input. Only today is read: future days are always empty, and the
// planner treats a missing key as zero.
export async function getDailyQuotaUsage(workspaceId: string, timezone: string | undefined) {
  const today = quotaDayKey(timezone);
  const snap = await getDb().collection("usageDays").doc(`${workspaceId}-${today}`).get();
  const data = snap.data() || {};
  return {
    [today]: {
      invites: Number(data.invites || 0),
      messages: Number(data.messages || 0),
    },
  };
}

// Reserves one unit of today's quota. Call this only after the LinkedIn send
// succeeds - failed Unipile responses must not burn the daily budget, or the
// rest of the day is stuck on invite-limit / message-limit with zero outreach.
export async function consumeDailyQuota(
  workspaceId: string,
  kind: "invites" | "messages",
  limit: number,
  timezone: string | undefined,
) {
  const today = quotaDayKey(timezone);
  const ref = getDb().collection("usageDays").doc(`${workspaceId}-${today}`);

  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    const current = Number(data[kind] || 0);

    if (current >= limit) return false;

    transaction.set(
      ref,
      {
        workspaceId,
        day: today,
        [kind]: current + 1,
        updatedAt: nowIso(),
      },
      { merge: true },
    );
    return true;
  });
}

// Live LinkedIn profile views (/users/{id} reads) are the access pattern
// LinkedIn's "high volume of profile data" enforcement flags, so they share a
// persistent per-account daily budget. Firestore-backed (unlike the old
// in-process counter) so restarts and multiple server processes cannot reset
// or multiply the one limit protecting the customer's account. Any failure
// reads as "budget spent" - under-viewing is the safe direction.
export async function consumeProfileViewBudget(accountId: string, limit: number) {
  const today = new Date().toISOString().slice(0, 10);
  const ref = getDb()
    .collection("usageDays")
    .doc(`account-${cleanId(accountId)}-${today}`);

  try {
    return await getDb().runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      const current = Number(snap.data()?.profileViews || 0);
      if (current >= limit) return false;

      transaction.set(
        ref,
        {
          accountId,
          day: today,
          profileViews: current + 1,
          updatedAt: nowIso(),
        },
        { merge: true },
      );
      return true;
    });
  } catch (error) {
    console.error("[data] profile view budget check failed:", error);
    return false;
  }
}

// Interval claim for recurring background tasks (webhook registration, the
// per-account acceptance sweep, reply sync). Returns null while the interval
// since the last run has not elapsed; on a successful claim returns the
// previous run's epoch ms (0 for the first run) so pollers can use it as a
// change cursor.
export async function claimSystemTask(taskId: string, intervalMs: number) {
  const ref = getDb().collection("automationLocks").doc(`task-${cleanId(taskId)}`);

  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const lastRunAt = snap.exists ? Number(snap.data()?.lastRunAt || 0) : 0;
    const now = Date.now();

    if (lastRunAt && now - lastRunAt < intervalMs) return null;

    transaction.set(ref, { taskId, lastRunAt: now, updatedAt: nowIso() });
    return { previousRunAt: lastRunAt };
  });
}

// Persistent per-account action drip: at most one outbound action per account
// per SPACING_MINUTES, across ticks, webhooks and manual runs. This used to
// cover invites only, so messages and AI replies had no spacing at all and
// went 1-3 per two-minute tick. Now invites, follow-ups and replies share one
// line, which is what the planner in send-schedule.ts allocates against.
// Claimed transactionally before the send; returns null when the slot is
// claimed, or the ISO time the next action is allowed. A claimed slot that
// ends up not sending under-sends rather than over-sends - the safe direction.
//
// Scoped per LinkedIn account, not per workspace: the spacing exists to look
// human to LinkedIn, which rate-checks per account.
export async function claimActionSlot(workspaceId: string, linkedInAccountId: string) {
  // Distinct from the old `inviteSpacing` collection: the semantics changed
  // (all actions, not just invites), so starting a fresh doc avoids inheriting
  // an invite-only cursor. Worst case one extra action in the first window
  // after rollout.
  const ref = getDb().collection("actionSpacing").doc(linkedInAccountId);
  const intervalMs = SPACING_MINUTES * 60 * 1000;

  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const lastSentAt = snap.exists ? Number(snap.data()?.lastSentAt || 0) : 0;
    const now = Date.now();

    if (lastSentAt && now - lastSentAt < intervalMs) {
      return new Date(lastSentAt + intervalMs).toISOString();
    }

    transaction.set(ref, {
      workspaceId,
      linkedInAccountId,
      lastSentAt: now,
      updatedAt: nowIso(),
    });
    return null;
  });
}

// Single-flight lock for the automation tick so overlapping cron runs (a long
// run still in progress when the next fires) can't double-send invites or
// messages. Scheduled callers can also enforce a minimum start interval so
// multiple PM2 processes or cron sources do not multiply the send cadence.
// The lock auto-expires after ttlMs so a crashed tick can't wedge it.
export async function acquireTickLock(
  lockId: string,
  ttlMs: number,
  minimumStartIntervalMs = 0,
): Promise<string | null> {
  const ref = getDb().collection("automationLocks").doc(lockId);
  const now = Date.now();
  const ownerToken = randomBytes(24).toString("hex");

  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const lockedAt = snap.exists ? Number(snap.data()?.lockedAt || 0) : 0;
    const lastStartedAt = snap.exists ? Number(snap.data()?.lastStartedAt || 0) : 0;

    if (lockedAt && now - lockedAt < ttlMs) return null;
    if (minimumStartIntervalMs && lastStartedAt && now - lastStartedAt < minimumStartIntervalMs) {
      return null;
    }

    transaction.set(ref, {
      lockedAt: now,
      lastStartedAt: now,
      ownerToken,
      updatedAt: nowIso(),
    });
    return ownerToken;
  });
}

export async function renewTickLock(lockId: string, ownerToken: string) {
  const ref = getDb().collection("automationLocks").doc(lockId);
  const now = Date.now();

  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.data()?.ownerToken !== ownerToken) return false;
    transaction.update(ref, { lockedAt: now, updatedAt: nowIso() });
    return true;
  });
}

export async function releaseTickLock(lockId: string, ownerToken: string) {
  const ref = getDb().collection("automationLocks").doc(lockId);
  await getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.data()?.ownerToken !== ownerToken) return;
    transaction.update(ref, {
      lockedAt: 0,
      ownerToken: FieldValue.delete(),
      updatedAt: nowIso(),
    });
  });
}

function inviteSafetyLockId(
  kind: "invite-cooldown" | "invite-limit-signals",
  workspaceId: string,
  linkedInAccountId: string,
) {
  return `${kind}-${workspaceId}-${cleanId(linkedInAccountId)}`;
}

// LinkedIn invitation restrictions are per connected account, not per
// workspace. Keeping the breaker account-scoped prevents one restricted
// account from freezing outreach on every other connected account.
export async function setInviteCooldown(
  workspaceId: string,
  linkedInAccountId: string,
  until: string,
) {
  await getDb()
    .collection("automationLocks")
    .doc(inviteSafetyLockId("invite-cooldown", workspaceId, linkedInAccountId))
    .set({ workspaceId, linkedInAccountId, until, updatedAt: nowIso() });
}

export async function getInviteCooldown(workspaceId: string, linkedInAccountId: string) {
  const snap = await getDb()
    .collection("automationLocks")
    .doc(inviteSafetyLockId("invite-cooldown", workspaceId, linkedInAccountId))
    .get();
  const until = snap.data()?.until;
  return typeof until === "string" && until > nowIso() ? until : null;
}

// Rolling tally of distinct leads whose invite was rejected with
// cannot_resend_yet; see addInviteLimitSignal for why one rejection must not
// arm the account cooldown. Signals are isolated per LinkedIn account. Returns
// the distinct-lead count so the caller can compare it against the threshold.
export async function recordInviteLimitSignal(
  workspaceId: string,
  linkedInAccountId: string,
  leadId: string,
) {
  const ref = getDb()
    .collection("automationLocks")
    .doc(inviteSafetyLockId("invite-limit-signals", workspaceId, linkedInAccountId));
  const snap = await ref.get();
  const prior = (snap.data()?.signals as Record<string, string> | undefined) ?? {};
  const signals = addInviteLimitSignal(prior, leadId, nowIso());
  await ref.set({ workspaceId, linkedInAccountId, signals, updatedAt: nowIso() });
  return Object.keys(signals).length;
}

// A successful invite proves the account is not invite-limited, so pending
// rejection signals are stale. Never throws: the invite already went out, and
// the caller must still record it on the enrollment.
export async function clearInviteLimitSignals(workspaceId: string, linkedInAccountId: string) {
  try {
    await getDb()
      .collection("automationLocks")
      .doc(inviteSafetyLockId("invite-limit-signals", workspaceId, linkedInAccountId))
      .delete();
  } catch (error) {
    console.error("[automation] failed to clear invite limit signals:", error);
  }
}
