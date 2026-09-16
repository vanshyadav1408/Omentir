import { NextRequest, NextResponse } from "next/server";
import { listWorkspaces } from "@/lib/server/data";
import { backfillWorkspaceFavicons } from "@/lib/server/workspace-favicons";
import { isLocalMode } from "@/lib/runtime-mode";
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

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const workspaces = await listWorkspaces();
  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      missingFavicon: workspaces.filter((workspace) => !workspace.faviconUrl).length,
      total: workspaces.length,
      localMode: isLocalMode(),
    });
  }

  const result = await backfillWorkspaceFavicons(workspaces);
  return NextResponse.json({ ok: true, ...result });
}
