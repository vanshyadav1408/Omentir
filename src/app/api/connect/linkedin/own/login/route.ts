import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import { readJsonBody } from "@/lib/server/request-body";
import {
  NoBrowserAvailableError,
  registerLiveBrowserLogin,
  startBrowserLinkedInLogin,
  type BrowserLoginOutcome,
} from "@/lib/server/linkedin-own/browser-login";
import { connectOwnLinkedInAccount, LinkedInConnectError } from "@/lib/server/linkedin-own/connect";
import { startLinkedInLogin, type LoginOutcome } from "@/lib/server/linkedin-own/login";
import { savePendingLogin } from "@/lib/server/linkedin-own/pending-logins";
import { NO_FREE_PROXY_MESSAGE, releaseProxy, requestCountry, reserveProxy } from "@/lib/server/linkedin-own/proxy-pool";
import { serializeCookies, type ProxyIdentity } from "@/lib/server/linkedin-own/transport";
import { connectFailureResponse, connectedResponse, guardOwnConnect, json, verificationResponse } from "../guard";

export const dynamic = "force-dynamic";

const inputSchema = z.object({
  email: z.string().trim().min(3).max(320).regex(/^\S+$/),
  password: z.string().min(1).max(1024),
  userAgent: z.string().trim().min(1).max(1024),
  timezone: z.string().max(100).optional(),
  replaceAccountId: z.string().trim().min(1).max(256).optional(),
});

// Step 1: email and password. Either connects straight away or returns a
// loginId for the verification-code step. The password is used for this one
// request and never stored.
export async function POST(request: NextRequest) {
  const guard = await guardOwnConnect(request, "linkedin-own-login", 5);
  if (guard instanceof NextResponse) return guard;

  // The IP this sign-in holds. Given back unless a saved account or a
  // pending verification step now uses it.
  let proxy: ProxyIdentity | null | undefined;
  const giveBackProxy = async () => {
    if (proxy?.proxyPort) await releaseProxy(proxy.proxySessionId, { rest: false }).catch(() => undefined);
  };
  try {
    const parsed = inputSchema.safeParse(await readJsonBody<unknown>(request, 16 * 1024));
    if (!parsed.success) return json({ error: "Enter your LinkedIn email and password." }, 400);
    const { email, password, userAgent, timezone, replaceAccountId } = parsed.data;
    if (!/Mozilla\/5\.0/.test(userAgent)) return json({ error: "Open this page in a regular browser and try again." }, 400);

    const workspace = await resolveActiveWorkspace(guard.userId);
    proxy = await reserveProxy(randomBytes(8).toString("hex"), requestCountry(request.headers));
    if (!proxy) throw new LinkedInConnectError(NO_FREE_PROXY_MESSAGE);
    // Prefer real Chromium sign-in; fall back to direct checkpoint sign-in on
    // hosts that have no browser binary installed.
    let outcome: BrowserLoginOutcome | LoginOutcome;
    try {
      outcome = await startBrowserLinkedInLogin({ email, password, userAgent, ...proxy, ...(timezone ? { timezone } : {}) });
    } catch (error) {
      if (!(error instanceof NoBrowserAvailableError)) throw error;
      outcome = await startLinkedInLogin({ email, password, userAgent, ...proxy });
    }

    if (outcome.kind === "challenge") {
      try {
        const loginId = await savePendingLogin({
          userId: guard.userId,
          workspaceId: workspace.id,
          ...("cookies" in outcome ? { cookies: outcome.cookies, challenge: outcome.challenge } : {}),
          userAgent,
          ...proxy,
          method: outcome.method,
          ...(outcome.hint ? { hint: outcome.hint } : {}),
          ...(timezone ? { timezone } : {}),
          ...(replaceAccountId ? { replaceAccountId } : {}),
        });
        if ("live" in outcome) {
          registerLiveBrowserLogin(loginId, outcome.live);
        }
        return verificationResponse(loginId, outcome);
      } catch (error) {
        // The pending sign-in could not be parked: do not leave the
        // browser sitting on LinkedIn's check page.
        if ("live" in outcome) await outcome.live.close().catch(() => undefined);
        throw error;
      }
    }

    const account = await connectOwnLinkedInAccount({
      workspaceId: workspace.id,
      cookieHeader: serializeCookies(outcome.cookies),
      userAgent,
      ...proxy,
      ...(timezone ? { timezone } : {}),
      ...(replaceAccountId ? { replaceAccountId } : {}),
    });
    // A reconnect keeps the account's earlier IP; this one goes back.
    await giveBackProxy();
    return connectedResponse(account);
  } catch (error) {
    await giveBackProxy();
    return connectFailureResponse(error);
  }
}
