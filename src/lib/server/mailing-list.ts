import "server-only";

import { randomBytes } from "node:crypto";
import { getDb, nowIso } from "./firebase";
import { getAppBaseUrl } from "./runtime-config";
import { hasActiveSubscription } from "./subscription";
import type { Workspace } from "./types";

export type MailingListPlan = "none" | "solo" | "startup" | "enterprise";

export type MailingListEntry = {
  /** Clerk user id; also the Firestore doc id. */
  userId: string;
  email: string;
  name?: string;
  plan: MailingListPlan;
  subscribed: boolean;
  /** Secret used in per-recipient unsubscribe links. */
  unsubscribeToken: string;
  createdAt: string;
  updatedAt: string;
  unsubscribedAt?: string;
};

function mailingList() {
  return getDb().collection("mailingList") as FirebaseFirestore.CollectionReference<MailingListEntry>;
}

export function mailingListPlanFromWorkspace(
  workspace: Pick<Workspace, "billing"> | null | undefined,
): MailingListPlan {
  if (!workspace?.billing || !hasActiveSubscription(workspace)) return "none";
  return workspace.billing.plan;
}

export function unsubscribeUrlFor(entry: Pick<MailingListEntry, "unsubscribeToken">) {
  return `${getAppBaseUrl()}/api/mailing-list/unsubscribe?token=${entry.unsubscribeToken}`;
}

/**
 * Adds (or refreshes) a person on the mailing list. Safe to call on every
 * login: it never flips an unsubscribed person back to subscribed - that only
 * happens by hand at their explicit request.
 */
export async function upsertMailingListEntry(input: {
  userId: string;
  email: string;
  name?: string;
  plan?: MailingListPlan;
}) {
  const ref = mailingList().doc(input.userId);

  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const now = nowIso();

    if (!snap.exists) {
      const entry: MailingListEntry = {
        userId: input.userId,
        email: input.email,
        ...(input.name ? { name: input.name } : {}),
        plan: input.plan ?? "none",
        subscribed: true,
        unsubscribeToken: randomBytes(24).toString("hex"),
        createdAt: now,
        updatedAt: now,
      };
      transaction.set(ref, entry);
      return entry;
    }

    const existing = snap.data() as MailingListEntry;
    const patch = {
      email: input.email,
      ...(input.name ? { name: input.name } : {}),
      ...(input.plan ? { plan: input.plan } : {}),
      updatedAt: now,
    };
    transaction.update(ref, patch);
    return { ...existing, ...patch };
  });
}

/** Current plan for a user, read without creating a workspace as a side effect. */
export async function currentMailingListPlan(userId: string): Promise<MailingListPlan> {
  const snap = await getDb().collection("workspaces").doc(userId).get();
  return mailingListPlanFromWorkspace(snap.exists ? (snap.data() as Workspace) : null);
}

/** Stamps the current plan onto an existing entry; no-op if not on the list. */
export async function syncMailingListPlan(userId: string, plan: MailingListPlan) {
  const ref = mailingList().doc(userId);
  const snap = await ref.get();
  if (!snap.exists) return;
  await ref.update({ plan, updatedAt: nowIso() });
}

/** Marks the token's owner unsubscribed. Returns the entry, or null for a bad token. */
export async function unsubscribeByToken(token: string) {
  const clean = token.trim();
  if (!/^[a-f0-9]{16,}$/i.test(clean)) return null;

  const snap = await mailingList().where("unsubscribeToken", "==", clean).limit(1).get();
  const doc = snap.docs[0];
  if (!doc) return null;

  const entry = doc.data();
  if (entry.subscribed) {
    await doc.ref.update({ subscribed: false, unsubscribedAt: nowIso(), updatedAt: nowIso() });
  }
  return { ...entry, subscribed: false };
}

/** Everyone who may be emailed. Campaign sends must use exactly this list. */
export async function listSubscribedMailingListEntries() {
  const snap = await mailingList().where("subscribed", "==", true).get();
  return snap.docs.map((doc) => doc.data());
}
