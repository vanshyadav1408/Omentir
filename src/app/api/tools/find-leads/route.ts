import { NextRequest, NextResponse } from "next/server";
import {
  ExaSearchError,
  findPublicLeads,
  PROMPT_MAX_LENGTH,
  PROMPT_MIN_LENGTH,
  PUBLIC_LEAD_COUNT,
} from "@/lib/server/exa-people-search";
import { rateLimitRequestShared, requestSource } from "@/lib/request-rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/request-body";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function isBrowserSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isBrowserSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  if (
    !(await rateLimitRequestShared(request, "find-leads", {
      sourceKey: requestSource(request),
      perSource: 8,
      global: 120,
      windowMs: 60 * 60 * 1000,
    }))
  ) {
    return NextResponse.json(
      { error: "Too many searches from this network. Try again in an hour." },
      { status: 429 },
    );
  }

  let body: { prompt?: unknown } | null;
  try {
    body = await readJsonBody<{ prompt?: unknown }>(request, 8 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    throw error;
  }

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (prompt.length < PROMPT_MIN_LENGTH) {
    return NextResponse.json(
      { error: "Add a bit more: what you sell, who buys it, and where they work." },
      { status: 400 },
    );
  }
  if (prompt.length > PROMPT_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Keep the description under ${PROMPT_MAX_LENGTH} characters.` },
      { status: 400 },
    );
  }

  try {
    const leads = await findPublicLeads(prompt);
    if (leads.length === 0) {
      return NextResponse.json(
        {
          error:
            "No matching profiles right now. Try a clearer buyer: role, company type, and location.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      leads: leads.slice(0, PUBLIC_LEAD_COUNT),
      count: Math.min(leads.length, PUBLIC_LEAD_COUNT),
    });
  } catch (error) {
    if (error instanceof ExaSearchError) {
      console.error(`[find-leads] ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Lead search failed.";
    console.error(`[find-leads] ${message}`);
    return NextResponse.json(
      { error: "Lead search failed. Try again in a minute." },
      { status: 502 },
    );
  }
}
