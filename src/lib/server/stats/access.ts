import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { isLocalMode } from "@/lib/runtime-mode";

export type StatsAccess = "allowed" | "signed-out" | "denied";

function allowedEmails() {
  return (process.env.STATS_ALLOWED_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * stats.omentir.com shows revenue, so it is owner-only: a signed-in Clerk user
 * with a verified email listed in STATS_ALLOWED_EMAILS. An empty list lets
 * nobody in. STATS_DEV_OPEN=1 skips the check under `next dev` only, because
 * the built-in browser cannot complete a Clerk sign-in.
 */
export async function statsAccess(): Promise<StatsAccess> {
  if (process.env.NODE_ENV === "development" && process.env.STATS_DEV_OPEN === "1") return "allowed";
  if (isLocalMode()) return "denied";
  const allowed = allowedEmails();
  const user = await currentUser().catch(() => null);
  if (!user) return "signed-out";
  const verified = user.emailAddresses
    .filter((email) => email.verification?.status === "verified")
    .map((email) => email.emailAddress.toLowerCase());
  return verified.some((email) => allowed.includes(email)) ? "allowed" : "denied";
}
