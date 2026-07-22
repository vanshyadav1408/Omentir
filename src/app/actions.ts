"use server";

import { auth, currentUser } from "@/lib/server/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buildCampaignSteps } from "@/lib/server/campaign-sequence";
import {
  createAgent,
  createAgentApiKey,
  createCampaign,
  createOrGetGroup,
  deleteAgent,
  deleteGroup,
  disconnectLinkedInAccount,
  enrollGroupInCampaign,
  ensureWorkspace,
  getAgent,
  getLinkedInAccount,
  getLinkedInAccountByAccountId,
  getLinkedInAccountForWorkspace,
  getProductProfile,
  listLeads,
  pauseAgent,
  resumeAgent,
  revokeAgentApiKey,
  setAverageTicketSize,
  updateAgent,
  updateWorkspaceOnboarding,
  updateWorkspaceNotificationEmail,
  updateWorkspaceSettings,
  upsertProductProfile,
  upsertLead,
} from "@/lib/server/data";
import { parseLinkedInLeadCsv } from "@/lib/linkedin-csv";
import { normalizeLinkedInProfileUrl } from "@/lib/server/firebase";
import { sendContactFormEmail, sendNewSignupNotification } from "@/lib/server/email";
import { executeScheduledActionNow } from "@/lib/server/automation";
import { analyzeWebsiteOrSearch, draftAgentSetupWithGemini } from "@/lib/server/gemini";
import { requireActiveSubscription } from "@/lib/server/subscription";
import { deleteLinkedInAccount, sendLinkedInChatMessage } from "@/lib/server/unipile";
import type { CampaignStep } from "@/lib/server/types";
import { isLocalMode } from "@/lib/runtime-mode";

async function requireWorkspace() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const workspace = await ensureWorkspace(userId);
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress || "";
  await updateWorkspaceNotificationEmail(workspace.id, email);
  return { ...workspace, notificationEmail: email || workspace.notificationEmail };
}

