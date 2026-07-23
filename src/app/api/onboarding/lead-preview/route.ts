import { auth } from "@/lib/server/auth";
import { NextRequest, NextResponse } from "next/server";
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

  if (
    !(await rateLimitRequestShared(request, "lead-preview", {
      sourceKey: userId,
      perSource: 10,
      global: 100,
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

  try {
    const leads = await findPreviewLeadsWithGemini({
      websiteUrl,
      productOverview,
      targetBuyers: strings(body.targetBuyers, 8),
      buyerTitles: strings(body.buyerTitles, 15),
      industries: strings(body.industries, 10),
      companySizes: strings(body.companySizes, 8),
      painPoints: strings(body.painPoints, 10),
      keywords: strings(body.keywords, 14),
    });

    if (!leads.length) {
      return NextResponse.json(
        { error: "We couldn't find example leads right now. Please try again in a minute." },
        { status: 422 },
      );
    }

    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lead discovery failed." },
      { status: 422 },
    );
  }
}
