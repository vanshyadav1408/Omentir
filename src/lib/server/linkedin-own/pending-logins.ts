import "server-only";

import { randomBytes } from "node:crypto";
import { getDb, nowIso } from "../firebase";
import type { ChallengeForm, VerificationMethod } from "./login";
import { decryptSessionSecret, encryptSessionSecret } from "./session-crypto";

// linkedinPendingLogins/{id}: a LinkedIn sign-in waiting for the person to
// enter a verification code or approve it in the LinkedIn app. Holds the
// pre-login cookie jar and LinkedIn's check form, sealed with
// LINKEDIN_SESSION_KEY. Never the password. One per user, ten minutes.

const COLLECTION = "linkedinPendingLogins";
const TTL_MS = 10 * 60_000;
export const MAX_CODE_ATTEMPTS = 5;

type PendingLoginDocument = {
  userId: string;
  workspaceId: string;
  sealed: string;
  userAgent: string;
  proxySessionId: string;
  proxyPort?: number;
  proxyHost?: string;
  proxyCountry?: string;
  timezone?: string;
  replaceAccountId?: string;
  method: VerificationMethod;
  hint?: string;
  attempts: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PendingLogin = Omit<PendingLoginDocument, "sealed"> & {
  id: string;
  cookies: Record<string, string>;
  // Missing for browser sign-ins: the check lives in the open browser
  // (browser-login.ts), not in a stored form.
  challenge?: ChallengeForm;
};

function pendingLogins() {
  return getDb().collection(COLLECTION) as FirebaseFirestore.CollectionReference<PendingLoginDocument>;
}

function seal(cookies: Record<string, string>, challenge?: ChallengeForm) {
  return encryptSessionSecret(JSON.stringify({ cookies, ...(challenge ? { challenge } : {}) }));
}

export async function savePendingLogin(input: {
  userId: string;
  workspaceId: string;
  cookies?: Record<string, string>;
  challenge?: ChallengeForm;
  userAgent: string;
  proxySessionId: string;
  proxyPort?: number;
  proxyHost?: string;
  proxyCountry?: string;
  timezone?: string;
  replaceAccountId?: string;
  method: VerificationMethod;
  hint?: string;
}) {
  // A new sign-in replaces any earlier one this person left unfinished.
  const earlier = await pendingLogins().where("userId", "==", input.userId).get();
  await Promise.all(earlier.docs.map((doc) => doc.ref.delete()));

  const id = randomBytes(24).toString("base64url");
  const timestamp = nowIso();
  await pendingLogins().doc(id).set({
    userId: input.userId,
    workspaceId: input.workspaceId,
    sealed: seal(input.cookies || {}, input.challenge),
    userAgent: input.userAgent,
    proxySessionId: input.proxySessionId,
    ...(input.proxyPort ? { proxyPort: input.proxyPort } : {}),
    ...(input.proxyPort && input.proxyHost ? { proxyHost: input.proxyHost } : {}),
    ...(input.proxyCountry ? { proxyCountry: input.proxyCountry } : {}),
    ...(input.timezone ? { timezone: input.timezone } : {}),
    ...(input.replaceAccountId ? { replaceAccountId: input.replaceAccountId } : {}),
    method: input.method,
    ...(input.hint ? { hint: input.hint } : {}),
    attempts: 0,
    expiresAt: new Date(Date.now() + TTL_MS).toISOString(),
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return id;
}

// Only the person who started the sign-in can continue it, and only in time.
export async function loadPendingLogin(id: string, userId: string): Promise<PendingLogin | null> {
  const ref = pendingLogins().doc(id);
  const stored = (await ref.get()).data();
  if (!stored || stored.userId !== userId) return null;
  if (Date.parse(stored.expiresAt) <= Date.now()) {
    await ref.delete().catch(() => undefined);
    return null;
  }
  const { sealed, ...rest } = stored;
  const { cookies, challenge } = JSON.parse(decryptSessionSecret(sealed)) as {
    cookies: Record<string, string>;
    challenge?: ChallengeForm;
  };
  return { ...rest, id, cookies: cookies || {}, ...(challenge ? { challenge } : {}) };
}

export async function updatePendingLogin(id: string, input: {
  cookies?: Record<string, string>;
  challenge?: ChallengeForm;
  method: VerificationMethod;
  hint?: string;
  attempts: number;
}) {
  await pendingLogins().doc(id).set({
    // Only reseal when the caller carries a new jar or check form
    // (stored-form sign-ins). Browser sign-ins update method/attempts
    // only; their check lives in the open browser, not in this document.
    ...(input.cookies !== undefined || input.challenge !== undefined ? { sealed: seal(input.cookies || {}, input.challenge) } : {}),
    method: input.method,
    ...(input.hint ? { hint: input.hint } : {}),
    attempts: input.attempts,
    updatedAt: nowIso(),
  }, { merge: true });
}

export async function deletePendingLogin(id: string) {
  await pendingLogins().doc(id).delete();
}