function splitList(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listFromForm(
  formData: FormData,
  name: string,
  currentValue: string[] | undefined,
) {
  if (!formData.has(name)) return currentValue || [];
  return formData.getAll(name).flatMap((value) => splitList(value));
}

function stringFromForm(
  formData: FormData,
  name: string,
  currentValue: string | undefined,
) {
  return formData.has(name) ? String(formData.get(name) || "").trim() : currentValue || "";
}

// Parses a non-negative money amount from the form, ignoring currency symbols
// and separators. Falls back to the current value when the field is absent or
// empty so an unrelated save never clears a previously set amount.
function numberFromForm(
  formData: FormData,
  name: string,
  currentValue: number | undefined,
) {
  if (!formData.has(name)) return currentValue;
  const raw = String(formData.get(name) || "").replace(/[^0-9.]/g, "");
  if (!raw) return currentValue;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : currentValue;
}

function revalidateWorkspaceDataPages() {
  revalidatePath("/dashboard");
  revalidatePath("/agents");
  revalidatePath("/campaigns");
}

async function assertCampaignCanRun(
  workspaceId: string,
  groupId: string,
  steps: CampaignStep[],
  options: { requireLeads?: boolean; linkedInAccountId?: string } = {},
) {
  const requireLeads = options.requireLeads ?? true;
  const [account, leads, profile] = await Promise.all([
    getLinkedInAccountForWorkspace(workspaceId, options.linkedInAccountId),
    groupId ? listLeads(workspaceId, groupId) : Promise.resolve([]),
    getProductProfile(workspaceId),
  ]);

  if (!account) throw new Error("Connect LinkedIn before starting a campaign.");
  if (!groupId) throw new Error("Choose a lead group before starting a campaign.");
  if (requireLeads && !leads.length) throw new Error("Add leads before starting a campaign.");

  const usesAiMessages = steps.some((step) => step.type === "message" && !step.messageTemplate.trim());
  if (usesAiMessages && !(profile?.description || profile?.painPointsText)) {
    throw new Error("Add your product profile before starting AI-message campaigns.");
  }
}

async function requireSelectedLinkedInAccount(workspaceId: string, formData: FormData) {
  const linkedInAccountId = String(formData.get("linkedInAccountId") || "").trim();
  const account = await getLinkedInAccountForWorkspace(workspaceId, linkedInAccountId);
  if (!account) throw new Error("Choose a connected LinkedIn account.");
  return account;
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

function decodeHeaderValue(value: string) {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Proxies often hand over IPv4 addresses in IPv6-mapped ("::ffff:1.2.3.4")
// or "ip:port" form; normalize so public/private detection and the geo
// lookup see a plain address.
function normalizeIpAddress(value: string | null | undefined) {
  let ip = (value || "").trim();
  if (!ip) return "";
  ip = ip.replace(/^::ffff:/i, "");
  const ipv4WithPort = ip.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (ipv4WithPort) ip = ipv4WithPort[1];
  return ip;
}

function isPublicIpAddress(value: string) {
  const ip = value.trim();
  if (!ip || ip === "Unknown") return false;

  const ipv4Parts = ip.split(".").map((part) => Number(part));
  if (ipv4Parts.length === 4 && ipv4Parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    const [first, second] = ipv4Parts;
    return !(
      first === 10 ||
      first === 127 ||
      first === 0 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 169 && second === 254)
    );
  }

  return ip.includes(":") && !ip.startsWith("::1") && !ip.toLowerCase().startsWith("fe80:");
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function lookupIpLocation(ipAddress: string) {
  if (!isPublicIpAddress(ipAddress)) return "";

  const ipwho = await fetchJsonWithTimeout<{
    success?: boolean;
    country?: string;
    region?: string;
    city?: string;
  }>(`https://ipwho.is/${encodeURIComponent(ipAddress)}?fields=success,country,region,city`, 2500);

  if (ipwho && ipwho.success !== false) {
    const location = [ipwho.city, ipwho.region, ipwho.country].filter(Boolean).join(", ");
    if (location) return location;
  }

  const geojs = await fetchJsonWithTimeout<{
    city?: string;
    region?: string;
    country?: string;
  }>(`https://get.geojs.io/v1/ip/geo/${encodeURIComponent(ipAddress)}.json`, 2500);

  if (geojs) {
    return [geojs.city, geojs.region, geojs.country].filter(Boolean).join(", ");
  }

  return "";
}

function requestHeaderLocation(headersList: Headers) {
  const city = decodeHeaderValue(headersList.get("x-vercel-ip-city") || "");
  const region = decodeHeaderValue(headersList.get("x-vercel-ip-country-region") || "");
  const country = decodeHeaderValue(headersList.get("x-vercel-ip-country") || "");
  return [city, region, country].filter(Boolean).join(", ");
}

async function requestLocation(headersList: Headers, ipAddress: string) {
  const resolvedLocation = await lookupIpLocation(ipAddress);
  if (resolvedLocation) return resolvedLocation;

  const headerLocation = requestHeaderLocation(headersList);
  return headerLocation ? `${headerLocation} (edge header fallback)` : "Unknown";
}

function requestIpAddress(headersList: Headers) {
  // Gather every candidate, then prefer the first *public* address. This
  // skips private/loopback hops that proxies prepend to X-Forwarded-For and
  // ignores spoofed client-supplied entries that geolocate nowhere.
  const candidates = [
    headersList.get("cf-connecting-ip"),
    headersList.get("true-client-ip"),
    headersList.get("x-real-ip"),
    firstHeaderValue(headersList.get("x-vercel-forwarded-for")),
    ...(headersList.get("x-forwarded-for")?.split(",") ?? []),
    headersList.get("x-client-ip"),
  ]
    .map(normalizeIpAddress)
    .filter(Boolean);

  return candidates.find(isPublicIpAddress) || candidates[0] || "Unknown";
}

function parseDeviceType(userAgent: string) {
  if (/bot|crawler|spider|crawling/i.test(userAgent)) return "Bot";
  if (/ipad|tablet|kindle|silk/i.test(userAgent)) return "Tablet";
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return "Mobile";
  return userAgent ? "Desktop" : "Unknown";
}

function parseOs(userAgent: string) {
  if (/windows nt/i.test(userAgent)) return "Windows";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/mac os x|macintosh/i.test(userAgent)) return "macOS";
  if (/cros/i.test(userAgent)) return "ChromeOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return userAgent ? "Unknown" : "Unknown";
}

function parseBrowser(userAgent: string) {
  if (/edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/firefox\//i.test(userAgent)) return "Firefox";
  if (/chrome\//i.test(userAgent) || /crios\//i.test(userAgent)) return "Chrome";
  if (/safari\//i.test(userAgent)) return "Safari";
  return userAgent ? "Unknown" : "Unknown";
}

function formatIstTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "long",
  }).format(date);
}

export async function analyzeWebsiteAction(formData: FormData) {
  const workspace = await requireWorkspace();
  const websiteUrl = String(formData.get("websiteUrl") || "").trim();

  if (!websiteUrl) throw new Error("Website URL is required.");

  try {
    const analysis = await analyzeWebsiteOrSearch(websiteUrl);
    const existing = await getProductProfile(workspace.id);
    await upsertProductProfile(workspace.id, {
      websiteUrl,
      description: analysis.productOverview,
      companyName: analysis.companyName,
      industry: analysis.industry,
      companySize: analysis.companySize,
      painPointsText: analysis.painPointsText,
      keyFeatures: analysis.keyFeatures,
      socialProof: analysis.socialProof,
      linkedInCompanyPage: existing?.linkedInCompanyPage || "",
      targetBuyers: analysis.targetBuyers,
      buyerTitles: analysis.buyerTitles,
      industries: analysis.industries,
      companySizes: analysis.companySizes,
      painPoints: analysis.painPoints,
      keywords: analysis.keywords,
      preferredLocations: analysis.preferredLocations,
    });
  } catch {
    // Keep the previous profile when re-analysis fails.
  }

  revalidatePath("/my-product");
  revalidatePath("/dashboard");
}

export async function completeOnboardingQuestionsAction(formData: FormData) {
  const workspace = await requireWorkspace();
  const websiteUrl = String(formData.get("websiteUrl") || "").trim();
  const hadCompletedOnboarding = Boolean(workspace.onboarding);
  const onboarding = {
    source: String(formData.get("source") || "").trim(),
    role: String(formData.get("role") || "").trim(),
    companySize: String(formData.get("companySize") || "").trim(),
    goal: String(formData.get("goal") || "").trim(),
  };

  await updateWorkspaceOnboarding(workspace.id, onboarding);

  if (!hadCompletedOnboarding && !isLocalMode()) {
    const [headersList, user] = await Promise.all([headers(), currentUser()]);
    const userAgent = headersList.get("user-agent") || "";
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    const email =
      user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress || "";
    const ipAddress = requestIpAddress(headersList);
    const location = await requestLocation(headersList, ipAddress);

    try {
      await sendNewSignupNotification({
        userId: workspace.ownerId,
        name: name || "Unknown",
        email: email || workspace.notificationEmail || "Unknown",
        websiteUrl,
        location,
        ipAddress,
        deviceType: parseDeviceType(userAgent),
        os: parseOs(userAgent),
        browser: parseBrowser(userAgent),
        answers: onboarding,
        signedUpAtIst: formatIstTime(),
      });
    } catch (error) {
      console.error("Failed to send new signup notification", error);
    }
  }

  revalidatePath("/onboarding");

  if (websiteUrl) {
    await analyzeWebsiteAction(formData);
    redirect("/onboarding");
  }

  redirect("/onboarding");
}

export async function completeSelfHostedOnboardingAction() {
  if (!isLocalMode()) throw new Error("Self-hosted onboarding is unavailable in hosted mode.");
  const workspace = await requireWorkspace();
  await updateWorkspaceOnboarding(workspace.id, {
    source: "Self-hosted",
    role: "",
    companySize: "",
    goal: "",
  });
  revalidatePath("/onboarding");
  return { ok: true };
}

export async function saveProductProfileAction(formData: FormData) {
  const workspace = await requireWorkspace();
  const currentProfile = await getProductProfile(workspace.id);

  await upsertProductProfile(workspace.id, {
    websiteUrl: stringFromForm(formData, "websiteUrl", currentProfile?.websiteUrl),
    description: stringFromForm(formData, "description", currentProfile?.description),
    companyName: stringFromForm(formData, "companyName", currentProfile?.companyName),
    industry: stringFromForm(formData, "industry", currentProfile?.industry),
    companySize: stringFromForm(formData, "companySize", currentProfile?.companySize),
    painPointsText: stringFromForm(
      formData,
      "painPointsText",
      currentProfile?.painPointsText,
    ),
    keyFeatures: listFromForm(formData, "keyFeatures", currentProfile?.keyFeatures),
    socialProof: listFromForm(formData, "socialProof", currentProfile?.socialProof),
    linkedInCompanyPage: stringFromForm(
      formData,
      "linkedInCompanyPage",
      currentProfile?.linkedInCompanyPage,
    ),
    targetBuyers: listFromForm(formData, "targetBuyers", currentProfile?.targetBuyers),
    buyerTitles: listFromForm(formData, "buyerTitles", currentProfile?.buyerTitles),
    industries: listFromForm(formData, "industries", currentProfile?.industries),
    companySizes: listFromForm(formData, "companySizes", currentProfile?.companySizes),
    painPoints: listFromForm(formData, "painPoints", currentProfile?.painPoints),
    keywords: listFromForm(formData, "keywords", currentProfile?.keywords),
    preferredLocations: listFromForm(
      formData,
      "preferredLocations",
      currentProfile?.preferredLocations,
    ),
    averageTicketSize: numberFromForm(
      formData,
      "averageTicketSize",
      currentProfile?.averageTicketSize,
    ),
  });

  revalidatePath("/my-product");
  revalidatePath("/dashboard");
}

// Used by the dashboard "Set deal size" modal to set the average ticket size in
// isolation without touching the rest of the product profile.
export async function setAverageTicketSizeAction(formData: FormData) {
  const workspace = await requireWorkspace();
  const value = numberFromForm(formData, "averageTicketSize", undefined);
  if (value === undefined) return;
  await setAverageTicketSize(workspace.id, value);
  revalidatePath("/dashboard");
  revalidatePath("/my-product");
}

export async function continueWithProductProfileAction(formData: FormData) {
  await saveProductProfileAction(formData);
  redirect("/onboarding");
}

export async function saveSettingsAction(formData: FormData) {
  const workspace = await requireWorkspace();
  const schema = z.object({
    dailyInviteLimit: z.coerce.number().int().min(1).max(100),
    dailyMessageLimit: z.coerce.number().int().min(1).max(200),
    firstMessageDelayMinutes: z.coerce.number().int().min(5).max(10080),
    aiFollowUpDelayMinutes: z.coerce.number().int().min(0).max(10080),
    aiFollowUpEnabled: z.boolean(),
  });

  const parsed = schema.parse({
    dailyInviteLimit: formData.get("dailyInviteLimit"),
    dailyMessageLimit: formData.get("dailyMessageLimit"),
    firstMessageDelayMinutes: formData.get("firstMessageDelayMinutes"),
    aiFollowUpDelayMinutes: formData.get("aiFollowUpDelayMinutes"),
    aiFollowUpEnabled: formData.get("aiFollowUpEnabled") === "on",
  });

  await updateWorkspaceSettings(workspace.id, parsed);
  revalidatePath("/settings");
}

export async function runScheduledActionNowAction(formData: FormData) {
  const workspace = await requireWorkspace();
  requireActiveSubscription(workspace);
  const enrollmentId = String(formData.get("enrollmentId") || "").trim();
  if (!enrollmentId) throw new Error("Scheduled action id is required.");

  const result = await executeScheduledActionNow(workspace.id, enrollmentId);
  revalidatePath("/actions");
  revalidatePath("/agents");
  return { result };
}

export async function createAgentApiKeyAction(formData: FormData) {
  const workspace = await requireWorkspace();
  requireActiveSubscription(workspace);
  const label = String(formData.get("label") || "AI agent").trim();
  const { token } = await createAgentApiKey(workspace.id, label);
  revalidatePath("/api-keys");
  return token;
}

export async function revokeAgentApiKeyAction(formData: FormData) {
  const workspace = await requireWorkspace();
  const keyId = String(formData.get("keyId") || "").trim();
  if (!keyId) throw new Error("Agent token id is required.");
  await revokeAgentApiKey(workspace.id, keyId);
  revalidatePath("/api-keys");
}

export async function disconnectLinkedInAccountAction(formData?: FormData) {
  const workspace = await requireWorkspace();
  const linkedInAccountId = String(formData?.get("linkedInAccountId") || "").trim();
  const account = await getLinkedInAccountForWorkspace(
    workspace.id,
    linkedInAccountId || undefined,
  );
  if (!account) return;

  // Remove the session from Unipile first so a local "disconnected" record
  // never hides a still-live LinkedIn connection.
  await deleteLinkedInAccount(account.accountId);
  await disconnectLinkedInAccount(workspace.id, account.id);
  revalidatePath("/settings");
  revalidatePath("/connect");
  revalidatePath("/dashboard");
}

async function createAgentFromForm(
  workspace: Awaited<ReturnType<typeof requireWorkspace>>,
  formData: FormData,
) {
  const groupName = String(formData.get("groupName") || "").trim();
  const rawMode = String(formData.get("mode") || "");

  if (!groupName) throw new Error("Group name is required.");
  const account = await requireSelectedLinkedInAccount(workspace.id, formData);

  return createAgent(workspace.id, {
    name: String(formData.get("name") || groupName).trim(),
    mode: rawMode === "prompt" || rawMode === "filters" || rawMode === "outreach" ? rawMode : "signals",
    prompt: String(formData.get("prompt") || "").trim(),
    filters: {
      titles: listFromForm(formData, "titles", []),
      industries: listFromForm(formData, "industries", []),
      locations: listFromForm(formData, "locations", []),
      keywords: listFromForm(formData, "keywords", []),
    },
    signalSources: {
      competitorUrls: listFromForm(formData, "competitorUrls", []),
      founderUrls: listFromForm(formData, "founderUrls", []),
      keywords: listFromForm(formData, "signalKeywords", []),
    },
    linkedInAccountId: account.id,
    targetGroupName: groupName,
  });
}

export async function createAgentForSetupAction(formData: FormData) {
  const workspace = await requireWorkspace();
  requireActiveSubscription(workspace);
  const agent = await createAgentFromForm(workspace, formData);

  revalidateWorkspaceDataPages();
  return { agentId: agent.id, groupId: agent.targetGroupId };
}

export async function importLinkedInCsvLeadsAction(formData: FormData) {
  const workspace = await requireWorkspace();
  requireActiveSubscription(workspace);
  const agentId = String(formData.get("agentId") || "").trim();
  const groupId = String(formData.get("groupId") || "").trim();
  const agent = agentId ? await getAgent(workspace.id, agentId) : null;
  if (!agent || agent.targetGroupId !== groupId || agent.mode !== "outreach") {
    throw new Error("Outreach agent not found.");
  }
  const leads = parseLinkedInLeadCsv(String(formData.get("csvContents") || ""));
  const existingLeads = await listLeads(workspace.id, undefined, 5000);
  const existingByUrl = new Map(
    existingLeads.map((lead) => [normalizeLinkedInProfileUrl(lead.linkedInUrl), lead]),
  );
  for (const lead of leads) {
    const existing = existingByUrl.get(normalizeLinkedInProfileUrl(lead.linkedInUrl));
    await upsertLead(workspace.id, groupId, {
      ...lead,
      // A person may already belong to another agent. Preserve that source so
      // pausing this campaign never changes the ownership of existing outreach.
      sourceAgentId: existing?.sourceAgentId || agent.id,
      fitScore: 100,
      scoreReasons: ["Imported by the user from CSV"],
      summary: "Imported from CSV for outreach.",
      leadReason: "Imported by the user from CSV",
      outreachStatus: "new",
    });
  }
  revalidatePath("/leads");
  return { imported: leads.length };
}

async function updateAgentFromForm(
  workspace: Awaited<ReturnType<typeof requireWorkspace>>,
  formData: FormData,
) {
  const agentId = String(formData.get("agentId") || "").trim();
  const groupName = String(formData.get("groupName") || "").trim();
  const rawMode = String(formData.get("mode") || "");

  if (!agentId) throw new Error("Agent id is required.");
  if (!groupName) throw new Error("Group name is required.");
  const account = await requireSelectedLinkedInAccount(workspace.id, formData);

  return updateAgent(workspace.id, agentId, {
    name: String(formData.get("name") || groupName).trim(),
    mode: rawMode === "prompt" || rawMode === "filters" || rawMode === "outreach" ? rawMode : "signals",
    prompt: String(formData.get("prompt") || "").trim(),
    filters: {
      titles: listFromForm(formData, "titles", []),
      industries: listFromForm(formData, "industries", []),
      locations: listFromForm(formData, "locations", []),
      keywords: listFromForm(formData, "keywords", []),
    },
    signalSources: {
      competitorUrls: listFromForm(formData, "competitorUrls", []),
      founderUrls: listFromForm(formData, "founderUrls", []),
      keywords: listFromForm(formData, "signalKeywords", []),
    },
    linkedInAccountId: account.id,
    targetGroupName: groupName,
  });
}

export async function updateAgentForSetupAction(formData: FormData) {
  const workspace = await requireWorkspace();
  requireActiveSubscription(workspace);
  const agent = await updateAgentFromForm(workspace, formData);

  revalidateWorkspaceDataPages();
  revalidatePath("/leads");
  return { agentId: agent.id, groupId: agent.targetGroupId };
}

export async function updateAgentAction(formData: FormData) {
  const workspace = await requireWorkspace();
  requireActiveSubscription(workspace);
  await updateAgentFromForm(workspace, formData);

  revalidateWorkspaceDataPages();
  revalidatePath("/leads");
  redirect("/agents");
}

export async function draftAgentSetupAction() {
  const workspace = await requireWorkspace();
  const profile = await getProductProfile(workspace.id);

  return draftAgentSetupWithGemini(profile);
}

export async function getSetupProductProfileAction() {
  const workspace = await requireWorkspace();
  const profile = await getProductProfile(workspace.id);

  return profile
    ? {
        companyName: profile.companyName || "",
        description: profile.description || "",
        industry: profile.industry || "",
        companySize: profile.companySize || "",
        painPointsText: profile.painPointsText || "",
        websiteUrl: profile.websiteUrl || "",
      }
    : null;
}

export async function createAgentAndDiscoverLeadsAction(formData: FormData) {
  const workspace = await requireWorkspace();
  requireActiveSubscription(workspace);
  const groupName = String(formData.get("groupName") || "").trim();
  const preparedAgentId = String(formData.get("preparedAgentId") || "").trim();
  const rawMode = String(formData.get("mode") || "");

  if (!groupName) throw new Error("Group name is required.");

  const account = await requireSelectedLinkedInAccount(workspace.id, formData);

  const agentInput = {
    name: String(formData.get("name") || groupName).trim(),
    mode: rawMode === "prompt" || rawMode === "filters" ? rawMode : "signals",
    prompt: String(formData.get("prompt") || "").trim(),
    filters: {
      titles: listFromForm(formData, "titles", []),
      industries: listFromForm(formData, "industries", []),
      locations: listFromForm(formData, "locations", []),
      keywords: listFromForm(formData, "keywords", []),
    },
    signalSources: {
      competitorUrls: listFromForm(formData, "competitorUrls", []),
      founderUrls: listFromForm(formData, "founderUrls", []),
      keywords: listFromForm(formData, "signalKeywords", []),
    },
    linkedInAccountId: account.id,
    targetGroupName: groupName,
  } as const;
  const agent = preparedAgentId
    ? await updateAgent(workspace.id, preparedAgentId, agentInput)
    : await createAgent(workspace.id, agentInput);

  // Discovery can take several minutes. Keeping it inside this Server Action
  // makes proxies and tunnels time out before Next.js can return its response.
  // createAgent/updateAgent already schedule the agent for the next automation
  // tick, so setup only persists the configuration and returns quickly.
  revalidateWorkspaceDataPages();
  return {
    agentId: agent.id,
    groupId: agent.targetGroupId,
    groupName: agent.targetGroupName,
    leadsDiscovered: 0,
    leads: [],
    candidates: 0,
    signalsObserved: 0,
  };
}

export async function pauseAgentAction(formData: FormData) {
  const workspace = await requireWorkspace();
  const agentId = String(formData.get("agentId") || "").trim();

  if (!agentId) throw new Error("Agent id is required.");

  await pauseAgent(workspace.id, agentId);
  revalidateWorkspaceDataPages();
}

export async function resumeAgentAction(formData: FormData) {
  const workspace = await requireWorkspace();
  requireActiveSubscription(workspace);
  const agentId = String(formData.get("agentId") || "").trim();

  if (!agentId) throw new Error("Agent id is required.");

  await resumeAgent(workspace.id, agentId);
  revalidateWorkspaceDataPages();
}

export async function deleteAgentAction(formData: FormData) {
  const workspace = await requireWorkspace();
  const agentId = String(formData.get("agentId") || "").trim();

  if (!agentId) throw new Error("Agent id is required.");

  await deleteAgent(workspace.id, agentId);
  revalidateWorkspaceDataPages();
}

export async function deleteGroupAction(formData: FormData) {
  const workspace = await requireWorkspace();
  const groupId = String(formData.get("groupId") || "").trim();

  if (!groupId) throw new Error("Lead group id is required.");

  await deleteGroup(workspace.id, groupId);
  revalidatePath("/leads");
  revalidateWorkspaceDataPages();
}

export async function createCampaignAction(formData: FormData) {
  const workspace = await requireWorkspace();
  requireActiveSubscription(workspace);
  const steps = buildCampaignSteps(formData, workspace.settings.firstMessageDelayMinutes);

  const rawGroupId = String(formData.get("groupId") || "").trim();
  const newGroupName = String(formData.get("newGroupName") || "").trim();
  if (rawGroupId === "__new__" && !newGroupName) {
    throw new Error("New lead group name is required.");
  }
  const groupId =
    rawGroupId === "__new__"
      ? (await createOrGetGroup(workspace.id, newGroupName, "Created during campaign setup")).id
      : rawGroupId;
  const status = formData.get("status") === "draft" ? "draft" : "active";
  const account = await requireSelectedLinkedInAccount(workspace.id, formData);

  if (status === "active") {
    await assertCampaignCanRun(workspace.id, groupId, steps, {
      requireLeads: formData.get("allowEmptyLeadGroup") !== "on",
      linkedInAccountId: account.id,
    });
  }

  const messageTone = String(formData.get("messageTone") || "").trim();
  const campaign = await createCampaign(workspace.id, {
    name: String(formData.get("name") || "LinkedIn campaign").trim(),
    groupId,
    linkedInAccountId: account.id,
    status,
    steps,
    replyHandling: formData.get("replyHandling") === "handoff" ? "handoff" : "ai",
    // Firestore rejects undefined properties - only set intent when provided.
    ...(formData.get("campaignGoal")
      ? { campaignGoal: formData.get("campaignGoal") === "demo" ? ("demo" as const) : ("warm" as const) }
      : {}),
    ...(messageTone ? { messageTone } : {}),
  });

  // Only enroll leads for campaigns that are actually live. Draft campaigns are
  // skipped by the cron, so enrolling them would create perpetually-due, never-
  // advanced enrollments. When a draft is later activated, syncNewEnrollments
  // enrolls its leads on the next tick.
  if (campaign.groupId && campaign.status === "active") {
    await enrollGroupInCampaign(workspace.id, campaign);
  }

  revalidateWorkspaceDataPages();
}

export async function sendLinkedInChatMessageAction(formData: FormData) {
  const workspace = await requireWorkspace();
  requireActiveSubscription(workspace);
  const chatId = String(formData.get("chatId") || "").trim();
  const body = String(formData.get("body") || "").trim();
  // Reply from the account that owns the chat - with multiple connected
  // accounts, defaulting to the first would send from the wrong identity.
  const requestedAccountId = String(formData.get("accountId") || "").trim();
  const requestedAccount = requestedAccountId
    ? await getLinkedInAccountByAccountId(requestedAccountId)
    : null;
  const linkedInAccount =
    requestedAccount?.workspaceId === workspace.id
      ? requestedAccount
      : await getLinkedInAccount(workspace.id);

  const attachments = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!linkedInAccount) throw new Error("Connect LinkedIn before sending messages.");
  if (!chatId) throw new Error("Chat id is required.");
  if (!body && !attachments.length) throw new Error("Message cannot be empty.");
  const oversized = attachments.find((file) => file.size > 15 * 1024 * 1024);
  if (oversized) throw new Error(`"${oversized.name}" is too large - attachments must be under 15MB.`);

  await sendLinkedInChatMessage({ chatId, accountId: linkedInAccount.accountId, body, attachments });
  revalidatePath("/messages");
}

export async function submitContactFormAction(formData: FormData) {
  const workspace = await requireWorkspace();
  const user = await currentUser();
  const title = String(formData.get("title") || "").trim();
  const query = String(formData.get("query") || "").trim();
  const contactEmail =
    String(formData.get("contactEmail") || "").trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses[0]?.emailAddress ||
    workspace.notificationEmail ||
    "";

  if (!title) throw new Error("Title is required.");
  if (!query) throw new Error("Message is required.");
  if (!contactEmail) {
    throw new Error("No email on your account. Add one in Settings.");
  }

  await sendContactFormEmail({
    title,
    contactEmail,
    roleTitle: "",
    query,
    workspaceId: workspace.id,
  });

  return { ok: true as const };
}
