import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  currentMailingListPlan,
  upsertMailingListEntry,
} from "@/lib/server/mailing-list";
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

// One-time import of every Clerk user into the mailingList collection. Safe to
// re-run: upserts refresh email/name/plan and never re-subscribe anyone who
// unsubscribed. Must run in production - only prod has the real Clerk keys.
export async function GET(request: NextRequest) {
  if (isLocalMode()) return new NextResponse(null, { status: 404 });
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const clerk = await clerkClient();

  let offset = 0;
  const pageSize = 100;
  let enrolled = 0;
  let skippedNoEmail = 0;
  const planCounts: Record<string, number> = {};

  for (;;) {
    const page = await clerk.users.getUserList({
      limit: pageSize,
      offset,
      orderBy: "+created_at",
    });

    for (const user of page.data) {
      const email =
        user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)
          ?.emailAddress ||
        user.emailAddresses[0]?.emailAddress ||
        "";
      if (!email) {
        skippedNoEmail += 1;
        continue;
      }

      const plan = await currentMailingListPlan(user.id);
      planCounts[plan] = (planCounts[plan] || 0) + 1;

      if (!dryRun) {
        await upsertMailingListEntry({
          userId: user.id,
          email,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || undefined,
          plan,
        });
      }
      enrolled += 1;
    }

    if (page.data.length < pageSize) break;
    offset += pageSize;
  }

  return NextResponse.json({ ok: true, dryRun, enrolled, skippedNoEmail, planCounts });
}
