import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/server/auth";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/request-body";
import { rateLimitRequestShared } from "@/lib/request-rate-limit";
import { connectOwnLinkedInAccount, LinkedInConnectError } from "@/lib/server/linkedin-own/connect";
import { NO_FREE_PROXY_MESSAGE, releaseProxy, requestCountry, reserveProxy } from "@/lib/server/linkedin-own/proxy-pool";
import type { ProxyIdentity } from "@/lib/server/linkedin-own/transport";
import { LinkedInResponseError } from "@/lib/server/linkedin-errors";
import { isAllowedOwnConnectOrigin } from "./guard";

export const dynamic = "force-dynamic";

const inputSchema = z.object({
  liAt: z.string().trim().min(1).max(8192).regex(/^[^;\r\n]+$/),
  jsessionId: z.string().trim().min(1).max(1024).regex(/^"?ajax:[A-Za-z0-9_-]+"?$/),
  userAgent: z.string().trim().min(1).max(1024),
  timezone: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  if (!isAllowedOwnConnectOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await rateLimitRequestShared(request, "linkedin-own-connect", {
    perSource: 5, global: 100, windowMs: 60_000, sourceKey: userId,
  }))) {
    return NextResponse.json({ error: "Too many connection attempts. Try again in a minute." }, { status: 429 });
  }

  // The IP reserved for this connect. Given back unless the saved account
  // now uses it (a reconnect keeps the account's earlier IP).
  let proxy: ProxyIdentity | null | undefined;
  const giveBackProxy = async () => {
    if (proxy?.proxyPort) await releaseProxy(proxy.proxySessionId, { rest: false }).catch(() => undefined);
  };
  try {
    const parsed = inputSchema.safeParse(await readJsonBody<unknown>(request, 16 * 1024));
    if (!parsed.success) {
      return NextResponse.json({ error: "Check both session values and try again." }, { status: 400 });
    }
    const workspace = await resolveActiveWorkspace(userId);
    const { liAt, jsessionId, userAgent, timezone } = parsed.data;
    proxy = await reserveProxy(randomBytes(8).toString("hex"), requestCountry(request.headers));
    if (!proxy) throw new LinkedInConnectError(NO_FREE_PROXY_MESSAGE);
    const account = await connectOwnLinkedInAccount({
      workspaceId: workspace.id,
      cookieHeader: `li_at=${liAt}; JSESSIONID=${jsessionId}`,
      userAgent,
      timezone,
      ...proxy,
    });
    await giveBackProxy();
    return NextResponse.json({ ok: true, displayName: account.displayName }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    await giveBackProxy();
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "Session values are too large." }, { status: 413 });
    }
    if (error instanceof LinkedInConnectError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof LinkedInResponseError) {
      // Status and our fixed error type only: never the cookies or LinkedIn's body.
      console.warn("[linkedin-own] browser-session connect refused", JSON.stringify({ status: error.status, type: error.errorType }));
      const unconfigured = error.errorType === "errors/provider_unconfigured";
      return NextResponse.json({
        error: unconfigured
          ? "LinkedIn connection is not configured. Contact your instance administrator."
          : "LinkedIn could not verify this session. Sign in to LinkedIn again and copy the new session values.",
      }, { status: unconfigured ? 503 : 400 });
    }
    // Provider and storage errors can contain credentials. Do not return or log them.
    return NextResponse.json({ error: "Could not connect LinkedIn. Please try again." }, { status: 503 });
  }
}
