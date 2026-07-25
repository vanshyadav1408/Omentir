import { auth } from "@/lib/server/auth";
import { NextRequest, NextResponse } from "next/server";
import { getWorkspace } from "@/lib/server/data";
import { findPreviewLeadsWithGemini } from "@/lib/server/gemini";
import { rateLimitRequestShared } from "@/lib/request-rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/request-body";

export const dynamic = "force-dynamic";

function strings(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, limit);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2 is the only caller, so a workspace that has finished onboarding has
  // no legitimate reason to hit this. Without the check a completed user can
  // keep replaying the endpoint and burning search-grounded Gemini calls.
  const workspace = await getWorkspace(userId);
  if (workspace.onboarding) {
    return NextResponse.json({ error: "Onboarding is already complete." }, { status: 403 });
  }

  if (
    // Step 2 spends two requests per attempt (fast, then the grounded upgrade),
    // so the per-user allowance covers ten attempts rather than five.
    !(await rateLimitRequestShared(request, "lead-preview", {
      sourceKey: userId,
      perSource: 20,
      global: 200,
      windowMs: 60 * 60 * 1000,
    }))
  ) {
    return NextResponse.json({ error: "Too many lead preview requests." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await readJsonBody<Record<string, unknown>>(request, 32 * 1024)) || {};
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    throw error;
  }

  const websiteUrl = String(body.websiteUrl || "").trim().slice(0, 500);
  const productOverview = String(body.productOverview || "").trim().slice(0, 4000);

  if (!productOverview) {
    return NextResponse.json({ error: "Fetch a website before finding leads." }, { status: 400 });
  }

  // "fast" is the no-search draft the step renders first; "search" is the
  // grounded upgrade it fetches in parallel. Anything else (including a direct
  // caller that sends no mode) gets "auto": grounded with its own draft net, so
  // this endpoint never depends on the client running both phases.
  const mode = body.mode === "fast" ? "fast" : body.mode === "search" ? "search" : "auto";

  try {
    const { leads, source } = await findPreviewLeadsWithGemini(
      {
        websiteUrl,
        productOverview,
        targetBuyers: strings(body.targetBuyers, 8),
        buyerTitles: strings(body.buyerTitles, 15),
        industries: strings(body.industries, 10),
        companySizes: strings(body.companySizes, 8),
        painPoints: strings(body.painPoints, 10),
        keywords: strings(body.keywords, 14),
      },
      // The fast pass must beat the proxy window with room to spare; the
      // grounded pass gets the rest of it. Both are wall clock for the whole
      // stage chain, retries included.
      mode === "fast" ? { mode, budgetMs: 32_000 } : { mode, budgetMs: 48_000 },
    );

    if (!leads.length) {
      return NextResponse.json(
        { error: "We couldn't find example leads right now. Please try again in a minute." },
        { status: 422 },
      );
    }

    return NextResponse.json({ leads, source });
  } catch (error) {
    // The message already names the real cause (quota, deadline, credentials);
    // logging it here is what makes it findable in the server log too, since
    // the client only ever shows one line of it.
    const message = error instanceof Error ? error.message : "Lead discovery failed.";
    console.error(`[lead-preview] mode=${mode} request failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
