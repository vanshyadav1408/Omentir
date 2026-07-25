import { NextRequest, NextResponse } from "next/server";
import { runGeminiDiagnostics } from "@/lib/server/gemini";
import { bearerOrHeaderSecretMatches } from "@/lib/local-session";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.AUTOMATION_JOB_SECRET;
  if (!secret) return false;
  return bearerOrHeaderSecretMatches(
    request.headers.get("authorization"),
    request.headers.get("x-cron-secret"),
    secret,
  );
}

/**
 * Answers "why does AI behave differently on this server than on my laptop?".
 * Reports which credential path, project, region and model the running instance
 * uses, then times a plain call, a search-grounded call, and both lead-preview
 * passes. Secret-protected because it spends real model calls.
 *
 *   curl -H "x-cron-secret: $CRON_SECRET" https://<host>/api/jobs/gemini-diagnostics
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const diagnostics = await runGeminiDiagnostics();
    return NextResponse.json({ ok: true, ms: Date.now() - startedAt, ...diagnostics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Diagnostics failed.";
    console.error("[gemini-diagnostics] failed:", message);
    return NextResponse.json({ ok: false, ms: Date.now() - startedAt, error: message }, { status: 500 });
  }
}
