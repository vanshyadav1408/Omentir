import "server-only";

import { createHash, randomBytes } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { hashAgentApiToken } from "@/lib/agent-api-token";
import { planLimits } from "@/lib/plan-limits";
import { getDb, nowIso, cleanId, normalizeLinkedInProfileUrl } from "./firebase";
import { hasIntervalElapsed, isAgentDueForRun, nextDailyAgentRunAt } from "./scheduling";
import { remapStepIndex } from "./enrollment-remap";
import { addInviteLimitSignal } from "./outreach-rules";
import type {
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
  LeadPreview,
  LeadSignal,
  LinkedInAccount,
  ProductProfile,
  Workspace,
  WorkspaceBilling,
  WorkspaceOnboarding,
  WorkspaceSettings,
} from "./types";

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

function omitUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
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

async function assertBelowPlanLimit(
  workspaceId: string,
  resource: "agent" | "campaign",
  limit: number,
) {
  if (!Number.isFinite(limit)) return;

  const snap = await collection(resource === "agent" ? "agents" : "campaigns")
    .where("workspaceId", "==", workspaceId)
    .limit(limit + 1)
    .get();

  if (snap.size >= limit) {
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
  return getDb().runTransaction(async (transaction) => {
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
export async function listWorkspaces(limit = 500) {
  const snap = await collection<Workspace>("workspaces").limit(limit).get();
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
  await ensureWorkspace(workspaceId);
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
) {
  const existing = await getProductProfile(workspaceId);
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
    keyFeatures: [],
    socialProof: [],
    linkedInCompanyPage: "",
    targetBuyers: [],
    buyerTitles: [],
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
    .limit(1000)
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
function assertAgentSetupComplete(input: CreateAgentInput) {
  if (input.mode === "outreach") return;
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

export async function createAgent(
  workspaceId: string,
  input: CreateAgentInput,
) {
  assertAgentSetupComplete(input);
  const workspace = await getWorkspace(workspaceId);
  await assertBelowPlanLimit(workspaceId, "agent", planLimits(workspace.billing?.plan).agents);

  const group = await createOrGetGroup(workspaceId, input.targetGroupName, "Created by AI Agent");
  const timestamp = nowIso();
  const ref = collection<Agent>("agents").doc();
  const agent: Agent = {
    id: ref.id,
    workspaceId,
    name: input.name || input.targetGroupName,
    // Spread conditionally: Firestore rejects undefined values outright.
    ...(input.linkedInAccountId ? { linkedInAccountId: input.linkedInAccountId } : {}),
    mode: input.mode,
    prompt: input.prompt,
    filters: input.filters,
    signalSources: withDefaultSignalSources(input.signalSources),
    targetGroupId: group.id,
    targetGroupName: group.name,
    status: "active",
    nextRunAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await ref.set(agent);
  return agent;
}

export async function updateAgent(
  workspaceId: string,
  agentId: string,
  input: CreateAgentInput,
) {
  assertAgentSetupComplete(input);
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

  const patch: Partial<Agent> = {
    name: input.name || input.targetGroupName || agent.name,
    // Spread conditionally: Firestore rejects undefined values, and an update
    // without a selection should keep the agent's current account.
    ...(input.linkedInAccountId ? { linkedInAccountId: input.linkedInAccountId } : {}),
    mode: input.mode,
    prompt: input.prompt,
    filters: input.filters,
    signalSources: withDefaultSignalSources(input.signalSources),
    targetGroupId: group.id,
    targetGroupName: group.name,
    status: agent.status === "paused" ? "paused" : "active",
    runStartedAt: FieldValue.delete() as unknown as string,
    nextRunAt: nowIso(),
    updatedAt: nowIso(),
  };

  await ref.update(patch);
  return { ...agent, ...patch } as Agent;
}

export async function markAgentRun(agent: Agent, ok: boolean) {
  await collection<Agent>("agents").doc(agent.id).update({
    status: ok ? "active" : "error",
    lastRunAt: nowIso(),
    runStartedAt: FieldValue.delete(),
    nextRunAt: nextDailyAgentRunAt(agent.nextRunAt),
    updatedAt: nowIso(),
  });
}

// Push an agent's next run to its next daily slot without recording a run or
// changing its status - for agents the tick skips (e.g. workspace without an
// active subscription). Leaving nextRunAt in the past keeps the agent due on
// every tick, re-reading its workspace forever for nothing.
export async function deferAgentRun(agent: Agent) {
  await collection<Agent>("agents").doc(agent.id).update({
    nextRunAt: nextDailyAgentRunAt(agent.nextRunAt),
    updatedAt: nowIso(),
  });
}

export async function markAgentStarted(agent: Agent) {
  await collection<Agent>("agents").doc(agent.id).update({
    status: "running",
    runStartedAt: nowIso(),
    updatedAt: nowIso(),
  });
}

export async function updateAgentPeopleEngineCursor(agentId: string, sourceKey: string) {
  await collection<Agent>("agents").doc(agentId).update({
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

  await ref.update({
    status: "active",
    runStartedAt: FieldValue.delete(),
    nextRunAt: nowIso(),
    updatedAt: nowIso(),
  });
  await wakeAgentPausedEnrollments(workspaceId, agent);
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
// that agent and are kept. The leads themselves are never deleted.
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

  const leads = await listLeads(workspaceId, groupId, 5000);
  for (let index = 0; index < leads.length; index += 450) {
    const batch = getDb().batch();
    leads.slice(index, index + 450).forEach((lead) => {
      batch.update(collection<Lead>("leads").doc(lead.id), {
        groupIds: FieldValue.arrayRemove(groupId),
        updatedAt: nowIso(),
      });
    });
    await batch.commit();
  }

  await ref.delete();
}

export async function listLeads(workspaceId: string, groupId?: string, limit = 500) {
  let query: FirebaseFirestore.Query<Lead> = collection<Lead>("leads").where(
    "workspaceId",
    "==",
    workspaceId,
  );
  if (groupId) query = query.where("groupIds", "array-contains", groupId);
  const snap = await query.limit(limit).get();
  return snap.docs.map((doc) => doc.data());
}

export async function listLeadPreviews(
  workspaceId: string,
  groupId?: string,
  limit = 500,
): Promise<LeadPreview[]> {
  let query: FirebaseFirestore.Query<Lead> = collection<Lead>("leads").where(
    "workspaceId",
    "==",
    workspaceId,
  );
  if (groupId) query = query.where("groupIds", "array-contains", groupId);
  const snap = await query
    .select(
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
      "sourceAgentId",
      "outreachStatus",
      "createdAt",
      "updatedAt",
    )
    .limit(limit)
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as LeadPreview);
}

// Resolve specific leads by id in batches. The list views above cap at 500
// leads, so in a larger workspace an enrollment/conversation can reference a
// lead that falls outside that page - which drops the person's name/details
// from activity rows. This fetches exactly the referenced leads (regardless of
// how many total leads the workspace has) so those rows still show the person.
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
  limit = 500,
): Promise<LeadAgentRef[]> {
  const snap = await collection<Lead>("leads")
    .where("workspaceId", "==", workspaceId)
    .select("sourceAgentId")
    .limit(limit)
    .get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    sourceAgentId: (doc.data() as Partial<Lead>).sourceAgentId,
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
  const id = leadDocId(workspaceId, lead);
  const ref = collection<Lead>("leads").doc(id);
  const groupRef = collection<Group>("groups").doc(groupId);

  return getDb().runTransaction(async (transaction) => {
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
      fitScore: lead.fitScore || 0,
      scoreReasons: lead.scoreReasons || [],
      signalType: lead.signalType,
      signalSource: lead.signalSource,
      signalText: lead.signalText,
      signalUrl: lead.signalUrl,
      signalObservedAt: lead.signalObservedAt,
      leadReason: lead.leadReason,
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

export async function getActiveCampaigns(limit = 1000) {
  const snap = await collection<Campaign>("campaigns")
    .where("status", "==", "active")
    .limit(limit)
    .get();
  return snap.docs.map((doc) => doc.data());
}

export async function createCampaign(
  workspaceId: string,
  input: Omit<Campaign, "id" | "workspaceId" | "createdAt" | "updatedAt">,
) {
  const workspace = await getWorkspace(workspaceId);
  await assertBelowPlanLimit(
    workspaceId,
    "campaign",
    planLimits(workspace.billing?.plan).campaigns,
  );

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
  return campaign;
}

export async function updateCampaign(
  workspaceId: string,
  campaignId: string,
  patch: Partial<Pick<Campaign, "name" | "status" | "steps" | "linkedInAccountId" | "replyHandling">>,
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
  return { ...campaign, ...next } as Campaign;
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

  const refs = leads.map((lead) =>
    collection<CampaignEnrollment>("campaignEnrollments").doc(`${campaign.id}-${lead.id}`),
  );
  const snaps = await getDb().getAll(...refs);

  const timestamp = nowIso();
  const batch = getDb().batch();
  let added = 0;

  // Campaigns that open with a connection request can only send one invite per
  // INVITE_SPACING_MINUTES per account, so ladder the scheduled times to match
  // that drip - stamping them all "now" shows a bogus pile-up on the Actions
  // page and churns the due queue every tick.
  const startsWithConnect = campaign.steps[0]?.type === "connect";
  const scheduledAt = (position: number) =>
    startsWithConnect
      ? new Date(Date.parse(timestamp) + position * INVITE_SPACING_MINUTES * 60 * 1000).toISOString()
      : timestamp;

  snaps.forEach((snap, index) => {
    const lead = leads[index];
    // Skip if already enrolled in this campaign, or already being contacted by
    // any campaign (prevents the same person getting hit by two campaigns).
    if (snap.exists) return;
    if (lead.outreachStatus !== "new") return;

    const enrollment: CampaignEnrollment = {
      id: refs[index].id,
      workspaceId,
      campaignId: campaign.id,
      leadId: lead.id,
      status: "queued",
      currentStepIndex: 0,
      nextActionAt: scheduledAt(added),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    batch.set(refs[index], enrollment);
    added += 1;
  });

  if (added > 0) await batch.commit();
  return added;
}

// Initial enrollment at campaign creation is just the incremental enroller with
// no existing enrollments yet.
export async function enrollGroupInCampaign(workspaceId: string, campaign: Campaign) {
  return enrollNewLeadsInCampaign(workspaceId, campaign);
}

export async function listCampaignEnrollments(workspaceId: string) {
  const snap = await collection<CampaignEnrollment>("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .limit(500)
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
    .limit(500)
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
export async function listConnectionSentEnrollments(workspaceId: string, limit = 1000) {
  const snap = await collection<CampaignEnrollment>("campaignEnrollments")
    .where("workspaceId", "==", workspaceId)
    .where("status", "==", "connection_sent")
    .limit(limit)
    .get();
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
// the 10-minute tick - the daily digest, the invite-limit alert - send exactly
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

// Once per lead: interested-lead emails must stay rare and high-signal.
export async function claimInterestNotification(workspaceId: string, leadId: string) {
  const ref = getDb().collection("notificationLocks").doc(`${workspaceId}-${leadId}-interest`);

  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.exists) return false;
    transaction.set(ref, {
      workspaceId,
      leadId,
      kind: "interest",
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
  return getDb().runTransaction(async (transaction) => {
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
        updatedAt: timestamp,
      },
      { merge: true },
    );
}

export async function listConversations(workspaceId: string, limit = 50) {
  const snap = await collection<Conversation>("conversations")
    .where("workspaceId", "==", workspaceId)
    .limit(limit)
    .get();
  return snap.docs.map((doc) => doc.data());
}

export async function getConversation(workspaceId: string, leadId: string) {
  const snap = await collection<Conversation>("conversations")
    .doc(`${workspaceId}-${leadId}`)
    .get();
  return snap.exists ? snap.data() || null : null;
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

export async function hasDailyQuotaRemaining(
  workspaceId: string,
  kind: "invites" | "messages",
  limit: number,
) {
  const today = new Date().toISOString().slice(0, 10);
  const snap = await getDb().collection("usageDays").doc(`${workspaceId}-${today}`).get();
  const current = Number(snap.data()?.[kind] || 0);
  return current < limit;
}

// Reserves one unit of today's quota. Call this only after the LinkedIn send
// succeeds - failed Unipile responses must not burn the daily budget, or the
// rest of the day is stuck on invite-limit / message-limit with zero outreach.
export async function consumeDailyQuota(
  workspaceId: string,
  kind: "invites" | "messages",
  limit: number,
) {
  const today = new Date().toISOString().slice(0, 10);
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

// Persistent per-account invite drip: connection requests are the signal
// LinkedIn rate-checks hardest, so consecutive invites from one account must
// be spaced out across ticks (a per-tick budget alone multiplies with the
// tick cadence). Claimed transactionally before the send; returns null when
// the slot is claimed, or the ISO time the next invite is allowed. A claimed
// slot that ends up not sending under-sends rather than over-sends, which is
// the safe direction.
export const INVITE_SPACING_MINUTES = 10;

export async function claimInviteSendSlot(workspaceId: string, linkedInAccountId: string) {
  const ref = getDb().collection("inviteSpacing").doc(linkedInAccountId);
  const intervalMs = INVITE_SPACING_MINUTES * 60 * 1000;

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
) {
  const ref = getDb().collection("automationLocks").doc(lockId);
  const now = Date.now();

  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const lockedAt = snap.exists ? Number(snap.data()?.lockedAt || 0) : 0;
    const lastStartedAt = snap.exists ? Number(snap.data()?.lastStartedAt || 0) : 0;

    if (lockedAt && now - lockedAt < ttlMs) return false;
    if (minimumStartIntervalMs && lastStartedAt && now - lastStartedAt < minimumStartIntervalMs) {
      return false;
    }

    transaction.set(ref, { lockedAt: now, lastStartedAt: now, updatedAt: nowIso() });
    return true;
  });
}

export async function releaseTickLock(lockId: string) {
  await getDb()
    .collection("automationLocks")
    .doc(lockId)
    .set({ lockedAt: 0, updatedAt: nowIso() }, { merge: true });
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
