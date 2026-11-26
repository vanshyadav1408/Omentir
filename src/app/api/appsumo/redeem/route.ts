import { NextResponse, type NextRequest } from "next/server";
import { AppSumoOAuthError, exchangeAppSumoCode } from "@/lib/appsumo-license";
import { rateLimitRequestShared } from "@/lib/request-rate-limit";
import { isLocalMode } from "@/lib/runtime-mode";
import {
  APPSUMO_CLAIM_COOKIE,
  APPSUMO_CLAIM_MAX_AGE_SECONDS,
  APPSUMO_REDEEM_PATH,
  appSumoConfig,
  appSumoRedirectUri,
  getAppSumoLicense,
  startAppSumoClaim,
  syncAppSumoAccess,
} from "@/lib/server/appsumo";
import { logAutomationRun } from "@/lib/server/data";
import { getAppBaseUrl } from "@/lib/server/runtime-config";

export const dynamic = "force-dynamic";

// Second half of the AppSumo OAuth redirect. The redeem page forwards the
// single-use code here because only a route handler can set the claim cookie.
export async function GET(request: NextRequest) {
  if (isLocalMode()) return new NextResponse(null, { status: 404 });

  // Behind the reverse proxy request.url is localhost, so every redirect is
  // built on the public base URL.
  const appUrl = getAppBaseUrl();
  const backToRedeem = (error?: string) =>
    NextResponse.redirect(
      new URL(error ? `${APPSUMO_REDEEM_PATH}?error=${error}` : APPSUMO_REDEEM_PATH, appUrl),
    );

  const code = request.nextUrl.searchParams.get("code")?.trim() || "";
  if (!/^[A-Za-z0-9._~-]{8,256}$/.test(code)) return backToRedeem("invalid");
  // Each accepted request calls AppSumo. The global ceiling leaves room for a
  // launch-day rush while keeping this from being used to flood their API.
  if (
    !(await rateLimitRequestShared(request, "appsumo-redeem", {
      perSource: 10,
      global: 300,
      windowMs: 60_000,
    }))
  ) {
    return backToRedeem("invalid");
  }

  const { clientId, clientSecret } = appSumoConfig();
  if (!clientId || !clientSecret) {
    console.error("[appsumo redeem] APPSUMO_CLIENT_ID or APPSUMO_CLIENT_SECRET is not set.");
    return backToRedeem("unavailable");
  }

  let licenseKey: string;
  try {
    ({ licenseKey } = await exchangeAppSumoCode({
      code,
      clientId,
      clientSecret,
      redirectUri: appSumoRedirectUri(),
    }));
  } catch (error) {
    if (!(error instanceof AppSumoOAuthError)) {
      console.error("[appsumo redeem] code exchange failed:", error);
      return backToRedeem("unavailable");
    }
    console.error("[appsumo redeem]", error.message);
    return backToRedeem("invalid");
  }

  const license = await getAppSumoLicense(licenseKey);
  if (!license) {
    // AppSumo vouches for a key no webhook ever reported. Without the webhook
    // the tier is unknown, so nothing is granted and the gap is logged.
    await logAutomationRun({
      kind: "webhook",
      status: "error",
      message: `AppSumo redeem for license ${licenseKey.slice(0, 8)} failed: no purchase or activate webhook was received for it.`,
    }).catch(() => undefined);
    return backToRedeem("unknown");
  }
  if (license.status === "deactivated") return backToRedeem("refunded");

  if (license.ownerId) {
    // Already attached: a returning buyer who clicked through from AppSumo.
    // Re-check billing on the way, which repairs it if an earlier write failed.
    await syncAppSumoAccess(license, "returning buyer");
    return NextResponse.redirect(new URL("/overview", appUrl));
  }

  const response = backToRedeem();
  response.cookies.set(APPSUMO_CLAIM_COOKIE, await startAppSumoClaim(licenseKey), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: APPSUMO_CLAIM_MAX_AGE_SECONDS,
  });
  return response;
}
