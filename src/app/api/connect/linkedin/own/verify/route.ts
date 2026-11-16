import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import { readJsonBody } from "@/lib/server/request-body";
import { closeLiveBrowserLogin, getLiveBrowserLogin, submitBrowserLinkedInChallenge } from "@/lib/server/linkedin-own/browser-login";
import { connectOwnLinkedInAccount } from "@/lib/server/linkedin-own/connect";
import { LinkedInLoginError, submitLinkedInChallenge } from "@/lib/server/linkedin-own/login";
import {
  deletePendingLogin,
  loadPendingLogin,
  MAX_CODE_ATTEMPTS,
  updatePendingLogin,
} from "@/lib/server/linkedin-own/pending-logins";
import { releaseProxy } from "@/lib/server/linkedin-own/proxy-pool";
import { proxyIdentityOf, serializeCookies } from "@/lib/server/linkedin-own/transport";
import { connectFailureResponse, connectedResponse, guardOwnConnect, json, verificationResponse } from "../guard";

export const dynamic = "force-dynamic";

const inputSchema = z.object({
  loginId: z.string().regex(/^[A-Za-z0-9_-]{20,64}$/),
  code: z.string().trim().max(32).optional(),
});

const RESTART = { restart: true };

// Step 2: the code LinkedIn sent (or, for app approval, no code once the
// person has approved). Finishes the sign-in started by ../login.
export async function POST(request: NextRequest) {
  const guard = await guardOwnConnect(request, "linkedin-own-verify", 10);
  if (guard instanceof NextResponse) return guard;

  let loginId: string | undefined;
  try {
    const parsed = inputSchema.safeParse(await readJsonBody<unknown>(request, 4 * 1024));
    if (!parsed.success) return json({ error: "Enter the code exactly as LinkedIn shows it." }, 400);
    loginId = parsed.data.loginId;

    const pending = await loadPendingLogin(loginId, guard.userId);
    if (!pending) return json({ error: "This sign-in expired. Enter your email and password again.", ...RESTART }, 410);
    const workspace = await resolveActiveWorkspace(guard.userId);
    if (workspace.id !== pending.workspaceId) {
      await closeLiveBrowserLogin(loginId);
      await deletePendingLogin(loginId);
      return json({ error: "You switched workspaces. Start the sign-in again.", ...RESTART }, 409);
    }
    const maxAttempts = pending.method === "app" ? MAX_CODE_ATTEMPTS * 3 : MAX_CODE_ATTEMPTS;
    if (pending.attempts >= maxAttempts) {
      await closeLiveBrowserLogin(loginId);
      await deletePendingLogin(loginId);
      return json({ error: "Too many verification attempts. Start the sign-in again.", ...RESTART }, 429);
    }

    // Browser sign-ins keep LinkedIn's check open in a live browser in
    // this process. Older pending sign-ins hold a stored check form and
    // finish over plain HTTP instead.
    const live = getLiveBrowserLogin(loginId);
    if (!live && !pending.challenge) {
      await deletePendingLogin(loginId);
      return json({ error: "This sign-in expired. Enter your email and password again.", ...RESTART }, 410);
    }

    let outcome;
    try {
      outcome = live
        ? await submitBrowserLinkedInChallenge(live, { code: parsed.data.code, method: pending.method })
        : await submitLinkedInChallenge({
            cookies: pending.cookies,
            challenge: pending.challenge!,
            userAgent: pending.userAgent,
            ...proxyIdentityOf(pending),
            code: parsed.data.code,
          });
    } catch (error) {
      // A malformed code never reached LinkedIn: keep the sign-in open.
      if (error instanceof LinkedInLoginError && error.reason === "bad_credentials") {
        return json({ error: error.message, needsVerification: true, loginId, method: pending.method }, 400);
      }
      if (error instanceof LinkedInLoginError) {
        await closeLiveBrowserLogin(loginId);
        await deletePendingLogin(loginId).catch(() => undefined);
        return connectFailureResponse(error, RESTART);
      }
      throw error;
    }

    if (outcome.kind === "challenge") {
      await updatePendingLogin(loginId, {
        ...("cookies" in outcome ? { cookies: outcome.cookies, challenge: outcome.challenge } : {}),
        method: outcome.method,
        attempts: pending.attempts + 1,
        ...(outcome.hint ? { hint: outcome.hint } : {}),
      });
      return verificationResponse(loginId, outcome, outcome.retryError ? 400 : 200);
    }
    await closeLiveBrowserLogin(loginId);

    await deletePendingLogin(loginId);
    const account = await connectOwnLinkedInAccount({
      workspaceId: pending.workspaceId,
      cookieHeader: serializeCookies(outcome.cookies),
      userAgent: pending.userAgent,
      ...proxyIdentityOf(pending),
      ...(pending.timezone ? { timezone: pending.timezone } : {}),
      ...(pending.replaceAccountId ? { replaceAccountId: pending.replaceAccountId } : {}),
    });
    // A reconnect keeps the account's earlier IP; this one goes back.
    if (pending.proxyPort) await releaseProxy(pending.proxySessionId, { rest: false }).catch(() => undefined);
    return connectedResponse(account);
  } catch (error) {
    return connectFailureResponse(error);
  }
}
