import { NextRequest, NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache";
import { runAutomationTick } from "@/lib/server/automation";
import { isAutomationDisabled, isLocalMode } from "@/lib/runtime-mode";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.AUTOMATION_JOB_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-cron-secret");
  return auth === `Bearer ${secret}` || cronSecret === secret;
}

export async function GET(request: NextRequest) {
  if (isAutomationDisabled()) {
    return NextResponse.json({ error: "Automation is disabled." }, { status: 503 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun =
    request.nextUrl.searchParams.get("dryRun") === "1" ||
    (isLocalMode() && process.env.ENABLE_LIVE_AUTOMATION?.toLowerCase() !== "true");
  const asyncMode = request.nextUrl.searchParams.get("async") === "1";
  const scheduled = asyncMode || request.nextUrl.searchParams.get("scheduled") === "1";

  // Async mode for the built-in scheduler: a tick can outlive any HTTP client
  // timeout, so run it after the response instead of holding the socket open.
  // Outcomes are still logged to automationRuns and the server console.
  if (asyncMode) {
    after(async () => {
      try {
        const result = await runAutomationTick({ dryRun, scheduled });
        const errors = "errors" in result ? result.errors : [];
        if (errors.length) {
          console.error("[automation-tick] completed with errors:", errors);
        }
      } catch (error) {
        console.error("[automation-tick] failed:", error);
      }
    });
    return NextResponse.json({ ok: true, started: true }, { status: 202 });
  }

  try {
    const result = await runAutomationTick({ dryRun, scheduled });
    revalidatePath("/dashboard");
    revalidatePath("/agents");
    revalidatePath("/campaigns");
    revalidatePath("/leads");

    // Surface partial failures as a non-2xx so uptime/cron monitoring catches
    // them, even though the tick itself didn't crash.
    const errors = "errors" in result ? result.errors : [];
    if (errors.length) {
      console.error("[automation-tick] completed with errors:", errors);
      return NextResponse.json({ ok: false, result }, { status: 500 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automation tick failed.";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[automation-tick] failed:", message, stack);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
