import { NextResponse, type NextRequest } from "next/server";
import { parseAppSumoWebhook, verifyAppSumoSignature } from "@/lib/appsumo-license";
import { isLocalMode } from "@/lib/runtime-mode";
import { appSumoConfig, handleAppSumoWebhook } from "@/lib/server/appsumo";
import { logAutomationRun } from "@/lib/server/data";
import { readTextBody, RequestBodyTooLargeError } from "@/lib/server/request-body";

export const dynamic = "force-dynamic";

// AppSumo expects a 200 that repeats the event back. Anything else is treated
// as not delivered: AppSumo leaves the license as it was and retries.
function delivered(event: string) {
  return NextResponse.json({ success: true, event });
}

function refused(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(request: NextRequest) {
  if (isLocalMode()) return new NextResponse(null, { status: 404 });

  let body: string;
  try {
    body = await readTextBody(request, 64 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return refused(413, error.message);
    throw error;
  }

  const webhook = parseAppSumoWebhook(body);
  if (!webhook) return refused(400, "Invalid AppSumo webhook payload.");

  const signature = request.headers.get("x-appsumo-signature");
  const timestamp = request.headers.get("x-appsumo-timestamp");
  // The Partner Portal checks the URL with a test event before it will save
  // it. A test event changes nothing, so an unsigned one is safe to answer and
  // the URL can be saved before APPSUMO_API_KEY is in place.
  if (webhook.test && !signature && !timestamp) return delivered(webhook.event);

  const { apiKey } = appSumoConfig();
  if (!apiKey) {
    console.error("[appsumo webhook] APPSUMO_API_KEY is not set; refusing a signed webhook.");
    return refused(503, "AppSumo webhooks are not configured.");
  }
  if (!verifyAppSumoSignature({ apiKey, timestamp, signature, body })) {
    console.error(`[appsumo webhook] signature check failed for ${webhook.event}.`);
    return refused(401, "AppSumo webhook verification failed.");
  }
  if (webhook.test) return delivered(webhook.event);

  try {
    await handleAppSumoWebhook(webhook);
  } catch (error) {
    // A 500 makes AppSumo retry, which is what a failed write needs.
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`[appsumo webhook] ${webhook.event} failed:`, message);
    await logAutomationRun({
      kind: "webhook",
      status: "error",
      message: `AppSumo ${webhook.event} for license ${webhook.licenseKey.slice(0, 8)} failed: ${message}`,
    }).catch(() => undefined);
    return refused(500, "AppSumo webhook could not be processed.");
  }
  return delivered(webhook.event);
}
